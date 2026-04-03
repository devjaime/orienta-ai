"""
Vocari Backend - Configuracion de la aplicacion.

Usa pydantic-settings para cargar y validar variables de entorno.
"""

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuracion global de la aplicacion."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Aplicacion ---
    app_name: str = "vocari-backend"
    app_env: str = "development"  # development | staging | production
    debug: bool = True
    secret_key: str = "cambiar-en-produccion"
    api_v1_prefix: str = "/api/v1"

    # --- Servidor ---
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 1
    reload: bool = True

    # --- Base de Datos ---
    database_url: str = "postgresql+asyncpg://vocari:vocari_dev@localhost:5433/vocari"
    database_pool_size: int = 10
    database_max_overflow: int = 20

    # --- Redis ---
    redis_url: str = "redis://localhost:6379/0"
    redis_required: bool = True

    # --- Google OAuth ---
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/v1/auth/callback"

    # --- JWT ---
    jwt_secret_key: str = "cambiar-en-produccion"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 7

    # --- Google Workspace (Service Account) ---
    google_service_account_file: str = ""  # Ruta a credentials JSON
    google_delegated_user: str = ""  # Email del admin para impersonar
    google_workspace_domain: str = ""  # Dominio Workspace del colegio

    # --- OpenRouter (IA) ---
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_default_model: str = "anthropic/claude-3.5-sonnet"
    openrouter_fallback_models: list[str] = [
        "google/gemini-2.0-flash-001",
        "meta-llama/llama-3.3-70b-instruct",
    ]
    openrouter_max_concurrent: int = 10
    openrouter_timeout_seconds: int = 30
    openrouter_max_retries: int = 3

    # --- Frontend ---
    frontend_url: str = "http://localhost:3000"
    allowed_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # --- Login MVP por credenciales fijas ---
    mvp_login_enabled: bool = True
    mvp_login_username: str = "devjaime"
    mvp_login_password: str = "CasaPropia08.."

    # --- Rate Limiting ---
    rate_limit_per_minute: int = 60
    rate_limit_per_hour: int = 1000

    # --- Logging ---
    log_level: str = "DEBUG"
    log_format: str = "json"  # json | console

    # --- Sentry (Monitoring) ---
    sentry_dsn: str = ""  # Sentry DSN for error tracking
    sentry_environment: str = "development"
    sentry_sample_rate: float = 1.0

    @field_validator("openrouter_fallback_models", mode="before")
    @classmethod
    def parse_fallback_models(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            return [m.strip() for m in v.split(",")]
        return v

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return [origin.strip() for origin in v if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"

    @property
    def cors_allowed_origins(self) -> list[str]:
        """Construye una lista robusta de origins permitidos para CORS."""
        origins = {
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
            "https://vocari.cl",
            "https://app.vocari.cl",
            "https://vocari-api.fly.dev",
        }

        if self.frontend_url:
            origins.add(self.frontend_url.rstrip("/"))

        origins.update(origin.rstrip("/") for origin in self.allowed_origins if origin)

        return sorted(origins)

    @property
    def cors_allow_origin_regex(self) -> str:
        """Permite previews controlados sin depender de variables manuales."""
        return r"^https://([a-z0-9-]+\.)?(vocari\.cl|vercel\.app)$"


@lru_cache
def get_settings() -> Settings:
    """Retorna singleton de configuracion."""
    return Settings()
