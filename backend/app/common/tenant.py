"""
Vocari Backend - Utilidades Multi-Tenant.

Funciones para filtrar queries por institucion del usuario.
"""

from uuid import UUID

from sqlalchemy import Select


def apply_tenant_filter(
    query: Select,  # type: ignore[type-arg]
    column: object,
    institution_id: UUID | None,
) -> Select:  # type: ignore[type-arg]
    """
    Aplica filtro de institucion a una query SQLAlchemy.

    Si institution_id es None (super_admin), no filtra.
    """
    if institution_id is not None:
        query = query.where(column == institution_id)  # type: ignore[arg-type]
    return query
