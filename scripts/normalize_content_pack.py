#!/usr/bin/env python3

import json
import re
import sys
from pathlib import Path
from typing import Any


def parse_json_with_fallback(raw_text: str) -> Any:
    candidates = [raw_text]

    fenced_match = re.search(r"```(?:json)?\s*(\{.*\})\s*```", raw_text, re.DOTALL | re.IGNORECASE)
    if fenced_match:
        candidates.append(fenced_match.group(1))

    first_brace = raw_text.find("{")
    last_brace = raw_text.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        candidates.append(raw_text[first_brace : last_brace + 1])

    last_error: Exception | None = None
    for candidate in candidates:
        candidate_text = candidate.strip()
        if not candidate_text:
            continue
        try:
            return json.loads(candidate_text)
        except Exception as exc:  # noqa: BLE001
            last_error = exc

    if last_error is None:
        raise ValueError("No parseable JSON candidates found")
    raise last_error


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python3 scripts/normalize_content_pack.py <file>")

    target = Path(sys.argv[1])
    raw = target.read_text(encoding="utf-8")
    parsed = parse_json_with_fallback(raw)
    target.write_text(json.dumps(parsed, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
