from app.modules.ai.providers.base import ExtractionProvider
from app.modules.ai.schemas.extraction import (
    AgentTimelineEvent,
    DraftLine,
    ExtractionDraft,
    ExtractionResult,
)


class FixtureProvider(ExtractionProvider):
    async def extract_evidence(
        self,
        file_bytes: bytes,
        original_name: str,
        content_type: str,
        evidence_kind: str = "receipt",
        safe_product_context: list[dict] | None = None,
    ) -> ExtractionResult:
        draft_lines = [
            DraftLine(
                line_id="line_001",
                product_id="cooking_oil_1l",
                product_name="Cooking oil 1L",
                unit="bottle",
                quantity=20,
                unit_price_centimes=2200,
                line_total_centimes=44000,
                confidence=0.99,
                uncertain_fields=[],
            ),
            DraftLine(
                line_id="line_002",
                product_id="sugar_1kg",
                product_name="Sugar 1kg",
                unit="bag",
                quantity=10,
                unit_price_centimes=850,
                line_total_centimes=8500,
                confidence=0.64,
                uncertain_fields=["quantity"],
            ),
        ]

        total_centimes = sum(line.line_total_centimes for line in draft_lines)

        draft = ExtractionDraft(
            id="draft_fixture_001",
            version=1,
            transaction_kind="purchase",
            currency="MAD",
            lines=draft_lines,
            total_centimes=total_centimes,
            clarification_question="Was the sugar quantity 10 bags?",
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
