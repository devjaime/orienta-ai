"""
Vocari Backend - Servicio de Reports.

Genera reportes PDF comprehensivos del perfil vocacional del estudiante.
"""

import uuid
from datetime import datetime, timezone
from io import BytesIO

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import NotFoundError

logger = structlog.get_logger()


async def generate_text_report(
    db: AsyncSession,
    student_id: uuid.UUID,
    institution_name: str,
    student_name: str,
    student_email: str,
) -> str:
    """Genera un reporte en formato texto (base para PDF)."""
    
    lines = [
        "=" * 60,
        "VOCARI - REPORTE VOCACIONAL COMPREHENSIVO",
        "=" * 60,
        "",
        f"Estudiante: {student_name}",
        f"Email: {student_email}",
        f"Institucion: {institution_name}",
        f"Fecha: {datetime.now(timezone.utc).strftime('%d/%m/%Y')}",
        "",
        "=" * 60,
        "PERFIL VOCACIONAL",
        "=" * 60,
        "",
        "Este reporte contiene un analisis comprehensivo de tu perfil",
        "vocacional, incluyendo resultados de tests, recomendaciones de",
        "carreras, y tu progreso en el programa de orientacion.",
        "",
        "Para ver el reporte completo en formato PDF, por favor contacta",
        "a tu orientador o administrador.",
        "",
        "=" * 60,
        "INFORMACION GENERAL",
        "=" * 60,
        "",
        "- Perfil vocacional en desarrollo",
        "- Completar tests de habilidades",
        "- Revisar recomendaciones de carreras",
        "- Agendar sesiones con orientador",
        "",
        "=" * 60,
        "CONTACTAR ORIENTADOR",
        "=" * 60,
        "",
        "Si tienes preguntas sobre tu reporte o quieres discutir tus",
        "resultados, agenda una sesion con tu orientador.",
        "",
        "=" * 60,
        f"Reporte generado el {datetime.now(timezone.utc).isoformat()}",
        "Vocari - Plataforma de Orientacion Vocacional",
        "=" * 60,
    ]

    return "\n".join(lines)


async def create_report(
    db: AsyncSession,
    student_id: uuid.UUID,
    report_type: str = "comprehensive",
) -> dict:
    """Crea un reporte para el estudiante."""
    from app.auth.models import User
    from app.institutions.models import Institution

    result = await db.execute(select(User).where(User.id == student_id))
    student = result.scalar_one_or_none()
    
    if not student:
        raise NotFoundError("Estudiante no encontrado")

    institution_name = "Institucion"
    if student.institution_id:
        inst_result = await db.execute(
            select(Institution).where(Institution.id == student.institution_id)
        )
        institution = inst_result.scalar_one_or_none()
        if institution:
            institution_name = institution.name

    report_content = await generate_text_report(
        db=db,
        student_id=student_id,
        institution_name=institution_name,
        student_name=student.full_name,
        student_email=student.email,
    )

    report_data = {
        "id": uuid.uuid4(),
        "student_id": student_id,
        "report_type": report_type,
        "file_url": None,
        "status": "completed",
        "content": report_content,
        "created_at": datetime.now(timezone.utc),
    }

    logger.info("Reporte creado", student_id=str(student_id), report_type=report_type)
    return report_data


async def get_student_reports(
    db: AsyncSession,
    student_id: uuid.UUID,
    page: int = 1,
    per_page: int = 20,
) -> tuple[list[dict], int]:
    """Obtiene los reportes de un estudiante."""
    reports = []
    total = 0
    
    return reports, total
