from pathlib import PurePath

from app.modules.ai.providers.base import EvidenceKind, ExtractionProvider
from app.modules.ai.schemas.extraction import (
    AgentTimelineEvent,
    DraftLine,
    ExtractionDraft,
    ExtractionResult,
)


class UnsupportedFixtureError(ValueError):
    pass


APPROVED_RECEIPT_FILENAME = "demo-receipt.jpg"
APPROVED_AUDIO_FILENAME = "demo-sales-note.wav"


class FixtureProvider(ExtractionProvider):
    APPROVED_RECEIPT_NAMES = {
        "receipt.jpg",
        "receipt.jpeg",
        "receipt.png",
        APPROVED_RECEIPT_FILENAME,
        "synthetic-purchase-receipt.jpg",
    }
    APPROVED_AUDIO_NAMES = {
        "voice.mp3",
        "voice.wav",
        APPROVED_AUDIO_FILENAME,
        "sales-note.mp3",
    }

    @classmethod
    def supports(cls, original_name: str, evidence_kind: EvidenceKind) -> bool:
        safe_name = PurePath(original_name).name.casefold()
        if evidence_kind == "audio":
            return safe_name in cls.APPROVED_AUDIO_NAMES
        return safe_name in cls.APPROVED_RECEIPT_NAMES

    async def extract_evidence(
        self,
        file_bytes: bytes,
        original_name: str,
        content_type: str,
        evidence_kind: EvidenceKind = "receipt",
        safe_product_context: list[dict] | None = None,
    ) -> ExtractionResult:
        if not self.supports(original_name, evidence_kind):
            raise UnsupportedFixtureError("No approved fixture exists for this evidence file")

        if evidence_kind == "audio":
            draft_lines = [
                DraftLine(
                    line_id="line-001",
                    product_id="cooking-oil-1l",
                    product_name="Cooking oil 1L",
                    original_product_name="zit",
                    unit="bottle",
                    quantity=4,
                    unit_price_centimes=2800,
                    line_total_centimes=11200,
                    confidence=0.96,
                    uncertain_fields=[],
                ),
                DraftLine(
                    line_id="line-002",
                    product_id="sugar-1kg",
                    product_name="Sugar 1kg",
                    original_product_name="sukkar",
                    unit="bag",
                    quantity=3,
                    unit_price_centimes=1200,
                    line_total_centimes=3600,
                    confidence=0.67,
                    uncertain_fields=["quantity"],
                ),
            ]
            transaction_kind = "sale"
            clarification = "Did you say 3 bags of sugar?"
        else:
            draft_lines = [
                DraftLine(
                    line_id="line-001",
                    product_id="cooking-oil-1l",
                    product_name="Cooking oil 1L",
                    original_product_name="Zit",
                    unit="bottle",
                    quantity=20,
                    unit_price_centimes=2200,
                    line_total_centimes=44000,
                    confidence=0.99,
                    uncertain_fields=[],
                ),
                DraftLine(
                    line_id="line-002",
                    product_id="sugar-1kg",
                    product_name="Sugar 1kg",
                    original_product_name="Sukkar",
                    unit="bag",
                    quantity=10,
                    unit_price_centimes=850,
                    line_total_centimes=8500,
                    confidence=0.64,
                    uncertain_fields=["quantity"],
                ),
            ]
            transaction_kind = "purchase"
            clarification = "Was the sugar quantity 10 bags?"

        total_centimes = sum(line.line_total_centimes for line in draft_lines)

        draft = ExtractionDraft(
            id="draft_fixture_001",
            version=1,
            transaction_kind=transaction_kind,
            currency="MAD",
            lines=draft_lines,
            total_centimes=total_centimes,
            clarification_question=clarification,
        )

        timeline = [
            AgentTimelineEvent(
                sequence=1,
                name="inspect_evidence",
                status="SUCCEEDED",
                duration_ms=45,
                input_summary=f"Processed synthetic {evidence_kind} file '{original_name}'",
                output_summary="File validated and read successfully",
                fallback_used=False,
            ),
            AgentTimelineEvent(
                sequence=2,
                name="extract_draft",
                status="SUCCEEDED",
                duration_ms=120,
                input_summary="Evidence content parsing",
                output_summary=f"Extracted {len(draft_lines)} items; 1 uncertainty detected",
                fallback_used=False,
            ),
            AgentTimelineEvent(
                sequence=3,
                name="validate_draft",
                status="SUCCEEDED",
                duration_ms=15,
                input_summary="Pydantic schema validation & centimes check",
                output_summary=f"Valid draft with total_centimes={total_centimes}",
                fallback_used=False,
            ),
        ]

        return ExtractionResult(
            provider="fixture",
            model=None,
            fallback_used=False,
            draft=draft,
            timeline=timeline,
        )
