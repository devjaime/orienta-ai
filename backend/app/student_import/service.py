"""
Vocari Backend - Servicio de Student Import (CSV).

Procesa archivos CSV para importacion masiva de estudiantes.
Genera codigos de activacion para cada estudiante.
"""

import csv
import io
import re
import secrets
import uuid

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, UserRole
from app.student_import.schemas import (
    CSVPreviewResponse,
    CSVRowPreview,
    ImportResponse,
    ImportResultRow,
)

logger = structlog.get_logger()

# Columnas esperadas (flexibles, case-insensitive)
_NAME_ALIASES = {"nombre", "name", "nombre_completo", "nombre completo", "alumno"}
_EMAIL_ALIASES = {"email", "correo", "correo_electronico", "correo electronico", "mail"}
_GRADE_ALIASES = {"curso", "grade", "nivel", "grado"}

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


def _generate_activation_code() -> str:
    """Genera un codigo de activacion de 8 caracteres alfanumericos."""
    return secrets.token_urlsafe(6)[:8].upper()


def _detect_columns(headers: list[str]) -> dict[str, int | None]:
    """Detecta las columnas del CSV basandose en aliases."""
    lower_headers = [h.strip().lower() for h in headers]
    mapping: dict[str, int | None] = {"name": None, "email": None, "grade": None}

    for i, header in enumerate(lower_headers):
        if header in _NAME_ALIASES:
            mapping["name"] = i
        elif header in _EMAIL_ALIASES:
            mapping["email"] = i
        elif header in _GRADE_ALIASES:
            mapping["grade"] = i

    return mapping


def _validate_row(
    row: list[str],
    col_map: dict[str, int | None],
    row_number: int,
) -> CSVRowPreview:
    """Valida una fila del CSV."""
    errors: list[str] = []

    name_idx = col_map["name"]
    email_idx = col_map["email"]
    grade_idx = col_map["grade"]

    name = row[name_idx].strip() if name_idx is not None and name_idx < len(row) else ""
    email = row[email_idx].strip() if email_idx is not None and email_idx < len(row) else ""
    grade = row[grade_idx].strip() if grade_idx is not None and grade_idx < len(row) else None

    if not name:
        errors.append("Nombre es obligatorio")
    elif len(name) < 2:
        errors.append("Nombre debe tener al menos 2 caracteres")

    if not email:
        errors.append("Email es obligatorio")
    elif not EMAIL_REGEX.match(email):
        errors.append("Email no es valido")

    return CSVRowPreview(
        row_number=row_number,
        name=name,
        email=email,
        grade=grade,
        valid=len(errors) == 0,
        errors=errors,
    )


async def preview_csv(
    content: str,
) -> CSVPreviewResponse:
    """Procesa un CSV y retorna una vista previa con validacion."""
    reader = csv.reader(io.StringIO(content))
    rows = list(reader)

    if not rows:
        return CSVPreviewResponse(
            total_rows=0,
            valid_rows=0,
            invalid_rows=0,
            rows=[],
            headers_detected=[],
        )

    headers = rows[0]
    col_map = _detect_columns(headers)

    # Verificar columnas requeridas
    if col_map["name"] is None or col_map["email"] is None:
        # Intentar sin header (si la primera fila parece datos)
        if EMAIL_REGEX.match(headers[1].strip()) if len(headers) > 1 else False:
            col_map = {"name": 0, "email": 1, "grade": 2 if len(headers) > 2 else None}
            data_rows = rows
        else:
            return CSVPreviewResponse(
                total_rows=0,
                valid_rows=0,
                invalid_rows=0,
                rows=[],
                headers_detected=headers,
            )
    else:
        data_rows = rows[1:]

    previews: list[CSVRowPreview] = []
    for i, row in enumerate(data_rows, start=1):
        if not any(cell.strip() for cell in row):
            continue  # Saltar filas vacias
        preview = _validate_row(row, col_map, i)
        previews.append(preview)

    valid_count = sum(1 for p in previews if p.valid)
    invalid_count = sum(1 for p in previews if not p.valid)

    return CSVPreviewResponse(
        total_rows=len(previews),
        valid_rows=valid_count,
        invalid_rows=invalid_count,
        rows=previews,
        headers_detected=headers,
    )


async def import_students(
    db: AsyncSession,
    content: str,
    institution_id: uuid.UUID,
) -> ImportResponse:
    """
    Importa estudiantes desde un CSV.

    Para cada fila valida:
    1. Verifica que el email no exista
    2. Crea el usuario con rol estudiante
    3. Genera un codigo de activacion (como google_id temporal)
    """
    preview = await preview_csv(content)
    results: list[ImportResultRow] = []
    successful = 0
    failed = 0

    for row_preview in preview.rows:
        if not row_preview.valid:
            results.append(
                ImportResultRow(
                    row_number=row_preview.row_number,
                    name=row_preview.name,
                    email=row_preview.email,
                    success=False,
                    error="; ".join(row_preview.errors),
                )
            )
            failed += 1
            continue

        # Verificar que el email no exista
        existing_q = select(User).where(User.email == row_preview.email)
        existing_result = await db.execute(existing_q)
        if existing_result.scalar_one_or_none():
            results.append(
                ImportResultRow(
                    row_number=row_preview.row_number,
                    name=row_preview.name,
                    email=row_preview.email,
                    success=False,
                    error="Ya existe un usuario con este email",
                )
            )
            failed += 1
            continue

        # Crear usuario con codigo de activacion como google_id temporal
        activation_code = _generate_activation_code()
        user = User(
            id=uuid.uuid4(),
            email=row_preview.email,
            google_id=f"pending_{activation_code}",
            name=row_preview.name,
            role=UserRole.ESTUDIANTE,
            institution_id=institution_id,
            is_active=True,
        )
        db.add(user)

        try:
            await db.flush()
            results.append(
                ImportResultRow(
                    row_number=row_preview.row_number,
                    name=row_preview.name,
                    email=row_preview.email,
                    success=True,
                    activation_code=activation_code,
                )
            )
            successful += 1
        except Exception as e:
            results.append(
                ImportResultRow(
                    row_number=row_preview.row_number,
                    name=row_preview.name,
                    email=row_preview.email,
                    success=False,
                    error=str(e),
                )
            )
            failed += 1

    logger.info(
        "Importacion de estudiantes completada",
        institution_id=str(institution_id),
        total=len(results),
        successful=successful,
        failed=failed,
    )

    return ImportResponse(
        total_processed=len(results),
        successful=successful,
        failed=failed,
        results=results,
    )
