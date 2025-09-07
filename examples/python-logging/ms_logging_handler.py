import logging
import os
import requests


class MiniSentryHandler(logging.Handler):
    """Python logging handler that reports records to Mini Sentry.

    Usage:
        import logging
        from ms_logging_handler import MiniSentryHandler

        handler = MiniSentryHandler(
            base=os.getenv('MS_BASE', 'http://localhost:8000'),
            token=os.getenv('MS_TOKEN', ''),
            release=os.getenv('MS_RELEASE', '1.0.0'),
            environment=os.getenv('MS_ENV', 'development'),
            app=os.getenv('MS_APP', 'python-app'),
        )
        logging.getLogger().addHandler(handler)
        logging.getLogger().setLevel(logging.INFO)
    """

    def __init__(self, base: str, token: str, release: str = '1.0.0', environment: str = 'development', app: str = 'python-app', level=logging.NOTSET):
        super().__init__(level)
        self.base = base.rstrip('/')
        self.token = token
        self.release = release
        self.environment = environment
        self.app = app

    def emit(self, record: logging.LogRecord) -> None:
        if not self.token:
            return
        try:
            msg = self.format(record)
            level = self._map_level(record.levelno)
            stack = None
            if record.exc_info:
                try:
                    import traceback
                    stack = ''.join(traceback.format_exception(*record.exc_info))
                except Exception:
                    stack = None
            payload = {
                'message': msg,
                'level': level,
                'stack': stack,
                'release': self.release,
                'environment': self.environment,
                'app': self.app,
                'extra': {
                    'logger': record.name,
                    'module': record.module,
                    'funcName': record.funcName,
                }
            }
            url = f"{self.base}/api/events/ingest/token/{self.token}/"
            requests.post(url, json=payload, timeout=3)
        except Exception:
            # Never raise from logging handler
            pass

    @staticmethod
    def _map_level(no: int) -> str:
        if no >= logging.ERROR:
            return 'error'
        if no >= logging.WARNING:
            return 'warning'
        return 'info'

