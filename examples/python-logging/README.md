# Python logging handler example

Use `MiniSentryHandler` to forward Python `logging` records to Mini Sentry.

## Usage

```
pip install requests
python - <<'PY'
import logging, os
from ms_logging_handler import MiniSentryHandler

handler = MiniSentryHandler(
  base=os.getenv('MS_BASE', 'http://localhost:8000'),
  token=os.getenv('MS_TOKEN', ''),
  release='1.0.0',
  environment='development',
  app='python-logging-example',
)
logging.getLogger().addHandler(handler)
logging.getLogger().setLevel(logging.INFO)

logging.info('hello from logging', extra={'section':'demo'})
try:
  1/0
except Exception:
  logging.exception('division failed')
PY
```

Set `MS_TOKEN` in your environment. The handler posts `{ message, level, stack, release, environment }`.

