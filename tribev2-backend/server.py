"""
TRIBE v2 Inference API Server with 3D Brain Visualization
"""
import base64
import io
import json
import os
import tempfile
import time
import uuid
from pathlib import Path
from typing import Optional

import numpy as np
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

CACHE_DIR = Path(os.environ.get("TRIBE_CACHE", "./cache"))
RESULTS_DIR = Path(os.environ.get("TRIBE_RESULTS", "./results"))
RESULTS_DIR.mkdir(exist_ok=True)

jobs: dict[str, dict] = {}
_model = None
_plotter = None

# ─── Lazy Load ─────────────────────────────────────────────────
def get_model():
    global _model
    if _model is None:
        print("Loading TRIBE v2 model...")
        from tribev2.demo_utils import TribeModel
        _model = TribeModel.from_pretrained("facebook/tribev2", cache_folder=str(CACHE_DIR))
        print("Model loaded.")
    return _model

def get_plotter():
    global _plotter
    if _plotter is None:
        from tribev2.plotting import PlotBrain
        _plotter = PlotBrain(mesh="fsaverage5")
    return _plotter

# ─── Brain Rendering ───────────────────────────────────────────
def render_brain_view(preds: np.ndarray, timestep: int, view: str = "left") -> str:
    """Render a single brain view at a given timestep. Returns base64 PNG."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    plotter = get_plotter()

    # Get data for this timestep
    data = preds[timestep].astype(np.float64)

    fig, ax = plt.subplots(1, 1, figsize=(4, 4))
    plotter.plot_surf(
        data,
        axes=ax,
        views=view,
        cmap="RdBu_r",
        symmetric_cbar=True,
        norm_percentile=98,
    )

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150, bbox_inches="tight", transparent=True)
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode()

def render_all_views(preds: np.ndarray, timestep: int) -> dict[str, str]:
    """Render standard brain views: lateral left/right, dorsal, ventral, anterior, posterior."""
    views = ["left", "right", "dorsal", "ventral", "anterior", "posterior"]
    result = {}
    for v in views:
        try:
            result[v] = render_brain_view(preds, timestep, v)
        except Exception as e:
            print(f"  View '{v}' failed: {e}")
            result[v] = None
    return result

# ─── App ───────────────────────────────────────────────────────
app = FastAPI(title="TRIBE v2 API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health():
    return {"status": "ok", "gpu": "ready"}

@app.post("/api/upload")
async def upload(
    modality: str = Form(...),
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
):
    if modality not in ("image", "video", "audio", "text"):
        raise HTTPException(400, "Invalid modality")

    if modality == "text" and not text:
        raise HTTPException(400, "Text modality requires text")
    if modality != "text" and not file:
        raise HTTPException(400, f"{modality} requires a file")

    job_id = str(uuid.uuid4())[:8]
    jobs[job_id] = {
        "status": "queued",
        "result": None,
        "error": None,
        "created_at": time.time(),
        "modality": modality,
    }

    # Save input
    if modality == "text":
        input_path = RESULTS_DIR / f"{job_id}.txt"
        input_path.write_text(text)
    else:
        suffix = Path(file.filename).suffix if file.filename else ""
        input_path = RESULTS_DIR / f"{job_id}{suffix}"
        content = await file.read()
        input_path.write_bytes(content)

    import threading
    t = threading.Thread(target=process_job, args=(job_id, modality, input_path), daemon=True)
    t.start()

    return {"jobId": job_id, "status": "queued"}

@app.get("/api/result/{job_id}")
async def get_result(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return {
        "jobId": job_id,
        "status": job["status"],
        "result": job.get("result"),
        "error": job.get("error"),
    }

@app.get("/api/brain-view/{job_id}/{timestep}")
async def get_brain_view(job_id: str, timestep: int, view: str = "left"):
    """Get a rendered brain view PNG for a specific timestep."""
    job = jobs.get(job_id)
    if not job or job["status"] != "done":
        raise HTTPException(404, "Job not ready")

    preds = job.get("_preds")
    if preds is None:
        raise HTTPException(400, "Predictions not available")

    if timestep < 0 or timestep >= preds.shape[0]:
        raise HTTPException(400, f"Timestep {timestep} out of range [0, {preds.shape[0]})")

    img_b64 = render_brain_view(preds, timestep, view)
    return {"timestep": timestep, "view": view, "image": f"data:image/png;base64,{img_b64}"}

@app.get("/api/brain-frames/{job_id}")
async def get_brain_frames(job_id: str, timestep: int = 0):
    """Get all brain views for a timestep."""
    job = jobs.get(job_id)
    if not job or job["status"] != "done":
        raise HTTPException(404, "Job not ready")

    preds = job.get("_preds")
    if preds is None:
        raise HTTPException(400, "Predictions not available")

    views = render_all_views(preds, timestep)
    return {
        "timestep": timestep,
        "totalTimesteps": int(preds.shape[0]),
        "views": {v: f"data:image/png;base64,{img}" if img else None for v, img in views.items()},
    }

# ─── Processing ────────────────────────────────────────────────
@app.get("/api/brain-data/{job_id}/{timestep}")
async def get_brain_data(job_id: str, timestep: int):
    """Return raw vertex prediction data for client-side 3D rendering."""
    job = jobs.get(job_id)
    if not job or job["status"] != "done":
        raise HTTPException(404, "Job not ready")

    preds = job.get("_preds")
    if preds is None:
        raise HTTPException(400, "Predictions not available")

    if timestep < 0 or timestep >= preds.shape[0]:
        raise HTTPException(400, f"Timestep {timestep} out of range [0, {preds.shape[0]})")

    # fsaverage5 has ~20k vertices, split left/right
    n_total = preds.shape[1]
    n_left = n_total // 2
    n_right = n_total - n_left

    ts_data = preds[timestep].astype(np.float64)
    return {
        "timestep": timestep,
        "totalTimesteps": int(preds.shape[0]),
        "left": ts_data[:n_left].tolist(),
        "right": ts_data[n_left:].tolist(),
    }


def process_job(job_id: str, modality: str, input_path: Path):
    try:
        jobs[job_id]["status"] = "processing"
        model = get_model()

        # Build events & predict
        if modality == "image":
            # Convert image to a short mp4 video (ffmpeg)
            video_path = input_path.with_suffix(".mp4")
            import subprocess
            # -vf "pad=ceil(iw/2)*2:ceil(ih/2)*2" ensures even dimensions for libx264
            subprocess.run([
                "ffmpeg", "-y", "-loop", "1", "-i", str(input_path.absolute()),
                "-t", "2", "-c:v", "libx264", "-pix_fmt", "yuv420p",
                "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2",
                "-loglevel", "error", str(video_path.absolute())
            ], check=True)
            df = model.get_events_dataframe(video_path=str(video_path.absolute()))
        elif modality == "video":
            df = model.get_events_dataframe(video_path=str(input_path))
        elif modality == "audio":
            df = model.get_events_dataframe(audio_path=str(input_path))
        elif modality == "text":
            df = model.get_events_dataframe(text_path=str(input_path))

        preds, segments = model.predict(events=df)

        # Keep predictions in memory for brain rendering
        jobs[job_id]["_preds"] = preds

        jobs[job_id]["status"] = "done"
        jobs[job_id]["result"] = {
            "modality": modality,
            "timesteps": int(preds.shape[0]),
            "vertices": int(preds.shape[1]),
            "predictionSummary": {
                "mean": float(preds.mean()),
                "std": float(preds.std()),
                "min": float(preds.min()),
                "max": float(preds.max()),
            },
        }
        print(f"✅ Job {job_id} done: {preds.shape}")

    except Exception as e:
        import traceback
        traceback.print_exc()
        jobs[job_id]["status"] = "error"
        jobs[job_id]["error"] = str(e)
        print(f"❌ Job {job_id} failed: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9000)
