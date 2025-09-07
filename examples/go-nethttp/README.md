# Go (net/http) example

Minimal Go program that posts an event to Mini Sentry.

## Run

```
cd examples/go-nethttp
MS_BASE=http://localhost:8000 MS_TOKEN=PASTE_INGEST_TOKEN go run main.go
```

This sends `{ message, level, release, environment, app }`.

