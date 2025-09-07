# Python (FastAPI) example

Minimal FastAPI app that reports errors to Mini Sentry via a global exception handler.

## Run locally

```
cd examples/python-fastapi
python -m venv .venv && source .venv/bin/activate
pip install fastapi uvicorn httpx
export MS_BASE=http://localhost:8000
export MS_TOKEN=PASTE_INGEST_TOKEN
uvicorn main:app --port 5002 --reload
# visit http://localhost:5002/boom
```

## Run with Docker Compose

- In `docker-compose.yml`, set `fastapi-example` env `MS_TOKEN` to your project token.
- Start: `docker compose up -d fastapi-example`
- Visit: http://localhost:5002/boom

The global `@app.exception_handler(Exception)` posts `{ message, level, stack, release, environment }`.

