"""
Provider contract for issue #21.

`extract_evidence` is the one function the rest of the app calls. Anas calls
this exact method whether AI_PROVIDER=fixture or AI_PROVIDER=gemma — the
caller never needs to know which implementation actually ran.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Literal

from app.modules.ai.schemas.extraction import ExtractionResult

EvidenceKind = Literal["receipt", "audio"]


class ExtractionProvider(ABC):
    """Base class every extraction provider (fixture or real Gemma) implements."""

    @abstractmethod
    def extract_evidence(
        self,
        *,
        file_bytes: bytes,
        original_name: str,
        content_type: str,
        evidence_kind: EvidenceKind,
        safe_product_context: list[str] | None = None,
    ) -> ExtractionResult:
        """
        Turn raw evidence (a receipt image or short voice note) into a
        validated ExtractionResult.

        A provider must NEVER:
          - save a confirmed transaction
          - change inventory
          - approve an order
          - execute a tool name that isn't on the approved allow-list
          - trust a number only because the model returned it
          - include chain-of-thought or raw secrets in the timeline
        """
        raise NotImplementedError