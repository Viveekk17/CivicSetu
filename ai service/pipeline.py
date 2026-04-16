import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim
from ultralytics import YOLO
import json
import os

class CleanupVerifier:
    def __init__(self, model_path='yolov8n-seg.pt'):
        """
        Initialize the CleanupVerifier with a YOLOv8 segmentation model.
        """
        # Load YOLOv8 segmentation model
        self.model = YOLO(model_path)
        
        # Density Map for Estimation: Weight = Pixel_Area * Density_Constant
        # Density unit assumed as grams per pixel area for mock demonstration
        self.density_map = {
            'plastic': 0.05,
            'metal': 0.2,
            'cardboard': 0.1,
            'bottle': 0.05,
            'cup': 0.03,
            'default': 0.05
        }
        
    def align_images(self, img_before, img_after):
        """
        Step 1: Image Registration & Alignment
        Aligns the 'after' image to the perspective of the 'before' image using ORB.
        Handles errors if not enough matches are found.
        """
        # Convert images to grayscale for keypoint detection
        gray_before = cv2.cvtColor(img_before, cv2.COLOR_BGR2GRAY)
        gray_after = cv2.cvtColor(img_after, cv2.COLOR_BGR2GRAY)
        
        # Initialize ORB (Oriented FAST and Rotated BRIEF) detector
        orb = cv2.ORB_create(nfeatures=5000)
        
        # Find keypoints and compute descriptors
        kp_before, des_before = orb.detectAndCompute(gray_before, None)
        kp_after, des_after = orb.detectAndCompute(gray_after, None)
        
        if des_before is None or des_after is None:
            print("Warning: Missing descriptors. Returning original after image.")
            return img_after
            
        # Match features using BFMatcher (Brute-Force Matcher)
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        matches = bf.match(des_after, des_before)
        
        # Sort matches by distance (best ones first)
        matches = sorted(matches, key=lambda x: x.distance)
        
        # Keep top 20% of good matches
        good_matches = matches[:int(len(matches) * 0.2)]
        
        # We need at least 4 matches to compute homography
        if len(good_matches) < 4:
            print("Warning: Not enough good matches for reliable homography. Alignment failed.")
            return img_after
            
        # Extract location of good matches
        src_pts = np.float32([kp_after[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
        dst_pts = np.float32([kp_before[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)
        
        # Calculate Homography transformation matrix using RANSAC
        M, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
        
        if M is None:
            print("Warning: Homography matrix calculation failed. Returning original after image.")
            return img_after
            
        # Warp 'after' image to perspective of 'before' image
        height, width, _ = img_before.shape
        aligned_after = cv2.warpPerspective(img_after, M, (width, height))
        
        return aligned_after

    def extract_garbage_mask(self, before_img, aligned_after_img):
        """
        Step 2: Structural Differencing & Masking
        Uses robust blurring and absolute differencing to isolate removed items.
        Better handles slight 3D misalignments after Homography than strict SSIM.
        """
        # Convert to grayscale
        gray_before = cv2.cvtColor(before_img, cv2.COLOR_BGR2GRAY)
        gray_after = cv2.cvtColor(aligned_after_img, cv2.COLOR_BGR2GRAY)
        
        # Apply heavy Gaussian Blur to ignore small parallax/homography misalignments
        # Kernel size must be odd
        blur_before = cv2.GaussianBlur(gray_before, (21, 21), 0)
        blur_after = cv2.GaussianBlur(gray_after, (21, 21), 0)
        
        # Calculate the absolute difference between the blurred frames
        diff = cv2.absdiff(blur_before, blur_after)
        
        # Threshold the difference (difference > 25 becomes white)
        _, thresh = cv2.threshold(diff, 25, 255, cv2.THRESH_BINARY)
        
        # Apply Morphological operations to clean noise (erosion + dilation)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
        mask_cleaned = cv2.erode(thresh, kernel, iterations=1)
        mask_cleaned = cv2.dilate(mask_cleaned, kernel, iterations=3)
        
        # Apply mask to 'before' image to get the "Isolated Garbage"
        isolated_garbage = cv2.bitwise_and(before_img, before_img, mask=mask_cleaned)
        
        return isolated_garbage

    def analyze_garbage(self, isolated_img):
        """
        Step 3: Object Detection, Segmentation, and Weight Estimation
        Runs YOLOv8 segmentation on the isolated areas to classify and size the items.
        """
        # Perform inference
        results = self.model(isolated_img)
        
        summary = []
        
        for result in results:
            boxes = result.boxes
            masks = result.masks
            names = result.names
            
            if boxes is None or len(boxes) == 0:
                continue
                
            for i in range(len(boxes)):
                # 1. Classification
                cls_id = int(boxes.cls[i].item())
                label = names[cls_id]
                confidence = float(boxes.conf[i].item())
                
                # Extract Bounding Box (xyxy format: minX, minY, maxX, maxY)
                bbox = boxes.xyxy[i].cpu().numpy().tolist()
                
                # 2. Area Calculation from Segmentation Mask
                pixel_area = 0
                if masks is not None and i < len(masks):
                    mask_data = masks.data[i].cpu().numpy()
                    pixel_area = int(np.sum(mask_data))
                else:
                    # Fallback to bbox area if masks are unavailable
                    width = bbox[2] - bbox[0]
                    height = bbox[3] - bbox[1]
                    pixel_area = int(width * height)
                    
                # 3. Weight Estimation using Density Heuristics
                density = self.density_map.get(label.lower(), self.density_map['default'])
                estimated_weight = pixel_area * density
                
                # Build summary payload
                item_info = {
                    "class": label,
                    "confidence": round(confidence, 4),
                    "pixel_area": pixel_area,
                    "estimated_weight_units": round(estimated_weight, 2),
                    "bounding_box": [round(val, 2) for val in bbox]
                }
                summary.append(item_info)
                
        return summary
        
    def run_pipeline(self, before_path, after_path):
        """
        Main execution function orchestrating all three steps.
        """
        img_before = cv2.imread(before_path)
        img_after = cv2.imread(after_path)
        
        if img_before is None or img_after is None:
            return {"error": "Images not found or inaccessible."}
            
        try:
            # Step 1: Align
            aligned_after = self.align_images(img_before, img_after)
            
            # Step 2: Strict Differencing & Masking
            isolated_garbage = self.extract_garbage_mask(img_before, aligned_after)
            
            # Step 3: Segmentation and Analysis
            detection_summary = self.analyze_garbage(isolated_garbage)
            
            # Formatting Response
            total_weight = sum(item["estimated_weight_units"] for item in detection_summary)
            
            return {
                "status": "success",
                "total_items_detected": len(detection_summary),
                "total_estimated_weight": round(total_weight, 2),
                "items": detection_summary
            }
            
        except Exception as e:
            return {"error": str(e)}

if __name__ == "__main__":
    print("=== CivicSetu AI Verification Pipeline ===")
    
    # Generate dummy 'Before' and 'After' images for the example run
    dummy_width, dummy_height = 800, 600
    
    # 1. Before Image: Has background environment + one object (garbage)
    dummy_before = np.zeros((dummy_height, dummy_width, 3), dtype=np.uint8)
    dummy_before[:] = (120, 120, 120)  # Neutral background
    
    # Environment features (to help homography match)
    cv2.circle(dummy_before, (100, 100), 20, (0, 255, 0), -1)
    cv2.circle(dummy_before, (700, 500), 20, (255, 0, 0), -1)
    cv2.circle(dummy_before, (400, 100), 20, (0, 0, 255), -1)
    
    # "Garbage" (a mock bottle or box) inside the 'before' photo
    cv2.rectangle(dummy_before, (300, 300), (450, 400), (0, 165, 255), -1) 
    
    # 2. After Image: Environmental features stay, garbage removed
    dummy_after = np.zeros((dummy_height, dummy_width, 3), dtype=np.uint8)
    dummy_after[:] = (120, 120, 120)
    
    # Ensure same environmental features for homography
    cv2.circle(dummy_after, (100, 100), 20, (0, 255, 0), -1)
    cv2.circle(dummy_after, (700, 500), 20, (255, 0, 0), -1)
    cv2.circle(dummy_after, (400, 100), 20, (0, 0, 255), -1)
    
    # Save dummy files
    before_test_path = "dummy_before.jpg"
    after_test_path = "dummy_after.jpg"
    cv2.imwrite(before_test_path, dummy_before)
    cv2.imwrite(after_test_path, dummy_after)
    
    # Print execution start
    print(f"\n[Step 0] Setup Phase: Created dummy images ({before_test_path}, {after_test_path}).")
    
    # Initialize Pipeline Component
    print("\n[Step 1] Loading YOLOv8 Segmentation Model...")
    # NOTE: Will trigger a download if yolov8n-seg.pt doesn't exist locally
    pipeline = CleanupVerifier(model_path="yolov8n-seg.pt")
    
    print("\n[Step 2] Processing images through Pipeline (Alignment -> Differencing -> Assessment)...")
    results = pipeline.run_pipeline(before_test_path, after_test_path)
    
    print("\n[Step 3] Output:")
    print(json.dumps(results, indent=4))
    
    # Cleanup dummy files
    if os.path.exists(before_test_path):
        os.remove(before_test_path)
    if os.path.exists(after_test_path):
        os.remove(after_test_path)
