"""
Vocari Backend - Modelo de Leads.
"""

from sqlalchemy import String
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.common.base_model import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Lead(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Lead capturado desde landings y flujos de test."""

    __tablename__ = "leads"

    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    whatsapp: Mapped[str | None] = mapped_column(String(30), nullable=True)
    interes: Mapped[str] = mapped_column(String(100), nullable=False, default="carreras")
    source: Mapped[str] = mapped_column(String(100), nullable=False, default="web")
    holland_code: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    test_answers: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    survey_response: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    metadata: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    def __repr__(self) -> str:
        return f"<Lead {self.email} source={self.source}>"
