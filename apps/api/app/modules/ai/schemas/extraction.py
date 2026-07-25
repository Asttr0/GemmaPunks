from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class DraftLine(BaseModel):
    model_config = ConfigDict(extra="forbid")

    line_id: str | None = None
    product_id: str | None = None
    product_name: str = Field(min_length=1, max_length=160)
    unit: str = Field(default="unit", min_length=1, max_length=32)
    quantity: int = Field(gt=0)
    unit_price_centimes: int = Field(ge=0)
    line_total_centimes: int = Field(ge=0)
    confidence: float = Field(ge=0.0, le=1.0, default=1.0)
    uncertain_fields: list[str] = Field(default_factory=list)


class ExtractionDraft(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str | None = None
    version: int = Field(default=1, ge=1)
    transaction_kind: Literal["purchase", "sale", "expense"] = "purchase"
    currency: Literal["MAD"] = "MAD"
    lines: list[DraftLine] = Field(min_length=1, max_length=100)
    total_centimes: int = Field(ge=0)
    clarification_question: str | None = Field(default=None, max_length=500)


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
