import hashlib
import os
import threading
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Protocol

from firebase_admin import firestore

from app.core.config import get_settings
from app.core.firebase import get_firestore_client
from app.core.models import (
    AgentRunRecord,
    Approval,
    Document,
    IngestionJob,
    InventoryItem,
    InventoryMovement,
)
from app.core.store import DataStore, db_store
from app.modules.ai.schemas.extraction import ExtractionDraft
from app.modules.ingestion.schemas import (
    ConfirmationResponse,
    DocumentMetadata,
    IngestionResponse,
)
from app.modules.inventory.schemas import Product
from app.modules.transactions.schemas import Transaction, TransactionLine


class IngestionNotFoundError(Exception):
    pass


class IngestionConflictError(Exception):
    pass


@dataclass(frozen=True)
class ConfirmationCommand:
    organization_id: str
    user_id: str
    ingestion_id: str
    draft_id: str
    draft_version: int
    idempotency_key: str
    request_hash: str
    draft: ExtractionDraft
    transaction_id: str
    movement_ids: tuple[str, ...]


@dataclass(frozen=True)
class IdempotencyRecord:
    organization_id: str
    ingestion_id: str
    request_hash: str
    response: ConfirmationResponse


@dataclass(frozen=True)
class ConfirmationRecords:
    transaction: Transaction
    movements: tuple[InventoryMovement, ...]
    inventory_items: tuple[InventoryItem, ...]
    approval: Approval
    response: ConfirmationResponse


class IngestionRepository(Protocol):
    def start_ingestion(self, document: Document, job: IngestionJob) -> None: ...

    def complete_ingestion(
        self,
        job: IngestionJob,
        draft: ExtractionDraft,
        agent_run: AgentRunRecord,
    ) -> None: ...

    def fail_ingestion(
        self,
        organization_id: str,
        ingestion_id: str,
        error_code: str,
    ) -> None: ...

    def get_ingestion(
        self,
        organization_id: str,
        ingestion_id: str,
    ) -> IngestionResponse | None: ...

    def confirm_ingestion(self, command: ConfirmationCommand) -> ConfirmationResponse: ...


def _document_metadata(document: Document) -> DocumentMetadata:
    return DocumentMetadata(
        id=document.document_id,
        kind=document.kind.lower(),
        original_name=document.original_name,
        content_type=document.content_type,
        size_bytes=document.size_bytes,
    )


def _status_for_quantity(quantity: float, low_stock_threshold: float) -> str:
    if quantity <= 0:
        return "OUT_OF_STOCK"
    if quantity <= low_stock_threshold:
        return "LOW_STOCK"
    return "HEALTHY"


def _build_confirmation_records(
    command: ConfirmationCommand,
    current_inventory: dict[str, InventoryItem | None],
) -> ConfirmationRecords:
    now = datetime.now(UTC)
    transaction_lines: list[TransactionLine] = []
    movements: list[InventoryMovement] = []
    inventory_items: dict[str, InventoryItem] = {}
    total_centimes = 0

    for index, line in enumerate(command.draft.lines):
        if line.product_id is None:
            raise IngestionConflictError("Every confirmed line must have a product ID")

        line_id = line.line_id or f"line-{index + 1:03d}"
        line_total = line.quantity * line.unit_price_centimes
        inventory_quantity = line.quantity * line.unit_multiplier
        total_centimes += line_total
        transaction_lines.append(
            TransactionLine(
                line_id=line_id,
                product_id=line.product_id,
                product_name=line.product_name,
                quantity=line.quantity,
                unit=line.unit.upper(),
                base_unit=line.base_unit.upper(),
                unit_multiplier=line.unit_multiplier,
                inventory_quantity=inventory_quantity,
                unit_price_centimes=line.unit_price_centimes,
                line_total_centimes=line_total,
            )
        )

        if command.draft.transaction_kind == "expense":
            continue

        current = inventory_items.get(line.product_id) or current_inventory.get(line.product_id)
        if current is None:
            current = InventoryItem(
                organization_id=command.organization_id,
                product_id=line.product_id,
                display_name=line.product_name,
                unit=line.base_unit.upper(),
                quantity_on_hand=0,
            )

        quantity_delta = (
            inventory_quantity
            if command.draft.transaction_kind == "purchase"
            else -inventory_quantity
        )
        quantity_after = current.quantity_on_hand + quantity_delta
        if quantity_after < 0:
            raise IngestionConflictError(f"Insufficient stock for product '{line.product_id}'")

        updated_item = current.model_copy(
            update={
                "display_name": line.product_name,
                "unit": line.base_unit.upper(),
                "quantity_on_hand": quantity_after,
                "status": _status_for_quantity(
                    quantity_after,
                    current.low_stock_threshold,
                ),
                "version": current.version + 1,
                "updated_at": now,
            }
        )
        inventory_items[line.product_id] = updated_item
        movements.append(
            InventoryMovement(
                movement_id=command.movement_ids[index],
                organization_id=command.organization_id,
                product_id=line.product_id,
                transaction_id=command.transaction_id,
                kind=command.draft.transaction_kind.upper(),
                unit=line.base_unit.upper(),
                quantity_delta=quantity_delta,
                quantity_after=quantity_after,
                occurred_at=now,
                created_at=now,
            )
        )

    official_transaction = Transaction(
        id=command.transaction_id,
        organization_id=command.organization_id,
        kind=command.draft.transaction_kind,
        currency="MAD",
        total_centimes=total_centimes,
        lines=transaction_lines,
        ingestion_id=command.ingestion_id,
        draft_id=command.draft_id,
        occurred_at=now,
    )
    response = ConfirmationResponse(
        ingestion_id=command.ingestion_id,
        draft_id=command.draft_id,
        transaction_id=command.transaction_id,
        inventory_movement_ids=[movement.movement_id for movement in movements],
        status="CONFIRMED",
        total_centimes=total_centimes,
    )
    approval = Approval(
        approval_id=f"approval-{hashlib.sha256(command.idempotency_key.encode()).hexdigest()[:32]}",
        organization_id=command.organization_id,
        action="CONFIRM_DRAFT",
        target_type="extraction_draft",
        target_id=command.draft_id,
        approved_by=command.user_id,
        idempotency_key=command.idempotency_key,
        created_at=now,
    )
    return ConfirmationRecords(
        transaction=official_transaction,
        movements=tuple(movements),
        inventory_items=tuple(inventory_items.values()),
        approval=approval,
        response=response,
    )


class InMemoryIngestionRepository:
    def __init__(self, store: DataStore):
        self.store = store
        self._lock = threading.RLock()
        self._idempotency: dict[tuple[str, str], IdempotencyRecord] = {}

    def start_ingestion(self, document: Document, job: IngestionJob) -> None:
        with self._lock:
            self.store.documents[document.document_id] = document
            self.store.ingestion_jobs[job.ingestion_id] = job

    def complete_ingestion(
        self,
        job: IngestionJob,
        draft: ExtractionDraft,
        agent_run: AgentRunRecord,
    ) -> None:
        if draft.id is None:
            raise ValueError("Completed extraction draft must have an ID")
        with self._lock:
            self.store.ingestion_jobs[job.ingestion_id] = job
            self.store.extraction_drafts[draft.id] = draft.model_copy(deep=True)
            self.store.agent_runs[agent_run.agent_run_id] = agent_run

    def fail_ingestion(
        self,
        organization_id: str,
        ingestion_id: str,
        error_code: str,
    ) -> None:
        with self._lock:
            job = self.store.ingestion_jobs.get(ingestion_id)
            if job is None or job.organization_id != organization_id:
                return
            job.status = "FAILED"
            job.error_code = error_code
            job.updated_at = datetime.now(UTC)

    def get_ingestion(
        self,
        organization_id: str,
        ingestion_id: str,
    ) -> IngestionResponse | None:
        with self._lock:
            job = self.store.ingestion_jobs.get(ingestion_id)
            if job is None or job.organization_id != organization_id:
                return None
            document = self.store.documents.get(job.document_id)
            if document is None:
                return None
            draft = (
                self.store.extraction_drafts.get(job.draft_id) if job.draft_id is not None else None
            )
            return IngestionResponse(
                id=job.ingestion_id,
                organization_id=job.organization_id,
                status=job.status,
                document=_document_metadata(document),
                draft=draft.model_copy(deep=True) if draft is not None else None,
                error_message=job.error_code,
            )

    def confirm_ingestion(self, command: ConfirmationCommand) -> ConfirmationResponse:
        cache_key = (command.organization_id, command.idempotency_key)
        with self._lock:
            existing = self._idempotency.get(cache_key)
            if existing is not None:
                if (
                    existing.ingestion_id != command.ingestion_id
                    or existing.request_hash != command.request_hash
                ):
                    raise IngestionConflictError(
                        "Idempotency-Key was already used with different confirmation data"
                    )
                return existing.response.model_copy(deep=True)

            job = self.store.ingestion_jobs.get(command.ingestion_id)
            if job is None or job.organization_id != command.organization_id:
                raise IngestionNotFoundError
            if job.draft_id is None or job.draft_id != command.draft_id:
                raise IngestionConflictError("Ingestion draft is unavailable")
            stored_draft = self.store.extraction_drafts.get(job.draft_id)
            if stored_draft is None:
                raise IngestionConflictError("Ingestion draft is unavailable")
            if job.status == "CONFIRMED":
                raise IngestionConflictError("Ingestion draft is already confirmed")
            if job.status != "NEEDS_REVIEW":
                raise IngestionConflictError(
                    f"Ingestion cannot be confirmed from status {job.status}"
                )
            if command.draft_version != stored_draft.version:
                raise IngestionConflictError(
                    f"Draft version mismatch: server version is {stored_draft.version}"
                )

            current_inventory = {
                product_id: self.store.inventory_items.get(command.organization_id, {}).get(
                    product_id
                )
                for product_id in {
                    line.product_id for line in command.draft.lines if line.product_id is not None
                }
            }
            records = _build_confirmation_records(command, current_inventory)

            organization_transactions = self.store.transactions.setdefault(
                command.organization_id,
                {},
            )
            organization_inventory = self.store.inventory_items.setdefault(
                command.organization_id,
                {},
            )
            organization_movements = self.store.inventory_movements.setdefault(
                command.organization_id,
                [],
            )
            organization_approvals = self.store.approvals.setdefault(
                command.organization_id,
                [],
            )

            organization_transactions[records.transaction.id] = records.transaction
            for inventory_item in records.inventory_items:
                organization_inventory[inventory_item.product_id] = inventory_item
                legacy_item = self.store.legacy_products.setdefault(
                    command.organization_id,
                    {},
                ).get(inventory_item.product_id)
                self.store.legacy_products[command.organization_id][inventory_item.product_id] = (
                    Product(
                        product_id=inventory_item.product_id,
                        organization_id=command.organization_id,
                        name=inventory_item.display_name,
                        unit=inventory_item.unit.lower(),
                        quantity_on_hand=int(inventory_item.quantity_on_hand),
                        reorder_threshold=(
                            legacy_item.reorder_threshold
                            if legacy_item is not None
                            else int(inventory_item.low_stock_threshold)
                        ),
                        selling_price_centimes=(
                            legacy_item.selling_price_centimes if legacy_item is not None else 0
                        ),
                    )
                )
            organization_movements.extend(records.movements)
            organization_approvals.append(records.approval)

            confirmed_draft = command.draft.model_copy(deep=True)
            confirmed_draft.total_centimes = records.response.total_centimes
            self.store.extraction_drafts[command.draft_id] = confirmed_draft
            job.status = "CONFIRMED"
            job.updated_at = datetime.now(UTC)
            self._idempotency[cache_key] = IdempotencyRecord(
                organization_id=command.organization_id,
                ingestion_id=command.ingestion_id,
                request_hash=command.request_hash,
                response=records.response.model_copy(deep=True),
            )
            return records.response


def _draft_from_firestore(draft_id: str, data: dict) -> ExtractionDraft:
    return ExtractionDraft.model_validate(
        {
            "id": draft_id,
            "version": data["version"],
            "transaction_kind": str(data["transaction_kind"]).lower(),
            "currency": data["currency"],
            "lines": data["lines"],
            "total_centimes": data["total_centimes"],
            "clarification_question": data.get("clarification_question"),
        }
    )


class FirestoreIngestionRepository:
    def __init__(self):
        self.client = get_firestore_client()

    def _organization_ref(self, organization_id: str):
        return self.client.collection("organizations").document(organization_id)

    def start_ingestion(self, document: Document, job: IngestionJob) -> None:
        organization_ref = self._organization_ref(document.organization_id)
        document_ref = organization_ref.collection("documents").document(document.document_id)
        job_ref = organization_ref.collection("ingestion_jobs").document(job.ingestion_id)
        batch = self.client.batch()
        batch.set(
            document_ref,
            document.model_dump(mode="python", exclude={"document_id"}),
        )
        batch.set(
            job_ref,
            job.model_dump(mode="python", exclude={"ingestion_id"}),
        )
        batch.commit()

    def complete_ingestion(
        self,
        job: IngestionJob,
        draft: ExtractionDraft,
        agent_run: AgentRunRecord,
    ) -> None:
        if draft.id is None:
            raise ValueError("Completed extraction draft must have an ID")
        organization_ref = self._organization_ref(job.organization_id)
        job_ref = organization_ref.collection("ingestion_jobs").document(job.ingestion_id)
        draft_ref = organization_ref.collection("extraction_drafts").document(draft.id)
        run_ref = organization_ref.collection("agent_runs").document(agent_run.agent_run_id)
        now = datetime.now(UTC)
        draft_data = draft.model_dump(mode="python", exclude={"id"})
        draft_data.update(
            {
                "organization_id": job.organization_id,
                "ingestion_job_id": job.ingestion_id,
                "document_id": job.document_id,
                "status": "NEEDS_REVIEW",
                "transaction_kind": draft.transaction_kind.upper(),
                "created_at": now,
                "updated_at": now,
            }
        )

        batch = self.client.batch()
        batch.update(
            job_ref,
            job.model_dump(mode="python", exclude={"ingestion_id", "created_at"}),
        )
        batch.set(draft_ref, draft_data)
        batch.set(
            run_ref,
            agent_run.model_dump(
                mode="python",
                exclude={"agent_run_id", "tool_calls"},
            ),
        )
        for tool_call in agent_run.tool_calls:
            batch.set(
                run_ref.collection("tool_calls").document(tool_call.tool_call_id),
                tool_call.model_dump(mode="python", exclude={"tool_call_id"}),
            )
        batch.commit()

    def fail_ingestion(
        self,
        organization_id: str,
        ingestion_id: str,
        error_code: str,
    ) -> None:
        job_ref = (
            self._organization_ref(organization_id)
            .collection("ingestion_jobs")
            .document(ingestion_id)
        )
        job_ref.update(
            {
                "status": "FAILED",
                "error_code": error_code,
                "updated_at": datetime.now(UTC),
            }
        )

    def get_ingestion(
        self,
        organization_id: str,
        ingestion_id: str,
    ) -> IngestionResponse | None:
        organization_ref = self._organization_ref(organization_id)
        job_snapshot = organization_ref.collection("ingestion_jobs").document(ingestion_id).get()
        if not job_snapshot.exists:
            return None
        job = IngestionJob(
            ingestion_id=ingestion_id,
            **job_snapshot.to_dict(),
        )
        document_snapshot = organization_ref.collection("documents").document(job.document_id).get()
        if not document_snapshot.exists:
            return None
        document = Document(
            document_id=job.document_id,
            **document_snapshot.to_dict(),
        )

        draft = None
        if job.draft_id is not None:
            draft_snapshot = (
                organization_ref.collection("extraction_drafts").document(job.draft_id).get()
            )
            if draft_snapshot.exists:
                draft = _draft_from_firestore(job.draft_id, draft_snapshot.to_dict())

        return IngestionResponse(
            id=job.ingestion_id,
            organization_id=job.organization_id,
            status=job.status,
            document=_document_metadata(document),
            draft=draft,
            error_message=job.error_code,
        )

    def confirm_ingestion(self, command: ConfirmationCommand) -> ConfirmationResponse:
        organization_ref = self._organization_ref(command.organization_id)
        job_ref = organization_ref.collection("ingestion_jobs").document(command.ingestion_id)
        approval_id = hashlib.sha256(command.idempotency_key.encode()).hexdigest()[:32]
        approval_ref = organization_ref.collection("approvals").document(f"confirm-{approval_id}")
        database_transaction = self.client.transaction()

        @firestore.transactional
        def apply_confirmation(transaction):
            approval_snapshot = approval_ref.get(transaction=transaction)
            if approval_snapshot.exists:
                approval_data = approval_snapshot.to_dict()
                if (
                    approval_data.get("target_id") != command.draft_id
                    or approval_data.get("request_hash") != command.request_hash
                ):
                    raise IngestionConflictError(
                        "Idempotency-Key was already used with different confirmation data"
                    )
                return ConfirmationResponse.model_validate(approval_data["result"])

            job_snapshot = job_ref.get(transaction=transaction)
            if not job_snapshot.exists:
                raise IngestionNotFoundError
            job_data = job_snapshot.to_dict()
            if job_data.get("organization_id") != command.organization_id:
                raise IngestionNotFoundError
            if job_data.get("draft_id") != command.draft_id:
                raise IngestionConflictError("Ingestion draft is unavailable")
            if job_data.get("status") == "CONFIRMED":
                raise IngestionConflictError("Ingestion draft is already confirmed")
            if job_data.get("status") != "NEEDS_REVIEW":
                raise IngestionConflictError(
                    f"Ingestion cannot be confirmed from status {job_data.get('status')}"
                )

            draft_ref = organization_ref.collection("extraction_drafts").document(command.draft_id)
            draft_snapshot = draft_ref.get(transaction=transaction)
            if not draft_snapshot.exists:
                raise IngestionConflictError("Ingestion draft is unavailable")
            stored_draft = _draft_from_firestore(
                command.draft_id,
                draft_snapshot.to_dict(),
            )
            if stored_draft.version != command.draft_version:
                raise IngestionConflictError(
                    f"Draft version mismatch: server version is {stored_draft.version}"
                )

            product_ids = {
                line.product_id
                for line in command.draft.lines
                if line.product_id is not None and command.draft.transaction_kind != "expense"
            }
            inventory_refs = {
                product_id: organization_ref.collection("inventory_items").document(product_id)
                for product_id in product_ids
            }
            inventory_snapshots = {
                product_id: inventory_ref.get(transaction=transaction)
                for product_id, inventory_ref in inventory_refs.items()
            }
            current_inventory = {
                product_id: (
                    InventoryItem.model_validate(snapshot.to_dict()) if snapshot.exists else None
                )
                for product_id, snapshot in inventory_snapshots.items()
            }
            records = _build_confirmation_records(command, current_inventory)
            now = datetime.now(UTC)

            transaction_ref = organization_ref.collection("transactions").document(
                records.transaction.id
            )
            transaction_data = records.transaction.model_dump(
                mode="python",
                exclude={"id", "ingestion_id", "draft_id"},
            )
            transaction_data.update(
                {
                    "kind": records.transaction.kind.upper(),
                    "status": "CONFIRMED",
                    "source_draft_id": command.draft_id,
                    "confirmed_by": command.user_id,
                    "created_at": now,
                    "updated_at": now,
                }
            )
            transaction.set(transaction_ref, transaction_data)

            for movement in records.movements:
                movement_ref = organization_ref.collection("inventory_movements").document(
                    movement.movement_id
                )
                transaction.set(
                    movement_ref,
                    movement.model_dump(mode="python", exclude={"movement_id"}),
                )
            for inventory_item in records.inventory_items:
                transaction.set(
                    inventory_refs[inventory_item.product_id],
                    inventory_item.model_dump(mode="python"),
                )

            confirmed_draft = command.draft.model_dump(mode="python", exclude={"id"})
            confirmed_draft.update(
                {
                    "organization_id": command.organization_id,
                    "ingestion_job_id": command.ingestion_id,
                    "document_id": job_data["document_id"],
                    "status": "CONFIRMED",
                    "transaction_kind": command.draft.transaction_kind.upper(),
                    "total_centimes": records.response.total_centimes,
                    "updated_at": now,
                }
            )
            transaction.update(draft_ref, confirmed_draft)
            transaction.update(
                job_ref,
                {
                    "status": "CONFIRMED",
                    "updated_at": now,
                },
            )

            approval_data = records.approval.model_dump(
                mode="python",
                exclude={"approval_id"},
            )
            approval_data.update(
                {
                    "request_hash": command.request_hash,
                    "result": records.response.model_dump(mode="json"),
                }
            )
            transaction.set(approval_ref, approval_data)
            return records.response

        return apply_confirmation(database_transaction)


_in_memory_repository = InMemoryIngestionRepository(db_store)


def get_ingestion_repository() -> IngestionRepository:
    settings = get_settings()
    if settings.app_env == "production" or os.getenv("FIRESTORE_EMULATOR_HOST"):
        return FirestoreIngestionRepository()
    return _in_memory_repository
