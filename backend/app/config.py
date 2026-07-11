import json
import os

from pydantic_settings import BaseSettings, SettingsConfigDict


def parse_cors_origins() -> list[str]:
    """Parse CORS_ORIGINS from env — supports comma-separated or JSON array."""
    default = ["http://localhost:3000", "http://127.0.0.1:3000"]
    raw = os.environ.get("CORS_ORIGINS", "").strip()
    if not raw:
        return default
    if raw.startswith("["):
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return [str(o).strip() for o in parsed if str(o).strip()]
        except json.JSONDecodeError:
            pass
    return [o.strip() for o in raw.split(",") if o.strip()] or default


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    secret_key: str = "signal-clone-dev-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    database_url: str = "sqlite:///./signal.db"
    mock_otp: str = "123456"

    @property
    def cors_origin_list(self) -> list[str]:
        return parse_cors_origins()


settings = Settings()
