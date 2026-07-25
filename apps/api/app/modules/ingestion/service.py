import hashlib
import json
import re
import uuid
from datetime import UTC, datetime
from pathlib import PurePath

from fastapi import HTTPException, UploadFile, status
from pydantic import ValidationError

from app.core.config import get_settings
from app.core.models import AgentRunRecord, Document, IngestionJob, ToolCallRecord
from app.modules.ai.providers.base import ExtractionProvider
from app.modules.ai.providers.factory import get_extraction_provider
from app.modules.ai.schemas.extraction import ExtractionDraft, ExtractionResult
from app.modules.auth.schemas import UserContext
from app.modules.ingestion.repository import (
    ConfirmationCommand,
    IngestionConflictError,
    IngestionNotFoundError,
    IngestionRepository,
    get_ingestion_repository,
)
from app.modules.ingestion.schemas import (
    ConfirmationResponse,
    ConfirmDraftRequest,
    IngestionResponse,
)

ALLOWED_KINDS = {"receipt", "audio", "ledger", "screenshot"}
ALLOWED_CONTENT_TYPES = {
    "receipt": {"image/jpeg", "image/png", "image/webp", "application/pdf"},
    "ledger": {"image/jpeg", "image/png", "image/webp", "application/pdf"},
    "screenshot": {"image/jpeg", "image/png", "image/webp"},
    "audio": {
        "audio/wav",
        "audio/x-wav",
        "audio/mpeg",
        "audio/mp4",
        "audio/ogg",
        "audio/m4a",
        "audio/x-m4a",
    },
}
IDEMPOTENCY_KEY_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$")
RESOURCE_ID_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$")
READ_CHUNK_SIZE = 1024 * 1024


def get_ingestion_service() -> "IngestionService":
    return IngestionService(
        repository=get_ingestion_repository(),
        extraction_provider=get_extraction_provider(),
        max_file_size_bytes=get_settings().max_upload_mb * 1024 * 1024,
    )


class IngestionService:
    def __init__(
        self,
        repository: IngestionRepository,
        extraction_provider: ExtractionProvider,
        max_file_size_bytes: int,
    ):
        self.repository = repository
        self.extraction_provider = extraction_provider
        self.max_file_size_bytes = max_file_size_bytes

    async def _read_temporary_upload(self, file: UploadFile) -> bytes:
        content = bytearray()
        while True:
            chunk = await file.read(READ_CHUNK_SIZE)
            if not chunk:
                break
            content.extend(chunk)
            if len(content) > self.max_file_size_bytes:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=(
                        f"File size exceeds maximum threshold of {self.max_file_size_bytes} bytes"
                    ),
                )
        if not content:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Uploaded evidence file is empty",
            )
        return bytes(content)

    @staticmethod
    def _validate_upload(kind: str, content_type: str) -> None:
        if kind not in ALLOWED_KINDS:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=(f"Unsupported evidence kind '{kind}'. Allowed: {sorted(ALLOWED_KINDS)}"),
            )
        if content_type not in ALLOWED_CONTENT_TYPES[kind]:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=(
                    f"Content type '{content_type}' is not supported for evidence kind '{kind}'"
                ),
            )

    @staticmethod
    def _normalize_draft(draft: ExtractionDraft, draft_id: str) -> ExtractionDraft:
        normalized = draft.model_copy(deep=True)
        normalized.id = draft_id
        normalized.version = 1
        total_centimes = 0
        seen_line_ids: set[str] = set()
        for index, line in enumerate(normalized.lines):
            line.line_id = line.line_id or f"line-{index + 1:03d}"
            if not RESOURCE_ID_PATTERN.fullmatch(line.line_id):
                raise ValueError(f"Invalid line ID '{line.line_id}'")
            if line.line_id in seen_line_ids:
                raise ValueError(f"Duplicate line ID '{line.line_id}'")
            seen_line_ids.add(line.line_id)
            if line.product_id is not None and not RESOURCE_ID_PATTERN.fullmatch(line.product_id):
                raise ValueError(f"Invalid product ID '{line.product_id}'")
            line.line_total_centimes = line.quantity * line.unit_price_centimes
            total_centimes += line.line_total_centimes
        normalized.total_centimes = total_centimes
        return ExtractionDraft.model_validate(normalized.model_dump(mode="python"))

    @staticmethod
    def _provider_name(provider: str) -> str:
        return "gemma" if provider.lower().startswith("gemma") else "fixture"

    @staticmethod
    def _build_agent_run(
        result: ExtractionResult,
        organization_id: str,
        document_id: str,
        ingestion_id: str,
        agent_run_id: str,
    ) -> AgentRunRecord:
        now = datetime.now(UTC)
        tool_calls = [
            ToolCallRecord(
                tool_call_id=f"tool-{uuid.uuid4().hex[:12]}",
                organization_id=organization_id,
                sequence=event.sequence,
                name=event.name,
                status=event.status,
                duration_ms=event.duration_ms,
                input_summary=event.input_summary,
                output_summary=event.output_summary,
                fallback_used=event.fallback_used,
                created_at=now,
            )
            for event in result.timeline
        ]
        return AgentRunRecord(
            agent_run_id=agent_run_id,
            organization_id=organization_id,
            document_id=document_id,
            ingestion_job_id=ingestion_id,
            provider=result.provider,
            model=result.model,
            status="SUCCEEDED",
            fallback_used=result.fallback_used,
            duration_ms=sum(event.duration_ms for event in result.timeline),
            tool_calls=tool_calls,
            created_at=now,
            completed_at=now,
        )

    async def create_ingestion(
        self,
        user: UserContext,
        file: UploadFile,
        kind: str = "receipt",
    ) -> IngestionResponse:
        normalized_kind = kind.strip().lower()
        content_type = (file.content_type or "application/octet-stream").lower()
        self._validate_upload(normalized_kind, content_type)

        file_bytes = b""
        try:
            file_bytes = await self._read_temporary_upload(file)
            now = datetime.now(UTC)
            ingestion_id = f"ing-{uuid.uuid4().hex[:12]}"
            document_id = f"doc-{uuid.uuid4().hex[:12]}"
            draft_id = f"draft-{uuid.uuid4().hex[:12]}"
            agent_run_id = f"run-{uuid.uuid4().hex[:12]}"
            original_name = PurePath(file.filename or "uploaded-evidence").name[:255]
            document = Document(
                document_id=document_id,
                organization_id=user.organization_id,
                kind=normalized_kind.upper(),
                original_name=original_name,
                content_type=content_type,
                size_bytes=len(file_bytes),
                evidence_retained=False,
                storage_provider="NONE",
                created_by=user.user_id,
                created_at=now,
                updated_at=now,
            )
            job = IngestionJob(
                ingestion_id=ingestion_id,
                organization_id=user.organization_id,
                document_id=document_id,
                status="PROCESSING",
                provider="fixture",
                fallback_used=False,
                created_by=user.user_id,
                created_at=now,
                updated_at=now,
            )
            self.repository.start_ingestion(document, job)

            try:
                raw_result = await self.extraction_provider.extract_evidence(
                    file_bytes=file_bytes,
                    original_name=original_name,
                    content_type=content_type,
                    evidence_kind=normalized_kind,
                )
                result = ExtractionResult.model_validate(
                    raw_result.model_dump(mode="python")
                    if isinstance(raw_result, ExtractionResult)
                    else raw_result
                )
                draft = self._normalize_draft(result.draft, draft_id)
            except (ValidationError, ValueError) as exc:
                self.repository.fail_ingestion(
                    user.organization_id,
                    ingestion_id,
                    "INVALID_EXTRACTION",
                )
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Extraction result failed validation: {exc}",
                ) from exc
            except Exception as exc:
                self.repository.fail_ingestion(
                    user.organization_id,
                    ingestion_id,
                    "PROVIDER_UNAVAILABLE",
                )
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Evidence extraction is temporarily unavailable",
                ) from exc

            job.draft_id = draft_id
            job.agent_run_id = agent_run_id
            job.status = "NEEDS_REVIEW"
            job.provider = self._provider_name(result.provider)
            job.fallback_used = result.fallback_used
            job.updated_at = datetime.now(UTC)
            agent_run = self._build_agent_run(
                result,
                user.organization_id,
                document_id,
                ingestion_id,
                agent_run_id,
            )
            self.repository.complete_ingestion(job, draft, agent_run)
            response = self.repository.get_ingestion(
                user.organization_id,
                ingestion_id,
            )
            if response is None:
                raise RuntimeError("Completed ingestion could not be read back")
            return response
        finally:
            file_bytes = b""
            await file.close()

    def get_ingestion(
        self,
        user: UserContext,
        ingestion_id: str,
    ) -> IngestionResponse:
        ingestion = self.repository.get_ingestion(
            user.organization_id,
            ingestion_id,
        )
        if ingestion is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ingestion job not found",
            )
        return ingestion

    @staticmethod
    def _request_hash(
        ingestion_id: str,
        draft: ExtractionDraft,
        request: ConfirmDraftRequest,
    ) -> str:
        canonical_payload = {
            "ingestion_id": ingestion_id,
            "draft_version": request.draft_version,
            "draft": draft.model_dump(mode="json"),
            "clarification_answers": sorted(
                [answer.model_dump(mode="json") for answer in request.clarification_answers],
                key=lambda answer: (answer["field_path"], answer["answer"]),
            ),
        }
        encoded = json.dumps(
            canonical_payload,
            sort_keys=True,
            separators=(",", ":"),
        ).encode()
        return hashlib.sha256(encoded).hexdigest()

    def confirm_ingestion(
        self,
        user: UserContext,
        ingestion_id: str,
        idempotency_key: str,
        request: ConfirmDraftRequest,
    ) -> ConfirmationResponse:
        if not IDEMPOTENCY_KEY_PATTERN.fullmatch(idempotency_key):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    "Idempotency-Key must be 8-128 characters and use only "
                    "letters, numbers, dot, underscore, colon, or hyphen"
                ),
            )

        ingestion = self.repository.get_ingestion(
            user.organization_id,
            ingestion_id,
        )
        if ingestion is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ingestion job not found",
            )
        if ingestion.draft is None or ingestion.draft.id is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ingestion draft is unavailable",
            )

        source_draft = request.draft or ingestion.draft
        try:
            target_draft = self._normalize_draft(
                source_draft,
                ingestion.draft.id,
            )
        except (ValidationError, ValueError) as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Corrected draft failed validation: {exc}",
            ) from exc
        target_draft.version = ingestion.draft.version
        command = ConfirmationCommand(
            organization_id=user.organization_id,
            user_id=user.user_id,
            ingestion_id=ingestion_id,
            draft_id=ingestion.draft.id,
            draft_version=request.draft_version,
            idempotency_key=idempotency_key,
            request_hash=self._request_hash(ingestion_id, target_draft, request),
            draft=target_draft,
            transaction_id=f"txn-{uuid.uuid4().hex[:12]}",
            movement_ids=tuple(f"mov-{uuid.uuid4().hex[:12]}" for _ in target_draft.lines),
        )
        try:
            return self.repository.confirm_ingestion(command)
        except IngestionNotFoundError as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ingestion job not found",
            ) from exc
        except IngestionConflictError as exc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(exc),
            ) from exc
