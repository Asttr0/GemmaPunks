"""
Provider factory (issue #21).

Selects which ExtractionProvider implementation the rest of the app uses,
based on the AI_PROVIDER environment variable. Callers (Anas's FastAPI
layer) only ever depend on the ExtractionProvider interface from base.py —
never on FixtureProvider or GemmaProvider directly.

    AI_PROVIDER=fixture   -> FixtureProvider (default; offline demo path)
    AI_PROVIDER=gemma     -> GemmaProvider (hosted Gemma 4 via the Gemini
                              API, with automatic fallback to
                              FixtureProvider on any failure)
"""

from __future__ import annotations

from functools import lru_cache

from app.core.config import get_settings
from app.modules.ai.providers.base import ExtractionProvider
from app.modules.ai.providers.fixture import FixtureProvider
from app.modules.ai.providers.gemma import GemmaProvider

_VALID_PROVIDERS = {"fixture", "gemma"}


@lru_cache
def get_extraction_provider() -> ExtractionProvider:
    """
    Returns the configured provider, built once and cached — so a GemmaProvider
    isn't rebuilding a Gemini API client (and FixtureProvider isn't reloading
    fixtures) on every single request.
    """
    settings = get_settings()
    provider_name = (getattr(settings, "ai_provider", None) or "fixture").strip().lower()

    if provider_name not in _VALID_PROVIDERS:
        raise ValueError(
            f"Unknown AI_PROVIDER={provider_name!r}. Expected one of {sorted(_VALID_PROVIDERS)}."
        )

    if provider_name == "gemma":
        return GemmaProvider()

    return FixtureProvider()