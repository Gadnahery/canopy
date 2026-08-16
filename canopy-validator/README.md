# CANOPIX CLIP validator

This FastAPI service loads `openai/clip-vit-base-patch32` once at startup and
validates a camera image before canopy-density processing.

## Configuration

- `CANOPY_CONFIDENCE_THRESHOLD` — optional; defaults to `0.55`.
- `VALIDATOR_TOKEN` — optional bearer token required by `/validate`.

## Run locally

```bash
cd canopy-validator
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt
.venv/Scripts/uvicorn app:app --host 0.0.0.0 --port 8000
```

Deploy this directory as a long-running Docker service (for example Render,
Railway, Fly.io, or Cloud Run). Then set `CANOPY_VALIDATOR_URL` on the Supabase
Edge Function to its `/validate` URL, and set matching optional bearer tokens.
