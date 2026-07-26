from decimal import ROUND_HALF_UP, Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class DraftLine(BaseModel):
    model_config = ConfigDict(extra="forbid")

    line_id: str | None = None
    product_id: str | None = None
    product_name: str = Field(min_length=1, max_length=160)
    original_product_name: str | None = Field(default=None, max_length=160)
    unit: str = Field(default="unit", min_length=1, max_length=32)
    base_unit: str = Field(default="unit", min_length=1, max_length=32)
    unit_multiplier: int = Field(default=1, ge=1, le=100_000)
    quantity: int = Field(gt=0)
    unit_price_centimes: int = Field(ge=0)
    line_total_centimes: int = Field(ge=0)
    confidence: float = Field(ge=0.0, le=1.0, default=1.0)
    uncertain_fields: list[str] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def normalize_missing_unit(cls, value: object) -> object:
        """Keep incomplete AI output reviewable without weakening downstream types."""
        if not isinstance(value, dict):
            return value

        unit = value.get("unit")
        if isinstance(unit, str) and unit.strip():
            return value

        normalized = dict(value)
        normalized["unit"] = "unit"

        uncertain_fields = normalized.get("uncertain_fields")
        uncertain_fields = [] if not isinstance(uncertain_fields, list) else list(uncertain_fields)

        if "unit" not in uncertain_fields:
            uncertain_fields.append("unit")
        normalized["uncertain_fields"] = uncertain_fields
        return normalized

    @model_validator(mode="after")
    def recalculate_line_total(self) -> "DraftLine":
        """Financial totals come from deterministic code, never model arithmetic."""
        self.line_total_centimes = int(
            (Decimal(str(self.quantity)) * Decimal(self.unit_price_centimes)).quantize(
                Decimal("1"),
                rounding=ROUND_HALF_UP,
            )
        )
        return self


class ExtractionDraft(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str | None = None
    version: int = Field(default=1, ge=1)
    transaction_kind: Literal["purchase", "sale", "expense"] = "purchase"
    currency: Literal["MAD"] = "MAD"
    lines: list[DraftLine] = Field(min_length=1, max_length=100)
    total_centimes: int = Field(ge=0)
    clarification_question: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def recalculate_total(self) -> "ExtractionDraft":
        self.total_centimes = sum(line.line_total_centimes for line in self.lines)
        return self


class AgentTimelineEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sequence: int
    name: str = Field(min_length=1, max_length=100)
    status: Literal["STARTED", "SUCCEEDED", "FAILED"] = "SUCCEEDED"
    duration_ms: int = Field(default=0, ge=0)
    input_summary: str = Field(max_length=500)
    output_summary: str = Field(max_length=500)
    fallback_used: bool = False


class ExtractionResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    provider: str = Field(default="fixture", min_length=1, max_length=50)
    model: str | None = Field(default=None, max_length=100)
    fallback_used: bool = False
    draft: ExtractionDraft
    timeline: list[AgentTimelineEvent] = Field(default_factory=list)
