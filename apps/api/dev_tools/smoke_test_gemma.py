"""
Real-model smoke test for GemmaProvider (issue #22) — no mocking, no
server. Just points the actual code at a real image and prints what comes
back, so you can eyeball extraction quality.

Run:
    python apps/api/dev_tools/smoke_test_gemma.py path/to/receipt.jpg

First run will be slow while Ollama loads the model into memory.
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.modules.ai.providers.gemma import GemmaProvider


def main() -> None:
    if len(sys.argv) != 2:
        print("Usage: python smoke_test_gemma.py path/to/receipt.jpg")
        sys.exit(1)

    image_path = Path(sys.argv[1])
    if not image_path.exists():
        print(f"File not found: {image_path}")
        sys.exit(1)

    file_bytes = image_path.read_bytes()

    print(f"Sending {image_path.name} ({len(file_bytes)} bytes) to gemma4:e4b...")
    start = time.monotonic()

    provider = GemmaProvider()
    result = provider.extract_evidence(
        file_bytes=file_bytes,
        original_name=image_path.name,
        content_type="image/jpeg",
        evidence_kind="receipt",
    )

    elapsed = time.monotonic() - start
    print(f"\nDone in {elapsed:.1f}s\n")
    print(json.dumps(result.model_dump(), indent=2, ensure_ascii=False))

    if result.fallback_used:
        print("\n⚠️  fallback_used=True — the real model call failed, this is fixture data.")
    else:
        print("\n✅ Real Gemma output above — check line items, quantities, and confidence for quality.")


if __name__ == "__main__":
    main()