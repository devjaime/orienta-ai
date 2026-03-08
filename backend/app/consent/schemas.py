"""
Vocari Backend - Schemas de Consent (Pydantic v2).
"""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel

from app.consent.models import ConsentMethod, ConsentType


class ConsentGrantType(str, Enum):
    """Tipos para otorgar consentimiento (incluye 'all')."""

    RECORDING = "recording"
    AI_PROCESSING = "ai_processing"
    DATA_STORAGE = "data_storage"
    ALL = "all"


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------


class ConsentGrantRequest(BaseModel):
    """Otorgar consentimiento. Rol: apoderado (para su hijo) o estudiante adulto."""

    consent_type: ConsentGrantType
    student_id: uuid.UUID | None = None  # Requerido si el otorgante es apoderado
    method: ConsentMethod = ConsentMethod.DIGITAL


class ConsentRevokeRequest(BaseModel):
    """Revocar consentimiento."""

    consent_type: ConsentGrantType
    student_id: uuid.UUID | None = None


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------


class ConsentStatusResponse(BaseModel):
    """Estado actual de consentimiento de un estudiante."""

    student_id: uuid.UUID
    recording_consent: bool = False
    ai_processing_consent: bool = False
    data_storage_consent: bool = False
    parental_consent: bool | None = None  # None si no es menor de edad
    consent_date: datetime | None = None
    method: ConsentMethod | None = None
    data_deletion_scheduled: bool = False


class ConsentRecordResponse(BaseModel):
    """Respuesta de un registro de consentimiento individual."""

    id: uuid.UUID
    student_id: uuid.UUID
    granted_by: uuid.UUID
    consent_type: ConsentType
    granted: bool
    granted_at: datetime
    revoked_at: datetime | None
    method: ConsentMethod

    model_config = {"from_attributes": True}


class ConsentGrantResponse(BaseModel):
    """Respuesta al otorgar consentimiento."""

    message: str
    records: list[ConsentRecordResponse]


class ConsentRevokeResponse(BaseModel):
    """Respuesta al revocar consentimiento."""

    message: str
    consent_type: ConsentGrantType
    data_deletion_scheduled: bool = False
