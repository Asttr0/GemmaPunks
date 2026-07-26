"""Run one real hosted-Gemma extraction without starting FastAPI.

Run:
    python apps/api/dev_tools/smoke_test_gemma.py path/to/receipt.jpg
"""

from __future__ import annotations

import asyncio
import json
import mimetypes
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import get_settings
from app.modules.ai.providers.gemma import GemmaProvider


async def run() -> None:
    if len(sys.argv) != 2:
        print("Usage: python smoke_test_gemma.py path/to/receipt.jpg")
        sys.exit(1)

    image_path = Path(sys.argv[1])
    if not image_path.exists():
        print(f"File not found: {image_path}")
        sys.exit(1)

    file_bytes = image_path.read_bytes()
    content_type = mimetypes.guess_type(image_path.name)[0]
    if content_type not in {"image/jpeg", "image/png", "application/pdf"}:
        print(f"Unsupported receipt content type: {content_type or 'unknown'}")
        sys.exit(1)

    settings = get_settings()
    print(
        f"Sending {image_path.name} ({len(file_bytes)} bytes) to hosted {settings.gemma_model}..."
    )
    start = time.monotonic()

    provider = GemmaProvider(
        api_key=settings.gemini_api_key,
        model_name=settings.gemma_model,
        timeout_seconds=settings.ai_timeout_seconds,
    )
    result = await provider.extract_evidence(
        file_bytes=file_bytes,
        original_name=image_path.name,
        content_type=content_type,
        evidence_kind="receipt",
    )

    elapsed = time.monotonic() - start
    print(f"\nDone in {elapsed:.1f}s\n")
    print(json.dumps(result.model_dump(), indent=2, ensure_ascii=False))

    if result.fallback_used:
        print("\nFallback was used; this did not prove the hosted model path.")
        sys.exit(2)
    else:
        print("\nReal Gemma output received; verify every extracted field manually.")


if __name__ == "__main__":
    asyncio.run(run())
