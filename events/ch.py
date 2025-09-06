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
