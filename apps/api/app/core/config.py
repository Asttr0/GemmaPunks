from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "MIZAN Souq API"
    app_env: str = "development"
    app_cors_origins: str = "http://localhost:5173"
    firebase_project_id: str = "demo-gemmapunks"
    ai_provider: str = "fixture"
    gemini_api_key: str | None = None
    gemma_model: str = "gemma-4-26b-a4b-it"
    ai_timeout_seconds: int = Field(default=60, ge=5, le=120)
    max_upload_mb: int = Field(default=10, ge=1, le=25)

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.app_cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
