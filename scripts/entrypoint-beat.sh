#!/usr/bin/env bash
set -euo pipefail

bash /app/scripts/wait-for-service.sh ${DATABASE_URL:-postgres://sentry:sentry@postgres:5432/sentry}
bash /app/scripts/wait-for-service.sh ${CELERY_BROKER_URL:-redis://redis:6379/1}

python manage.py migrate --noinput

exec celery -A core beat -l info
