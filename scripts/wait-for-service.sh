#!/usr/bin/env bash
set -euo pipefail

TARGET_URL=${1:-}

if [[ -z "$TARGET_URL" ]]; then
  echo "Usage: wait-for-service.sh <url>" >&2
  exit 1
fi

# Extract scheme
SCHEME="${TARGET_URL%%://*}"
REST="${TARGET_URL#*://}"
# Strip userinfo if present
REST_NO_USER="${REST#*@}"
# Take host:port portion
HOSTPORT="${REST_NO_USER%%/*}"
HOST="${HOSTPORT%%:*}"
PORT_PART="${HOSTPORT#*:}"
if [[ "$PORT_PART" == "$HOSTPORT" ]]; then
  PORT=""
else
  PORT="$PORT_PART"
fi

if [[ -z "${HOST}" || "${HOST}" == "${HOSTPORT}" && -z "${PORT}" ]]; then
  HOST="localhost"
fi

if [[ -z "$PORT" ]]; then
  case "$SCHEME" in
    redis) PORT=6379 ;;
    postgres|postgresql) PORT=5432 ;;
    http) PORT=80 ;;
    https) PORT=443 ;;
    *) PORT=80 ;;
  esac
fi

echo "Waiting for ${HOST}:${PORT}..."
for i in $(seq 1 90); do
  if nc -z -w1 "$HOST" "$PORT"; then
    echo "Service is up"
    exit 0
  fi
  sleep 1
done

echo "Timed out waiting for ${HOST}:${PORT}" >&2
exit 1
