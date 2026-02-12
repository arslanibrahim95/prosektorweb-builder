#!/usr/bin/env python3

import json
import re
import sys
from pathlib import Path
from typing import Any


def fail(message: str) -> None:
    print(f"[content-pack] {message}", file=sys.stderr)
    sys.exit(1)


def is_non_empty_string(value: Any) -> bool:
    return isinstance(value, str) and len(value.strip()) > 0


def is_object(value: Any) -> bool:
    return isinstance(value, dict)


def parse_json_with_fallback(raw_text: str) -> Any:
    candidates = [raw_text]

    # Common LLM pattern: fenced JSON block.
    fenced_match = re.search(r"```(?:json)?\s*(\{.*\})\s*```", raw_text, re.DOTALL | re.IGNORECASE)
    if fenced_match:
        candidates.append(fenced_match.group(1))

    # Fallback: first object block in the response.
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
        fail("Usage: python3 scripts/validate_content_pack.py <file>")

    target = Path(sys.argv[1])
    if not target.exists():
        fail(f"File not found: {target}")

    try:
        payload = parse_json_with_fallback(target.read_text(encoding="utf-8"))
    except Exception as exc:
        fail(f"Cannot parse JSON: {exc}")

    if not is_object(payload):
        fail("Top-level payload must be an object")

    pages = payload.get("pages")
    if not isinstance(pages, list) or len(pages) == 0:
        fail("`pages` must be a non-empty array")

    for index, page in enumerate(pages):
        if not is_object(page):
            fail(f"pages[{index}] must be an object")

        if not is_non_empty_string(page.get("slug")):
            fail(f"pages[{index}].slug must be a non-empty string")

        if not is_non_empty_string(page.get("title")):
            fail(f"pages[{index}].title must be a non-empty string")

        sections = page.get("sections")
        if not isinstance(sections, list):
            fail(f"pages[{index}].sections must be an array")

        seo = page.get("seo")
        if not is_object(seo):
            fail(f"pages[{index}].seo must be an object")

        if not is_non_empty_string(seo.get("title")):
            fail(f"pages[{index}].seo.title must be a non-empty string")

        if not is_non_empty_string(seo.get("description")):
            fail(f"pages[{index}].seo.description must be a non-empty string")

    image_prompts = payload.get("imagePrompts")
    if not isinstance(image_prompts, list) or len(image_prompts) == 0:
        fail("`imagePrompts` must be a non-empty array")

    for index, prompt_item in enumerate(image_prompts):
        string_prompt = is_non_empty_string(prompt_item)
        object_prompt = is_object(prompt_item) and is_non_empty_string(prompt_item.get("prompt"))
        if not string_prompt and not object_prompt:
            fail(
                f"imagePrompts[{index}] must be a string or an object with a non-empty prompt"
            )

    tone_guide = payload.get("toneGuide")
    tone_guide_valid = is_non_empty_string(tone_guide) or is_object(tone_guide)
    if not tone_guide_valid:
        fail("`toneGuide` must be a non-empty string or object")

    print("[content-pack] Validation passed")


if __name__ == "__main__":
    main()
