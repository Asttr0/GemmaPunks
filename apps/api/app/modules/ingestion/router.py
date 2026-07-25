from fastapi import APIRouter, Depends, File, Form, Header, UploadFile

from app.modules.auth.dependencies import get_current_user
from app.modules.auth.schemas import UserContext
from app.modules.ingestion.schemas import (
    ConfirmationResponse,
    ConfirmDraftRequest,
    IngestionResponse,
)
from app.modules.ingestion.service import IngestionService

router = APIRouter(prefix="/api/v1/ingestions", tags=["ingestion"])


@router.post("", response_model=IngestionResponse)
async def upload_evidence(
    file: UploadFile = File(...),
    kind: str = Form("receipt"),
    user: UserContext = Depends(get_current_user),
) -> IngestionResponse:
    """Upload receipt or audio evidence to start ingestion and receive an unconfirmed draft."""
    return await IngestionService.create_ingestion(user=user, file=file, kind=kind)


@router.get("/{id}", response_model=IngestionResponse)
async def read_ingestion(
    id: str,
    user: UserContext = Depends(get_current_user),
) -> IngestionResponse:
    """Read ingestion status and extraction draft for the authenticated merchant organization."""
    return IngestionService.get_ingestion(user=user, ingestion_id=id)


@router.post("/{id}/confirm", response_model=ConfirmationResponse)
async def confirm_draft(
    id: str,
    req: ConfirmDraftRequest,
    idempotency_key: str | None = Header(None, alias="Idempotency-Key"),
    user: UserContext = Depends(get_current_user),
) -> ConfirmationResponse:
    """Confirm corrected draft, creating official transactions and inventory movements."""
    return IngestionService.confirm_ingestion(
        user=user,
        ingestion_id=id,
        idempotency_key=idempotency_key,
        req=req,
    )
