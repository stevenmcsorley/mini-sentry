import json
import os
from typing import Any, Dict

from kafka import KafkaProducer

_producer = None


def get_producer() -> KafkaProducer:
    global _producer
    if _producer is None:
        servers = os.environ.get("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
        _producer = KafkaProducer(
            bootstrap_servers=servers.split(","),
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            linger_ms=50,
        )
    return _producer


def publish_event(data: Dict[str, Any], topic: str | None = None):
    topic = topic or os.environ.get("KAFKA_TOPIC", "events")
    try:
        producer = get_producer()
        producer.send(topic, value=data)
        producer.flush(1)
    except Exception:
        # Best-effort; ignore failures for now
        pass


def publish_session(data: Dict[str, Any]):
    topic = os.environ.get("KAFKA_SESSIONS_TOPIC", "sessions")
    publish_event(data, topic=topic)
