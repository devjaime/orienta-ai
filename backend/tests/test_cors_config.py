"""
Tests para asegurar que CORS permita el frontend productivo.
"""

from app.config import Settings


def test_cors_allowed_origins_incluye_frontends_productivos() -> None:
    settings = Settings(
        frontend_url="https://app.vocari.cl",
        allowed_origins=["https://preview.vocari.cl"],
    )

    assert "https://app.vocari.cl" in settings.cors_allowed_origins
    assert "https://vocari.cl" in settings.cors_allowed_origins
    assert "https://preview.vocari.cl" in settings.cors_allowed_origins


def test_cors_origin_regex_cubre_subdominios_vocari_y_vercel() -> None:
    settings = Settings()

    assert settings.cors_allow_origin_regex == r"^https://([a-z0-9-]+\.)?(vocari\.cl|vercel\.app)$"
