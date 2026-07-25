from typing import Literal

from pydantic import BaseModel, Field


class DraftLine(BaseModel):
    line_id: str | None = None
    product_id: str | None = None
    product_name: str
    unit: str = "unit"
    quantity: int = Field(gt=0)
    unit_price_centimes: int = Field(ge=0)
    line_total_centimes: int = Field(ge=0)
    confidence: float = Field(ge=0.0, le=1.0, default=1.0)
    uncertain_fields: list[str] = Field(default_factory=list)


class ExtractionDraft(BaseModel):
    id: str | None = None
    version: int = 1
    transaction_kind: Literal["purchase", "sale", "expense"] = "purchase"
    currency: str = "MAD"
    lines: list[DraftLine]
    total_centimes: int = Field(ge=0)
    clarification_question: str | None = None


class AgentTimelineEvent(BaseModel):
    sequence: int
    name: str
    status: Literal["STARTED", "SUCCEEDED", "FAILED"] = "SUCCEEDED"
    duration_ms: int = 0
    input_summary: str
    output_summary: str
    fallback_used: bool = False


class ExtractionResult(BaseModel):
    provider: str = "fixture"
    model: str | None = None
    fallback_used: bool = False
    draft: ExtractionDraft
    timeline: list[AgentTimelineEvent] = Field(default_factory=list)
