package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "os"
)

func sendEvent(message string, level string) {
    base := os.Getenv("MS_BASE")
    if base == "" { base = "http://localhost:8000" }
    token := os.Getenv("MS_TOKEN")
    if token == "" { token = "PASTE_INGEST_TOKEN" }
    body := map[string]any{
        "message": message,
        "level": level,
        "release": "1.0.0",
        "environment": "development",
        "app": "go-example",
    }
    b, _ := json.Marshal(body)
    http.Post(fmt.Sprintf("%s/api/events/ingest/token/%s/", base, token), "application/json", bytes.NewBuffer(b))
}

func main() {
    // Example send
    sendEvent("Hello from Go", "info")
}

