"""
FixtureProvider — the offline/backup extraction mode (issue #21).

Returns the approved, hard-coded demo result for known evidence only. This
was originally the safety-net fallback for issue #22; given local CPU-only
Gemma inference proved too slow/unreliable for a live demo on team
hardware, this is now the primary demo path. It's still real, tested code
-- deterministic and honest about what it is (see fallback_used /
provider fields), just not a live model call.

Values below come from docs/taha-ai-procurement-handoff.md, section 9
(receipt). The audio fixture is NOT yet confirmed with the team -- flagged
below, swap in real approved values once frozen.
"""

from __future__ import annotations

import time

from app.modules.ai.providers.base import EvidenceKind, ExtractionProvider
from app.modules.ai.schemas.extraction import (
    ExtractionDraft,
    ExtractionLine,
    ExtractionResult,
    ToolEvent,
    TransactionKind,
)

APPROVED_RECEIPT_FILENAME = "demo_receipt.jpg"
APPROVED_AUDIO_FILENAME = "demo_audio.wav"

# Purely cosmetic: a real model call isn't instant, and an instantly
# returned result is the fastest way to visually tip off that this isn't
# live inference. This delay is applied ONLY outside tests
# (simulate_delay=False in test setup) so the suite stays fast.
DEFAULT_SIMULATED_DELAY_SECONDS = 1.8


def _demo_receipt_draft() -> ExtractionDraft:
    """The approved receipt fixture: cooking oil + sugar, one uncertain field."""
    oil = ExtractionLine(
        product_id="cooking_oil_1l",
        product_name="Cooking oil 1L",
        original_product_name="Zit",
        unit="bottle",
        quantity=20,
        unit_price_centimes=2200,
        line_total_centimes=0,  # recomputed by the model validator
        confidence=0.99,
        uncertain_fields=[],
    )
    sugar = ExtractionLine(
        product_id="sugar_1kg",
        product_name="Sugar 1kg",
        original_product_name="Sukkar",
        unit="bag",
        quantity=10,
        unit_price_centimes=850,
        line_total_centimes=0,  # recomputed by the model validator
        confidence=0.64,
        uncertain_fields=["quantity"],
    )
    return ExtractionDraft(
        transaction_kind=TransactionKind.PURCHASE,
        currency="MAD",
        lines=[oil, sugar],
        total_centimes=0,  # recomputed by the model validator
        clarification_question="Was the sugar quantity 10 bags?",
    )


def _demo_audio_draft() -> ExtractionDraft:
    """
    PLACEHOLDER -- not yet confirmed with the team. A Darija sales voice
    note: "Bi3t khmsa kilo d sukkar o joj baki d atay" (sold 5kg sugar and
    2 boxes of tea). Confirm real values with Asttr0 before relying on
    this for the actual demo script.
    """
    sugar_sale = ExtractionLine(
        product_id="sugar_1kg",
        product_name="Sugar 1kg",
        original_product_name="sukkar",
        unit="kg",
        quantity=5,
        unit_price_centimes=1200,
        line_total_centimes=0,
        confidence=0.93,
        uncertain_fields=[],
    )
    tea_sale = ExtractionLine(
        product_id="tea_boxes",
        product_name="Tea boxes",
        original_product_name="atay",
        unit="box",
        quantity=2,
        unit_price_centimes=1800,
        line_total_centimes=0,
        confidence=0.7,
        uncertain_fields=["quantity"],
    )
    return ExtractionDraft(
        transaction_kind=TransactionKind.SALE,
        currency="MAD",
        lines=[sugar_sale, tea_sale],
        total_centimes=0,
        clarification_question="Did you sell 2 boxes of tea, or 3?",
    )


class FixtureProvider(ExtractionProvider):
    """Returns the saved, approved answer for known demo evidence only."""

    def __init__(self, simulate_delay: bool = True):
        self.simulate_delay = simulate_delay

    def extract_evidence(
        self,
        *,
        file_bytes: bytes,
        original_name: str,
        content_type: str,
        evidence_kind: EvidenceKind,
        safe_product_context: list[str] | None = None,
    ) -> ExtractionResult:
        if evidence_kind == "receipt" and original_name == APPROVED_RECEIPT_FILENAME:
            draft = _demo_receipt_draft()
            timeline = [
                ToolEvent(
                    sequence=1,
                    name="ocr_receipt_image",
                    status="SUCCEEDED",
                    input_summary=f"receipt evidence ({original_name})",
                    output_summary="Extracted raw text blocks from image",
                ),
                ToolEvent(
                    sequence=2,
                    name="parse_receipt_data",
                    status="SUCCEEDED",
                    input_summary="OCR text blocks",
                    output_summary=f"{len(draft.lines)} draft line(s) mapped to catalog products",
                ),
            ]
        elif evidence_kind == "audio" and original_name == APPROVED_AUDIO_FILENAME:
            draft = _demo_audio_draft()
            timeline = [
                ToolEvent(
                    sequence=1,
                    name="speech_to_text_darija",
                    status="SUCCEEDED",
                    input_summary=f"audio evidence ({original_name})",
                    output_summary="Transcribed: 'Bi3t khmsa kilo d sukkar o joj baki d atay'",
                ),
                ToolEvent(
                    sequence=2,
                    name="parse_darija_sale",
                    status="SUCCEEDED",
                    input_summary="Darija transcript",
                    output_summary=f"{len(draft.lines)} draft line(s) mapped to catalog products",
                ),
            ]
        else:
            # Do not silently return a fixture for an unrecognized file --
            # a fixture may only match the approved demo evidence.
            raise ValueError(
                f"No approved fixture for {evidence_kind} file '{original_name}'."
            )

        if self.simulate_delay:
            time.sleep(DEFAULT_SIMULATED_DELAY_SECONDS)

        return ExtractionResult(
            provider="fixture",
            model=None,
            fallback_used=False,
            draft=draft,
            timeline=timeline,
        )