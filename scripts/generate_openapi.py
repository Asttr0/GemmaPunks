#!/usr/bin/env python3
"""Generate and validate the frozen FastAPI contract used by the web app."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps" / "api"))

from app.main import app  # noqa: E402

OUTPUT = ROOT / "packages" / "contracts" / "openapi.json"

FIELD_EXAMPLES: dict[str, Any] = {
    "id": "resource-001",
    "user_id": "demo-merchant",
    "organization_id": "merchant-berrechid",
    "primary_organization_id": "merchant-berrechid",
    "supplier_organization_id": "supplier-atlas",
    "participant_organization_ids": ["merchant-berrechid"],
    "email": "merchant.demo@example.com",
    "display_name": "Demo Merchant",
    "organization_name": "Berrechid Demo Grocery",
    "product_id": "cooking-oil-1l",
    "procurement_need_id": "need-oil-001",
    "opportunity_id": "opp-oil-001",
    "catalog_item_id": "cat-oil-bulk",
    "supplier_catalog_item_id": "cat-oil-bulk",
    "ingestion_id": "ingestion-001",
    "draft_id": "draft-001",
    "transaction_id": "transaction-001",
    "agent_run_id": "agent-run-001",
    "movement_id": "movement-001",
    "inventory_movement_ids": ["movement-001"],
    "group_order_id": "group-oil-001",
    "supplier_sku": "ATL-OIL-1L",
    "original_name": "receipt-demo.jpg",
    "content_type": "image/jpeg",
    "field_path": "lines[0].quantity",
    "answer": "20",
    "label": "Review purchasing need",
    "code": "stockout_soon",
    "message": "Cooking oil may run out in four days.",
    "unit": "BOTTLE",
    "locale": "en-MA",
    "currency": "MAD",
    "coarse_area": "Berrechid Center",
    "city": "Berrechid",
    "quantity": 20,
    "quantity_needed": 20,
    "quantity_on_hand": 14,
    "requested_quantity": 20,
    "minimum_quantity": 50,
    "available_quantity": 500,
    "target_stock": 34,
    "target_stock_quantity": 34,
    "total_centimes": 1850,
    "unit_price_centimes": 1850,
    "delivery_fee_centimes": 3000,
    "delivery_total_centimes": 3000,
    "landed_cost_centimes": 40000,
    "sales_centimes": 1250000,
    "expenses_centimes": 830000,
    "estimated_profit_centimes": 420000,
    "available_cash_centimes": 610000,
    "total_savings_centimes": 10000,
    "collective_unit_price_centimes": 1850,
    "original_unit_price_centimes": 2200,
}


def resolve_schema(schema: dict[str, Any], document: dict[str, Any]) -> dict[str, Any]:
    reference = schema.get("$ref")
    if not reference:
        return schema
    node: Any = document
    for segment in reference.removeprefix("#/").split("/"):
        node = node[segment]
    return node


def example_for(
    schema: dict[str, Any],
    document: dict[str, Any],
    field_name: str | None = None,
) -> Any:
    schema = resolve_schema(schema, document)
    if "example" in schema:
        return schema["example"]
    if "default" in schema and schema["default"] is not None:
        return schema["default"]
    if field_name in FIELD_EXAMPLES:
        return FIELD_EXAMPLES[field_name]

    for union_key in ("anyOf", "oneOf"):
        if union_key in schema:
            options = schema[union_key]
            selected = next(
                (option for option in options if option.get("type") != "null"),
                options[0],
            )
            return example_for(selected, document, field_name)

    if "allOf" in schema:
        return example_for(schema["allOf"][0], document, field_name)
    if "const" in schema:
        return schema["const"]
    if schema.get("enum"):
        return schema["enum"][0]

    schema_type = schema.get("type")
    if schema_type == "object" or "properties" in schema:
        return {
            name: example_for(property_schema, document, name)
            for name, property_schema in schema.get("properties", {}).items()
        }
    if schema_type == "array":
        return [example_for(schema.get("items", {}), document, field_name)]
    if schema_type == "integer":
        return 1
    if schema_type == "number":
        return 1.0
    if schema_type == "boolean":
        return True
    if schema.get("format") == "date-time":
        return "2026-07-25T08:00:00Z"
    if schema.get("format") == "binary":
        return "receipt-demo.jpg"
    return "string"


def validate_money_and_identity(
    schema: dict[str, Any],
    document: dict[str, Any],
    *,
    request_schema: bool,
    visited: set[str] | None = None,
) -> None:
    visited = visited or set()
    reference = schema.get("$ref")
    if reference:
        if reference in visited:
            return
        visited.add(reference)
        schema = resolve_schema(schema, document)

    for union_key in ("anyOf", "oneOf", "allOf"):
        for option in schema.get(union_key, []):
            validate_money_and_identity(
                option,
                document,
                request_schema=request_schema,
                visited=visited,
            )

    for name, property_schema in schema.get("properties", {}).items():
        resolved_property = resolve_schema(property_schema, document)
        if request_schema and name == "organization_id":
            raise ValueError("Request schemas must not accept organization_id")
        if name.endswith("_centimes"):
            property_types = {
                option.get("type")
                for option in resolved_property.get("anyOf", [resolved_property])
            }
            if "integer" not in property_types:
                raise ValueError(f"{name} must be represented as integer centimes")
        validate_money_and_identity(
            property_schema,
            document,
            request_schema=request_schema,
            visited=visited,
        )

    items = schema.get("items")
    if items:
        validate_money_and_identity(
            items,
            document,
            request_schema=request_schema,
            visited=visited,
        )


def enrich_and_validate_contract(document: dict[str, Any]) -> None:
    errors: list[str] = []
    for path, methods in document["paths"].items():
        if not path.startswith("/api/v1/"):
            continue
        for method, operation in methods.items():
            if method not in {"get", "post", "put", "patch", "delete"}:
                continue
            operation_name = f"{method.upper()} {path}"

            for parameter in operation.get("parameters", []):
                parameter["example"] = example_for(
                    parameter["schema"],
                    document,
                    parameter.get("name"),
                )

            request_body = operation.get("requestBody")
            if request_body:
                for media in request_body.get("content", {}).values():
                    request_schema = media.get("schema")
                    if not request_schema:
                        errors.append(f"{operation_name} request is missing a schema")
                        continue
                    media["example"] = example_for(request_schema, document)
                    try:
                        validate_money_and_identity(
                            request_schema,
                            document,
                            request_schema=True,
                        )
                    except ValueError as exc:
                        errors.append(f"{operation_name}: {exc}")

            success_response = next(
                (
                    response
                    for code, response in operation.get("responses", {}).items()
                    if code.startswith("2")
                ),
                None,
            )
            if success_response is None:
                errors.append(f"{operation_name} is missing a success response")
                continue

            content = success_response.get("content", {})
            if not content:
                errors.append(f"{operation_name} success response is missing content")
                continue
            for media in content.values():
                response_schema = media.get("schema")
                if not response_schema:
                    errors.append(f"{operation_name} response is missing a schema")
                    continue
                media["example"] = example_for(response_schema, document)
                try:
                    validate_money_and_identity(
                        response_schema,
                        document,
                        request_schema=False,
                    )
                except ValueError as exc:
                    errors.append(f"{operation_name}: {exc}")

    if errors:
        raise ValueError("Contract validation failed:\n- " + "\n- ".join(errors))


def main() -> None:
    document = app.openapi()
    enrich_and_validate_contract(document)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        json.dumps(document, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(f"Generated {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
