import cv2
import sys
import os
import json
import numpy as np
from pipeline import CleanupVerifier

def run_visual_analysis(before_path, after_path, output_path="pipeline_analysis_output.jpg"):
    print(f"🖼️ Loading images: \n  Before: {before_path}\n  After: {after_path}")
    
    # Initialize Pipeline
    print("🚀 Initializing CivicSetu Verification Pipeline...")
    try:
        pipeline = CleanupVerifier(model_path="yolov8n-seg.pt")
    except Exception as e:
        print(f"❌ Error initializing pipeline: {e}")
        return

    # Check images
    img_before = cv2.imread(before_path)
    img_after = cv2.imread(after_path)
    
    if img_before is None or img_after is None:
        print("❌ Error: Could not load one or both images!")
        return

    # 1. Alignment
    print("🔍 Aligning Images...")
    aligned_after = pipeline.align_images(img_before, img_after)

    # 2. Extract Garbage Mask
    print("🔍 Extracting difference mask...")
    isolated_garbage = pipeline.extract_garbage_mask(img_before, aligned_after)

    # 3. Analyze Garbage
    print("🤖 Processing Segmentation & Weight Estimation...")
    results = pipeline.analyze_garbage(isolated_garbage)
    
    # We will draw the bounding boxes on the original 'Before' image
    output_image = img_before.copy()
    total_weight = 0
    items_count = len(results)
    
    # Loop over tracked items
    for item in results:
        label = f"{item['class']}: {item['estimated_weight_units']}g"
        bbox = item['bounding_box']
        x1, y1, x2, y2 = map(int, bbox)
        
        total_weight += item['estimated_weight_units']
        
        # Color palette: BGR (Orange-ish)
        color = (0, 165, 255)
        
        # Draw Box around removed garbage
        cv2.rectangle(output_image, (x1, y1), (x2, y2), color, 3)
        
        # Draw Label Background
        font_scale = 0.6
        thickness = 1
        (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)
        cv2.rectangle(output_image, (x1, y1 - h - 10), (x1 + w, y1), color, -1)
        
        # Draw Text
        cv2.putText(output_image, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (255, 255, 255), thickness)

    # Add Summary Overlay
    overlay = output_image.copy()
    cv2.rectangle(overlay, (0, 0), (550, 80), (0, 0, 0), -1)
    alpha = 0.6  # Transparency factor
    cv2.addWeighted(overlay, alpha, output_image, 1 - alpha, 0, output_image)

    summary_text = f"Items Removed: {items_count} | Total Est. Weight: {total_weight:.2f}g"
    cv2.putText(output_image, "CivicSetu AI Output (Before Image)", (15, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
    cv2.putText(output_image, summary_text, (15, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
    
    # Save Image
    cv2.imwrite(output_path, output_image)
    
    # Optional: Also save the "isolated garbage" view for debugging
    cv2.imwrite("isolated_garbage_debug.jpg", isolated_garbage)
    
    print("\n" + "="*50)
    print("✅ TEST ANALYSIS JSON RESULTS")
    print("="*50)
    print(json.dumps({
        "status": "success",
        "total_items_detected": items_count,
        "total_estimated_weight": round(total_weight, 2),
        "items": results
    }, indent=4))
    print("="*50)
    print(f"✅ Visualization saved to: {output_path}")
    print(f"✅ Isolated Difference Mask saved to: isolated_garbage_debug.jpg")

if __name__ == "__main__":
    # Ensure correct directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    # Default file targets
    b_path = "pipeline_test_before.jpg"
    a_path = "pipeline_test_after.jpg"

    # Use args if provided
    if len(sys.argv) == 3:
        b_path = sys.argv[1]
        a_path = sys.argv[2]
        if not os.path.exists(b_path) or not os.path.exists(a_path):
            print("❌ Provided image paths are invalid.")
            sys.exit(1)
        run_visual_analysis(b_path, a_path)
    else:
        print("💡 Usage: python visual_pipeline_test.py <before_img_path> <after_img_path>")
        print("Generating a quick standard dummy test since no parameters provided...\n")

        # Create dummy before image
        dummy_b = np.zeros((600, 800, 3), dtype=np.uint8)
        dummy_b[:] = (50, 50, 50)
        cv2.circle(dummy_b, (100, 100), 20, (0, 255, 0), -1)
        cv2.circle(dummy_b, (700, 500), 20, (255, 0, 0), -1)
        cv2.rectangle(dummy_b, (300, 300), (450, 400), (0, 165, 255), -1)
        cv2.imwrite(b_path, dummy_b)

        # Create dummy after image
        dummy_a = np.zeros((600, 800, 3), dtype=np.uint8)
        dummy_a[:] = (50, 50, 50)
        cv2.circle(dummy_a, (100, 100), 20, (0, 255, 0), -1)
        cv2.circle(dummy_a, (700, 500), 20, (255, 0, 0), -1)
        cv2.imwrite(a_path, dummy_a)

        run_visual_analysis(b_path, a_path)
