import os
import time
from typing import Tuple

import redis as redis_lib


_redis_client = None


def get_redis():
    global _redis_client
    if _redis_client is None:
        url = os.environ.get("CELERY_BROKER_URL") or os.environ.get("REDIS_URL", "redis://localhost:6379/0")
        _redis_client = redis_lib.Redis.from_url(url)
    return _redis_client


def check_rate_limit(scope_key: str, limit: int = 120, window_seconds: int = 60) -> Tuple[bool, int]:
    """
    Simple fixed-window limiter using Redis INCR+EXPIRE.
    Returns (allowed, remaining).
    """
    r = get_redis()
    now = int(time.time())
    window = now // window_seconds
    key = f"rate:{scope_key}:{window}"
    count = r.incr(key)
    if count == 1:
        r.expire(key, window_seconds)
    remaining = max(0, limit - int(count))
    return (count <= limit), remaining

