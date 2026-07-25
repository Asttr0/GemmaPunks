from typing import Literal

from pydantic import BaseModel, Field

from app.modules.ai.schemas.extraction import ExtractionDraft


class DocumentMetadata(BaseModel):
    id: str
    kind: Literal["receipt", "audio", "ledger", "screenshot"] = "receipt"
    original_name: str
    content_type: str
    size_bytes: int


class ClarificationAnswer(BaseModel):
    field_path: str
    answer: str


class ConfirmDraftRequest(BaseModel):
    draft_version: int = 1
    clarification_answers: list[ClarificationAnswer] = Field(default_factory=list)
    draft: ExtractionDraft | None = None


class IngestionResponse(BaseModel):
    id: str
    organization_id: str
    status: Literal["PROCESSING", "NEEDS_REVIEW", "CONFIRMED", "REJECTED", "FAILED"] = (
        "NEEDS_REVIEW"
    )
    document: DocumentMetadata
    draft: ExtractionDraft
    error_message: str | None = None


class ConfirmationResponse(BaseModel):
    ingestion_id: str
    draft_id: str
    transaction_id: str
    inventory_movement_ids: list[str] = Field(default_factory=list)
    status: Literal["CONFIRMED"] = "CONFIRMED"
    total_centimes: int
