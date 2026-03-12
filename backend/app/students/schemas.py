"""
Vocari Backend - Schemas de next actions para estudiantes.
"""

from pydantic import BaseModel, Field


class NextActionItem(BaseModel):
    """Accion recomendada para el siguiente paso del estudiante."""

    action_type: str = Field(..., description="game|test|chat|careers")
    target_url: str
    label: str
    reason: str
    priority: int = Field(..., ge=1, le=3)


class NextActionsResponse(BaseModel):
    """Respuesta con acciones recomendadas ordenadas por prioridad."""

    items: list[NextActionItem]

