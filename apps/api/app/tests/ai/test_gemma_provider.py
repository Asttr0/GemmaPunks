"""
Tests for GemmaProvider (issue #22) — now targeting hosted Gemma 4 via the
Gemini API (AI_PROVIDER=gemma) instead of local Ollama.

These patch GemmaProvider._call_model directly, so the suite runs without a
real GEMINI_API_KEY, network access, or the google-genai SDK making real
calls — useful for CI and for anyone on the team without a key set. Use
smoke_test_gemma.py separately to sanity-check real output quality against
the live API.

Run with: pytest apps/api/app/tests/ai/test_gemma_provider.py
"""

import json
from unittest.mock import patch

import pytest

from app.modules.ai.providers.fixture import (
    APPROVED_AUDIO_FILENAME,
    APPROVED_RECEIPT_FILENAME,
)
from app.modules.ai.providers.gemma import GemmaProvider

VALID_GEMMA_JSON = json.dumps({
    "transaction_kind": "purchase",
    "currency": "MAD",
    "lines": [
        {
            "product_id": "cooking_oil_1l",
            "product_name": "Cooking oil 1L",
            "original_product_name": "Zit",
            "unit": "bottle",
            "quantity": 20,
            "unit_price_centimes": 2200,
            "line_total_centimes": 44000,
            "confidence": 0.95,
            "uncertain_fields": [],
        }
    ],
    "total_centimes": 44000,
    "clarification_question": None,
})


def _provider_with_key() -> GemmaProvider:
    """
    GemmaProvider only attempts a real call when self._client is set (i.e.
    it believes GEMINI_API_KEY is configured). Tests patch _call_model
    below, so the placeholder client object here never actually gets used
    to make a request — it just needs to be truthy.
    """
    provider = GemmaProvider()
    provider._client = object()
    return provider


def test_successful_extraction_returns_gemma_provider_result():
    provider = _provider_with_key()

    with patch.object(GemmaProvider, "_call_model", return_value=VALID_GEMMA_JSON):
        result = provider.extract_evidence(
            file_bytes=b"fake receipt jpeg bytes",
            original_name="whatever_photo.jpg",
            content_type="image/jpeg",
            evidence_kind="receipt",
        )

    assert result.provider == "gemma"
    assert result.model == provider.model_name
    assert result.fallback_used is False
    assert result.draft.lines[0].product_id == "cooking_oil_1l"


def test_markdown_fenced_json_is_still_parsed():
    provider = _provider_with_key()
    fenced = f"```json\n{VALID_GEMMA_JSON}\n```"

    with patch.object(GemmaProvider, "_call_model", return_value=fenced):
        result = provider.extract_evidence(
            file_bytes=b"fake receipt jpeg bytes",
            original_name="whatever_photo.jpg",
            content_type="image/jpeg",
            evidence_kind="receipt",
        )

    assert result.provider == "gemma"
    assert len(result.draft.lines) == 1


def test_missing_api_key_falls_back_to_fixture():
    # No GEMINI_API_KEY configured in the test environment -> self._client is None.
    provider = GemmaProvider()

    result = provider.extract_evidence(
        file_bytes=b"fake receipt jpeg bytes",
        original_name=APPROVED_RECEIPT_FILENAME,
        content_type="image/jpeg",
        evidence_kind="receipt",
    )

    assert result.provider == "fixture"
    assert result.fallback_used is True
    assert any(event.name == "gemma_fallback" for event in result.timeline)


def test_api_call_failure_falls_back_to_fixture():
    provider = _provider_with_key()

    with patch.object(GemmaProvider, "_call_model", side_effect=ConnectionError("Gemini API unreachable")):
        result = provider.extract_evidence(
            file_bytes=b"fake receipt jpeg bytes",
            original_name=APPROVED_RECEIPT_FILENAME,
            content_type="image/jpeg",
            evidence_kind="receipt",
        )

    assert result.provider == "fixture"
    assert result.fallback_used is True
    assert any(event.name == "gemma_fallback" for event in result.timeline)


def test_malformed_json_falls_back_to_fixture():
    provider = _provider_with_key()

    with patch.object(GemmaProvider, "_call_model", return_value="this is not json at all"):
        result = provider.extract_evidence(
            file_bytes=b"fake receipt jpeg bytes",
            original_name=APPROVED_RECEIPT_FILENAME,
            content_type="image/jpeg",
            evidence_kind="receipt",
        )

    assert result.provider == "fixture"
    assert result.fallback_used is True


def test_audio_routes_straight_to_fallback_and_succeeds():
    """
    GemmaProvider doesn't have real audio inference wired up via the hosted
    API either, so it always routes audio straight to the fallback — same
    behavior as before the switch away from local Ollama.
    """
    provider = _provider_with_key()

    result = provider.extract_evidence(
        file_bytes=b"fake audio bytes",
        original_name=APPROVED_AUDIO_FILENAME,
        content_type="audio/wav",
        evidence_kind="audio",
    )

    assert result.fallback_used is True
    assert result.provider == "fixture"