from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.modules.ai.schemas.extraction import ExtractionDraft

EvidenceKind = Literal["receipt", "audio", "ledger", "screenshot"]
IngestionStatus = Literal[
    "PROCESSING",
    "NEEDS_REVIEW",
    "CONFIRMED",
    "REJECTED",
    "FAILED",
]


class DocumentMetadata(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    kind: EvidenceKind = "receipt"
    original_name: str = Field(min_length=1, max_length=255)
    content_type: str = Field(min_length=1, max_length=100)
    size_bytes: int = Field(ge=1)


class ClarificationAnswer(BaseModel):
    model_config = ConfigDict(extra="forbid")

    field_path: str = Field(min_length=1, max_length=200)
    answer: str = Field(min_length=1, max_length=500)


class ConfirmDraftRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    draft_version: int = Field(default=1, ge=1)
    clarification_answers: list[ClarificationAnswer] = Field(
        default_factory=list,
        max_length=50,
    )
    draft: ExtractionDraft | None = None


class IngestionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    organization_id: str
    status: IngestionStatus = "NEEDS_REVIEW"
    document: DocumentMetadata
    draft: ExtractionDraft | None = None
    error_message: str | None = None


class ConfirmationResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ingestion_id: str
    draft_id: str
    transaction_id: str
    inventory_movement_ids: list[str] = Field(default_factory=list)
    status: Literal["CONFIRMED"] = "CONFIRMED"
    total_centimes: int
