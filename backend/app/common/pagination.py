"""
Vocari Backend - Utilidades de paginacion.
"""

from dataclasses import dataclass
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationParams(BaseModel):
    """Parametros de paginacion para queries."""

    page: int = Field(default=1, ge=1, description="Numero de pagina")
    per_page: int = Field(default=20, ge=1, le=100, description="Items por pagina")

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.per_page


@dataclass
class PaginatedResult(Generic[T]):
    """Resultado paginado generico."""

    items: list[T]
    total: int
    page: int
    per_page: int

    @property
    def total_pages(self) -> int:
        return (self.total + self.per_page - 1) // self.per_page if self.total > 0 else 0

    @property
    def has_next(self) -> bool:
        return self.page < self.total_pages

    @property
    def has_prev(self) -> bool:
        return self.page > 1

    def to_dict(self) -> dict[str, Any]:
        return {
            "items": self.items,
            "total": self.total,
            "page": self.page,
            "per_page": self.per_page,
            "total_pages": self.total_pages,
            "has_next": self.has_next,
            "has_prev": self.has_prev,
        }
