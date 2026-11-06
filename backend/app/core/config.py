from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Autotoner API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Gemini API Key
    GEMINI_API_KEY: str = ""

    # Default fallback chain for AI model selection
    DEFAULT_AI_MODELS: list[str] = [
        "gemini-3.8-flash",
        "gemini-3.8-flash-lite",
    ]

    # Audio analysis limits
    MAX_AUDIO_UPLOAD_BYTES: int = 20 * 1024 * 1024  # 20 MB limit
    AUDIO_ANALYSIS_DURATION_SECONDS: float = 30.0

    # CORS configuration
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()