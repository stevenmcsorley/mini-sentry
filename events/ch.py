import os
import clickhouse_connect
from urllib.parse import urlparse


_client = None


def get_client():
    global _client
    if _client is None:
        url = os.environ.get("CLICKHOUSE_URL", "http://clickhouse:8123")
        parsed = urlparse(url)
        host = parsed.hostname or "clickhouse"
        port = parsed.port or (8443 if parsed.scheme == "https" else 8123)
        db = os.environ.get("CLICKHOUSE_DATABASE", "sentry")
        _client = clickhouse_connect.get_client(host=host, port=port, database=db)
    return _client


def query_events(project: str, limit: int = 100):
    client = get_client()
    query = (
        "SELECT id, project, level, fingerprint, title, message, received_at "
        "FROM sentry.events WHERE project = %(project)s ORDER BY received_at DESC LIMIT %(limit)s"
    )
    return client.query(query, parameters={"project": project, "limit": limit}).result_rows


def query_session_series(project: str, minutes: int = 1440, bucket: str = '5m'):
    client = get_client()
    # Determine interval
    if bucket.endswith('m'):
        granularity = "toStartOfFiveMinutes" if bucket == '5m' else "toStartOfMinute"
    elif bucket.endswith('h'):
        granularity = "toStartOfHour"
    else:
        granularity = "toStartOfFiveMinute"
    sql = f"""
        SELECT {granularity}(toDateTime(started_at)) AS bucket,
               count() AS total,
               sum(status = 'crashed') AS crashed
        FROM sentry.sessions
        WHERE project = %(project)s AND started_at >= now() - toIntervalMinute(%(minutes)s)
        GROUP BY bucket
        ORDER BY bucket
    """
    return get_client().query(sql, parameters={"project": project, "minutes": minutes}).result_rows


def query_events_series_by_level(project: str, minutes: int = 60, bucket: str = '5m', from_iso: str | None = None, to_iso: str | None = None, environment: str | None = None):
    client = get_client()
    # Determine granularity function
    if bucket == '1h':
        trunc = 'toStartOfHour'
    elif bucket.endswith('m'):
        trunc = 'toStartOfFiveMinutes' if bucket == '5m' else 'toStartOfMinute'
    else:
        trunc = 'toStartOfFiveMinutes'
    # Build WHERE clause with optional environment filter
    env_filter = " AND environment = %(environment)s" if environment else ""
    
    if from_iso and to_iso:
        sql = f"""
            SELECT {trunc}(toDateTime(received_at)) AS bucket, level, count() AS c
            FROM sentry.events
            WHERE project = %(project)s
              AND received_at BETWEEN parseDateTimeBestEffort(%(from)s) AND parseDateTimeBestEffort(%(to)s)
              {env_filter}
            GROUP BY bucket, level
            ORDER BY bucket
        """
        params = {"project": project, "from": from_iso, "to": to_iso}
        if environment:
            params["environment"] = environment
    else:
        sql = f"""
            SELECT {trunc}(toDateTime(received_at)) AS bucket, level, count() AS c
            FROM sentry.events
            WHERE project = %(project)s AND received_at >= now() - toIntervalMinute(%(minutes)s)
              {env_filter}
            GROUP BY bucket, level
            ORDER BY bucket
        """
        params = {"project": project, "minutes": minutes}
        if environment:
            params["environment"] = environment
    rows = client.query(sql, parameters=params).result_rows
    # Fold rows into series with columns per level
    out = {}
    for b, level, c in rows:
        key = str(b)
        if key not in out:
            out[key] = {"bucket": key, "error": 0, "warning": 0, "info": 0}
        out[key][level] = int(c)
    return list(out.values())


def query_top_groups(project: str, minutes: int = 60, limit: int = 10, from_iso: str | None = None, to_iso: str | None = None):
    client = get_client()
    if from_iso and to_iso:
        sql = """
            SELECT fingerprint, any(title) AS title, count() AS c
            FROM sentry.events
            WHERE project = %(project)s
              AND received_at BETWEEN parseDateTimeBestEffort(%(from)s) AND parseDateTimeBestEffort(%(to)s)
            GROUP BY fingerprint
            ORDER BY c DESC
            LIMIT %(limit)s
        """
        params = {"project": project, "from": from_iso, "to": to_iso, "limit": limit}
    else:
        sql = """
            SELECT fingerprint, any(title) AS title, count() AS c
            FROM sentry.events
            WHERE project = %(project)s AND received_at >= now() - toIntervalMinute(%(minutes)s)
            GROUP BY fingerprint
            ORDER BY c DESC
            LIMIT %(limit)s
        """
        params = {"project": project, "minutes": minutes, "limit": limit}
    return client.query(sql, parameters=params).result_rows
