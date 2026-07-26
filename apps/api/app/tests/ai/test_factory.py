"""
Tests for get_extraction_provider (issues #21/#22).

Run with: pytest apps/api/app/tests/ai/test_factory.py
"""

import importlib

from app.modules.ai.providers.fixture import FixtureProvider


def _reload_factory():
    factory = importlib.import_module("app.modules.ai.providers.factory")
    importlib.reload(factory)
    return factory


def test_defaults_to_fixture_when_unset(monkeypatch):
    monkeypatch.delenv("AI_PROVIDER", raising=False)
    factory = _reload_factory()

    provider = factory.get_extraction_provider()

    assert isinstance(provider, FixtureProvider)


def test_explicit_fixture_setting(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "fixture")
    factory = _reload_factory()

    provider = factory.get_extraction_provider()

    assert isinstance(provider, FixtureProvider)


def test_unknown_value_falls_back_to_fixture(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "something_unexpected")
    factory = _reload_factory()

    provider = factory.get_extraction_provider()

    assert isinstance(provider, FixtureProvider)


def test_gemma_setting_returns_gemma_provider(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "gemma")
    factory = _reload_factory()

    from app.modules.ai.providers.gemma import GemmaProvider

    provider = factory.get_extraction_provider()

    assert isinstance(provider, GemmaProvider)