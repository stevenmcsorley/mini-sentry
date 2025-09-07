import traceback
import requests

def init_ms_error_handler(app, *, base="http://localhost:8000", token=None, release="1.0.0", environment="development", app_name="flask-app"):
    if not token:
        raise RuntimeError("MiniSentry: token is required")

    @app.errorhandler(Exception)
    def _ms_any_exception(e):
        try:
            payload = {
                "message": str(e),
                "level": "error",
                "stack": traceback.format_exc(),
                "release": release,
                "environment": environment,
                "app": app_name,
            }
            requests.post(f"{base}/api/events/ingest/token/{token}/", json=payload, timeout=3)
        except Exception:
            pass
        # fall back to generic 500; customize for your app
        return ("Internal Server Error", 500)

