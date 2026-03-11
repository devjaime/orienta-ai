"""
Vocari Backend - Router de Leads (captura de prospectos).
"""

import uuid
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.security import HTTPBasic, HTTPBasicCredentials

from app.common.database import get_async_session
from app.leads.models import Lead

logger = structlog.get_logger()

router = APIRouter()
security = HTTPBasic()

REVIEW_USERNAME = "mvp-admin"
REVIEW_PASSWORD = "vocari-mvp-2026"


class LeadCreate(BaseModel):
    lead_id: uuid.UUID | None = None
    nombre: str
    email: str
    whatsapp: str | None = None
    interes: str = "carreras"
    holland_code: str | None = None
    source: str = "web"
    test_answers: dict | None = None
    survey_response: dict | None = None
    metadata: dict | None = None


def require_review_auth(
    credentials: HTTPBasicCredentials = Depends(security),
) -> None:
    """Autenticación fija para revisión interna del MVP."""
    valid_user = secrets.compare_digest(credentials.username, REVIEW_USERNAME)
    valid_pass = secrets.compare_digest(credentials.password, REVIEW_PASSWORD)

    if not (valid_user and valid_pass):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
            headers={"WWW-Authenticate": "Basic"},
        )


@router.post("/leads")
async def create_lead(
    lead: LeadCreate,
    db: AsyncSession = Depends(get_async_session),
) -> dict:
    """Crea o actualiza un lead desde el sitio web."""
    lead_row: Lead | None = None

    if lead.lead_id:
        result = await db.execute(select(Lead).where(Lead.id == lead.lead_id))
        lead_row = result.scalar_one_or_none()

    if lead_row is None:
        lead_row = Lead(
            nombre=lead.nombre.strip(),
            email=lead.email.strip().lower(),
            whatsapp=lead.whatsapp,
            interes=lead.interes,
            holland_code=lead.holland_code,
            source=lead.source,
            share_token=secrets.token_urlsafe(18),
            test_answers=lead.test_answers or {},
            survey_response=lead.survey_response or {},
            metadata=lead.metadata or {},
        )
        db.add(lead_row)
    else:
        lead_row.nombre = lead.nombre.strip()
        lead_row.email = lead.email.strip().lower()
        lead_row.whatsapp = lead.whatsapp
        lead_row.interes = lead.interes
        lead_row.holland_code = lead.holland_code
        lead_row.source = lead.source

        if lead.test_answers is not None:
            lead_row.test_answers = lead.test_answers
        if lead.survey_response is not None:
            lead_row.survey_response = lead.survey_response
        if lead.metadata is not None:
            lead_row.metadata = lead.metadata

    await db.flush()

    logger.info(
        "Lead capturado",
        lead_id=str(lead_row.id),
        nombre=lead.nombre,
        email=lead.email,
        whatsapp=lead.whatsapp,
        interes=lead.interes,
        holland_code=lead.holland_code,
        source=lead.source,
        test_answers_keys=list((lead.test_answers or {}).keys()),
        survey_response_keys=list((lead.survey_response or {}).keys()),
        metadata=lead.metadata,
    )

    return {
        "success": True,
        "lead_id": str(lead_row.id),
        "share_token": lead_row.share_token,
        "public_url": f"/informe-test/{lead_row.share_token}",
        "message": "Lead capturado correctamente",
    }


@router.get("/leads/review/all")
async def get_all_leads_for_review(
    _: None = Depends(require_review_auth),
    db: AsyncSession = Depends(get_async_session),
) -> dict:
    """Lista completa de leads para revisión interna del MVP."""
    result = await db.execute(select(Lead).order_by(Lead.created_at.desc()))
    rows = result.scalars().all()

    return {
        "success": True,
        "count": len(rows),
        "items": [
            {
                "id": str(row.id),
                "nombre": row.nombre,
                "email": row.email,
                "source": row.source,
                "interes": row.interes,
                "holland_code": row.holland_code,
                "test_answers": row.test_answers,
                "survey_response": row.survey_response,
                "metadata": row.metadata,
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "updated_at": row.updated_at.isoformat() if row.updated_at else None,
            }
            for row in rows
        ],
    }


@router.get("/leads/public/{share_token}")
async def get_public_lead_report(
    share_token: str,
    db: AsyncSession = Depends(get_async_session),
) -> dict:
    """Obtiene un resumen público de la información guardada del lead."""
    result = await db.execute(select(Lead).where(Lead.share_token == share_token))
    lead_row = result.scalar_one_or_none()

    if lead_row is None:
        return {
            "success": False,
            "message": "Informe no encontrado",
        }

    return {
        "success": True,
        "id": str(lead_row.id),
        "share_token": lead_row.share_token,
        "nombre": lead_row.nombre,
        "email": lead_row.email,
        "source": lead_row.source,
        "interes": lead_row.interes,
        "holland_code": lead_row.holland_code,
        "test_answers": lead_row.test_answers,
        "survey_response": lead_row.survey_response,
        "metadata": lead_row.metadata,
        "created_at": lead_row.created_at.isoformat() if lead_row.created_at else None,
        "updated_at": lead_row.updated_at.isoformat() if lead_row.updated_at else None,
    }
