"""
Vocari Backend - Hashing de tokens revocables.
"""

import hashlib
import hmac
import secrets

from app.config import get_settings


def new_secret_token(nbytes: int = 32) -> str:
    """Genera un token opaco URL-safe."""
    return secrets.token_urlsafe(nbytes)


def hash_token(raw_token: str) -> str:
    """Hashea un token con HMAC-SHA256 usando secret_key."""
    settings = get_settings()
    return hmac.new(
        settings.secret_key.encode("utf-8"),
        raw_token.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def tokens_match(raw_token: str, token_hash: str) -> bool:
    """Compara un token en claro con su hash almacenado."""
    return hmac.compare_digest(hash_token(raw_token), token_hash)
