import re
from typing import Tuple


_NUMBER_RE = re.compile(r"\b\d+\b")
_HEX_RE = re.compile(r"\b0x[0-9a-fA-F]+\b")
_UUID_RE = re.compile(r"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}\b")
_EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")


def normalize_message(message: str) -> str:
    if not message:
        return ""
    m = message.strip()
    m = _EMAIL_RE.sub("<email>", m)
    m = _UUID_RE.sub("<uuid>", m)
    m = _HEX_RE.sub("<hex>", m)
    m = _NUMBER_RE.sub("<n>", m)
    return m[:500]


def compute_fingerprint(message: str, level: str = "error") -> Tuple[str, str]:
    normalized = normalize_message(message)
    # Very simple fingerprint: level + normalized message
    fingerprint = f"{level}:{normalized}"
    title = normalized[:120] or (message[:120] if message else "event")
    return fingerprint, title

