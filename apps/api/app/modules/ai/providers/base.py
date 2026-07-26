"""Shared extraction provider contract.

The ingestion service calls this interface in both hosted-Gemma and deterministic
fixture modes. Providers only return an unconfirmed draft; they never write
financial records, update inventory, or approve an order.
"""

from abc import ABC, abstractmethod
from typing import Literal

from app.modules.ai.schemas.extraction import ExtractionResult

EvidenceKind = Literal["receipt", "audio"]


class ExtractionProvider(ABC):
    @abstractmethod
    async def extract_evidence(
        self,
        file_bytes: bytes,
        original_name: str,
        content_type: str,
        evidence_kind: EvidenceKind = "receipt",
        safe_product_context: list[dict] | None = None,
    ) -> ExtractionResult:
        """Return a validated, reviewable draft from untrusted business evidence."""
        raise NotImplementedError
