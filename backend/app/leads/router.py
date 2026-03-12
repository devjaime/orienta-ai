"""
Vocari Backend - Router de Leads (captura de prospectos).
"""

# ruff: noqa: B008

import secrets
import uuid
from datetime import UTC, datetime

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

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


class LeadTestSubmitRequest(BaseModel):
    lead_id: uuid.UUID | None = None
    nombre: str
    email: str
    source: str = "test_gratis"
    holland_code: str | None = None
    test_answers: dict = Field(default_factory=dict)
    metadata: dict | None = None


class LeadSurveyRequest(BaseModel):
    survey_response: dict = Field(default_factory=dict)
    metadata: dict | None = None


class LeadAIReportRequest(BaseModel):
    lead_id: uuid.UUID | None = None
    nombre: str
    holland_code: str | None = None
    recommendations: list[dict] = Field(default_factory=list)
    survey_response: dict | None = None


def _extract_clarity_score(survey_response: dict | None) -> float | None:
    if not survey_response:
        return None
    value = survey_response.get("claridad_resultado")
    if isinstance(value, (int, float)):
        score = float(value)
        if 1 <= score <= 5:
            return score
    return None


def _merge_metadata(existing: dict, incoming: dict | None) -> dict:
    if not incoming:
        return existing
    merged = dict(existing)
    merged.update(incoming)
    return merged


async def _get_lead_by_id(db: AsyncSession, lead_id: uuid.UUID) -> Lead:
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead_row = result.scalar_one_or_none()
    if lead_row is None:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    return lead_row


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
            clarity_score=_extract_clarity_score(lead.survey_response),
            metadata_json=lead.metadata or {},
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
            lead_row.clarity_score = _extract_clarity_score(lead.survey_response)
        if lead.metadata is not None:
            lead_row.metadata_json = _merge_metadata(lead_row.metadata_json or {}, lead.metadata)

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


@router.post("/tests/submit")
async def submit_test_for_lead(
    payload: LeadTestSubmitRequest,
    db: AsyncSession = Depends(get_async_session),
) -> dict:
    """
    Guarda respuestas del test gratuito.
    Endpoint de conveniencia para el frontend de app.vocari.cl.
    """
    lead_data = LeadCreate(
        lead_id=payload.lead_id,
        nombre=payload.nombre,
        email=payload.email,
        source=payload.source,
        interes="test_vocacional",
        holland_code=payload.holland_code,
        test_answers=payload.test_answers,
        metadata=payload.metadata or {"step": "test_submitted"},
    )
    return await create_lead(lead_data, db)


@router.post("/leads/{lead_id}/survey")
async def submit_lead_survey(
    lead_id: uuid.UUID,
    payload: LeadSurveyRequest,
    db: AsyncSession = Depends(get_async_session),
) -> dict:
    """Guarda encuesta final vinculada al lead."""
    lead_row = await _get_lead_by_id(db, lead_id)
    lead_row.survey_response = payload.survey_response or {}
    lead_row.clarity_score = _extract_clarity_score(payload.survey_response)
    lead_row.metadata_json = _merge_metadata(
        lead_row.metadata_json or {},
        payload.metadata or {"step": "survey_submitted"},
    )
    await db.flush()

    return {
        "success": True,
        "lead_id": str(lead_row.id),
        "share_token": lead_row.share_token,
        "public_url": f"/informe-test/{lead_row.share_token}",
        "message": "Encuesta guardada correctamente",
    }


def _fallback_ai_report(nombre: str, holland_code: str | None, recommendations: list[dict]) -> str:
    top_career = recommendations[0]["career"]["name"] if recommendations else "una carrera de tu perfil"
    return (
        f"{nombre}, tu perfil vocacional {holland_code or 'en exploración'} muestra intereses definidos.\n\n"
        f"Tu mejor ajuste actual es {top_career}. Te recomendamos priorizar carreras con alta empleabilidad,"
        " revisar su malla curricular y hablar con un orientador para validar tu decisión.\n\n"
        "Próximos pasos:\n"
        "1. Compara al menos 3 carreras por empleabilidad e ingresos.\n"
        "2. Revisa campos laborales reales en Chile.\n"
        "3. Define un plan de preparación académica para postulación."
    )


@router.post("/leads/ai-report")
async def generate_lead_ai_report(
    payload: LeadAIReportRequest,
    db: AsyncSession = Depends(get_async_session),
) -> dict:
    """Genera informe IA para el lead y lo deja persistido para revisión."""
    report_text = ""
    generated_at = datetime.now(UTC)

    try:
        from app.ai_engine.openrouter_client import get_openrouter_client

        client = get_openrouter_client()

        if not client.api_key:
            report_text = _fallback_ai_report(
                payload.nombre,
                payload.holland_code,
                payload.recommendations,
            )
        else:
            prompt = (
                "Eres orientador vocacional en Chile.\n"
                f"Nombre: {payload.nombre}\n"
                f"Código Holland: {payload.holland_code or 'No disponible'}\n"
                f"Recomendaciones: {payload.recommendations[:5]}\n"
                f"Encuesta final: {payload.survey_response or {}}\n\n"
                "Escribe un informe breve en español, personalizado por nombre, con:\n"
                "1) interpretación del perfil,\n"
                "2) análisis de 3 recomendaciones principales,\n"
                "3) próximos pasos accionables."
            )

            response = await client.chat(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.6,
                max_tokens=1200,
            )
            report_text = response.content
    except Exception as error:
        logger.warning("Fallo generación IA de lead", error=str(error))
        report_text = _fallback_ai_report(
            payload.nombre,
            payload.holland_code,
            payload.recommendations,
        )

    if payload.lead_id:
        lead_row = await _get_lead_by_id(db, payload.lead_id)
        if lead_row:
            metadata = lead_row.metadata_json or {}
            metadata["ai_report_text"] = report_text
            metadata["ai_report_generated_at"] = generated_at.isoformat()
            lead_row.metadata_json = metadata
            lead_row.ai_report_text = report_text
            lead_row.ai_report_generated_at = generated_at
            await db.flush()

    return {
        "success": True,
        "generated_for": payload.nombre,
        "report_text": report_text,
    }


@router.get("/informe/{lead_id}")
async def get_lead_report_by_id(
    lead_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_session),
) -> dict:
    """Retorna informe consolidado de un lead por ID."""
    lead_row = await _get_lead_by_id(db, lead_id)

    return {
        "success": True,
        "id": str(lead_row.id),
        "share_token": lead_row.share_token,
        "nombre": lead_row.nombre,
        "email": lead_row.email,
        "source": lead_row.source,
        "interes": lead_row.interes,
        "holland_code": lead_row.holland_code,
        "clarity_score": lead_row.clarity_score,
        "test_answers": lead_row.test_answers,
        "survey_response": lead_row.survey_response,
        "ai_report_text": lead_row.ai_report_text,
        "ai_report_generated_at": (
            lead_row.ai_report_generated_at.isoformat()
            if lead_row.ai_report_generated_at
            else None
        ),
        "metadata": lead_row.metadata_json,
        "created_at": lead_row.created_at.isoformat() if lead_row.created_at else None,
        "updated_at": lead_row.updated_at.isoformat() if lead_row.updated_at else None,
    }


@router.get("/leads/review/all")
@router.get("/revision/leads")
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
                "clarity_score": row.clarity_score,
                "test_answers": row.test_answers,
                "survey_response": row.survey_response,
                "ai_report_text": row.ai_report_text,
                "ai_report_generated_at": (
                    row.ai_report_generated_at.isoformat()
                    if row.ai_report_generated_at
                    else None
                ),
                "metadata": row.metadata_json,
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
        "clarity_score": lead_row.clarity_score,
        "test_answers": lead_row.test_answers,
        "survey_response": lead_row.survey_response,
        "ai_report_text": lead_row.ai_report_text,
        "ai_report_generated_at": (
            lead_row.ai_report_generated_at.isoformat()
            if lead_row.ai_report_generated_at
            else None
        ),
        "metadata": lead_row.metadata_json,
        "created_at": lead_row.created_at.isoformat() if lead_row.created_at else None,
        "updated_at": lead_row.updated_at.isoformat() if lead_row.updated_at else None,
    }
