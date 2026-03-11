"""
Vocari Backend - Router de Reports.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.middleware import get_current_user
from app.auth.models import User
from app.common.database import get_async_session
from app.common.exceptions import NotFoundError
from app.reports import schemas as report_schemas
from app.reports import service

router = APIRouter()


@router.post("/generate", response_model=dict)
async def generate_report(
    data: report_schemas.ReportCreate,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Genera un reporte vocacional para el estudiante actual."""
    report = await service.create_report(
        db=db,
        student_id=current_user.id,
        report_type=data.report_type,
    )
    return {
        "id": report["id"],
        "student_id": report["student_id"],
        "report_type": report["report_type"],
        "share_token": report["share_token"],
        "status": report["status"],
        "share_url": f"/informe/{report['share_token']}",
        "report_data": report["report_data"],
        "created_at": report["created_at"],
    }


@router.get("/my", response_model=list[dict])
async def get_my_reports(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
) -> list[dict]:
    """Obtiene los reportes del estudiante actual."""
    reports, _ = await service.get_student_reports(
        db=db, student_id=current_user.id, page=page, per_page=per_page
    )
    return reports


@router.get("/public/{share_token}", response_model=dict)
async def get_public_report(
    share_token: str,
    db: AsyncSession = Depends(get_async_session),
) -> dict:
    """
    Endpoint público para ver un reporte compartido por link.
    No requiere autenticación.
    """
    return await service.get_report_by_token(db, share_token)
