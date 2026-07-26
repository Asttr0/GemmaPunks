"""
Real Gemma extraction provider (issue #22).

Calls hosted Gemma 4 (gemma-4-12b-it by default) through the Gemini API —
not local Ollama, not a Gemini model. Implements the exact same
ExtractionProvider contract as FixtureProvider (see base.py), so Anas's
FastAPI layer never needs to know which one ran.

Falls back to FixtureProvider automatically when:
  - GEMINI_API_KEY is not configured
  - evidence_kind == "audio" (real audio inference isn't wired up yet)
  - the API call fails or times out
  - the response fails ExtractionDraft validation

Never trusts a number Gemma proposes: ExtractionLine/ExtractionDraft
recompute line totals and the grand total themselves (see extraction.py).
"""

from __future__ import annotations

import json
import logging
import time
import uuid
from typing import Optional

from google import genai
from google.genai import types
from pydantic import ValidationError

from app.core.config import get_settings
from app.modules.ai.providers.base import EvidenceKind, ExtractionProvider
from app.modules.ai.providers.fixture import FixtureProvider
from app.modules.ai.schemas.extraction import (
    ExtractionDraft,
    ExtractionResult,
    ToolEvent,
    ToolEventStatus,
)

logger = logging.getLogger(__name__)

# Only gemma-4-26b-a4b-it and gemma-4-31b-it are actually served through
# the hosted Gemini API — gemma-4-12b-it is download-and-self-host only
# (Ollama/Hugging Face), not callable here, confirmed by a live 404.
# 26b-a4b-it (MoE, lower latency than the 31B dense model) is the default
# for demo-day speed; override with GEMMA_MODEL_NAME for 31b-it instead.
DEFAULT_MODEL_NAME = "gemma-4-26b-a4b-it"
REQUEST_TIMEOUT_MS = 45_000

EXTRACTION_PROMPT = """You are an extraction assistant for MIZAN Souq, a business
management tool for Moroccan microbusinesses. You are given one piece of
transaction evidence (a receipt/invoice image). Extract it into strict JSON
matching this exact schema — no prose, no markdown fences, JSON only:

{
  "transaction_kind": "purchase" | "sale",
  "currency": "MAD",
  "lines": [
    {
      "product_id": "string (snake_case; reuse an id from the known catalog below if it clearly matches, otherwise derive one from the product name)",
      "product_name": "string (normalized product name)",
      "original_product_name": "string or null (the exact wording seen on the evidence, e.g. Darija/French)",
      "unit": "string (e.g. 'bottle', 'bag', 'kg', 'unit')",
      "quantity": positive number,
      "unit_price_centimes": non-negative integer (1 MAD = 100 centimes; convert if the evidence shows dirhams),
      "line_total_centimes": non-negative integer (your best read; the caller recalculates this, don't worry about rounding),
      "confidence": number from 0.0 to 1.0,
      "uncertain_fields": ["list of field names on this line you are not confident about, e.g. 'quantity'"]
    }
  ],
  "total_centimes": non-negative integer (your best read; the caller recalculates this),
  "clarification_question": "one short, polite question in French or Darija if something important is ambiguous, otherwise null"
}

Rules:
- Never guess a blurry number with high confidence — mark it in uncertain_fields and lower confidence instead.
- If nothing is ambiguous, clarification_question must be null.
- Return uncertainty rather than inventing precise-looking figures.
"""


def _strip_markdown_fence(text: str) -> str:
    stripped = text.strip()
    if stripped.startswith("```"):
        stripped = stripped.split("\n", 1)[1] if "\n" in stripped else stripped
        if stripped.endswith("```"):
            stripped = stripped.rsplit("```", 1)[0]
    return stripped.strip()


class GemmaProvider(ExtractionProvider):
    """Hosted Gemma 4 (Gemini API) provider, per base.py's ExtractionProvider."""

    def __init__(
        self,
        fallback_provider: Optional[FixtureProvider] = None,
        model_name: Optional[str] = None,
    ):
        self.settings = get_settings()
        self.fallback = fallback_provider or FixtureProvider()
        self.model_name = (
            model_name
            or getattr(self.settings, "gemma_model_name", None)
            or DEFAULT_MODEL_NAME
        )

        api_key = getattr(self.settings, "gemini_api_key", None)
        self._client: Optional[genai.Client] = (
            genai.Client(api_key=api_key) if api_key else None
        )

    # --- public contract -------------------------------------------------

    def extract_evidence(
        self,
        *,
        file_bytes: bytes,
        original_name: str,
        content_type: str,
        evidence_kind: EvidenceKind,
        safe_product_context: list[str] | None = None,
    ) -> ExtractionResult:
        timeline: list[ToolEvent] = []

        if self._client is None:
            return self._fallback(
                file_bytes, original_name, content_type, evidence_kind,
                safe_product_context, timeline, reason="Missing GEMINI_API_KEY",
            )

        if evidence_kind == "audio":
            # Real audio inference isn't wired up yet for the hosted path
            # either — same limitation as the old local-Ollama provider.
            return self._fallback(
                file_bytes, original_name, content_type, evidence_kind,
                safe_product_context, timeline,
                reason="Audio not yet supported by GemmaProvider",
            )

        start = time.monotonic()
        prompt = EXTRACTION_PROMPT
        if safe_product_context:
            prompt += f"\nKnown product catalog (ids): {safe_product_context}\n"

        try:
            raw_text = self._call_model(file_bytes, content_type, prompt)
            duration_ms = int((time.monotonic() - start) * 1000)

            parsed = json.loads(_strip_markdown_fence(raw_text))
            if isinstance(parsed, list):
                # Gemma sometimes wraps the object in a single-element array
                # even when the prompt asks for a bare object — normalize it.
                if len(parsed) != 1:
                    raise ValueError(
                        f"Expected a single JSON object, got a list of {len(parsed)}"
                    )
                parsed = parsed[0]

            draft = ExtractionDraft.model_validate(parsed)

            timeline.append(
                ToolEvent(
                    sequence=1,
                    name="gemma_extract",
                    status=ToolEventStatus.SUCCEEDED,
                    input_summary=f"{evidence_kind} evidence, {len(file_bytes)} bytes -> {self.model_name}",
                    output_summary=f"{len(draft.lines)} line(s) extracted",
                    duration_ms=duration_ms,
                )
            )

            return ExtractionResult(
                provider="gemma",
                model=self.model_name,
                fallback_used=False,
                draft=draft,
                timeline=timeline,
            )

        except (ValidationError, ValueError) as e:
            logger.warning("Gemma response failed schema validation: %s", e)
            timeline.append(
                ToolEvent(
                    sequence=1,
                    name="gemma_extract",
                    status=ToolEventStatus.FAILED,
                    input_summary=f"{evidence_kind} evidence -> {self.model_name}",
                    output_summary="Response failed schema validation",
                    duration_ms=int((time.monotonic() - start) * 1000),
                    fallback_used=True,
                )
            )
            return self._fallback(
                file_bytes, original_name, content_type, evidence_kind,
                safe_product_context, timeline, reason=str(e),
            )

        except Exception as e:  # noqa: BLE001 — any API/network failure falls back
            logger.error("Gemma API call failed: %s", e)
            timeline.append(
                ToolEvent(
                    sequence=1,
                    name="gemma_extract",
                    status=ToolEventStatus.FAILED,
                    input_summary=f"{evidence_kind} evidence -> {self.model_name}",
                    output_summary="Gemma API call failed",
                    duration_ms=int((time.monotonic() - start) * 1000),
                    fallback_used=True,
                )
            )
            return self._fallback(
                file_bytes, original_name, content_type, evidence_kind,
                safe_product_context, timeline, reason=str(e),
            )

    # --- internals ---------------------------------------------------------

    def _call_model(self, file_bytes: bytes, content_type: str, prompt: str) -> str:
        """Isolated so tests can patch just this method instead of the SDK
        internals. Returns the raw text response from the model."""
        response = self._client.models.generate_content(
            model=self.model_name,
            contents=[
                types.Part.from_bytes(data=file_bytes, mime_type=content_type),
                prompt,
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                http_options=types.HttpOptions(timeout=REQUEST_TIMEOUT_MS),
            ),
        )
        if not response or not response.text:
            raise ValueError("Empty response from Gemma API")
        return response.text

    def _fallback(
        self,
        file_bytes: bytes,
        original_name: str,
        content_type: str,
        evidence_kind: EvidenceKind,
        safe_product_context: list[str] | None,
        timeline: list[ToolEvent],
        *,
        reason: str,
    ) -> ExtractionResult:
        timeline = list(timeline)
        timeline.append(
            ToolEvent(
                sequence=len(timeline) + 1,
                name="gemma_fallback",
                status=ToolEventStatus.SUCCEEDED,
                input_summary=f"reason={reason}",
                output_summary="Loaded approved fixture instead",
                fallback_used=True,
            )
        )

        fixture_result = self.fallback.extract_evidence(
            file_bytes=file_bytes,
            original_name=original_name,
            content_type=content_type,
            evidence_kind=evidence_kind,
            safe_product_context=safe_product_context,
        )

        merged_timeline = timeline + list(fixture_result.timeline)
        return fixture_result.model_copy(
            update={"fallback_used": True, "timeline": merged_timeline}
        )