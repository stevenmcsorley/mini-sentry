import os
import time
import json
from datetime import datetime, timezone
from kafka import KafkaConsumer
import clickhouse_connect
from urllib.parse import urlparse


KAFKA_BOOTSTRAP_SERVERS = os.environ.get("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
KAFKA_TOPICS = [t.strip() for t in os.environ.get("KAFKA_TOPICS", "events,sessions").split(",") if t.strip()]
CLICKHOUSE_URL = os.environ.get("CLICKHOUSE_URL", "http://clickhouse:8123")
CLICKHOUSE_DATABASE = os.environ.get("CLICKHOUSE_DATABASE", "sentry")


def ensure_table(client):
    client.command(f"CREATE DATABASE IF NOT EXISTS {CLICKHOUSE_DATABASE}")
    client.command(
        f"""
        CREATE TABLE IF NOT EXISTS {CLICKHOUSE_DATABASE}.events (
            id UInt64,
            project String,
            level LowCardinality(String),
            fingerprint String,
            title String,
            message String,
            received_at DateTime
        ) ENGINE = MergeTree()
        ORDER BY (project, received_at)
        """
    )
    client.command(
        f"""
        CREATE TABLE IF NOT EXISTS {CLICKHOUSE_DATABASE}.sessions (
            project String,
            release String,
            environment String,
            status LowCardinality(String),
            session_id String,
            user String,
            duration_ms UInt32,
            started_at DateTime
        ) ENGINE = MergeTree()
        ORDER BY (project, started_at)
        """
    )


def main():
    # Retry Kafka connectivity
    consumer = None
    for i in range(60):
        try:
            consumer = KafkaConsumer(
                *KAFKA_TOPICS,
                bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS.split(","),
                value_deserializer=lambda m: json.loads(m.decode("utf-8")),
                auto_offset_reset="earliest",
                enable_auto_commit=True,
                group_id="snuba-consumer",
                max_poll_records=100,
            )
            break
        except Exception as e:
            print(f"Kafka not ready: {e}; retrying...")
            time.sleep(2)
    if consumer is None:
        raise SystemExit("Kafka not available after retries")

    # Retry ClickHouse connectivity
    parsed = urlparse(CLICKHOUSE_URL)
    host = parsed.hostname or "clickhouse"
    port = parsed.port or (8443 if parsed.scheme == "https" else 8123)
    client = None
    for i in range(60):
        try:
            client = clickhouse_connect.get_client(host=host, port=port, database=CLICKHOUSE_DATABASE)
            ensure_table(client)
            break
        except Exception as e:
            print(f"ClickHouse not ready: {e}; retrying...")
            time.sleep(2)
    if client is None:
        raise SystemExit("ClickHouse not available after retries")

    while True:
        msgs = consumer.poll(timeout_ms=1000, max_records=100)
        rows = []
        session_rows = []
        for tp, batch in msgs.items():
            for msg in batch:
                data = msg.value
                try:
                    if tp.topic.endswith('events'):
                        # Parse received_at to datetime
                        ra = data.get("received_at", "")
                        dt = None
                        if isinstance(ra, str) and ra:
                            try:
                                dt = datetime.fromisoformat(ra.replace('Z', '+00:00'))
                            except Exception:
                                dt = datetime.now(timezone.utc)
                        elif isinstance(ra, (int, float)):
                            dt = datetime.fromtimestamp(float(ra), tz=timezone.utc)
                        else:
                            dt = datetime.now(timezone.utc)
                        rows.append(
                            [
                                int(data.get("id", 0)),
                                data.get("project", ""),
                                data.get("level", "error"),
                                data.get("fingerprint", ""),
                                data.get("title", ""),
                                data.get("message", ""),
                                dt,
                            ]
                        )
                    elif tp.topic.endswith('sessions'):
                        sa = data.get("started_at", "")
                        sdt = None
                        if isinstance(sa, str) and sa:
                            try:
                                sdt = datetime.fromisoformat(sa.replace('Z', '+00:00'))
                            except Exception:
                                sdt = datetime.now(timezone.utc)
                        elif isinstance(sa, (int, float)):
                            sdt = datetime.fromtimestamp(float(sa), tz=timezone.utc)
                        else:
                            sdt = datetime.now(timezone.utc)
                        session_rows.append(
                            [
                                data.get("project", ""),
                                data.get("release", ""),
                                data.get("environment", ""),
                                data.get("status", ""),
                                data.get("session_id", ""),
                                data.get("user", ""),
                                int(data.get("duration_ms", 0) or 0),
                                sdt,
                            ]
                        )
                except Exception:
                    continue
        if rows:
            client.insert(
                f"{CLICKHOUSE_DATABASE}.events",
                rows,
                column_names=[
                    "id",
                    "project",
                    "level",
                    "fingerprint",
                    "title",
                    "message",
                    "received_at",
                ],
            )
        if session_rows:
            client.insert(
                f"{CLICKHOUSE_DATABASE}.sessions",
                session_rows,
                column_names=[
                    "project",
                    "release",
                    "environment",
                    "status",
                    "session_id",
                    "user",
                    "duration_ms",
                    "started_at",
                ],
            )
        time.sleep(0.2)


if __name__ == "__main__":
    main()
