"""Servicio de métricas para panel administrativo de colegio."""

from __future__ import annotations

from collections import Counter, defaultdict
from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING, Any

from sqlalchemy import and_, select

from app.auth.models import User, UserProfile, UserRole
from app.leads.models import AIReport, Lead
from app.tests_vocational.models import TestResult

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession


def _parse_period(period: str | None) -> tuple[datetime | None, datetime | None]:
    """Parsea periodo YYYY-MM a rango UTC [inicio, fin)."""
    if not period:
        return None, None

    try:
        year_str, month_str = period.split("-")
        year = int(year_str)
        month = int(month_str)
        start = datetime(year, month, 1, tzinfo=UTC)
        if month == 12:
            end = datetime(year + 1, 1, 1, tzinfo=UTC)
        else:
            end = datetime(year, month + 1, 1, tzinfo=UTC)
        return start, end
    except Exception:
        return None, None


def _course_label(grade: str | None) -> str:
    return (grade or "Sin curso").strip() or "Sin curso"


def _safe_round(value: float | None, decimals: int = 1) -> float | None:
    if value is None:
        return None
    return round(value, decimals)


def _month_key(date_value: datetime) -> str:
    return date_value.strftime("%Y-%m")


async def get_admin_metrics(
    db: AsyncSession,
    institution_id,
    curso: str | None = None,
    periodo: str | None = None,
) -> dict[str, Any]:
    """Obtiene métricas institucionales agregadas para panel admin."""
    period_start, period_end = _parse_period(periodo)

    students_query = (
        select(User.id, User.email, UserProfile.grade)
        .outerjoin(UserProfile, UserProfile.user_id == User.id)
        .where(
            User.institution_id == institution_id,
            User.role == UserRole.ESTUDIANTE,
            User.is_active.is_(True),
        )
    )
    if curso:
        students_query = students_query.where(UserProfile.grade == curso)

    student_rows = (await db.execute(students_query)).all()
    student_ids = [row[0] for row in student_rows]
    student_emails = [row[1] for row in student_rows if row[1]]
    course_by_student = {row[0]: _course_label(row[2]) for row in student_rows}

    courses = sorted({_course_label(row[2]) for row in student_rows})

    if not student_ids:
        return {
            "filters": {
                "curso": curso,
                "periodo": periodo,
                "period_start": period_start,
                "period_end": period_end,
            },
            "summary": {
                "total_students": 0,
                "students_with_test": 0,
                "completion_rate": 0.0,
                "tests_in_period": 0,
                "average_clarity": None,
                "indecision_index": None,
            },
            "cursos": courses,
            "riasec_distribution_by_course": [],
            "clarity_by_course": [],
            "top_careers": [],
        }

    tests_query = select(TestResult.user_id, TestResult.result_code, TestResult.created_at).where(
        TestResult.user_id.in_(student_ids)
    )
    if period_start and period_end:
        tests_query = tests_query.where(
            and_(TestResult.created_at >= period_start, TestResult.created_at < period_end)
        )
    tests_rows = (await db.execute(tests_query)).all()

    students_with_test = {row[0] for row in tests_rows}
    riasec_by_course: dict[str, Counter[str]] = defaultdict(Counter)
    tested_by_course: Counter[str] = Counter()
    students_by_course: Counter[str] = Counter(course_by_student.values())

    for user_id, result_code, _ in tests_rows:
        course = course_by_student.get(user_id, "Sin curso")
        tested_by_course[course] += 1
        if result_code:
            riasec_by_course[course][result_code] += 1

    leads_query = select(Lead.email, Lead.clarity_score, Lead.updated_at).where(
        Lead.email.in_(student_emails)
    )
    if period_start and period_end:
        leads_query = leads_query.where(and_(Lead.updated_at >= period_start, Lead.updated_at < period_end))
    lead_rows = (await db.execute(leads_query)).all()

    # Tomamos el último lead por email para claridad.
    latest_lead_by_email: dict[str, tuple[float | None, datetime | None]] = {}
    for email, clarity_score, updated_at in lead_rows:
        previous = latest_lead_by_email.get(email)
        if previous is None or ((updated_at or datetime.min.replace(tzinfo=UTC)) > (previous[1] or datetime.min.replace(tzinfo=UTC))):
            latest_lead_by_email[email] = (clarity_score, updated_at)

    student_email_to_course = {row[1]: _course_label(row[2]) for row in student_rows if row[1]}

    clarity_values: list[float] = []
    clarity_by_course_values: dict[str, list[float]] = defaultdict(list)
    indecision_count = 0
    indecision_by_course: Counter[str] = Counter()

    for email, (clarity_score, _) in latest_lead_by_email.items():
        if clarity_score is None:
            continue
        course = student_email_to_course.get(email, "Sin curso")
        clarity_values.append(float(clarity_score))
        clarity_by_course_values[course].append(float(clarity_score))
        if clarity_score <= 2:
            indecision_count += 1
            indecision_by_course[course] += 1

    total_students = len(student_ids)
    students_with_test_count = len(students_with_test)
    completion_rate = round((students_with_test_count / total_students) * 100, 1) if total_students else 0.0

    average_clarity = _safe_round(sum(clarity_values) / len(clarity_values), 2) if clarity_values else None
    indecision_index = (
        _safe_round((indecision_count / len(clarity_values)) * 100, 1) if clarity_values else None
    )

    riasec_distribution_by_course = []
    for course in courses:
        riasec_distribution_by_course.append(
            {
                "curso": course,
                "total_students": int(students_by_course.get(course, 0)),
                "total_with_test": int(tested_by_course.get(course, 0)),
                "codes": dict(riasec_by_course.get(course, Counter())),
            }
        )

    clarity_by_course = []
    for course in courses:
        values = clarity_by_course_values.get(course, [])
        avg_course = _safe_round(sum(values) / len(values), 2) if values else None
        idx_course = _safe_round((indecision_by_course.get(course, 0) / len(values)) * 100, 1) if values else None
        clarity_by_course.append(
            {
                "curso": course,
                "total_students": int(students_by_course.get(course, 0)),
                "students_with_clarity": len(values),
                "average_clarity": avg_course,
                "indecision_index": idx_course,
            }
        )

    top_careers_counter: Counter[str] = Counter()
    if student_emails:
        careers_query = (
            select(AIReport.report_json)
            .join(Lead, Lead.id == AIReport.lead_id)
            .where(Lead.email.in_(student_emails))
        )
        if period_start and period_end:
            careers_query = careers_query.where(
                and_(AIReport.created_at >= period_start, AIReport.created_at < period_end)
            )
        careers_rows = (await db.execute(careers_query)).all()
        for (report_json,) in careers_rows:
            top_careers = (report_json or {}).get("top_careers", [])
            if isinstance(top_careers, list):
                for career_item in top_careers:
                    if not isinstance(career_item, dict):
                        continue
                    name = career_item.get("nombre")
                    if isinstance(name, str) and name.strip():
                        top_careers_counter[name.strip()] += 1

    top_careers = [
        {"career_name": name, "count": count}
        for name, count in top_careers_counter.most_common(10)
    ]

    return {
        "filters": {
            "curso": curso,
            "periodo": periodo,
            "period_start": period_start,
            "period_end": period_end,
        },
        "summary": {
            "total_students": total_students,
            "students_with_test": students_with_test_count,
            "completion_rate": completion_rate,
            "tests_in_period": len(tests_rows),
            "average_clarity": average_clarity,
            "indecision_index": indecision_index,
        },
        "cursos": courses,
        "riasec_distribution_by_course": riasec_distribution_by_course,
        "clarity_by_course": clarity_by_course,
        "top_careers": top_careers,
    }


async def get_admin_insights(
    db: AsyncSession,
    institution_id,
    curso: str | None = None,
    periodo: str | None = None,
) -> dict[str, Any]:
    """Obtiene insights institucionales (cohorte, tendencias y alertas)."""
    period_start, period_end = _parse_period(periodo)
    if period_start is None and period_end is None:
        period_end = datetime.now(UTC)
        period_start = period_end - timedelta(days=180)

    students_query = (
        select(User.id, User.name, User.email, UserProfile.grade)
        .outerjoin(UserProfile, UserProfile.user_id == User.id)
        .where(
            User.institution_id == institution_id,
            User.role == UserRole.ESTUDIANTE,
            User.is_active.is_(True),
        )
    )
    if curso:
        students_query = students_query.where(UserProfile.grade == curso)

    student_rows = (await db.execute(students_query)).all()
    student_ids = [row[0] for row in student_rows]
    student_emails = [row[2] for row in student_rows if row[2]]
    student_by_email = {row[2]: row for row in student_rows if row[2]}
    courses = sorted({_course_label(row[3]) for row in student_rows})

    if not student_ids:
        return {
            "filters": {
                "curso": curso,
                "periodo": periodo,
                "period_start": period_start,
                "period_end": period_end,
            },
            "summary": {
                "total_students": 0,
                "students_with_clarity": 0,
                "students_with_high_indecision": 0,
                "high_indecision_rate": 0.0,
            },
            "courses": courses,
            "career_interest_by_course": [],
            "clarity_trend": [],
            "indecision_alerts": [],
        }

    leads_query = select(
        Lead.id,
        Lead.email,
        Lead.clarity_score,
        Lead.holland_code,
        Lead.updated_at,
    ).where(Lead.email.in_(student_emails))
    if period_start and period_end:
        leads_query = leads_query.where(and_(Lead.updated_at >= period_start, Lead.updated_at < period_end))
    lead_rows = (await db.execute(leads_query)).all()

    # Tendencia de claridad mensual (tomando todos los leads del periodo)
    clarity_values_by_month: dict[str, list[float]] = defaultdict(list)
    for _, _, clarity_score, _, updated_at in lead_rows:
        if clarity_score is None or updated_at is None:
            continue
        month = _month_key(updated_at)
        clarity_values_by_month[month].append(float(clarity_score))

    clarity_trend = []
    for month in sorted(clarity_values_by_month.keys()):
        values = clarity_values_by_month[month]
        indecision = [value for value in values if value <= 2]
        clarity_trend.append(
            {
                "month": month,
                "students_with_clarity": len(values),
                "average_clarity": _safe_round(sum(values) / len(values), 2),
                "indecision_index": _safe_round((len(indecision) / len(values)) * 100, 1),
            }
        )

    # Último lead por email para alertas y summary
    latest_lead_by_email: dict[str, dict[str, Any]] = {}
    for lead_id, email, clarity_score, holland_code, updated_at in lead_rows:
        previous = latest_lead_by_email.get(email)
        current_time = updated_at or datetime.min.replace(tzinfo=UTC)
        previous_time = (
            previous["updated_at"] if previous and previous.get("updated_at") else datetime.min.replace(tzinfo=UTC)
        )
        if previous is None or current_time > previous_time:
            latest_lead_by_email[email] = {
                "lead_id": lead_id,
                "clarity_score": clarity_score,
                "holland_code": holland_code,
                "updated_at": updated_at,
            }

    indecision_alerts = []
    students_with_clarity = 0
    students_with_high_indecision = 0
    for email, info in latest_lead_by_email.items():
        clarity_score = info.get("clarity_score")
        if clarity_score is None:
            continue
        students_with_clarity += 1
        if clarity_score > 2:
            continue

        students_with_high_indecision += 1
        student_row = student_by_email.get(email)
        if not student_row:
            continue
        student_id, student_name, student_email, grade = student_row
        indecision_alerts.append(
            {
                "student_id": str(student_id),
                "student_name": student_name,
                "student_email": student_email,
                "curso": _course_label(grade),
                "clarity_score": float(clarity_score),
                "holland_code": info.get("holland_code"),
                "last_activity_at": info.get("updated_at"),
                "recommended_action": "Priorizar reunión 1:1 con orientador en los próximos 7 días",
            }
        )

    indecision_alerts.sort(
        key=lambda item: (
            item["clarity_score"],
            item["last_activity_at"] or datetime.min.replace(tzinfo=UTC),
        )
    )

    # Interés de carreras por cohorte (curso) usando report_json.top_careers
    top_careers_by_course: dict[str, Counter[str]] = defaultdict(Counter)
    if student_emails:
        reports_query = (
            select(Lead.email, AIReport.report_json, AIReport.created_at)
            .join(Lead, Lead.id == AIReport.lead_id)
            .where(Lead.email.in_(student_emails))
        )
        if period_start and period_end:
            reports_query = reports_query.where(
                and_(AIReport.created_at >= period_start, AIReport.created_at < period_end)
            )
        report_rows = (await db.execute(reports_query)).all()

        for email, report_json, _ in report_rows:
            student_row = student_by_email.get(email)
            if not student_row:
                continue
            course = _course_label(student_row[3])
            top_careers = (report_json or {}).get("top_careers", [])
            if not isinstance(top_careers, list):
                continue
            for career_item in top_careers:
                if not isinstance(career_item, dict):
                    continue
                name = career_item.get("nombre")
                if isinstance(name, str) and name.strip():
                    top_careers_by_course[course][name.strip()] += 1

    career_interest_by_course = []
    for course in courses:
        counter = top_careers_by_course.get(course, Counter())
        career_interest_by_course.append(
            {
                "curso": course,
                "careers": [
                    {"career_name": career_name, "count": count}
                    for career_name, count in counter.most_common(8)
                ],
            }
        )

    high_indecision_rate = (
        round((students_with_high_indecision / students_with_clarity) * 100, 1)
        if students_with_clarity
        else 0.0
    )

    return {
        "filters": {
            "curso": curso,
            "periodo": periodo,
            "period_start": period_start,
            "period_end": period_end,
        },
        "summary": {
            "total_students": len(student_ids),
            "students_with_clarity": students_with_clarity,
            "students_with_high_indecision": students_with_high_indecision,
            "high_indecision_rate": high_indecision_rate,
        },
        "courses": courses,
        "career_interest_by_course": career_interest_by_course,
        "clarity_trend": clarity_trend,
        "indecision_alerts": indecision_alerts[:50],
    }
