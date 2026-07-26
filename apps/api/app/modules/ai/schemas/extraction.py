"""
Pydantic schemas for the evidence-extraction contract (issue #21).

Both providers (FixtureProvider and GemmaProvider) build an ExtractionResult
from these same models, so the rest of the app — Anas's FastAPI layer,
Asttr0's merchant UI — never needs to know which provider actually ran.

Money is always stored as integer centimes, never float. Totals are always
recalculated in Python, never trusted from Gemma's output.
"""

from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class TransactionKind(str, Enum):
    PURCHASE = "purchase"
    SALE = "sale"


class ToolEventStatus(str, Enum):
    STARTED = "STARTED"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"


class ExtractionLine(BaseModel):
    """One product line extracted from a receipt or voice note."""

    product_id: str
    product_name: str
    original_product_name: str | None = None
    unit: str
    quantity: float = Field(gt=0)
    unit_price_centimes: int = Field(ge=0)
    line_total_centimes: int = Field(ge=0)
    confidence: float = Field(ge=0.0, le=1.0)
    uncertain_fields: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def recompute_line_total(self) -> "ExtractionLine":
        """Never trust a line total Gemma proposes — always recalculate it."""
        self.line_total_centimes = round(self.quantity * self.unit_price_centimes)
        return self


class ExtractionDraft(BaseModel):
    transaction_kind: TransactionKind
    currency: Literal["MAD"] = "MAD"
    lines: list[ExtractionLine]
    total_centimes: int = Field(ge=0)
    clarification_question: str | None = None

    @model_validator(mode="after")
    def recompute_total(self) -> "ExtractionDraft":
        """Never trust the draft total Gemma proposes — sum the lines."""
        self.total_centimes = sum(line.line_total_centimes for line in self.lines)
        return self


class ToolEvent(BaseModel):
    """One entry in the tool-call/activity timeline shown in the demo UI."""

    sequence: int
    name: str
    status: ToolEventStatus
    input_summary: str
    output_summary: str
    duration_ms: int | None = None
    fallback_used: bool = False


class ExtractionResult(BaseModel):
    """What extract_evidence() returns to Anas. Same shape for both providers."""

    provider: Literal["fixture", "gemma"]
    model: str | None = None
    fallback_used: bool = False
    draft: ExtractionDraft
    timeline: list[ToolEvent] = Field(default_factory=list)