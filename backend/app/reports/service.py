"""
Vocari Backend - Servicio de Reports.

Genera reportes comprehensivos del perfil vocacional del estudiante,
con link público compartible e informes generados con IA.
"""

import secrets
import uuid
from datetime import datetime, timezone

import structlog
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import NotFoundError

logger = structlog.get_logger()


async def _generate_ai_insights(
    student_name: str,
    holland_code: str | None,
    riasec_scores: dict | None,
    careers: list[dict],
) -> str:
    """Genera un analisis personalizado con IA usando OpenRouter."""
    try:
        from app.ai_engine.openrouter_client import get_openrouter_client

        client = get_openrouter_client()

        if not client.api_key:
            return _generate_fallback_insights(holland_code, careers)

        dim_names = {"R": "Realista", "I": "Investigador", "A": "Artistico", "S": "Social", "E": "Emprendedor", "C": "Convencional"}
        dims = [dim_names.get(c, c) for c in (holland_code or "")[:3]]

        careers_text = "\n".join([
            f"- {c['name']}: {c.get('area', 'N/A')} | Salario: ${c.get('salary_range', {}).get('median', 0)/1000:.0f}k | Empleabilidad: {c.get('employability', 0)*100:.0f}% | Saturacion: {c.get('saturation_index', 0)*100:.0f}%"
            for c in careers[:5]
        ]) or "No hay recomendaciones disponibles"

        prompt = f"""Eres un orientador vocacional experto en Chile. Genera un analisis personalizado para {student_name}.

PERFIL VOCACIONAL:
- Codigo Holland: {holland_code or 'No disponible'}
- Dimensiones principales: {', '.join(dims) if dims else 'No determinado'}
- Puntuaciones: {riasec_scores or 'No disponibles'}

CARRERAS RECOMENDADAS (con datos MINEDUC):
{careers_text}

Genera un informe en español que incluya:
1. Una introduccion personalizada explicando su perfil vocacional
2. Explicacion de que significa su codigo Holland en terminos simples
3. Analisis de cada carrera recomendada (por que encaja con su perfil)
4. Datos реальные del mercado laboral chileno (empleabilidad, salario, saturacion)
5. Recomendaciones concretas de proximos pasos

Usa un tono profesional pero accesible, como un orientador que conversa con el estudiante.
Sé específico con los datos de empleabilidad y salarios cuando estén disponibles.
"""

        response = await client.chat(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=2000,
        )

        return response.content
    except Exception as e:
        logger.warning("Error generando insights IA", error=str(e))
        return _generate_fallback_insights(holland_code, careers)


def _generate_fallback_insights(holland_code: str | None, careers: list[dict]) -> str:
    """Genera un analisis basico sin IA."""
    dim_names = {"R": "Realista", "I": "Investigador", "A": "Artistico", "S": "Social", "E": "Emprendedor", "C": "Convencional"}
    dims = [dim_names.get(c, c) for c in (holland_code or "")[:3]]

    insights = [f"Tu perfil vocacional tiene como dimensiones principales: {', '.join(dims) if dims else 'por determinar'}."]

    if careers:
        best = careers[0]
        insights.append(f"Tu mejor opcion es {best['name']} con una compatibilidad del {best.get('match_score', 0)}%.")
        insights.append(f"Esta carrera tiene una empleabilidad del {best.get('employability', 0)*100:.0f}% y un salario promedio de ${best.get('salary_range', {}).get('median', 0)/1000:.0f}k CLP.")

    insights.append("\nRecomendaciones:")
    insights.append("1. Explora las carreras recomendadas que coinciden con tu perfil")
    insights.append("2. Investiga sobre el campo laboral de cada carrera")
    insights.append("3. Considera hablar con un orientador para profundizar")
    insights.append("4. Realiza pruebas de practica o pasantias si es posible")

    return "\n\n".join(insights)


async def _ensure_reports_table(db: AsyncSession) -> None:
    """Crea la tabla reports si no existe."""
    await db.execute(text("""
        CREATE TABLE IF NOT EXISTS reports (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            report_type VARCHAR(50) NOT NULL DEFAULT 'comprehensive',
            share_token VARCHAR(64) UNIQUE NOT NULL,
            report_data JSONB NOT NULL DEFAULT '{}',
            status VARCHAR(20) NOT NULL DEFAULT 'completed',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """))
    await db.execute(text(
        "CREATE INDEX IF NOT EXISTS idx_reports_student_id ON reports(student_id)"
    ))
    await db.execute(text(
        "CREATE INDEX IF NOT EXISTS idx_reports_share_token ON reports(share_token)"
    ))


async def _get_riasec_data(db: AsyncSession, student_id: uuid.UUID) -> dict | None:
    """Obtiene los datos RIASEC más recientes del estudiante."""
    try:
        result = await db.execute(text("""
            SELECT result_code, certainty, scores, test_metadata, created_at
            FROM test_results
            WHERE user_id = :student_id AND test_type = 'riasec'
            ORDER BY created_at DESC LIMIT 1
        """), {"student_id": str(student_id)})
        row = result.fetchone()
        if not row:
            return None
        return {
            "result_code": row[0],
            "certainty": row[1],
            "scores": row[2],
            "metadata": row[3],
            "date": row[4].isoformat() if row[4] else None,
        }
    except Exception:
        return None


async def _get_career_recommendations(db: AsyncSession, holland_code: str | None) -> list[dict]:
    """Obtiene recomendaciones de carrera basadas en el código Holland."""
    if not holland_code:
        return []
    try:
        result = await db.execute(text("""
            SELECT id, name, area, holland_codes, description,
                   salary_range, employability, saturation_index
            FROM careers
            WHERE is_active = true
            ORDER BY name
            LIMIT 8
        """))
        rows = result.fetchall()
        careers = []
        for r in rows:
            codes = r[3] if isinstance(r[3], list) else []
            match_score = sum(1 for c in codes if c in holland_code) / max(len(codes), 1)
            careers.append({
                "name": r[1],
                "area": r[2],
                "holland_codes": codes,
                "description": r[4],
                "salary_range": r[5],
                "employability": r[6],
                "saturation_index": r[7],
                "match_score": round(match_score * 100),
            })
        # Ordenar por match_score desc
        careers.sort(key=lambda x: x["match_score"], reverse=True)
        return careers[:6]
    except Exception:
        return []


async def _get_game_results(db: AsyncSession, student_id: uuid.UUID) -> list[dict]:
    """Obtiene los resultados de juegos del estudiante."""
    try:
        result = await db.execute(text("""
            SELECT gr.skills_scores, gr.duration_seconds, gr.created_at,
                   g.name as game_name, g.skills_evaluated
            FROM game_results gr
            JOIN games g ON g.id = gr.game_id
            WHERE gr.student_id = :student_id
            ORDER BY gr.created_at DESC
            LIMIT 10
        """), {"student_id": str(student_id)})
        rows = result.fetchall()
        return [{
            "game_name": r[3],
            "skills_evaluated": r[4] if isinstance(r[4], list) else [],
            "skills_scores": r[0],
            "duration_seconds": r[1],
            "date": r[2].isoformat() if r[2] else None,
        } for r in rows]
    except Exception:
        return []


async def create_report(
    db: AsyncSession,
    student_id: uuid.UUID,
    report_type: str = "comprehensive",
    include_ai: bool = True,
) -> dict:
    """Crea un reporte comprehensivo con link compartible e informe IA."""
    from app.auth.models import User
    from app.institutions.models import Institution

    await _ensure_reports_table(db)

    result = await db.execute(select(User).where(User.id == student_id))
    student = result.scalar_one_or_none()
    if not student:
        raise NotFoundError("Estudiante no encontrado")

    student_name = getattr(student, "full_name", None) or getattr(student, "name", "Estudiante")

    institution_name = "Vocari"
    if student.institution_id:
        inst_result = await db.execute(
            select(Institution).where(Institution.id == student.institution_id)
        )
        institution = inst_result.scalar_one_or_none()
        if institution:
            institution_name = institution.name

    riasec = await _get_riasec_data(db, student_id)
    holland_code = riasec["result_code"] if riasec else None
    riasec_scores = riasec.get("scores") if riasec else None
    careers = await _get_career_recommendations(db, holland_code)
    games = await _get_game_results(db, student_id)

    skills_summary: dict[str, float] = {}
    for game in games:
        for skill, score in (game.get("skills_scores") or {}).items():
            if skill not in skills_summary:
                skills_summary[skill] = []
            skills_summary[skill].append(float(score))
    skills_avg = {k: round(sum(v) / len(v), 2) for k, v in skills_summary.items() if v}

    riasec_descriptions = {
        "R": "Realista — Practico, concreto, tecnico",
        "I": "Investigador — Analitico, curioso, cientifico",
        "A": "Artistico — Creativo, expresivo, imaginativo",
        "S": "Social — Empatico, colaborativo, orientado a personas",
        "E": "Emprendedor — Liderazgo, persuasivo, orientado a resultados",
        "C": "Convencional — Organizado, detallista, estructurado",
    }

    ai_insights = ""
    if include_ai and holland_code:
        ai_insights = await _generate_ai_insights(student_name, holland_code, riasec_scores, careers)

    report_data = {
        "student_name": student_name,
        "student_email": student.email,
        "institution_name": institution_name,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "riasec": riasec,
        "holland_code": holland_code,
        "riasec_descriptions": riasec_descriptions,
        "career_recommendations": careers,
        "game_results": games,
        "skills_summary": skills_avg,
        "report_type": report_type,
        "ai_insights": ai_insights,
    }

    share_token = secrets.token_urlsafe(24)

    # Guardar en DB
    insert_result = await db.execute(text("""
        INSERT INTO reports (student_id, report_type, share_token, report_data, status)
        VALUES (:student_id, :report_type, :share_token, CAST(:report_data AS jsonb), 'completed')
        RETURNING id, created_at
    """), {
        "student_id": str(student_id),
        "report_type": report_type,
        "share_token": share_token,
        "report_data": __import__("json").dumps(report_data),
    })
    row = insert_result.fetchone()
    report_id = row[0]
    created_at = row[1]

    logger.info("Reporte creado", student_id=str(student_id), report_id=str(report_id))

    return {
        "id": str(report_id),
        "student_id": str(student_id),
        "report_type": report_type,
        "share_token": share_token,
        "status": "completed",
        "report_data": report_data,
        "created_at": created_at.isoformat() if created_at else None,
    }


async def get_student_reports(
    db: AsyncSession,
    student_id: uuid.UUID,
    page: int = 1,
    per_page: int = 20,
) -> tuple[list[dict], int]:
    """Obtiene los reportes de un estudiante."""
    try:
        await _ensure_reports_table(db)
        offset = (page - 1) * per_page
        count_result = await db.execute(text(
            "SELECT COUNT(*) FROM reports WHERE student_id = :sid"
        ), {"sid": str(student_id)})
        total = count_result.scalar() or 0

        result = await db.execute(text("""
            SELECT id, report_type, share_token, status, created_at
            FROM reports
            WHERE student_id = :sid
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        """), {"sid": str(student_id), "limit": per_page, "offset": offset})
        rows = result.fetchall()
        reports = [{
            "id": str(r[0]),
            "report_type": r[1],
            "share_token": r[2],
            "status": r[3],
            "created_at": r[4].isoformat() if r[4] else None,
            "share_url": f"/informe/{r[2]}",
        } for r in rows]
        return reports, total
    except Exception:
        return [], 0


async def get_report_by_token(db: AsyncSession, share_token: str) -> dict:
    """Obtiene un reporte por su share_token (endpoint público)."""
    try:
        await _ensure_reports_table(db)
        result = await db.execute(text("""
            SELECT id, student_id, report_type, report_data, status, created_at
            FROM reports
            WHERE share_token = :token
        """), {"token": share_token})
        row = result.fetchone()
        if not row:
            raise NotFoundError("Reporte no encontrado")
        return {
            "id": str(row[0]),
            "student_id": str(row[1]),
            "report_type": row[2],
            "report_data": row[3],
            "status": row[4],
            "created_at": row[5].isoformat() if row[5] else None,
        }
    except NotFoundError:
        raise
    except Exception as e:
        raise NotFoundError(f"Reporte no encontrado: {e}") from e
