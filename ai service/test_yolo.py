import sys
import os

# Ensure the correct directory
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

from app import GarbageWeightEstimator

def main():
    # if len(sys.argv) < 2:
    #     print("❌ Error: You must provide the path to your image!")
    #     print("Usage: python test_yolo.py <path_to_image>")
    #     sys.exit(1)

    image_path = "./before.png"
    print(f"🖼️ Loading image from: {image_path}")

    try:
        with open(image_path, "rb") as f:
            image_bytes = f.read()
        
        estimator = GarbageWeightEstimator()
        result = estimator.estimate(image_bytes)
        
        print("\n" + "="*40)
        print("🤖 YOLOv8 + MobileNetV3 RESULTS")
        print("="*40)
        print(f"Total Items Detected:  {result['items_detected']}")
        print(f"Total Weight Estimate: {result['total_weight_kg']} kg\n")
        
        if result['items_detected'] > 0:
            print("Breakdown per item:")
            for detail in result['details']:
                print(f" - [{detail['item']}] Material: {detail['material']}  ->  {detail['weight_kg']} kg")
        else:
            print("No garbage items recognized by the model!")
            
        print("="*40)

    except Exception as e:
        print(f"\n❌ Failed to process image: {e}")

if __name__ == "__main__":
    main()
