#!/usr/bin/env python3

import sys
import unicodedata
from pathlib import Path


def fail(message: str) -> None:
    print(f"[frontend-artifact] {message}", file=sys.stderr)
    raise SystemExit(1)


def contains_any(text: str, patterns: list[str]) -> bool:
    return any(pattern in text for pattern in patterns)


def normalize_text(value: str) -> str:
    value = unicodedata.normalize("NFKD", value)
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    value = value.lower()
    turkish_map = str.maketrans(
        {
            "ı": "i",
            "ş": "s",
            "ğ": "g",
            "ü": "u",
            "ö": "o",
            "ç": "c",
        }
    )
    value = value.translate(turkish_map)
    cleaned = []
    for ch in value:
        if ch.isalnum() or ch.isspace():
            cleaned.append(ch)
    return " ".join("".join(cleaned).split())


def extract_headings(raw_text: str) -> list[str]:
    headings: list[str] = []
    for line in raw_text.splitlines():
        stripped = line.strip()
        if not stripped.startswith("#"):
            continue
        heading = stripped.lstrip("#").strip()
        if heading:
            headings.append(normalize_text(heading))
    return headings


def has_heading_keyword_sets(headings: list[str], keyword_sets: list[list[str]]) -> bool:
    normalized_sets = [[normalize_text(item) for item in keyword_set] for keyword_set in keyword_sets]
    for heading in headings:
        for keyword_set in normalized_sets:
            if all(keyword in heading for keyword in keyword_set):
                return True
    return False


def main() -> None:
    if len(sys.argv) != 2:
        fail("Usage: python3 scripts/validate_frontend_artifact.py <file>")

    target = Path(sys.argv[1])
    if not target.exists():
        fail(f"File not found: {target}")

    raw = target.read_text(encoding="utf-8")
    text = raw.lower()

    headings = extract_headings(raw)

    required_heading_keywords = [
        ("Visual Direction", [["gorsel", "yonelim"]]),
        ("Design Tokens", [["tasarim", "token"]]),
        ("Route-by-Route UI Plan", [["rota", "plan"]]),
        ("Component Mapping", [["bilesen", "esle"], ["bilesen", "haritala"]]),
        ("Responsive and Accessibility Rules", [["erisilebilirlik"], ["duyarlilik", "erisilebilirlik"]]),
        (
            "Hand-off Notes for Backend Integration",
            [["backend", "handoff"], ["backend", "devir"], ["backend", "not"]],
        ),
    ]

    for display_name, keyword_sets in required_heading_keywords:
        if not has_heading_keyword_sets(headings, keyword_sets):
            fail(f"Missing required section heading group: {display_name}")

    # Guardrail compliance checks.
    guardrail_checks = [
        (
            "light-first theme strategy",
            [
                "theme strategy: light-first with dark support",
                "light-first with dark support",
                "açık tema öncelikli",
                "acik tema oncelikli",
            ],
        ),
        (
            "neutral base + one primary accent rule",
            [
                "palette rule: neutral base + one primary accent",
                "neutral base + one primary accent",
                "nötr taban + tek ana vurgu",
                "notr taban + tek ana vurgu",
                "tek ana vurgu",
            ],
        ),
        (
            "subtle functional motion rule",
            [
                "motion rule: subtle, functional, and minimal",
                "subtle, functional, and minimal",
                "işlevsel",
                "islevsel",
                "subtle motion",
            ],
        ),
        (
            "consistency across components",
            [
                "consistent",
                "tutarlı",
                "tutarli",
                "same radius",
                "aynı radius",
                "ayni radius",
            ],
        ),
    ]

    for name, patterns in guardrail_checks:
        if not contains_any(text, patterns):
            fail(f"Missing guardrail signal: {name}")

    # Basic anti-slop checks (allow mentioning to avoid, but flag if repeatedly promoted).
    banned_promotional_terms = [
        "neon palette",
        "heavy glassmorphism",
        "decorative motion spam",
    ]

    for term in banned_promotional_terms:
        if text.count(term) > 1:
            fail(f"Potentially unstable style guidance repeated: {term}")

    print("[frontend-artifact] Validation passed")


if __name__ == "__main__":
    main()
