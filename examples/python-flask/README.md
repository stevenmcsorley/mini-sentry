# Python (Flask) example

Minimal Flask app that reports errors to Mini Sentry.

## Setup & run

```
cd examples/python-flask
python -m venv .venv && source .venv/bin/activate
pip install flask requests
export MS_BASE=http://localhost:8000
export MS_TOKEN=PASTE_INGEST_TOKEN
python app.py
# visit http://localhost:5001/boom
```

The `/boom` route posts an event with `{ message, level, stack, release, environment }`.

### Use the built-in error handler

`ms_error_handler.py` registers a global error handler so uncaught exceptions are automatically reported. The example `app.py` installs it on startup.

Dockerfile example (optional):

```
FROM python:3.11-slim
WORKDIR /app
COPY . /app
RUN pip install --no-cache-dir flask requests
ENV MS_BASE=http://localhost:8000
ENV MS_TOKEN=CHANGE_ME
EXPOSE 5001
CMD ["python", "app.py"]
```
