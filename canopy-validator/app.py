"""CLIP validation service for CANOPIX capture images.

The model is loaded once when this process starts.  The Edge Function sends the
raw camera image to POST /validate before it runs the canopy-density algorithm.
"""

from contextlib import asynccontextmanager
from io import BytesIO
import os
from typing import Any

import torch
from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

MODEL_NAME = "openai/clip-vit-base-patch32"
CANOPY_LABEL = "a photo looking up through tree canopy at the sky"
LABELS = [
    CANOPY_LABEL,
    "an unrelated or random photo",
    "a photo of a person",
    "a photo taken indoors",
    "a blurry, dark, or unclear photo",
]
CANOPY_CONFIDENCE_THRESHOLD = float(os.getenv("CANOPY_CONFIDENCE_THRESHOLD", "0.55"))
VALIDATOR_TOKEN = os.getenv("VALIDATOR_TOKEN")

processor: CLIPProcessor | None = None
model: CLIPModel | None = None


@asynccontextmanager
async def lifespan(_: FastAPI):
    global processor, model
    processor = CLIPProcessor.from_pretrained(MODEL_NAME)
    model = CLIPModel.from_pretrained(MODEL_NAME)
    model.eval()
    yield


app = FastAPI(title="CANOPIX image validator", lifespan=lifespan)


def classify_image(image: Image.Image) -> tuple[str, float]:
    """Return CLIP's best label and the canopy-label probability for *image*."""
    if processor is None or model is None:
        raise RuntimeError("CLIP model has not finished loading")

    inputs = processor(text=LABELS, images=image.convert("RGB"), return_tensors="pt", padding=True)
    with torch.inference_mode():
        probabilities = model(**inputs).logits_per_image.softmax(dim=1)[0]

    canopy_index = LABELS.index(CANOPY_LABEL)
    best_index = int(probabilities.argmax().item())
    confidence = float(probabilities[canopy_index].item())
    return LABELS[best_index], confidence


def is_valid_canopy_image(image: Image.Image) -> tuple[bool, float]:
    """Testable canopy gate used before density processing: ``(valid, confidence)``."""
    predicted_label, confidence = classify_image(image)
    return predicted_label == CANOPY_LABEL and confidence > CANOPY_CONFIDENCE_THRESHOLD, confidence


@app.get("/health")
def health() -> dict[str, Any]:
    return {"ready": model is not None and processor is not None, "threshold": CANOPY_CONFIDENCE_THRESHOLD}


@app.post("/validate")
async def validate(
    image: UploadFile = File(...),
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    if VALIDATOR_TOKEN and authorization != f"Bearer {VALIDATOR_TOKEN}":
        raise HTTPException(status_code=401, detail="unauthorized")

    try:
        picture = Image.open(BytesIO(await image.read()))
        predicted_label, confidence = classify_image(picture)
        valid = predicted_label == CANOPY_LABEL and confidence > CANOPY_CONFIDENCE_THRESHOLD
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"unable to validate image: {exc}") from exc

    return {
        "valid": valid,
        "confidence": confidence,
        "predicted_label": predicted_label,
        "threshold": CANOPY_CONFIDENCE_THRESHOLD,
        "rejection_reason": None if valid else "not a valid canopy image",
    }
