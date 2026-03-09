"""
Vocari Backend - Servicio de Dashboards.

Funciones de agregacion para los 5 dashboards por rol.
Cada funcion realiza consultas optimizadas sobre los modelos existentes.
"""

import uuid
from datetime import datetime, timedelta, timezone

import structlog
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import ParentStudentLink, User, UserRole
from app.careers.models import Career
from app.dashboards.schemas import (
    AdminDashboardResponse,
    AIAnalysisSummary,
    CareerSummary,
    ChildDashboardInfo,
    EngagementTrendItem,
    InstitutionOverview,
    InstitutionStats,
    OrientadorDashboardResponse,
    OrientadorWorkloadItem,
    ParentDashboardResponse,
    PlatformStats,
    ProfileSummary,
    SessionSummary,
    StudentAlert,
    StudentDashboardResponse,
    SuperAdminDashboardResponse,
    TestResultSummary,
    WorkloadStats,
)
from app.institutions.models import Institution
from app.profiles.models import StudentLongitudinalProfile
from app.sessions.models import Session, SessionAIAnalysis, SessionStatus
from app.tests_vocational.models import TestResult

logger = structlog.get_logger()


# --- Helpers ---


def _now() -> datetime:
    """Retorna la hora actual con timezone UTC."""
    return datetime.now(timezone.utc)


def _start_of_month() -> datetime:
    """Retorna el inicio del mes actual."""
    now = _now()
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _start_of_week() -> datetime:
    """Retorna el inicio de la semana actual (lunes)."""
    now = _now()
    days_since_monday = now.weekday()
    return (now - timedelta(days=days_since_monday)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )


# --- Dashboard Estudiante ---


async def get_student_dashboard(
    db: AsyncSession,
    user: User,
) -> StudentDashboardResponse:
    """Dashboard del estudiante: sesiones, tests, perfil, carreras."""
    student_id = user.id
    now = _now()

    # Proximas sesiones (scheduled, futuras)
    upcoming_q = (
        select(Session)
        .where(
            and_(
                Session.student_id == student_id,
                Session.status == SessionStatus.SCHEDULED,
                Session.scheduled_at >= now,
            )
        )
        .order_by(Session.scheduled_at.asc())
        .limit(5)
    )
    upcoming_result = await db.execute(upcoming_q)
    upcoming_sessions = [
        SessionSummary.model_validate(s) for s in upcoming_result.scalars().all()
    ]

    # Resultados recientes de tests (ultimos 5)
    recent_tests_q = (
        select(TestResult)
        .where(TestResult.user_id == student_id)
        .order_by(TestResult.created_at.desc())
        .limit(5)
    )
    recent_tests_result = await db.execute(recent_tests_q)
    recent_results = [
        TestResultSummary.model_validate(t) for t in recent_tests_result.scalars().all()
    ]

    # Total de tests completados
    total_tests_q = select(func.count()).select_from(TestResult).where(
        TestResult.user_id == student_id
    )
    total_tests = (await db.execute(total_tests_q)).scalar() or 0

    # Total de sesiones
    total_sessions_q = select(func.count()).select_from(Session).where(
        Session.student_id == student_id
    )
    total_sessions = (await db.execute(total_sessions_q)).scalar() or 0

    # Perfil longitudinal
    profile_q = select(StudentLongitudinalProfile).where(
        StudentLongitudinalProfile.student_id == student_id
    )
    profile_result = await db.execute(profile_q)
    profile = profile_result.scalar_one_or_none()
    profile_summary = None
    if profile:
        profile_summary = ProfileSummary(
            student_id=profile.student_id,
            skills=profile.skills or {},
            interests=profile.interests or {},
            happiness_indicators=profile.happiness_indicators or {},
            riasec_history=profile.riasec_history or [],
            last_updated=profile.last_updated,
        )

    # Carreras recomendadas (top 5 por empleabilidad)
    careers_q = (
        select(Career)
        .where(Career.is_active.is_(True))
        .order_by(Career.employability.desc())
        .limit(5)
    )
    careers_result = await db.execute(careers_q)
    recommended_careers = [
        CareerSummary.model_validate(c) for c in careers_result.scalars().all()
    ]

    logger.info("Dashboard estudiante generado", student_id=str(student_id))

    return StudentDashboardResponse(
        upcoming_sessions=upcoming_sessions,
        pending_tests=0,  # No hay tests pendientes como modelo separado aun
        recent_results=recent_results,
        profile_summary=profile_summary,
        recommended_careers=recommended_careers,
        total_sessions=total_sessions,
        total_tests=total_tests,
    )


# --- Dashboard Orientador ---


async def get_orientador_dashboard(
    db: AsyncSession,
    user: User,
) -> OrientadorDashboardResponse:
    """Dashboard del orientador: sesiones, estudiantes, carga, alertas."""
    orientador_id = user.id
    now = _now()
    start_of_month = _start_of_month()
    start_of_week = _start_of_week()

    # Proximas sesiones
    upcoming_q = (
        select(Session)
        .where(
            and_(
                Session.orientador_id == orientador_id,
                Session.status == SessionStatus.SCHEDULED,
                Session.scheduled_at >= now,
            )
        )
        .order_by(Session.scheduled_at.asc())
        .limit(10)
    )
    upcoming_result = await db.execute(upcoming_q)
    upcoming_sessions = [
        SessionSummary.model_validate(s) for s in upcoming_result.scalars().all()
    ]

    # Estudiantes asignados (con sesiones activas, no canceladas)
    students_q = (
        select(func.count(func.distinct(Session.student_id)))
        .select_from(Session)
        .where(
            and_(
                Session.orientador_id == orientador_id,
                Session.status != SessionStatus.CANCELLED,
            )
        )
    )
    students_assigned = (await db.execute(students_q)).scalar() or 0

    # Analisis IA recientes (ultimos 5)
    analyses_q = (
        select(SessionAIAnalysis)
        .join(Session, Session.id == SessionAIAnalysis.session_id)
        .where(Session.orientador_id == orientador_id)
        .order_by(SessionAIAnalysis.created_at.desc())
        .limit(5)
    )
    analyses_result = await db.execute(analyses_q)
    recent_analyses = [
        AIAnalysisSummary.model_validate(a) for a in analyses_result.scalars().all()
    ]

    # Analisis pendientes de revision
    pending_q = (
        select(func.count())
        .select_from(SessionAIAnalysis)
        .join(Session, Session.id == SessionAIAnalysis.session_id)
        .where(
            and_(
                Session.orientador_id == orientador_id,
                SessionAIAnalysis.reviewed_by_orientador.is_(False),
            )
        )
    )
    pending_reviews = (await db.execute(pending_q)).scalar() or 0

    # Estadisticas de carga
    week_sessions_q = (
        select(func.count())
        .select_from(Session)
        .where(
            and_(
                Session.orientador_id == orientador_id,
                Session.scheduled_at >= start_of_week,
                Session.status != SessionStatus.CANCELLED,
            )
        )
    )
    week_count = (await db.execute(week_sessions_q)).scalar() or 0

    month_sessions_q = (
        select(func.count())
        .select_from(Session)
        .where(
            and_(
                Session.orientador_id == orientador_id,
                Session.scheduled_at >= start_of_month,
                Session.status != SessionStatus.CANCELLED,
            )
        )
    )
    month_count = (await db.execute(month_sessions_q)).scalar() or 0

    workload = WorkloadStats(
        this_week=week_count,
        this_month=month_count,
        capacity=40,
    )

    # Alertas: estudiantes sin actividad reciente (sin sesiones en 30 dias)
    alerts: list[StudentAlert] = []
    thirty_days_ago = now - timedelta(days=30)

    # Obtener estudiantes asignados que no tienen sesiones recientes
    active_students_q = (
        select(Session.student_id)
        .where(
            and_(
                Session.orientador_id == orientador_id,
                Session.status != SessionStatus.CANCELLED,
            )
        )
        .distinct()
    )
    active_students_result = await db.execute(active_students_q)
    all_student_ids = [row[0] for row in active_students_result.all()]

    if all_student_ids:
        recent_activity_q = (
            select(Session.student_id)
            .where(
                and_(
                    Session.orientador_id == orientador_id,
                    Session.scheduled_at >= thirty_days_ago,
                    Session.student_id.in_(all_student_ids),
                )
            )
            .distinct()
        )
        recent_activity_result = await db.execute(recent_activity_q)
        recently_active_ids = {row[0] for row in recent_activity_result.all()}

        inactive_ids = set(all_student_ids) - recently_active_ids
        if inactive_ids:
            inactive_users_q = select(User).where(User.id.in_(list(inactive_ids)[:5]))
            inactive_users_result = await db.execute(inactive_users_q)
            for u in inactive_users_result.scalars().all():
                alerts.append(
                    StudentAlert(
                        student_id=u.id,
                        student_name=u.name,
                        alert_type="inactividad",
                        message=f"{u.name} no tiene sesiones en los ultimos 30 dias",
                    )
                )

    logger.info("Dashboard orientador generado", orientador_id=str(orientador_id))

    return OrientadorDashboardResponse(
        upcoming_sessions=upcoming_sessions,
        students_assigned=students_assigned,
        recent_analyses=recent_analyses,
        workload_stats=workload,
        pending_reviews=pending_reviews,
        alerts=alerts,
    )


# --- Dashboard Apoderado ---


async def get_parent_dashboard(
    db: AsyncSession,
    user: User,
) -> ParentDashboardResponse:
    """Dashboard del apoderado: informacion de hijos vinculados."""
    parent_id = user.id
    now = _now()

    # Obtener vinculos padre-hijo verificados
    links_q = (
        select(ParentStudentLink)
        .where(
            and_(
                ParentStudentLink.parent_id == parent_id,
                ParentStudentLink.verified.is_(True),
            )
        )
    )
    links_result = await db.execute(links_q)
    links = links_result.scalars().all()

    children: list[ChildDashboardInfo] = []

    for link in links:
        student_id = link.student_id

        # Datos del estudiante
        student_q = select(User).where(User.id == student_id)
        student_result = await db.execute(student_q)
        student = student_result.scalar_one_or_none()
        if not student:
            continue

        # Perfil longitudinal
        profile_q = select(StudentLongitudinalProfile).where(
            StudentLongitudinalProfile.student_id == student_id
        )
        profile_result = await db.execute(profile_q)
        profile = profile_result.scalar_one_or_none()
        profile_summary = None
        happiness_indicator = None
        if profile:
            profile_summary = ProfileSummary(
                student_id=profile.student_id,
                skills=profile.skills or {},
                interests=profile.interests or {},
                happiness_indicators=profile.happiness_indicators or {},
                riasec_history=profile.riasec_history or [],
                last_updated=profile.last_updated,
            )
            # Extraer indicador de felicidad si existe
            happiness_data = profile.happiness_indicators or {}
            if isinstance(happiness_data, dict) and "overall" in happiness_data:
                happiness_indicator = float(happiness_data["overall"])

        # Sesiones recientes (ultimas 5 completadas)
        recent_sessions_q = (
            select(Session)
            .where(
                and_(
                    Session.student_id == student_id,
                    Session.status == SessionStatus.COMPLETED,
                )
            )
            .order_by(Session.scheduled_at.desc())
            .limit(5)
        )
        recent_sessions_result = await db.execute(recent_sessions_q)
        recent_sessions = [
            SessionSummary.model_validate(s)
            for s in recent_sessions_result.scalars().all()
        ]

        # Proximas sesiones
        upcoming_q = (
            select(Session)
            .where(
                and_(
                    Session.student_id == student_id,
                    Session.status == SessionStatus.SCHEDULED,
                    Session.scheduled_at >= now,
                )
            )
            .order_by(Session.scheduled_at.asc())
            .limit(3)
        )
        upcoming_result = await db.execute(upcoming_q)
        upcoming_sessions = [
            SessionSummary.model_validate(s) for s in upcoming_result.scalars().all()
        ]

        # Tests recientes
        recent_tests_q = (
            select(TestResult)
            .where(TestResult.user_id == student_id)
            .order_by(TestResult.created_at.desc())
            .limit(5)
        )
        recent_tests_result = await db.execute(recent_tests_q)
        recent_tests = [
            TestResultSummary.model_validate(t)
            for t in recent_tests_result.scalars().all()
        ]

        children.append(
            ChildDashboardInfo(
                student_id=student.id,
                student_name=student.name,
                student_email=student.email,
                profile_summary=profile_summary,
                recent_sessions=recent_sessions,
                recent_tests=recent_tests,
                happiness_indicator=happiness_indicator,
                upcoming_sessions=upcoming_sessions,
            )
        )

    logger.info(
        "Dashboard apoderado generado",
        parent_id=str(parent_id),
        children_count=len(children),
    )

    return ParentDashboardResponse(children=children)


# --- Dashboard Admin Colegio ---


async def get_admin_dashboard(
    db: AsyncSession,
    user: User,
) -> AdminDashboardResponse:
    """Dashboard del admin de colegio: estadisticas institucionales."""
    institution_id = user.institution_id
    if not institution_id:
        return AdminDashboardResponse()

    start_of_month = _start_of_month()

    # Total estudiantes de la institucion
    total_students_q = (
        select(func.count())
        .select_from(User)
        .where(
            and_(
                User.institution_id == institution_id,
                User.role == UserRole.ESTUDIANTE,
            )
        )
    )
    total_students = (await db.execute(total_students_q)).scalar() or 0

    # Estudiantes activos (con sesion o test este mes)
    active_session_students_q = (
        select(func.count(func.distinct(Session.student_id)))
        .select_from(Session)
        .where(
            and_(
                Session.institution_id == institution_id,
                Session.scheduled_at >= start_of_month,
            )
        )
    )
    active_from_sessions = (await db.execute(active_session_students_q)).scalar() or 0

    active_test_students_q = (
        select(func.count(func.distinct(TestResult.user_id)))
        .select_from(TestResult)
        .where(
            and_(
                TestResult.institution_id == institution_id,
                TestResult.created_at >= start_of_month,
            )
        )
    )
    active_from_tests = (await db.execute(active_test_students_q)).scalar() or 0

    # Aproximacion: max de ambos (estudiantes unicos con actividad)
    active_students = max(active_from_sessions, active_from_tests)

    # Sesiones este mes
    sessions_month_q = (
        select(func.count())
        .select_from(Session)
        .where(
            and_(
                Session.institution_id == institution_id,
                Session.scheduled_at >= start_of_month,
            )
        )
    )
    sessions_this_month = (await db.execute(sessions_month_q)).scalar() or 0

    # Tests completados este mes
    tests_month_q = (
        select(func.count())
        .select_from(TestResult)
        .where(
            and_(
                TestResult.institution_id == institution_id,
                TestResult.created_at >= start_of_month,
            )
        )
    )
    tests_this_month = (await db.execute(tests_month_q)).scalar() or 0

    # Engagement promedio (porcentaje de estudiantes activos)
    avg_engagement = (active_students / total_students * 100) if total_students > 0 else 0.0

    institution_stats = InstitutionStats(
        total_students=total_students,
        active_students=active_students,
        sessions_this_month=sessions_this_month,
        tests_completed_this_month=tests_this_month,
        average_engagement=round(avg_engagement, 1),
    )

    # Estadisticas por orientador
    orientadores_q = select(User).where(
        and_(
            User.institution_id == institution_id,
            User.role == UserRole.ORIENTADOR,
            User.is_active.is_(True),
        )
    )
    orientadores_result = await db.execute(orientadores_q)
    orientadores = orientadores_result.scalars().all()

    orientador_stats: list[OrientadorWorkloadItem] = []
    for orientador in orientadores:
        # Estudiantes asignados
        o_students_q = (
            select(func.count(func.distinct(Session.student_id)))
            .select_from(Session)
            .where(
                and_(
                    Session.orientador_id == orientador.id,
                    Session.status != SessionStatus.CANCELLED,
                )
            )
        )
        o_students = (await db.execute(o_students_q)).scalar() or 0

        # Sesiones completadas
        o_completed_q = (
            select(func.count())
            .select_from(Session)
            .where(
                and_(
                    Session.orientador_id == orientador.id,
                    Session.status == SessionStatus.COMPLETED,
                )
            )
        )
        o_completed = (await db.execute(o_completed_q)).scalar() or 0

        # Carga como porcentaje (asumimos capacidad de 40 sesiones/mes)
        capacity = 40
        month_sessions_q = (
            select(func.count())
            .select_from(Session)
            .where(
                and_(
                    Session.orientador_id == orientador.id,
                    Session.scheduled_at >= start_of_month,
                    Session.status != SessionStatus.CANCELLED,
                )
            )
        )
        month_sessions = (await db.execute(month_sessions_q)).scalar() or 0
        workload_pct = round((month_sessions / capacity) * 100, 1) if capacity > 0 else 0.0

        orientador_stats.append(
            OrientadorWorkloadItem(
                orientador_id=orientador.id,
                orientador_name=orientador.name,
                students_assigned=o_students,
                sessions_completed=o_completed,
                workload_percentage=workload_pct,
            )
        )

    # Top carreras recomendadas (por empleabilidad)
    top_careers_q = (
        select(Career)
        .where(Career.is_active.is_(True))
        .order_by(Career.employability.desc())
        .limit(10)
    )
    top_careers_result = await db.execute(top_careers_q)
    top_careers = [
        CareerSummary.model_validate(c) for c in top_careers_result.scalars().all()
    ]

    # Tendencia de engagement (ultimas 4 semanas)
    engagement_trend: list[EngagementTrendItem] = []
    for weeks_ago in range(3, -1, -1):
        week_start = _now() - timedelta(weeks=weeks_ago + 1)
        week_end = _now() - timedelta(weeks=weeks_ago)
        week_label = week_start.strftime("%d/%m")

        week_active_q = (
            select(func.count(func.distinct(Session.student_id)))
            .select_from(Session)
            .where(
                and_(
                    Session.institution_id == institution_id,
                    Session.scheduled_at >= week_start,
                    Session.scheduled_at < week_end,
                )
            )
        )
        week_active = (await db.execute(week_active_q)).scalar() or 0
        engagement_trend.append(
            EngagementTrendItem(week=week_label, active_students=week_active)
        )

    logger.info(
        "Dashboard admin generado",
        institution_id=str(institution_id),
        total_students=total_students,
    )

    return AdminDashboardResponse(
        institution_stats=institution_stats,
        orientador_stats=orientador_stats,
        top_careers=top_careers,
        engagement_trend=engagement_trend,
    )


# --- Dashboard Super Admin ---


async def get_super_admin_dashboard(
    db: AsyncSession,
) -> SuperAdminDashboardResponse:
    """Dashboard del super admin: estadisticas globales de la plataforma."""
    start_of_month = _start_of_month()

    # Total instituciones
    total_inst_q = select(func.count()).select_from(Institution)
    total_institutions = (await db.execute(total_inst_q)).scalar() or 0

    # Instituciones activas
    active_inst_q = (
        select(func.count())
        .select_from(Institution)
        .where(Institution.is_active.is_(True))
    )
    active_institutions = (await db.execute(active_inst_q)).scalar() or 0

    # Total usuarios
    total_users_q = select(func.count()).select_from(User)
    total_users = (await db.execute(total_users_q)).scalar() or 0

    # Total estudiantes
    total_students_q = (
        select(func.count())
        .select_from(User)
        .where(User.role == UserRole.ESTUDIANTE)
    )
    total_students = (await db.execute(total_students_q)).scalar() or 0

    # Total sesiones
    total_sessions_q = select(func.count()).select_from(Session)
    total_sessions = (await db.execute(total_sessions_q)).scalar() or 0

    # Total tests
    total_tests_q = select(func.count()).select_from(TestResult)
    total_tests = (await db.execute(total_tests_q)).scalar() or 0

    # Sesiones este mes
    sessions_month_q = (
        select(func.count())
        .select_from(Session)
        .where(Session.scheduled_at >= start_of_month)
    )
    sessions_this_month = (await db.execute(sessions_month_q)).scalar() or 0

    # Tests este mes
    tests_month_q = (
        select(func.count())
        .select_from(TestResult)
        .where(TestResult.created_at >= start_of_month)
    )
    tests_this_month = (await db.execute(tests_month_q)).scalar() or 0

    platform_stats = PlatformStats(
        total_institutions=total_institutions,
        active_institutions=active_institutions,
        total_users=total_users,
        total_students=total_students,
        total_sessions=total_sessions,
        total_tests=total_tests,
        sessions_this_month=sessions_this_month,
        tests_this_month=tests_this_month,
    )

    # Instituciones activas con resumen
    institutions_q = (
        select(Institution)
        .where(Institution.is_active.is_(True))
        .order_by(Institution.created_at.desc())
        .limit(20)
    )
    institutions_result = await db.execute(institutions_q)
    institutions = institutions_result.scalars().all()

    institution_overviews: list[InstitutionOverview] = []
    for inst in institutions:
        # Estudiantes de la institucion
        inst_students_q = (
            select(func.count())
            .select_from(User)
            .where(
                and_(
                    User.institution_id == inst.id,
                    User.role == UserRole.ESTUDIANTE,
                )
            )
        )
        inst_students = (await db.execute(inst_students_q)).scalar() or 0

        # Sesiones de la institucion
        inst_sessions_q = (
            select(func.count())
            .select_from(Session)
            .where(Session.institution_id == inst.id)
        )
        inst_sessions = (await db.execute(inst_sessions_q)).scalar() or 0

        institution_overviews.append(
            InstitutionOverview(
                id=inst.id,
                name=inst.name,
                slug=inst.slug,
                plan=inst.plan.value,
                total_students=inst_students,
                total_sessions=inst_sessions,
                is_active=inst.is_active,
            )
        )

    # Conteos recientes (ultimos 7 dias)
    seven_days_ago = _now() - timedelta(days=7)

    recent_sessions_q = (
        select(func.count())
        .select_from(Session)
        .where(Session.scheduled_at >= seven_days_ago)
    )
    recent_sessions_count = (await db.execute(recent_sessions_q)).scalar() or 0

    recent_tests_q = (
        select(func.count())
        .select_from(TestResult)
        .where(TestResult.created_at >= seven_days_ago)
    )
    recent_tests_count = (await db.execute(recent_tests_q)).scalar() or 0

    logger.info(
        "Dashboard super admin generado",
        total_institutions=total_institutions,
        total_users=total_users,
    )

    return SuperAdminDashboardResponse(
        platform_stats=platform_stats,
        active_institutions=institution_overviews,
        recent_sessions_count=recent_sessions_count,
        recent_tests_count=recent_tests_count,
    )
