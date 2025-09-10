#!/usr/bin/env bash
set -euo pipefail

bash /app/scripts/wait-for-service.sh ${DATABASE_URL:-postgres://sentry:sentry@postgres:5432/sentry}

python manage.py migrate --noinput

# Collect static files for admin and apps (idempotent)
python manage.py collectstatic --noinput || true

# Use Daphne ASGI server for WebSocket support
exec daphne -b 0.0.0.0 -p 8000 core.asgi:application
