#!/usr/bin/env bash
set -euo pipefail

bash /app/scripts/wait-for-service.sh ${DATABASE_URL:-postgres://sentry:sentry@postgres:5432/sentry}

python manage.py migrate --noinput

# Collect static files for admin and apps (idempotent)
python manage.py collectstatic --noinput || true

exec gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 3
