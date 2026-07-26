import pytest

from app.core.business_repository import InMemoryBusinessRepository
from app.core.models import InventoryItem
from app.core.store import db_store
from app.modules.ai.schemas.extraction import DraftLine, ExtractionDraft
from app.modules.auth.schemas import UserContext
from app.modules.ingestion.repository import (
    ConfirmationCommand,
    _build_confirmation_records,
)
from app.modules.inventory.router import list_product_options


def test_carton_purchase_preserves_invoice_quantity_and_updates_base_inventory():
    draft = ExtractionDraft(
        id="draft-invoice",
        transaction_kind="purchase",
        currency="MAD",
        lines=[
            DraftLine(
                line_id="line-001",
                product_id="cooking-oil-1l",
                product_name="Cooking oil 1L",
                unit="CARTON",
                base_unit="BOTTLE",
                unit_multiplier=12,
                quantity=500,
                unit_price_centimes=18_500,
                line_total_centimes=9_250_000,
            )
        ],
        total_centimes=9_250_000,
    )
    command = ConfirmationCommand(
        organization_id="merchant-berrechid",
        user_id="demo-merchant",
        ingestion_id="ing-invoice",
        draft_id="draft-invoice",
        draft_version=1,
        idempotency_key="confirm-invoice",
        request_hash="request-hash",
        draft=draft,
        transaction_id="txn-invoice",
        movement_ids=("mov-invoice",),
    )
    current_inventory = {
        "cooking-oil-1l": InventoryItem(
            organization_id="merchant-berrechid",
            product_id="cooking-oil-1l",
            display_name="Cooking oil 1L",
            unit="BOTTLE",
            quantity_on_hand=10,
        )
    }

    records = _build_confirmation_records(command, current_inventory)

    line = records.transaction.lines[0]
    assert line.quantity == 500
    assert line.unit == "CARTON"
    assert line.unit_multiplier == 12
    assert line.inventory_quantity == 6_000
    assert records.transaction.total_centimes == 9_250_000
    assert records.movements[0].unit == "BOTTLE"
    assert records.movements[0].quantity_delta == 6_000
    assert records.inventory_items[0].unit == "BOTTLE"
    assert records.inventory_items[0].quantity_on_hand == 6_010


@pytest.mark.asyncio
async def test_product_options_expose_only_approved_packaging_conversions():
    response = await list_product_options(
        user=UserContext(
            user_id="demo-merchant",
            organization_id="merchant-berrechid",
            role="owner",
        ),
        repository=InMemoryBusinessRepository(db_store),
    )

    oil = next(item for item in response.items if item.product_id == "cooking-oil-1l")
    assert oil.base_unit == "BOTTLE"
    assert [(unit.unit, unit.conversion_to_base) for unit in oil.units] == [
        ("BOTTLE", 1),
        ("CARTON", 12),
    ]
