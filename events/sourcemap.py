"""
Minimal Source Map v3 parser with VLQ decoding.
Supports mapping generated (line, column) -> original (source, line, column, name).
Assumes 1-based lines from callers; converts to 0-based internally.
This is a simplified implementation suitable for basic symbolication only.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional, Tuple


BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
BASE64_VAL = {c: i for i, c in enumerate(BASE64_CHARS)}


def vlq_decode(segment: str) -> List[int]:
    values = []
    i = 0
    shift = 0
    result = 0
    while i < len(segment):
        c = segment[i]
        i += 1
        val = BASE64_VAL.get(c)
        if val is None:
            break
        continuation = val & 0x20
        digit = val & 0x1F
        result += digit << shift
        if continuation:
            shift += 5
            continue
        # sign bit
        sign = result & 1
        value = result >> 1
        if sign:
            value = -value
        values.append(value)
        result = 0
        shift = 0
    return values


@dataclass
class Mapping:
    gen_line: int
    gen_col: int
    src: Optional[int]
    src_line: Optional[int]
    src_col: Optional[int]
    name: Optional[int]


@dataclass
class SourceMap:
    version: int
    file: Optional[str]
    sources: List[str]
    names: List[str]
    mappings: List[Mapping]

    @staticmethod
    def parse(data: dict) -> "SourceMap":
        version = int(data.get("version", 3))
        file = data.get("file")
        sources = list(data.get("sources", []))
        names = list(data.get("names", []))
        raw = data.get("mappings", "")
        mappings: List[Mapping] = []
        # Decode mappings per line
        gen_line = 0
        prev_gen_col = 0
        prev_src = 0
        prev_src_line = 0
        prev_src_col = 0
        prev_name = 0
        for line in raw.split(";"):
            gen_line += 1
            if line == "":
                prev_gen_col = 0
                continue
            prev_gen_col = 0
            for seg in line.split(','):
                if not seg:
                    continue
                vals = vlq_decode(seg)
                # At least generatedColumn
                gen_col = prev_gen_col + vals[0]
                prev_gen_col = gen_col
                if len(vals) == 1:
                    mappings.append(Mapping(gen_line, gen_col, None, None, None, None))
                    continue
                src = prev_src + vals[1]
                prev_src = src
                src_line = prev_src_line + vals[2]
                prev_src_line = src_line
                src_col = prev_src_col + vals[3]
                prev_src_col = src_col
                name = None
                if len(vals) >= 5:
                    name = prev_name + vals[4]
                    prev_name = name
                mappings.append(Mapping(gen_line, gen_col, src, src_line, src_col, name))
        return SourceMap(version, file, sources, names, mappings)

    def original_position_for(self, gen_line_1: int, gen_col_0: int) -> Optional[Tuple[str, int, int, Optional[str]]]:
        # Find the closest mapping with same line and the greatest generated column <= given column
        line = gen_line_1
        best: Optional[Mapping] = None
        for m in self.mappings:
            if m.gen_line != line:
                continue
            if m.gen_col <= gen_col_0 and (best is None or m.gen_col > best.gen_col):
                best = m
        if not best or best.src is None:
            return None
        src_name = self.sources[best.src] if 0 <= best.src < len(self.sources) else ""
        orig_name = self.names[best.name] if (best.name is not None and 0 <= best.name < len(self.names)) else None
        # Convert to 1-based line
        return (src_name, (best.src_line or 0) + 1, best.src_col or 0, orig_name)

