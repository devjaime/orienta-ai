#!/usr/bin/env python3
"""
Script para crear usuarios de prueba en la base de datos (cualquier entorno).

Uso local:
    python scripts/seed_test_users.py

Via Fly.io:
    fly ssh console -a vocari-api -C "python scripts/seed_test_users.py"

Tambien se puede pasar DATABASE_URL por env var:
    DATABASE_URL=postgresql+asyncpg://... python scripts/seed_test_users.py
"""

import asyncio
import os
import sys
import uuid
from pathlib import Path

# Agregar el directorio raiz al path
sys.path.insert(0, str(Path(__file__).parent.parent))


async def main() -> None:
    import structlog
    from sqlalchemy import select, text
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

    from app.auth.models import User, UserRole
    from app.auth.service import create_access_token, create_refresh_token
    from app.config import get_settings
    from app.institutions.models import Institution, InstitutionPlan

    settings = get_settings()
    logger = structlog.get_logger()

    db_url = os.getenv("DATABASE_URL", settings.database_url)
    print(f"\n=== Conectando a: {db_url[:40]}... ===\n")

    engine = create_async_engine(db_url, echo=False)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as db:
        # --- Crear o recuperar institucion de prueba ---
        result = await db.execute(
            select(Institution).where(Institution.slug == "colegio-demo-vocari")
        )
        institution = result.scalar_one_or_none()

        if not institution:
            institution = Institution(
                id=uuid.uuid4(),
                name="Colegio Demo Vocari",
                slug="colegio-demo-vocari",
                plan=InstitutionPlan.BASIC,
                max_students=200,
                is_active=True,
            )
            db.add(institution)
            await db.flush()
            print(f"  Institucion creada: {institution.name} (id={institution.id})")
        else:
            print(f"  Institucion existente: {institution.name}")

        # --- Definicion de usuarios de prueba ---
        test_users = [
            {
                "email": "test.estudiante@vocari.cl",
                "name": "Ana García (Estudiante Test)",
                "role": UserRole.ESTUDIANTE,
                "institution_id": None,
                "google_id": "test-google-estudiante-001",
            },
            {
                "email": "test.apoderado@vocari.cl",
                "name": "Carlos García (Apoderado Test)",
                "role": UserRole.APODERADO,
                "institution_id": None,
                "google_id": "test-google-apoderado-001",
            },
            {
                "email": "test.orientador@vocari.cl",
                "name": "María López (Orientadora Test)",
                "role": UserRole.ORIENTADOR,
                "institution_id": institution.id,
                "google_id": "test-google-orientador-001",
            },
            {
                "email": "test.admin.colegio@vocari.cl",
                "name": "Pedro Rojas (Admin Colegio Test)",
                "role": UserRole.ADMIN_COLEGIO,
                "institution_id": institution.id,
                "google_id": "test-google-admincolegio-001",
            },
            {
                "email": "test.superadmin@vocari.cl",
                "name": "Super Admin Test",
                "role": UserRole.SUPER_ADMIN,
                "institution_id": None,
                "google_id": "test-google-superadmin-001",
            },
        ]

        print("\n=== Usuarios de prueba ===\n")
        created_users = []

        for u_data in test_users:
            result = await db.execute(select(User).where(User.email == u_data["email"]))
            user = result.scalar_one_or_none()

            if not user:
                user = User(
                    id=uuid.uuid4(),
                    email=u_data["email"],
                    google_id=u_data["google_id"],
                    name=u_data["name"],
                    role=u_data["role"],
                    institution_id=u_data["institution_id"],
                    is_active=True,
                )
                db.add(user)
                await db.flush()
                status = "CREADO"
            else:
                # Actualizar datos si ya existe
                user.name = u_data["name"]
                user.role = u_data["role"]
                user.institution_id = u_data["institution_id"]
                user.is_active = True
                status = "EXISTENTE"

            # Generar JWT
            access_token = create_access_token(
                user_id=user.id,
                role=user.role.value,
                email=user.email,
                name=user.name,
                institution_id=user.institution_id,
            )
            refresh_token = create_refresh_token(user.id)

            created_users.append(
                {
                    "user": user,
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "status": status,
                }
            )

            print(f"  [{status}] {user.role.value.upper():15} | {user.email}")
            print(f"    Nombre: {user.name}")
            if user.institution_id:
                print(f"    Institucion: {institution.name}")

        await db.commit()

        # --- Imprimir tokens ---
        print("\n=== Tokens JWT (validos 30 min) ===\n")
        print("Copia estos tokens para usar en el navegador o Postman:\n")

        frontend_url = os.getenv("FRONTEND_URL", "https://app.vocari.cl")
        api_url = os.getenv("API_URL", "https://vocari-api.fly.dev")

        for entry in created_users:
            user = entry["user"]
            print(f"── {user.role.value.upper()} ({user.email}) ──")
            print(f"  Access Token:\n  {entry['access_token']}\n")

        # --- URLs de acceso directo ---
        print("\n=== URLs de acceso directo al frontend ===\n")
        print("Abre estas URLs para simular el login de cada rol:\n")

        for entry in created_users:
            user = entry["user"]
            at = entry["access_token"]
            rt = entry["refresh_token"]
            print(
                f"  {user.role.value.upper():15} → "
                f"{frontend_url}/auth/callback?access_token={at}&refresh_token={rt}"
            )

        print("\n=== API Test (curl) ===\n")
        first_entry = created_users[0]
        at = first_entry["access_token"]
        print(f"  curl -H 'Authorization: Bearer {at}' {api_url}/api/v1/auth/me\n")

        print("✓ Seed completado correctamente.\n")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
