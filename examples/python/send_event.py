#!/usr/bin/env python3
import os
import sys
import json
import time
import requests

BASE = os.environ.get("MS_BASE", "http://localhost:8000")
TOKEN = os.environ.get("MS_TOKEN")

if not TOKEN:
    print("Set MS_TOKEN to your project ingest token")
    sys.exit(1)

msg = os.environ.get("MS_MESSAGE", "Example error from sample app")
release = os.environ.get("MS_RELEASE", "1.0.0")
env = os.environ.get("MS_ENV", "production")

url = f"{BASE}/api/events/ingest/token/{TOKEN}/"
payload = {"message": msg, "level": "error", "release": release, "environment": env}
r = requests.post(url, json=payload, timeout=5)
r.raise_for_status()
print(json.dumps(r.json(), indent=2))

