import json
from typing import Any, Dict, List, Optional

from .models import Artifact, Release
from .sourcemap import SourceMap
import re


def _load_symbol_map(release: Release) -> Dict[str, str]:
    # Look for the newest JSON artifact with a simple function map
    artifact = (
        release.artifacts.filter(content_type__icontains="json").order_by("-created_at").first()
    )
    if not artifact:
        return {}
    try:
        data = json.loads(artifact.content)
        return data.get("function_map", {}) if isinstance(data, dict) else {}
    except Exception:
        return {}


def _best_sourcemap_for_file(release: Release, file_path: str) -> SourceMap | None:
    # Try to match artifacts by name component (e.g., app.js.map -> app.js)
    file_tail = (file_path or '').split('/')[-1]
    for art in release.artifacts.filter(content_type__icontains="json").order_by("-created_at"):
        try:
            data = json.loads(art.content)
        except Exception:
            continue
        if not isinstance(data, dict) or not data.get("version"):
            continue
        sm = SourceMap.parse(data)
        sm_file = (sm.file or '').split('/')[-1]
        if sm_file and sm_file == file_tail:
            return sm
    return None


def parse_stacktrace(stack: str) -> List[Dict[str, Any]]:
    """Parse JS stack trace lines into frames.
    Supports Chrome/Edge/Safari/Firefox formats and a few common variants.
    """
    frames: List[Dict[str, Any]] = []
    if not stack:
        return frames

    # Patterns
    # Chrome with function:    at fn (http://host/file.js:10:120)
    chrome_fn = re.compile(r"^\s*at\s+(?P<fn>[^\s].*?)\s*\((?P<file>.*?):(?P<line>\d+):(?P<col>\d+)\)\s*$")
    # Chrome without function: at http://host/file.js:10:120
    chrome_no_fn = re.compile(r"^\s*at\s+(?P<file>.*?):(?P<line>\d+):(?P<col>\d+)\s*$")
    # Firefox/Safari:          fn@http://host/file.js:10:120
    firefox = re.compile(r"^(?P<fn>[^@]+)?@(?P<file>.*?):(?P<line>\d+):(?P<col>\d+)$")
    # Bare file line:          http://host/file.js:10:120
    bare = re.compile(r"^(?P<file>.*?):(?P<line>\d+):(?P<col>\d+)$")

    for line in (stack.splitlines()):
        line = line.strip()
        if not line:
            continue
        m = chrome_fn.match(line) or chrome_no_fn.match(line) or firefox.match(line) or bare.match(line)
        if not m:
            continue
        gd = m.groupdict()
        frames.append({
            "function": (gd.get("fn") or "<anon>").strip(),
            "file": gd.get("file"),
            "line": int(gd.get("line") or 0),
            "column": int(gd.get("col") or 0),
        })
    return frames


def symbolicate_frames_for_release(release: Release, frames: List[Dict[str, Any]] | None, stack: str | None = None):
    fmap = _load_symbol_map(release)
    out = []
    if (not frames) and stack:
        frames = parse_stacktrace(stack)
    for fr in frames or []:
        fr2 = dict(fr)
        fn = fr.get("function")
        if fn and fn in fmap:
            fr2["function"] = fmap[fn]
        # If we have line/column and sourcemap, try mapping
        smap = None
        file_path = fr.get("file")
        if file_path:
            smap = _best_sourcemap_for_file(release, file_path)
        if smap and fr.get("line"):
            gen_line = int(fr.get("line"))
            gen_col = int(fr.get("column", 0))
            pos = smap.original_position_for(gen_line, gen_col)
            if pos:
                src, line1, col0, name = pos
                fr2["orig_file"] = src
                fr2["orig_line"] = line1
                fr2["orig_column"] = col0
                if name:
                    fr2["function"] = name
        out.append(fr2)
    return out
