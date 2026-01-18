# Error Storm Demo (CDN)

This folder contains a browser-based "error storm" demo for Mini Sentry. It sends a burst or drip of client-side errors to your local backend so you can verify ingestion and log filtering.

## Run the demo

1) Start the backend and frontend (from repo root):

```bash
docker compose up -d
```

2) Serve this folder (from this directory):

```bash
python3 -m http.server 8081
```

3) Open the demo page:

```
http://localhost:8081/error-storm.html
```

4) In the page:
- Base URL: `http://localhost:8000`
- Token: paste the ingest token for your project (Projects tab)
- Click "Init", then use "Burst" or "Drip"

## Notes

- The demo uses `examples/CDN/dist/error-storm.js` built from `src/error-storm.js`.
- To rebuild the bundle:

```bash
npm run build
```
