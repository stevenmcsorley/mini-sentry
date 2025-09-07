from fastapi import FastAPI, Request
import os, traceback, httpx

app = FastAPI()
BASE = os.environ.get("MS_BASE", "http://localhost:8000")
TOKEN = os.environ.get("MS_TOKEN", "PASTE_INGEST_TOKEN")

@app.get("/")
def ok():
    return {"ok": True}

@app.get("/boom")
def boom():
    raise RuntimeError("Deliberate error from FastAPI")

@app.exception_handler(Exception)
async def ms_exception_handler(request: Request, exc: Exception):
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            await client.post(f"{BASE}/api/events/ingest/token/{TOKEN}/", json={
                "message": str(exc),
                "level": "error",
                "stack": traceback.format_exc(),
                "release": "1.0.0",
                "environment": "development",
                "app": "fastapi-example",
                "extra": {"path": request.url.path, "method": request.method},
            })
    except Exception:
        pass
    return {"detail": "Internal Server Error"}

# Run: uvicorn main:app --port 5002 --reload

