from flask import Flask
import os, requests, traceback
from ms_error_handler import init_ms_error_handler

app = Flask(__name__)
BASE = os.environ.get('MS_BASE', 'http://localhost:8000')
TOKEN = os.environ.get('MS_TOKEN', 'PASTE_INGEST_TOKEN')

def send_event(message, level='error', stack=None, extra=None):
    url = f"{BASE}/api/events/ingest/token/{TOKEN}/"
    payload = {
        'message': message,
        'level': level,
        'stack': stack,
        'extra': extra or {},
        'release': '1.0.0',
        'environment': 'development',
        'app': 'flask-example',
    }
    try:
        requests.post(url, json=payload, timeout=5)
    except Exception:
        pass

@app.route('/')
def ok():
    return 'OK'

@app.route('/boom')
def boom():
    # Let the global handler capture this
    raise RuntimeError('Deliberate error from Flask')

if __name__ == '__main__':
    # Install global error handler for automatic capture
    init_ms_error_handler(
        app,
        base=BASE,
        token=TOKEN or os.environ.get('MS_TOKEN', ''),
        release=os.environ.get('MS_RELEASE', '1.0.0'),
        environment=os.environ.get('MS_ENV', 'development'),
        app_name='flask-example',
    )
    app.run(port=5001, debug=True)
