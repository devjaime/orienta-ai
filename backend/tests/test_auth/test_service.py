"""
Vocari Backend - Tests del servicio de autenticacion.
"""

import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import patch

import pytest
from jose import jwt

from app.auth.service import (
    create_access_token,
    create_refresh_token,
    verify_token,
)
from app.common.exceptions import AuthenticationError, TokenExpiredError
from app.config import get_settings


class TestCreateAccessToken:
    """Tests para create_access_token."""

    def test_create_access_token(self) -> None:
        """Crea un access token y verifica que el payload sea correcto."""
        user_id = uuid.uuid4()
        role = "estudiante"

        token = create_access_token(user_id, role)

        settings = get_settings()
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])

        assert payload["sub"] == str(user_id)
        assert payload["role"] == role
        assert payload["type"] == "access"
        assert "exp" in payload
        assert "iat" in payload


class TestCreateRefreshToken:
    """Tests para create_refresh_token."""

    def test_create_refresh_token(self) -> None:
        """Crea un refresh token y verifica el tipo correcto."""
        user_id = uuid.uuid4()

        token = create_refresh_token(user_id)

        settings = get_settings()
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])

        assert payload["sub"] == str(user_id)
        assert payload["type"] == "refresh"
        assert "exp" in payload
        assert "iat" in payload


class TestVerifyToken:
    """Tests para verify_token."""

    def test_verify_token_valid(self) -> None:
        """Un token valido retorna el payload correcto."""
        user_id = uuid.uuid4()
        role = "orientador"

        token = create_access_token(user_id, role)
        payload = verify_token(token, expected_type="access")

        assert payload["sub"] == str(user_id)
        assert payload["role"] == role
        assert payload["type"] == "access"

    def test_verify_token_expired(self) -> None:
        """Un token expirado lanza TokenExpiredError."""
        settings = get_settings()
        expired_payload = {
            "sub": str(uuid.uuid4()),
            "role": "estudiante",
            "exp": datetime.now(UTC) - timedelta(hours=1),
            "iat": datetime.now(UTC) - timedelta(hours=2),
            "type": "access",
        }
        token = jwt.encode(
            expired_payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm
        )

        with pytest.raises(TokenExpiredError):
            verify_token(token, expected_type="access")

    def test_verify_token_wrong_type(self) -> None:
        """Un token con tipo incorrecto lanza AuthenticationError."""
        user_id = uuid.uuid4()

        # Crear un refresh token e intentar verificarlo como access
        token = create_refresh_token(user_id)

        with pytest.raises(AuthenticationError, match="Tipo de token incorrecto"):
            verify_token(token, expected_type="access")
