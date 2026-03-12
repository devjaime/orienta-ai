"""Router admin para métricas institucionales."""

# ruff: noqa: B008

from fastapi import APIRouter, Depends, Query

from app.admin.schemas import AdminInsightsResponse, AdminMetricsResponse
from app.admin.service import get_admin_insights, get_admin_metrics
from app.auth.models import User, UserRole
from app.auth.permissions import require_roles
from app.common.database import get_async_session

router = APIRouter()


@router.get("/metrics", response_model=AdminMetricsResponse)
async def admin_metrics(
    curso: str | None = Query(default=None),
    periodo: str | None = Query(default=None, description="Formato YYYY-MM"),
    user: User = Depends(require_roles(UserRole.ADMIN_COLEGIO, UserRole.SUPER_ADMIN)),
    db=Depends(get_async_session),
) -> AdminMetricsResponse:
    """Métricas agregadas para admin de colegio."""
    if not user.institution_id:
        return AdminMetricsResponse(
            filters={"curso": curso, "periodo": periodo, "period_start": None, "period_end": None},
            summary={
                "total_students": 0,
                "students_with_test": 0,
                "completion_rate": 0.0,
                "tests_in_period": 0,
                "average_clarity": None,
                "indecision_index": None,
            },
        )

    payload = await get_admin_metrics(
        db=db,
        institution_id=user.institution_id,
        curso=curso,
        periodo=periodo,
    )
    return AdminMetricsResponse.model_validate(payload)


@router.get("/insights", response_model=AdminInsightsResponse)
async def admin_insights(
    curso: str | None = Query(default=None),
    periodo: str | None = Query(default=None, description="Formato YYYY-MM"),
    user: User = Depends(require_roles(UserRole.ADMIN_COLEGIO, UserRole.SUPER_ADMIN)),
    db=Depends(get_async_session),
) -> AdminInsightsResponse:
    """Insights institucionales por cohorte y alertas de indecisión."""
    if not user.institution_id:
        return AdminInsightsResponse(
            filters={"curso": curso, "periodo": periodo, "period_start": None, "period_end": None},
            summary={
                "total_students": 0,
                "students_with_clarity": 0,
                "students_with_high_indecision": 0,
                "high_indecision_rate": 0.0,
            },
        )

    payload = await get_admin_insights(
        db=db,
        institution_id=user.institution_id,
        curso=curso,
        periodo=periodo,
    )
    return AdminInsightsResponse.model_validate(payload)
