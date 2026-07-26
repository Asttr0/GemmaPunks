"""
Tests for FixtureProvider (issue #21).

Run with: pytest apps/api/app/tests/ai/test_fixture_provider.py
"""

import pytest

from app.modules.ai.providers.fixture import (
    APPROVED_AUDIO_FILENAME,
    APPROVED_RECEIPT_FILENAME,
    FixtureProvider,
)


def test_fixture_output_passes_extraction_schema():
    provider = FixtureProvider(simulate_delay=False)

    result = provider.extract_evidence(
        file_bytes=b"fake receipt bytes",
        original_name=APPROVED_RECEIPT_FILENAME,
        content_type="image/jpeg",
        evidence_kind="receipt",
    )

    assert result.provider == "fixture"
    assert result.fallback_used is False
    assert len(result.draft.lines) == 2


def test_receipt_returns_both_approved_products():
    provider = FixtureProvider(simulate_delay=False)

    result = provider.extract_evidence(
        file_bytes=b"fake receipt bytes",
        original_name=APPROVED_RECEIPT_FILENAME,
        content_type="image/jpeg",
        evidence_kind="receipt",
    )

    product_ids = {line.product_id for line in result.draft.lines}
    assert product_ids == {"cooking_oil_1l", "sugar_1kg"}


def test_sugar_quantity_confidence_is_064():
    provider = FixtureProvider(simulate_delay=False)

    result = provider.extract_evidence(
        file_bytes=b"fake receipt bytes",
        original_name=APPROVED_RECEIPT_FILENAME,
        content_type="image/jpeg",
        evidence_kind="receipt",
    )

    sugar = next(l for l in result.draft.lines if l.product_id == "sugar_1kg")
    assert sugar.confidence == 0.64
    assert "quantity" in sugar.uncertain_fields


def test_line_totals_are_recalculated():
    provider = FixtureProvider(simulate_delay=False)

    result = provider.extract_evidence(
        file_bytes=b"fake receipt bytes",
        original_name=APPROVED_RECEIPT_FILENAME,
        content_type="image/jpeg",
        evidence_kind="receipt",
    )

    oil = next(l for l in result.draft.lines if l.product_id == "cooking_oil_1l")
    assert oil.line_total_centimes == 20 * 2200
    assert result.draft.total_centimes == 20 * 2200 + 10 * 850


def test_expected_clarification_question_is_returned():
    provider = FixtureProvider(simulate_delay=False)

    result = provider.extract_evidence(
        file_bytes=b"fake receipt bytes",
        original_name=APPROVED_RECEIPT_FILENAME,
        content_type="image/jpeg",
        evidence_kind="receipt",
    )

    assert result.draft.clarification_question == "Was the sugar quantity 10 bags?"


def test_unknown_file_does_not_receive_a_demo_fixture():
    provider = FixtureProvider(simulate_delay=False)

    with pytest.raises(ValueError):
        provider.extract_evidence(
            file_bytes=b"some random upload",
            original_name="not_the_demo_file.jpg",
            content_type="image/jpeg",
            evidence_kind="receipt",
        )