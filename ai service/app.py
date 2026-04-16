from fastapi import FastAPI, UploadFile, File, HTTPException
import io
import torch
from torchvision import models, transforms
from ultralytics import YOLO
from PIL import Image
import uvicorn

# =================================================================
# 🧬 MONOLITHIC AI WEIGHT ESTIMATOR CLASS
# =================================================================
class GarbageWeightEstimator:
    """
    Expert-calibrated pipeline for roadside garbage weight estimation.
    Combined YOLOv8n (Detection) + MobileNetV3 Small (Classification).
    """
    
    # --- Physical Calibration Constants (Magic Numbers) ---
    # Adjusted downwards to predict a more conservative/lower weight
    PIXEL_TO_METERS = 0.004       # Balanced average for mobile cameras
    ASSUMED_DEPTH_METERS = 0.1    # Standard 10cm depth for heavy duty garbage
    
    # Material densities in kg/m^3 (Standard roadside specs)
    DENSITIES = {
        'plastic': 20.0,    
        'organic': 60.0,   
        'mixed': 35.0      
    }

    def __init__(self, yolo_model_path='yolov8n.pt'):
        print("⏳ Loading AI Models (YOLOv8 & MobileNetV3)...")
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # 1. Load YOLOv8 for detection
        self.detector = YOLO(yolo_model_path)
        
        # 2. Load MobileNetV3 Small for classification
        self.classifier = models.mobilenet_v3_small(weights="DEFAULT")
        self.classifier.to(self.device)
        self.classifier.eval()
        
        # 3. Define Preprocessing for Classifier
        self.preprocess = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
        print(f"✅ AI Engine Ready on {self.device}")

    def _classify_material(self, crop):
        """Maps ImageNet classes to specific material types."""
        input_tensor = self.preprocess(crop).unsqueeze(0).to(self.device)
        with torch.no_grad():
            output = self.classifier(input_tensor)
            class_idx = torch.argmax(output[0]).item()
            
        # Class mapping: 440-445 (bottles/cups), 898 (water bottle) -> plastic
        if class_idx in range(440, 446) or class_idx == 898:
            return 'plastic'
        return 'organic'

    def estimate(self, image_bytes):
        """Process image bytes and return weight estimation."""
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # 1. Detection Phase (conf=0.25, imgsz=640, iou=0.45) - Standard Verified Parameters
        results = self.detector(img, conf=0.25, imgsz=640, iou=0.45, verbose=False)
        
        total_weight_kg = 0.0
        details = []

        for r in results:
            boxes = r.boxes
            for box in boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                width_px = x2 - x1
                height_px = y2 - y1
                
                if width_px <= 0 or height_px <= 0: continue

                # 2. Geometry Calculation
                area_m2 = (width_px * self.PIXEL_TO_METERS) * (height_px * self.PIXEL_TO_METERS)
                volume_m3 = area_m2 * self.ASSUMED_DEPTH_METERS

                # 3. Material Classification
                crop = img.crop((x1, y1, x2, y2))
                material = self._classify_material(crop)
                
                # 4. Weight Calculation
                density = self.DENSITIES.get(material, self.DENSITIES['mixed'])
                weight_kg = volume_m3 * density
                
                total_weight_kg += weight_kg
                details.append({
                    "item": self.detector.names[int(box.cls[0])],
                    "material": material,
                    "weight_kg": round(weight_kg, 4)
                })

        return {
            "total_weight_kg": round(total_weight_kg, 4),
            "items_detected": len(details),
            "details": details
        }

# =================================================================
# 🌐 FASTAPI APPLICATION SERVICE
# =================================================================
app = FastAPI(title="CivicSetu AI Service")
estimator = None

@app.on_event("startup")
def load_engine():
    global estimator
    estimator = GarbageWeightEstimator()

@app.get("/health")
def health():
    return {"status": "online", "engine_ready": estimator is not None}

@app.post("/process-cleanup")
async def process_cleanup(
    before_image: UploadFile = File(...),
    after_image: UploadFile = File(...)
):
    """Authoritative endpoint for backend analysis flow."""
    try:
        before_bytes = await before_image.read()
        
        if estimator is None:
            raise HTTPException(status_code=503, detail="AI Engine not loaded")
            
        weight_data = estimator.estimate(before_bytes)

        print(weight_data)
        
        return {
            "status": "success",
            "message": "Heavy Duty Weight Estimation Complete",
            "data": {
                "items_detected": weight_data["items_detected"],
                "total_weight_kg": weight_data["total_weight_kg"],
                "material_breakdown": {
                    "plastic": sum(i['weight_kg'] for i in weight_data['details'] if i['material'] == 'plastic'),
                    "organic": sum(i['weight_kg'] for i in weight_data['details'] if i['material'] == 'organic'),
                    "other": sum(i['weight_kg'] for i in weight_data['details'] if i['material'] not in ['plastic', 'organic'])
                },
                "details": weight_data["details"]
            }
        }
    except Exception as e:
        print(f"❌ Service Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)