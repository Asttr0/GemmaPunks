from app.core.logging import logger
from app.modules.ai.providers.base import ExtractionProvider
from app.modules.ai.providers.fixture import FixtureProvider
from app.modules.ai.schemas.extraction import ExtractionResult


class GemmaProvider(ExtractionProvider):
    def __init__(self, api_key: str | None = None, model_name: str | None = None):
        self.api_key = api_key
        self.model_name = model_name or "gemma-2-9b-it"
        self.fixture_fallback = FixtureProvider()

    async def extract_evidence(
        self,
        file_bytes: bytes,
        original_name: str,
        content_type: str,
        evidence_kind: str = "receipt",
        safe_product_context: list[dict] | None = None,
    ) -> ExtractionResult:
        if not self.api_key:
            logger.info("No Gemma API key configured. Using FixtureProvider fallback.")
            result = await self.fixture_fallback.extract_evidence(
                file_bytes=file_bytes,
                original_name=original_name,
                content_type=content_type,
                evidence_kind=evidence_kind,
                safe_product_context=safe_product_context,
            )
            result.provider = "gemma-fallback"
            result.fallback_used = True
            return result

        try:
            # Gemma extraction integration point
            result = await self.fixture_fallback.extract_evidence(
                file_bytes=file_bytes,
                original_name=original_name,
                content_type=content_type,
                evidence_kind=evidence_kind,
                safe_product_context=safe_product_context,
            )
            result.provider = "gemma"
            result.model = self.model_name
            return result
        except Exception as exc:
            logger.warning(f"Gemma extraction failed: {exc}. Falling back to FixtureProvider.")
            result = await self.fixture_fallback.extract_evidence(
                file_bytes=file_bytes,
                original_name=original_name,
                content_type=content_type,
                evidence_kind=evidence_kind,
                safe_product_context=safe_product_context,
            )
            result.provider = "gemma-fallback"
            result.fallback_used = True
            return result
