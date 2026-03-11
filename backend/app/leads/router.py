"""
Vocari Backend - Router de Leads (captura de prospectos).
"""

import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.database import get_async_session
from app.leads.models import Lead

logger = structlog.get_logger()

router = APIRouter()


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
        "message": "Lead capturado correctamente",
    }
