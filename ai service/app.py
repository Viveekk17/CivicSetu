from fastapi import FastAPI, UploadFile, File, HTTPException
import io
import os
import numpy as np
from ultralytics import YOLO
from PIL import Image, ImageFilter
import uvicorn

# =================================================================
# 🧬 MONOLITHIC AI WEIGHT ESTIMATOR CLASS
# =================================================================
class GarbageWeightEstimator:
    """
    Calibrated pipeline for roadside garbage weight estimation using YOLOv8.

    Calibration model:
        weight_kg = bbox_area_m² × fill_factor × depth_m × density_kg/m³

    where bbox area is converted to real-world m² assuming the photo frame
    spans ~FRAME_WIDTH_M of ground at typical handheld distance (~1.5–2 m
    from a phone camera). Real items only occupy a fraction of their bbox,
    so we apply BBOX_FILL_FACTOR. Depth and density come from published MSW
    references (loose-packed, uncompacted).

    References for densities (loose, uncompacted, kg/m³):
      - Plastic bottles/film:        40–80
      - Mixed paper/cardboard:       50–120
      - Glass containers (loose):   250–350
      - Aluminium / steel cans:     50–120
      - Food / organic waste:       300–500
      - Mixed municipal solid waste: 150–250
    """

    # --- Geometric calibration ---
    # Assumed ground width covered by the photo frame at typical hand-held
    # distance (~1.5–2 m) with a phone wide-angle lens (~70° hFOV).
    FRAME_WIDTH_M = 1.6

    # Fraction of bbox actually occupied by the item (irregular shapes).
    BBOX_FILL_FACTOR = 0.55

    # Effective depth (3rd dimension) per item, in metres.
    # Most loose roadside items / piles project to ~10–25 cm of depth.
    ASSUMED_DEPTH_METERS = 0.18

    # Material → density (kg/m³). Values picked from the loose-packed
    # mid-range of MSW references above.
    DENSITIES = {
        'plastic': 60.0,
        'paper': 90.0,
        'glass': 300.0,
        'metal': 90.0,
        'organic': 400.0,
        'mixed': 200.0,
    }

    # YOLO COCO class id → material category.
    # Only classes that plausibly appear as roadside trash are mapped;
    # everything else falls back to 'mixed'. This replaces a separate
    # ImageNet classifier (which is unreliable on cropped trash).
    COCO_MATERIAL_MAP = {
        39: 'plastic',   # bottle
        40: 'glass',     # wine glass
        41: 'plastic',   # cup
        42: 'metal',     # fork
        43: 'metal',     # knife
        44: 'metal',     # spoon
        45: 'plastic',   # bowl
        46: 'organic',   # banana
        47: 'organic',   # apple
        48: 'organic',   # sandwich
        49: 'organic',   # orange
        50: 'organic',   # broccoli
        51: 'organic',   # carrot
        52: 'organic',   # hot dog
        53: 'organic',   # pizza
        54: 'organic',   # donut
        55: 'organic',   # cake
        73: 'paper',     # book
        76: 'paper',     # scissors (mostly metal but rare → paper bin)
        84: 'paper',     # book
    }

    # Hard caps to keep one outlier detection from producing absurd outputs.
    MAX_WEIGHT_PER_ITEM_KG = 25.0
    MAX_TOTAL_WEIGHT_KG = 200.0

    # Detector confidence floor. YOLOv8n is COCO-only, so we err on the side
    # of recall: borderline detections are still useful as scale anchors.
    YOLO_CONF = 0.15

    # Heuristic fallback (used when YOLO finds nothing). Roadside trash
    # photos typically don't contain COCO classes (no "garbage" label exists)
    # so we fall back to an edge/colour-variance estimate of the trash region.
    HEURISTIC_DEPTH_M = 0.10
    HEURISTIC_DENSITY = 180.0       # mid-range loose mixed MSW
    HEURISTIC_MIN_KG = 0.8          # baseline: "user uploaded a trash photo"
    HEURISTIC_MAX_KG = 12.0

    def __init__(self, yolo_model_path='yolov8n.pt'):
        print("⏳ Loading YOLOv8 detector...")
        self.detector = YOLO(yolo_model_path)
        print("✅ AI Engine Ready (CPU-only YOLOv8)")

    def _classify_material(self, class_id):
        """Map a YOLO COCO class id to a material category."""
        return self.COCO_MATERIAL_MAP.get(int(class_id), 'mixed')

    def _heuristic_estimate(self, img):
        """
        Fallback when YOLO finds nothing. COCO has no 'garbage' class, so a
        pile of mixed wrappers / leaves / debris produces zero detections.

        We approximate the trash-covered fraction of the frame via edge
        density (high local contrast = clutter / debris) and convert that
        area to a weight using mixed-MSW density and a shallow depth.
        """
        small = img.convert('L').resize((256, 256))
        edges = small.filter(ImageFilter.FIND_EDGES)
        arr = np.asarray(edges, dtype=np.float32) / 255.0
        # "Busy" pixels: above the per-image edge mean. Caps the trash
        # fraction so a noisy background (sky, leaves) doesn't dominate.
        threshold = max(0.08, float(arr.mean()) * 1.5)
        busy_fraction = float((arr > threshold).mean())
        trash_fraction = max(0.05, min(0.55, busy_fraction))

        frame_area_m2 = self.FRAME_WIDTH_M * (self.FRAME_WIDTH_M * 0.75)  # 4:3 frame
        trash_area_m2 = frame_area_m2 * trash_fraction
        volume_m3 = trash_area_m2 * self.HEURISTIC_DEPTH_M
        weight_kg = volume_m3 * self.HEURISTIC_DENSITY

        weight_kg = max(self.HEURISTIC_MIN_KG, min(self.HEURISTIC_MAX_KG, weight_kg))
        return round(weight_kg, 4), round(trash_fraction, 3)

    def estimate(self, image_bytes):
        """Process image bytes and return weight estimation."""
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_w, img_h = img.size

        # Pixel→metre scale derived from the assumed real-world frame width.
        # Using the actual image width keeps the scale correct regardless of
        # camera resolution.
        pixel_to_m = self.FRAME_WIDTH_M / max(img_w, 1)

        results = self.detector(img, conf=self.YOLO_CONF, imgsz=640, iou=0.45, verbose=False)

        total_weight_kg = 0.0
        details = []
        method = 'yolo'

        for r in results:
            for box in r.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                width_px = x2 - x1
                height_px = y2 - y1
                if width_px <= 0 or height_px <= 0:
                    continue

                # Geometry: bbox → projected ground area → effective volume.
                area_m2 = (width_px * pixel_to_m) * (height_px * pixel_to_m)
                effective_area_m2 = area_m2 * self.BBOX_FILL_FACTOR
                volume_m3 = effective_area_m2 * self.ASSUMED_DEPTH_METERS

                cls_id = int(box.cls[0])
                material = self._classify_material(cls_id)
                density = self.DENSITIES.get(material, self.DENSITIES['mixed'])

                weight_kg = volume_m3 * density
                # Per-item sanity cap (e.g. a person/car in frame would
                # otherwise dominate the estimate).
                weight_kg = min(weight_kg, self.MAX_WEIGHT_PER_ITEM_KG)

                total_weight_kg += weight_kg
                details.append({
                    "item": self.detector.names[cls_id],
                    "material": material,
                    "weight_kg": round(weight_kg, 4),
                })

        # Global sanity cap
        total_weight_kg = min(total_weight_kg, self.MAX_TOTAL_WEIGHT_KG)

        # Fallback when YOLO can't find any COCO-known objects (the common
        # case for piles of mixed roadside debris).
        if total_weight_kg <= 0.0 or len(details) == 0:
            heuristic_weight, trash_fraction = self._heuristic_estimate(img)
            total_weight_kg = heuristic_weight
            method = 'heuristic'
            details.append({
                "item": "unclassified_debris",
                "material": "mixed",
                "weight_kg": heuristic_weight,
                "trash_fraction": trash_fraction,
            })

        return {
            "total_weight_kg": round(total_weight_kg, 4),
            "items_detected": len(details),
            "method": method,
            "details": details,
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
                "method": weight_data.get("method", "yolo"),
                "material_breakdown": {
                    mat: round(sum(i['weight_kg'] for i in weight_data['details'] if i['material'] == mat), 4)
                    for mat in {d['material'] for d in weight_data['details']}
                },
                "details": weight_data["details"]
            }
        }
    except Exception as e:
        print(f"❌ Service Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)