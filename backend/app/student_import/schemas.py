"""
Vocari Backend - Schemas de Student Import (Pydantic).
"""

from pydantic import BaseModel, Field


class CSVRowPreview(BaseModel):
    """Vista previa de una fila del CSV."""

    row_number: int
    name: str
    email: str
    grade: str | None = None
    valid: bool = True
    errors: list[str] = Field(default_factory=list)


class CSVPreviewResponse(BaseModel):
    """Respuesta de vista previa del CSV."""

    total_rows: int
    valid_rows: int
    invalid_rows: int
    rows: list[CSVRowPreview]
    headers_detected: list[str]


class ImportResultRow(BaseModel):
    """Resultado de importacion de una fila."""

    row_number: int
    name: str
    email: str
    success: bool
    error: str | None = None
    activation_code: str | None = None


class ImportResponse(BaseModel):
    """Respuesta de importacion de estudiantes."""

    total_processed: int
    successful: int
    failed: int
    results: list[ImportResultRow]
