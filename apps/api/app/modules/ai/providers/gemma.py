import asyncio
import json
import os
import tempfile
import time
from contextlib import suppress
from pathlib import Path

from app.core.logging import logger
from app.modules.ai.providers.base import ExtractionProvider
from app.modules.ai.providers.fixture import FixtureProvider
from app.modules.ai.schemas.extraction import (
    AgentTimelineEvent,
    ExtractionDraft,
    ExtractionResult,
)


def _extract_json(text: str) -> dict:
    normalized = text.strip()
    if normalized.startswith("```"):
        normalized = normalized.removeprefix("```json").removeprefix("```")
        normalized = normalized.removesuffix("```").strip()
    start = normalized.find("{")
    end = normalized.rfind("}")
    if start < 0 or end <= start:
        raise ValueError("Gemma did not return a JSON object")
    return json.loads(normalized[start : end + 1])


class GemmaProvider(ExtractionProvider):
    def __init__(
        self,
        api_key: str | None = None,
        model_name: str = "gemma-4-26b-a4b-it",
        timeout_seconds: int = 30,
    ):
        self.api_key = api_key
        self.model_name = model_name
        self.timeout_seconds = timeout_seconds
        self.fixture_fallback = FixtureProvider()

    @staticmethod
    def _prompt(evidence_kind: str, safe_product_context: list[dict] | None) -> str:
        prompt_name = "audio.md" if evidence_kind == "audio" else "receipt.md"
        prompt_path = Path(__file__).parents[1] / "prompts" / prompt_name
        prompt = prompt_path.read_text(encoding="utf-8")
        return prompt.replace(
            "{{SAFE_PRODUCT_CONTEXT}}",
            json.dumps(safe_product_context or [], ensure_ascii=False),
        )

    def _call_gemma(
        self,
        file_bytes: bytes,
        original_name: str,
        content_type: str,
        evidence_kind: str,
        safe_product_context: list[dict] | None,
    ) -> ExtractionDraft:
        from google import genai

        suffix = Path(original_name).suffix
        temporary_path = ""
        try:
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temporary:
                temporary.write(file_bytes)
                temporary_path = temporary.name

            client = genai.Client(api_key=self.api_key)
            uploaded_file = client.files.upload(
                file=temporary_path,
                config={"mime_type": content_type, "display_name": original_name},
            )
            response = client.models.generate_content(
                model=self.model_name,
                contents=[
                    uploaded_file,
                    self._prompt(evidence_kind, safe_product_context),
                ],
            )
            if not response.text:
                raise ValueError("Gemma returned an empty response")
            return ExtractionDraft.model_validate(_extract_json(response.text))
        finally:
            if temporary_path:
                with suppress(FileNotFoundError):
                    os.unlink(temporary_path)

    async def _fallback(
        self,
        *,
        file_bytes: bytes,
        original_name: str,
        content_type: str,
        evidence_kind: str,
        safe_product_context: list[dict] | None,
        reason: str,
    ) -> ExtractionResult:
        result = await self.fixture_fallback.extract_evidence(
            file_bytes=file_bytes,
            original_name=original_name,
            content_type=content_type,
            evidence_kind=evidence_kind,
            safe_product_context=safe_product_context,
        )
        result.provider = "gemma-fallback"
        result.model = self.model_name
        result.fallback_used = True
        result.timeline.insert(
            0,
            AgentTimelineEvent(
                sequence=0,
                name="gemma_fallback",
                status="FAILED",
                duration_ms=0,
                input_summary="Hosted Gemma extraction",
                output_summary=reason[:500],
                fallback_used=True,
            ),
        )
        return result

    async def extract_evidence(
        self,
        file_bytes: bytes,
        original_name: str,
        content_type: str,
        evidence_kind: str = "receipt",
        safe_product_context: list[dict] | None = None,
    ) -> ExtractionResult:
        if not self.api_key:
            return await self._fallback(
                file_bytes=file_bytes,
                original_name=original_name,
                content_type=content_type,
                evidence_kind=evidence_kind,
                safe_product_context=safe_product_context,
                reason="GEMINI_API_KEY is not configured",
            )

        started = time.monotonic()
        try:
            draft = await asyncio.wait_for(
                asyncio.to_thread(
                    self._call_gemma,
                    file_bytes,
                    original_name,
                    content_type,
                    evidence_kind,
                    safe_product_context,
                ),
                timeout=self.timeout_seconds,
            )
            elapsed_ms = int((time.monotonic() - started) * 1000)
            return ExtractionResult(
                provider="gemma",
                model=self.model_name,
                fallback_used=False,
                draft=draft,
                timeline=[
                    AgentTimelineEvent(
                        sequence=1,
                        name="gemma_extract_evidence",
                        status="SUCCEEDED",
                        duration_ms=elapsed_ms,
                        input_summary=f"Processed {evidence_kind} '{original_name}'",
                        output_summary=(
                            f"Extracted {len(draft.lines)} draft lines; "
                            f"clarification={'yes' if draft.clarification_question else 'no'}"
                        ),
                    )
                ],
            )
        except Exception as exc:
            logger.warning(
                "Gemma extraction failed; attempting approved fixture fallback: %s",
                exc,
            )
            return await self._fallback(
                file_bytes=file_bytes,
                original_name=original_name,
                content_type=content_type,
                evidence_kind=evidence_kind,
                safe_product_context=safe_product_context,
                reason=f"Gemma unavailable: {type(exc).__name__}",
            )
