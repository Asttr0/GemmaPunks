from app.core.config import get_settings
from app.modules.ai.providers.base import ExtractionProvider
from app.modules.ai.providers.fixture import FixtureProvider
from app.modules.ai.providers.gemma import GemmaProvider


def get_extraction_provider() -> ExtractionProvider:
    settings = get_settings()
    provider_name = getattr(settings, "ai_provider", "fixture").lower()
    if provider_name == "gemma":
        api_key = getattr(settings, "gemini_api_key", None)
        return GemmaProvider(api_key=api_key)
    return FixtureProvider()
