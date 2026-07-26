from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Header, UploadFile

from app.modules.auth.dependencies import get_current_user
from app.modules.auth.schemas import UserContext
from app.modules.ingestion.schemas import (
    ConfirmationResponse,
    ConfirmDraftRequest,
    IngestionResponse,
)
from app.modules.ingestion.service import IngestionService, get_ingestion_service

router = APIRouter(prefix="/api/v1/ingestions", tags=["ingestion"])


@router.post("", response_model=IngestionResponse)
async def upload_evidence(
    file: UploadFile = File(...),
    kind: str = Form("receipt"),
    user: UserContext = Depends(get_current_user),
    service: IngestionService = Depends(get_ingestion_service),
) -> IngestionResponse:
    """Upload receipt or audio evidence to start ingestion and receive an unconfirmed draft."""
    return await service.create_ingestion(user=user, file=file, kind=kind)


@router.get("/{id}", response_model=IngestionResponse)
async def read_ingestion(
    id: str,
    user: UserContext = Depends(get_current_user),
    service: IngestionService = Depends(get_ingestion_service),
) -> IngestionResponse:
    """Read ingestion status and extraction draft for the authenticated merchant organization."""
    return service.get_ingestion(user=user, ingestion_id=id)


@router.post("/{id}/confirm", response_model=ConfirmationResponse)
async def confirm_draft(
    id: str,
    req: ConfirmDraftRequest,
    idempotency_key: Annotated[
        str,
        Header(
            alias="Idempotency-Key",
            min_length=8,
            max_length=128,
        ),
    ],
    user: UserContext = Depends(get_current_user),
    service: IngestionService = Depends(get_ingestion_service),
) -> ConfirmationResponse:
    """Confirm corrected draft, creating official transactions and inventory movements."""
    return service.confirm_ingestion(
        user=user,
        ingestion_id=id,
        idempotency_key=idempotency_key,
        request=req,
    )
