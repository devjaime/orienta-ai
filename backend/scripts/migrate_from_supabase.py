"""
Vocari Backend - Scripts de Migracion de Datos.

Este script migra datos desde Supabase (PostgreSQL) a Cloud SQL.
"""

import asyncio
import uuid
from datetime import datetime, timezone
from typing import Any

import asyncpg
import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.config import get_settings

logger = structlog.get_logger()

MIGRATION_TABLES = [
    "users",
    "user_profiles",
    "institutions",
    "institution_students",
    "sessions",
    "session_recordings",
    "session_transcripts",
    "session_ai_analyses",
    "consent_records",
    "test_results",
    "adaptive_questionnaires",
    "student_longitudinal_profiles",
    "careers",
    "career_simulations",
    "games",
    "game_results",
    "notifications",
    "audit_logs",
    "parent_student_links",
]


async def get_source_connection() -> asyncpg.Pool:
    """Conecta a la base de datos fuente (Supabase)."""
    settings = get_settings()
    source_url = settings.database_url.replace(
        "postgresql+asyncpg://", "postgresql://"
    )
    return await asyncpg.create_pool(source_url)


async def get_target_engine():
    """Crea el motor para la base de datos destino (Cloud SQL)."""
    settings = get_settings()
    engine = create_async_engine(settings.database_url, echo=True)
    return engine


async def migrate_table(
    source_pool: asyncpg.Pool,
    target_engine,
    table_name: str,
    batch_size: int = 1000,
) -> dict[str, Any]:
    """Migra una tabla completa."""
    logger.info(f"Iniciando migracion de {table_name}")

    async with source_pool.acquire() as conn:
        count = await conn.fetchval(f"SELECT COUNT(*) FROM {table_name}")
        logger.info(f"Filas a migrar en {table_name}: {count}")

        if count == 0:
            return {"status": "skipped", "message": "Tabla vacia"}

        rows = await conn.fetch(f"SELECT * FROM {table_name}")
        
        columns = list(rows[0].keys())
        placeholders = ", ".join([f"${i+1}" for i in range(len(columns))])
        column_names = ", ".join(columns)

        async with target_engine.begin() as target_conn:
            for i in range(0, len(rows), batch_size):
                batch = rows[i : i + batch_size]
                values = [list(row.values()) for row in batch]

                for row_values in values:
                    row_values = [
                        v.isoformat() if isinstance(v, datetime) else v
                        for v in row_values
                    ]
                    try:
                        await target_conn.execute(
                            text(f"""
                                INSERT INTO {table_name} ({column_names})
                                VALUES ({placeholders})
                                ON CONFLICT DO NOTHING
                            """),
                            row_values,
                        )
                    except Exception as e:
                        logger.error(
                            f"Error migrating row in {table_name}",
                            error=str(e),
                            row=i,
                        )

    return {
        "status": "success",
        "table": table_name,
        "total_rows": count,
    }


async def verify_migration(source_pool: asyncpg.Pool, target_engine) -> dict:
    """Verifica que la migracion fue exitosa."""
    results = {}

    async with target_engine.connect() as target_conn:
        for table in MIGRATION_TABLES:
            try:
                source_count = await source_pool.fetchval(
                    f"SELECT COUNT(*) FROM {table}"
                )
                target_result = await target_conn.execute(
                    text(f"SELECT COUNT(*) FROM {table}")
                )
                target_count = target_result.scalar()

                results[table] = {
                    "source": source_count,
                    "target": target_count,
                    "match": source_count == target_count,
                }
            except Exception as e:
                results[table] = {"error": str(e)}

    return results


async def main():
    """Ejecuta la migracion completa."""
    settings = get_settings()
    logger.info("Iniciando migracion de datos", environment=settings.app_env)

    if settings.app_env == "development":
        logger.warning(
            "Running migration in development - this is not recommended!"
        )
        logger.warning("Set APP_ENV=production to run migration")

    logger.info("Obteniendo conexiones...")
    source_pool = await get_source_connection()
    target_engine = await get_target_engine()

    try:
        results = []
        for table in MIGRATION_TABLES:
            result = await migrate_table(source_pool, target_engine, table)
            results.append(result)
            logger.info(f"Resultado: {result}")

        logger.info("Verificando migracion...")
        verification = await verify_migration(source_pool, target_engine)
        
        logger.info("Verificacion completa:", verification)

        all_match = all(v.get("match", False) for v in verification.values())
        
        if all_match:
            logger.info("Migracion exitosa - todos los datos verificados")
        else:
            logger.error("Migracion incompleta - verificar diferencias")

    finally:
        await source_pool.close()
        await target_engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
