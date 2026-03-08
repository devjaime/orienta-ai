"""
Vocari Backend - Alembic async environment configuration.

Soporta migraciones async con asyncpg.
"""

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.common.base_model import Base

# Importar todos los modelos para que Alembic detecte las tablas.
# Los modulos que aun no existen se importan condicionalmente.
import app.auth.models  # noqa: F401
import app.institutions.models  # noqa: F401

import app.sessions.models  # noqa: F401
import app.tests_vocational.models  # noqa: F401
import app.games.models  # noqa: F401
import app.careers.models  # noqa: F401
import app.profiles.models  # noqa: F401
import app.consent.models  # noqa: F401
import app.audit.models  # noqa: F401
import app.ai_engine.cost_tracking  # noqa: F401  (AIUsageLog model)

# Alembic Config object
config = context.config

# Configurar logging desde alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata para autogenerate
target_metadata = Base.metadata


def get_database_url() -> str:
    """Obtiene la URL de la base de datos, priorizando app.config sobre alembic.ini."""
    try:
        from app.config import get_settings

        settings = get_settings()
        return settings.database_url
    except Exception:
        url = config.get_main_option("sqlalchemy.url")
        if url is None:
            raise RuntimeError(
                "No se pudo obtener database_url ni de app.config ni de alembic.ini"
            )
        return url


def run_migrations_offline() -> None:
    """Ejecuta migraciones en modo 'offline'.

    Genera SQL sin conectarse a la base de datos.
    """
    url = get_database_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Ejecuta migraciones con una conexion activa."""
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Ejecuta migraciones en modo async."""
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = get_database_url()

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Ejecuta migraciones en modo 'online' (async)."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
