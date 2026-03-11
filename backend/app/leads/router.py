"""
Vocari Backend - Router de Leads (captura de prospectos).
"""

from fastapi import APIRouter
from pydantic import BaseModel
import structlog

logger = structlog.get_logger()

router = APIRouter()


class LeadCreate(BaseModel):
    email: str
    whatsapp: str | None = None
    interes: str = "carreras"
    holland_code: str | None = None
    source: str = "web"


@router.post("/leads")
async def create_lead(lead: LeadCreate) -> dict:
    """Captura un lead desde el sitio web."""
    logger.info(
        "Lead capturado",
        email=lead.email,
        whatsapp=lead.whatsapp,
        interes=lead.interes,
        holland_code=lead.holland_code,
        source=lead.source,
    )
    
    # En una implementación real, guardarías esto en la base de datos
    # Por ahora solo logueamos y retornamos éxito
    
    return {
        "success": True,
        "message": "Lead capturado correctamente"
    }
