#!/usr/bin/env python3
import os
import sys
import json
import uuid
import requests

BASE = os.environ.get("MS_BASE", "http://localhost:8000")
TOKEN = os.environ.get("MS_TOKEN")

if not TOKEN:
    print("Set MS_TOKEN to your project ingest token")
    sys.exit(1)

release = os.environ.get("MS_RELEASE", "1.0.0")
env = os.environ.get("MS_ENV", "production")
status = os.environ.get("MS_STATUS", "ok")
session_id = os.environ.get("MS_SESSION_ID", uuid.uuid4().hex[:12])
user = os.environ.get("MS_USER", "user-xyz")

url = f"{BASE}/api/sessions/ingest/token/{TOKEN}/"
payload = {
    "session_id": session_id,
    "status": status,
    "release": release,
    "environment": env,
    "user": user,
    "duration_ms": 1200 if status == "ok" else 0,
}
r = requests.post(url, json=payload, timeout=5)
r.raise_for_status()
print(json.dumps(r.json(), indent=2))

