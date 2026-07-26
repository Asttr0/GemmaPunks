from app.core.config import get_settings
from app.modules.ai.providers.base import ExtractionProvider
from app.modules.ai.providers.fixture import FixtureProvider
from app.modules.ai.providers.gemma import GemmaProvider


def get_extraction_provider() -> ExtractionProvider:
    settings = get_settings()
    provider_name = getattr(settings, "ai_provider", "fixture").lower()
    if provider_name == "gemma":
        return GemmaProvider(
            api_key=settings.gemini_api_key,
            model_name=settings.gemma_model,
            timeout_seconds=settings.ai_timeout_seconds,
        )
    return FixtureProvider()
