from abc import ABC, abstractmethod

from app.modules.ai.schemas.extraction import ExtractionResult


class ExtractionProvider(ABC):
    @abstractmethod
    async def extract_evidence(
        self,
        file_bytes: bytes,
        original_name: str,
        content_type: str,
        evidence_kind: str = "receipt",
        safe_product_context: list[dict] | None = None,
    ) -> ExtractionResult:
        """Extract evidence and return a structured ExtractionResult draft."""
        pass
