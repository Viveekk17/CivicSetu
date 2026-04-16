import cv2
import torch
from ultralytics import YOLO
from PIL import Image
import numpy as np
import os
import sys

# Ensure the correct directory
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

# Import the estimator from app.py
from app import GarbageWeightEstimator

def visualize_detections(image_path, output_path="detected_items.png"):
    print(f"🖼️ Loading image from: {image_path}")
    
    # Initialize the estimator to use its logic and models
    try:
        estimator = GarbageWeightEstimator()
    except Exception as e:
        print(f"❌ Error initializing AI Engine: {e}")
        return
    
    # Load image with OpenCV for drawing
    img_cv = cv2.imread(image_path)
    if img_cv is None:
        print(f"❌ Error: Could not load image at {image_path}")
        return

    # Convert to RGB for PIL (used by estimator's classifier)
    img_rgb = cv2.cvtColor(img_cv, cv2.COLOR_BGR2RGB)
    img_pil = Image.fromarray(img_rgb)
    
    print("🔍 Running detection and classification...")
    # Run Detection (conf=0.25, imgsz=640, iou=0.45) - Match app.py
    results = estimator.detector(img_pil, conf=0.25, imgsz=1280, iou=0.45, verbose=False)
    
    total_weight = 0
    items_count = 0
    
    for r in results:
        boxes = r.boxes
        for box in boxes:
            items_count += 1
            # Get coordinates
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            
            # Classification and weight calculation (replicated from app.py)
            crop = img_pil.crop((x1, y1, x2, y2))
            material = estimator._classify_material(crop)
            
            width_px = x2 - x1
            height_px = y2 - y1
            
            # Replicate the logic from app.py
            area_m2 = (width_px * estimator.PIXEL_TO_METERS) * (height_px * estimator.PIXEL_TO_METERS)
            volume_m3 = area_m2 * estimator.ASSUMED_DEPTH_METERS
            density = estimator.DENSITIES.get(material, estimator.DENSITIES['mixed'])
            weight_kg = volume_m3 * density
            
            total_weight += weight_kg
            item_name = estimator.detector.names[int(box.cls[0])]
            label = f"{item_name}: {weight_kg:.3f}kg ({material})"
            
            # Draw Box
            # BGR Colors: Green for organic, Blue for plastic/others
            color = (0, 255, 0) if material == 'organic' else (255, 100, 0) 
            cv2.rectangle(img_cv, (x1, y1), (x2, y2), color, 3)
            
            # Draw Label Background
            font_scale = 0.6
            thickness = 1
            (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)
            cv2.rectangle(img_cv, (x1, y1 - h - 10), (x1 + w, y1), color, -1)
            
            # Draw Text
            cv2.putText(img_cv, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (255, 255, 255), thickness)

    # Add Summary Overlay
    overlay = img_cv.copy()
    cv2.rectangle(overlay, (0, 0), (500, 80), (0, 0, 0), -1)
    alpha = 0.6  # Transparency factor
    img_cv = cv2.addWeighted(overlay, alpha, img_cv, 1 - alpha, 0)

    summary_text = f"Items: {items_count} | Weight: {total_weight:.3f}kg"
    cv2.putText(img_cv, "CivicSetu AI Verification", (15, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
    cv2.putText(img_cv, summary_text, (15, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
    
    # Save Image
    cv2.imwrite(output_path, img_cv)
    print("\n" + "="*40)
    print(f"✅ Visualization saved to: {output_path}")
    print(f"📊 Summary: {items_count} items, {total_weight:.3f}kg total")
    print("="*40)

if __name__ == "__main__":
    # Check if image path provided in args, else use default
    if len(sys.argv) > 1:
        image_to_test = sys.argv[1]
    else:
        image_to_test = "./before.png"
        
    if os.path.exists(image_to_test):
        visualize_detections(image_to_test)
    else:
        print(f"❌ File '{image_to_test}' not found.")
        print("Usage: python visual_test.py <path_to_image>")
