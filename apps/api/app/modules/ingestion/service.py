import uuid
from fastapi import HTTPException, UploadFile, status

from app.core.store import db_store
from app.modules.ai.providers.factory import get_extraction_provider
from app.modules.auth.schemas import UserContext
from app.modules.ingestion.schemas import (
    ConfirmationResponse,
    ConfirmDraftRequest,
    DocumentMetadata,
    IngestionResponse,
)
from app.modules.transactions.schemas import Transaction, TransactionLine


MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10MB limit
ALLOWED_KINDS = {"receipt", "audio", "ledger", "screenshot"}
ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "audio/wav",
    "audio/mpeg",
    "audio/mp4",
    "audio/ogg",
    "audio/m4a",
    "audio/x-m4a",
}


class IngestionService:
    @staticmethod
    async def create_ingestion(
        user: UserContext,
        file: UploadFile,
        kind: str = "receipt",
    ) -> IngestionResponse:
        if kind not in ALLOWED_KINDS:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Unsupported evidence kind '{kind}'. Allowed: {list(ALLOWED_KINDS)}",
            )

        file_bytes = await file.read()
        file_size = len(file_bytes)

        if file_size > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds maximum threshold of {MAX_FILE_SIZE_BYTES} bytes",
            )

        content_type = file.content_type or "application/octet-stream"
        if content_type not in ALLOWED_CONTENT_TYPES and not content_type.startswith(("image/", "audio/")):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Content type '{content_type}' is not supported for evidence extraction",
            )

        # Call AI extraction provider
        provider = get_extraction_provider()
        try:
            extraction_result = await provider.extract_evidence(
                file_bytes=file_bytes,
                original_name=file.filename or "uploaded_file",
                content_type=content_type,
                evidence_kind=kind,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Extraction provider error: {exc}",
            ) from exc

        ingestion_id = f"ing_{uuid.uuid4().hex[:8]}"
        doc_id = f"doc_{uuid.uuid4().hex[:8]}"
        draft = extraction_result.draft
        draft.id = f"draft_{uuid.uuid4().hex[:8]}"

        doc_meta = DocumentMetadata(
            id=doc_id,
            kind=kind,  # type: ignore
            original_name=file.filename or "uploaded_file",
            content_type=content_type,
            size_bytes=file_size,
        )

        response = IngestionResponse(
            id=ingestion_id,
            organization_id=user.organization_id,
            status="NEEDS_REVIEW",
            document=doc_meta,
            draft=draft,
        )

        db_store.save_ingestion(response)
        return response

    @staticmethod
    def get_ingestion(user: UserContext, ingestion_id: str) -> IngestionResponse:
        ing = db_store.get_ingestion(ingestion_id, user.organization_id)
        if not ing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ingestion job not found",
            )
        return ing

    @staticmethod
    def confirm_ingestion(
        user: UserContext,
        ingestion_id: str,
        idempotency_key: str | None,
        req: ConfirmDraftRequest,
    ) -> ConfirmationResponse:
        # Check idempotency cache
        if idempotency_key and idempotency_key in db_store.idempotency_cache:
            return db_store.idempotency_cache[idempotency_key]

        ingestion = db_store.get_ingestion(ingestion_id, user.organization_id)
        if not ingestion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ingestion job not found",
            )

        if ingestion.status == "CONFIRMED":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ingestion draft is already confirmed",
            )

        if req.draft_version != ingestion.draft.version:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Draft version mismatch: server version is {ingestion.draft.version}",
            )

        # Use updated draft from request if provided, otherwise use server draft
        target_draft = req.draft or ingestion.draft
        txn_kind = target_draft.transaction_kind

        # Apply centimes financial recalculation
        txn_lines = []
        movement_ids = []
        total_centimes = 0

        for idx, line in enumerate(target_draft.lines):
            line_id = line.line_id or f"line_{idx+1:03d}"
            prod_id = line.product_id or f"prod_{uuid.uuid4().hex[:6]}"
            prod_name = line.product_name
            qty = line.quantity
            price_centimes = line.unit_price_centimes
            line_total = qty * price_centimes
            total_centimes += line_total

            txn_lines.append(
                TransactionLine(
                    line_id=line_id,
                    product_id=prod_id,
                    product_name=prod_name,
                    quantity=qty,
                    unit_price_centimes=price_centimes,
                    line_total_centimes=line_total,
                )
            )

            # Update inventory movement
            direction = "in" if txn_kind == "purchase" else "out"
            stock_delta = qty if direction == "in" else -qty
            db_store.update_product_stock(
                organization_id=user.organization_id,
                product_id=prod_id,
                name=prod_name,
                unit=line.unit,
                delta=stock_delta,
            )
            movement_ids.append(f"mov_{uuid.uuid4().hex[:8]}")

        txn_id = f"txn_{uuid.uuid4().hex[:8]}"
        official_txn = Transaction(
            id=txn_id,
            organization_id=user.organization_id,
            kind=txn_kind,
            currency="MAD",
            total_centimes=total_centimes,
            lines=txn_lines,
            ingestion_id=ingestion.id,
            draft_id=ingestion.draft.id,
        )

        db_store.save_transaction(official_txn)

        # Mark draft as confirmed
        ingestion.status = "CONFIRMED"
        ingestion.draft.total_centimes = total_centimes

        confirm_res = ConfirmationResponse(
            ingestion_id=ingestion.id,
            draft_id=ingestion.draft.id or "draft_001",
            transaction_id=txn_id,
            inventory_movement_ids=movement_ids,
            status="CONFIRMED",
            total_centimes=total_centimes,
        )

        if idempotency_key:
            db_store.idempotency_cache[idempotency_key] = confirm_res

        return confirm_res
