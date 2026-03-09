"""
Vocari Backend - Script de seed/demo data.

Crea datos de demostracion para los 4 roles principales:
  - estudiante
  - orientador
  - apoderado
  - admin_colegio

Incluye: institucion, usuarios, sesiones, tests, perfiles, carreras,
vinculos padre-hijo, notificaciones y audit logs.

Uso:
    python -m scripts.seed_demo

Requisitos:
    - Base de datos configurada (DATABASE_URL en env)
    - Tablas creadas (Alembic o Base.metadata.create_all)
"""

import asyncio
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# Configuracion
import os
import sys

# Agregar el directorio backend al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.common.base_model import Base
from app.auth.models import ParentStudentLink, User, UserRole
from app.institutions.models import Institution, InstitutionPlan
from app.sessions.models import Session, SessionAIAnalysis, SessionStatus
from app.tests_vocational.models import TestResult
from app.profiles.models import StudentLongitudinalProfile
from app.careers.models import Career
from app.notifications.models import Notification, NotificationType
from app.audit.models import AuditLog

# ---------------------------------------------------------------------------
# IDs fijos para demo (facilitan referencia)
# ---------------------------------------------------------------------------

INST_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
ESTUDIANTE_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")
ORIENTADOR_ID = uuid.UUID("33333333-3333-3333-3333-333333333333")
APODERADO_ID = uuid.UUID("44444444-4444-4444-4444-444444444444")
ADMIN_COL_ID = uuid.UUID("55555555-5555-5555-5555-555555555555")
SUPER_ADMIN_ID = uuid.UUID("66666666-6666-6666-6666-666666666666")
ESTUDIANTE2_ID = uuid.UUID("77777777-7777-7777-7777-777777777777")

NOW = datetime.now(timezone.utc)


def _past(days: int = 0, hours: int = 0) -> datetime:
    return NOW - timedelta(days=days, hours=hours)


def _future(days: int = 0, hours: int = 0) -> datetime:
    return NOW + timedelta(days=days, hours=hours)


# ---------------------------------------------------------------------------
# Seed functions
# ---------------------------------------------------------------------------


async def seed_institution(db: AsyncSession) -> Institution:
    inst = Institution(
        id=INST_ID,
        name="Colegio Demo Vocari",
        slug="colegio-demo-vocari",
        plan=InstitutionPlan.FREE,
        max_students=200,
        is_active=True,
    )
    db.add(inst)
    await db.flush()
    print(f"  Institucion: {inst.name} ({inst.id})")
    return inst


async def seed_users(db: AsyncSession) -> dict[str, User]:
    users = {
        "estudiante": User(
            id=ESTUDIANTE_ID,
            email="demo.estudiante@vocari.cl",
            google_id="google-demo-estudiante",
            name="Camila Fernandez",
            role=UserRole.ESTUDIANTE,
            institution_id=INST_ID,
            is_active=True,
        ),
        "estudiante2": User(
            id=ESTUDIANTE2_ID,
            email="demo.estudiante2@vocari.cl",
            google_id="google-demo-estudiante2",
            name="Sebastian Morales",
            role=UserRole.ESTUDIANTE,
            institution_id=INST_ID,
            is_active=True,
        ),
        "orientador": User(
            id=ORIENTADOR_ID,
            email="demo.orientador@vocari.cl",
            google_id="google-demo-orientador",
            name="Patricia Gonzalez",
            role=UserRole.ORIENTADOR,
            institution_id=INST_ID,
            is_active=True,
        ),
        "apoderado": User(
            id=APODERADO_ID,
            email="demo.apoderado@vocari.cl",
            google_id="google-demo-apoderado",
            name="Roberto Fernandez",
            role=UserRole.APODERADO,
            institution_id=INST_ID,
            is_active=True,
        ),
        "admin_colegio": User(
            id=ADMIN_COL_ID,
            email="demo.admin@vocari.cl",
            google_id="google-demo-admin",
            name="Carolina Soto",
            role=UserRole.ADMIN_COLEGIO,
            institution_id=INST_ID,
            is_active=True,
        ),
        "super_admin": User(
            id=SUPER_ADMIN_ID,
            email="demo.superadmin@vocari.cl",
            google_id="google-demo-superadmin",
            name="Admin Vocari",
            role=UserRole.SUPER_ADMIN,
            is_active=True,
        ),
    }

    for user in users.values():
        db.add(user)
    await db.flush()

    for key, user in users.items():
        print(f"  {key}: {user.name} <{user.email}> ({user.role.value})")

    return users


async def seed_sessions(db: AsyncSession) -> list[Session]:
    sessions = [
        # Sesion completada hace 5 dias
        Session(
            institution_id=INST_ID,
            student_id=ESTUDIANTE_ID,
            orientador_id=ORIENTADOR_ID,
            scheduled_at=_past(days=5),
            duration_minutes=45,
            status=SessionStatus.COMPLETED,
            completed_at=_past(days=5),
            notes_by_student="Quiero explorar carreras de tecnologia",
        ),
        # Sesion completada hace 2 dias
        Session(
            institution_id=INST_ID,
            student_id=ESTUDIANTE_ID,
            orientador_id=ORIENTADOR_ID,
            scheduled_at=_past(days=2),
            duration_minutes=30,
            status=SessionStatus.COMPLETED,
            completed_at=_past(days=2),
        ),
        # Sesion programada para manana
        Session(
            institution_id=INST_ID,
            student_id=ESTUDIANTE_ID,
            orientador_id=ORIENTADOR_ID,
            scheduled_at=_future(days=1),
            duration_minutes=30,
            status=SessionStatus.SCHEDULED,
        ),
        # Sesion programada para la proxima semana
        Session(
            institution_id=INST_ID,
            student_id=ESTUDIANTE2_ID,
            orientador_id=ORIENTADOR_ID,
            scheduled_at=_future(days=7),
            duration_minutes=45,
            status=SessionStatus.SCHEDULED,
        ),
        # Sesion con no-show (alerta para orientador)
        Session(
            institution_id=INST_ID,
            student_id=ESTUDIANTE2_ID,
            orientador_id=ORIENTADOR_ID,
            scheduled_at=_past(days=1),
            duration_minutes=30,
            status=SessionStatus.NO_SHOW,
        ),
    ]

    for s in sessions:
        db.add(s)
    await db.flush()
    print(f"  {len(sessions)} sesiones creadas")
    return sessions


async def seed_ai_analysis(db: AsyncSession, sessions: list[Session]) -> None:
    """Crea analisis IA para las sesiones completadas."""
    completed = [s for s in sessions if s.status == SessionStatus.COMPLETED]
    for i, session in enumerate(completed):
        analysis = SessionAIAnalysis(
            session_id=session.id,
            summary=f"Sesion productiva #{i+1}. La estudiante muestra interes en areas STEM, "
            "particularmente en ciencias de la computacion y diseno UX. "
            "Se recomienda profundizar en tests de aptitudes tecnicas.",
            interests_detected=["tecnologia", "diseno", "ciencias"],
            skills_detected=["pensamiento logico", "creatividad", "comunicacion"],
            emotional_sentiment={"overall": "positivo", "engagement": 0.85},
            suggested_tests=["riasec", "aptitudes_tecnicas"],
            suggested_games=["career_simulation", "day_in_life"],
            model_used="google/gemini-2.0-flash-001",
            tokens_used=1500 + i * 200,
            processing_time_seconds=3.2 + i * 0.5,
            reviewed_by_orientador=i == 0,  # Solo la primera esta revisada
        )
        db.add(analysis)
    await db.flush()
    print(f"  {len(completed)} analisis IA creados")


async def seed_test_results(db: AsyncSession) -> list[TestResult]:
    tests = [
        TestResult(
            user_id=ESTUDIANTE_ID,
            institution_id=INST_ID,
            test_type="riasec",
            answers={"q1": "a", "q2": "c", "q3": "b"},
            scores={"R": 3, "I": 8, "A": 6, "S": 4, "E": 2, "C": 5},
            result_code="IAS",
            certainty=0.82,
        ),
        TestResult(
            user_id=ESTUDIANTE_ID,
            institution_id=INST_ID,
            test_type="aptitudes",
            answers={"q1": "b", "q2": "a"},
            scores={"logico_matematico": 8, "verbal": 6, "espacial": 7},
            result_code="STEM",
            certainty=0.75,
        ),
        TestResult(
            user_id=ESTUDIANTE2_ID,
            institution_id=INST_ID,
            test_type="riasec",
            answers={"q1": "c", "q2": "a"},
            scores={"R": 5, "I": 4, "A": 2, "S": 7, "E": 6, "C": 3},
            result_code="SE",
            certainty=0.70,
        ),
    ]

    for t in tests:
        db.add(t)
    await db.flush()
    print(f"  {len(tests)} resultados de test creados")
    return tests


async def seed_profiles(db: AsyncSession) -> None:
    profiles = [
        StudentLongitudinalProfile(
            student_id=ESTUDIANTE_ID,
            institution_id=INST_ID,
            skills={
                "pensamiento_logico": 0.85,
                "creatividad": 0.72,
                "comunicacion": 0.68,
                "trabajo_equipo": 0.75,
            },
            interests={
                "tecnologia": 0.9,
                "diseno": 0.78,
                "ciencias": 0.65,
                "arte": 0.45,
            },
            learning_patterns={
                "visual": 0.8,
                "practico": 0.75,
                "teorico": 0.5,
            },
            happiness_indicators={
                "overall": 0.82,
                "academico": 0.78,
                "social": 0.85,
                "vocacional": 0.80,
            },
            career_recommendations=[
                {"career": "Ingenieria en Informatica", "match": 0.92},
                {"career": "Diseno UX/UI", "match": 0.87},
                {"career": "Ciencia de Datos", "match": 0.84},
            ],
            riasec_history=[
                {"date": _past(days=30).isoformat(), "code": "IA", "scores": {"I": 7, "A": 5}},
                {"date": _past(days=5).isoformat(), "code": "IAS", "scores": {"I": 8, "A": 6, "S": 4}},
            ],
            data_sources=["riasec_test", "aptitudes_test", "session_analysis"],
        ),
        StudentLongitudinalProfile(
            student_id=ESTUDIANTE2_ID,
            institution_id=INST_ID,
            skills={
                "comunicacion": 0.88,
                "liderazgo": 0.72,
                "empatia": 0.82,
            },
            interests={
                "educacion": 0.8,
                "psicologia": 0.75,
                "negocios": 0.6,
            },
            learning_patterns={"social": 0.85, "practico": 0.7},
            happiness_indicators={"overall": 0.75, "academico": 0.70, "social": 0.90},
            career_recommendations=[
                {"career": "Psicologia", "match": 0.88},
                {"career": "Pedagogia", "match": 0.82},
            ],
            riasec_history=[
                {"date": _past(days=3).isoformat(), "code": "SE", "scores": {"S": 7, "E": 6}},
            ],
            data_sources=["riasec_test", "session_analysis"],
        ),
    ]

    for p in profiles:
        db.add(p)
    await db.flush()
    print(f"  {len(profiles)} perfiles longitudinales creados")


async def seed_careers(db: AsyncSession) -> list[Career]:
    careers = [
        Career(
            name="Ingenieria en Informatica",
            area="Tecnologia",
            holland_codes=["I", "R", "C"],
            description="Desarrollo de software, sistemas y soluciones tecnologicas.",
            salary_range={"min": 900000, "max": 3500000, "currency": "CLP"},
            employability=0.92,
            saturation_index=0.25,
            mineduc_data={"matricula_2024": 45000, "titulados_2023": 8500},
            is_active=True,
        ),
        Career(
            name="Diseno UX/UI",
            area="Tecnologia",
            holland_codes=["A", "I"],
            description="Diseno de experiencia e interfaz de usuario para productos digitales.",
            salary_range={"min": 800000, "max": 2800000, "currency": "CLP"},
            employability=0.88,
            saturation_index=0.30,
            mineduc_data={"matricula_2024": 12000, "titulados_2023": 2500},
            is_active=True,
        ),
        Career(
            name="Psicologia",
            area="Ciencias Sociales",
            holland_codes=["S", "I", "A"],
            description="Estudio del comportamiento humano y salud mental.",
            salary_range={"min": 600000, "max": 2200000, "currency": "CLP"},
            employability=0.72,
            saturation_index=0.55,
            mineduc_data={"matricula_2024": 60000, "titulados_2023": 12000},
            is_active=True,
        ),
        Career(
            name="Medicina",
            area="Salud",
            holland_codes=["I", "S"],
            description="Ciencias de la salud y atencion medica.",
            salary_range={"min": 1200000, "max": 5000000, "currency": "CLP"},
            employability=0.95,
            saturation_index=0.15,
            mineduc_data={"matricula_2024": 30000, "titulados_2023": 3500},
            is_active=True,
        ),
        Career(
            name="Pedagogia en Matematicas",
            area="Educacion",
            holland_codes=["S", "I", "C"],
            description="Formacion de profesores de matematicas para educacion media.",
            salary_range={"min": 550000, "max": 1800000, "currency": "CLP"},
            employability=0.85,
            saturation_index=0.20,
            mineduc_data={"matricula_2024": 8000, "titulados_2023": 1500},
            is_active=True,
        ),
        Career(
            name="Ingenieria Civil Industrial",
            area="Ingenieria",
            holland_codes=["E", "I", "C"],
            description="Optimizacion de procesos y gestion empresarial.",
            salary_range={"min": 1000000, "max": 4000000, "currency": "CLP"},
            employability=0.90,
            saturation_index=0.35,
            mineduc_data={"matricula_2024": 55000, "titulados_2023": 10000},
            is_active=True,
        ),
    ]

    for c in careers:
        db.add(c)
    await db.flush()
    print(f"  {len(careers)} carreras creadas")
    return careers


async def seed_parent_links(db: AsyncSession) -> None:
    # Vinculo verificado: apoderado -> estudiante (Camila)
    link1 = ParentStudentLink(
        parent_id=APODERADO_ID,
        student_id=ESTUDIANTE_ID,
        verified=True,
    )
    # Vinculo pendiente: apoderado -> estudiante2 (Sebastian)
    link2 = ParentStudentLink(
        parent_id=APODERADO_ID,
        student_id=ESTUDIANTE2_ID,
        verified=False,
    )
    db.add_all([link1, link2])
    await db.flush()
    print("  2 vinculos padre-estudiante creados (1 verificado, 1 pendiente)")


async def seed_notifications(db: AsyncSession) -> None:
    notifications = [
        Notification(
            user_id=ESTUDIANTE_ID,
            notification_type=NotificationType.SESSION_SCHEDULED,
            title="Sesion programada",
            message="Tu proxima sesion con Patricia Gonzalez es manana a las 10:00.",
            extra_data={"orientador_name": "Patricia Gonzalez"},
        ),
        Notification(
            user_id=ESTUDIANTE_ID,
            notification_type=NotificationType.TEST_COMPLETED,
            title="Resultados disponibles",
            message="Los resultados de tu test RIASEC estan listos. Tu perfil es IAS.",
            is_read=True,
            extra_data={"test_type": "riasec", "result_code": "IAS"},
        ),
        Notification(
            user_id=ORIENTADOR_ID,
            notification_type=NotificationType.AI_ANALYSIS_READY,
            title="Analisis IA listo",
            message="El analisis de la sesion con Camila Fernandez esta disponible para revision.",
            extra_data={"student_name": "Camila Fernandez"},
        ),
        Notification(
            user_id=ORIENTADOR_ID,
            notification_type=NotificationType.SESSION_SCHEDULED,
            title="Nueva sesion asignada",
            message="Sebastian Morales ha agendado una sesion para la proxima semana.",
        ),
        Notification(
            user_id=APODERADO_ID,
            notification_type=NotificationType.PARENT_LINK_VERIFIED,
            title="Vinculacion verificada",
            message="Tu vinculacion con Camila Fernandez ha sido verificada.",
            is_read=True,
        ),
        Notification(
            user_id=APODERADO_ID,
            notification_type=NotificationType.CONSENT_REQUIRED,
            title="Consentimiento requerido",
            message="Se requiere tu consentimiento para que Camila realice el test de aptitudes.",
        ),
        Notification(
            user_id=ADMIN_COL_ID,
            notification_type=NotificationType.SYSTEM,
            title="Importacion completada",
            message="La importacion CSV de 25 estudiantes se completo exitosamente.",
            is_read=True,
        ),
        Notification(
            user_id=ADMIN_COL_ID,
            notification_type=NotificationType.GENERAL,
            title="Reporte mensual",
            message="El reporte de engagement de marzo esta disponible.",
        ),
    ]

    for n in notifications:
        db.add(n)
    await db.flush()
    print(f"  {len(notifications)} notificaciones creadas")


async def seed_audit_logs(db: AsyncSession) -> None:
    logs = [
        AuditLog(
            user_id=ADMIN_COL_ID,
            institution_id=INST_ID,
            action="import_students",
            resource_type="user",
            details={"count": 25, "source": "csv"},
            ip_address="192.168.1.100",
        ),
        AuditLog(
            user_id=ORIENTADOR_ID,
            institution_id=INST_ID,
            action="review_analysis",
            resource_type="session_ai_analysis",
            details={"student": "Camila Fernandez"},
            ip_address="192.168.1.101",
        ),
        AuditLog(
            user_id=ADMIN_COL_ID,
            institution_id=INST_ID,
            action="verify_parent_link",
            resource_type="parent_student_link",
            details={"parent": "Roberto Fernandez", "student": "Camila Fernandez"},
            ip_address="192.168.1.100",
        ),
        AuditLog(
            user_id=SUPER_ADMIN_ID,
            institution_id=None,
            action="create_institution",
            resource_type="institution",
            resource_id=INST_ID,
            details={"name": "Colegio Demo Vocari"},
            ip_address="10.0.0.1",
        ),
    ]

    for log in logs:
        db.add(log)
    await db.flush()
    print(f"  {len(logs)} audit logs creados")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


async def run_seed(database_url: str | None = None) -> None:
    """Ejecuta el seed completo."""
    if not database_url:
        database_url = os.getenv(
            "DATABASE_URL",
            "sqlite+aiosqlite:///./demo.db",
        )

    print(f"\n=== Vocari Demo Seed ===")
    print(f"Base de datos: {database_url.split('@')[-1] if '@' in database_url else database_url}")
    print()

    engine = create_async_engine(database_url, echo=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with session_factory() as db:
        try:
            print("[1/9] Creando institucion...")
            await seed_institution(db)

            print("[2/9] Creando usuarios...")
            await seed_users(db)

            print("[3/9] Creando sesiones...")
            sessions = await seed_sessions(db)

            print("[4/9] Creando analisis IA...")
            await seed_ai_analysis(db, sessions)

            print("[5/9] Creando resultados de tests...")
            await seed_test_results(db)

            print("[6/9] Creando perfiles longitudinales...")
            await seed_profiles(db)

            print("[7/9] Creando carreras...")
            await seed_careers(db)

            print("[8/9] Creando vinculos y notificaciones...")
            await seed_parent_links(db)
            await seed_notifications(db)

            print("[9/9] Creando audit logs...")
            await seed_audit_logs(db)

            await db.commit()
            print("\n=== Seed completado exitosamente ===")
            print()
            print("Usuarios demo:")
            print("  Estudiante:     demo.estudiante@vocari.cl  (Camila Fernandez)")
            print("  Estudiante 2:   demo.estudiante2@vocari.cl (Sebastian Morales)")
            print("  Orientador:     demo.orientador@vocari.cl  (Patricia Gonzalez)")
            print("  Apoderado:      demo.apoderado@vocari.cl   (Roberto Fernandez)")
            print("  Admin Colegio:  demo.admin@vocari.cl       (Carolina Soto)")
            print("  Super Admin:    demo.superadmin@vocari.cl   (Admin Vocari)")
            print()
            print("Institucion: Colegio Demo Vocari")
            print()

        except Exception as e:
            await db.rollback()
            print(f"\nError durante seed: {e}")
            raise
        finally:
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(run_seed())
