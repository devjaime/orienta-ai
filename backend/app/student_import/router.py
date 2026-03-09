"""
Vocari Backend - Router de Student Import (CSV).

Endpoints para preview e importacion masiva de estudiantes via CSV.
"""

from fastapi import APIRouter, Depends, UploadFile

from app.auth.models import User, UserRole
from app.auth.permissions import require_roles
from app.common.database import get_async_session
from app.common.exceptions import ValidationError
from app.student_import.schemas import CSVPreviewResponse, ImportResponse
from app.student_import.service import import_students, preview_csv

router = APIRouter()

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


@router.post("/preview", response_model=CSVPreviewResponse)
async def preview_csv_upload(
    file: UploadFile,
    user: User = Depends(
        require_roles(UserRole.ADMIN_COLEGIO, UserRole.SUPER_ADMIN)
    ),
) -> CSVPreviewResponse:
    """
    Sube un CSV y retorna una vista previa con validacion.
    No crea ningun registro en la base de datos.
    """
    _validate_upload(file)
    content = (await file.read()).decode("utf-8-sig")
    return await preview_csv(content)


@router.post("/import", response_model=ImportResponse)
async def import_csv_students(
    file: UploadFile,
    user: User = Depends(
        require_roles(UserRole.ADMIN_COLEGIO, UserRole.SUPER_ADMIN)
    ),
    db=Depends(get_async_session),
) -> ImportResponse:
    """
    Importa estudiantes desde un CSV.

    El admin debe usar /preview primero para validar el archivo.
    Solo admin de colegio y super admin pueden importar.
    """
    _validate_upload(file)

    institution_id = user.institution_id
    if user.role == UserRole.SUPER_ADMIN and not institution_id:
        raise ValidationError(
            "Super admin debe especificar una institucion para importar estudiantes"
        )

    if not institution_id:
        raise ValidationError("No perteneces a ninguna institucion")

    content = (await file.read()).decode("utf-8-sig")
    return await import_students(db, content, institution_id)


def _validate_upload(file: UploadFile) -> None:
    """Valida el archivo subido."""
    if not file.filename:
        raise ValidationError("El archivo debe tener un nombre")

    if not file.filename.endswith(".csv"):
        raise ValidationError("Solo se aceptan archivos CSV (.csv)")

    if file.content_type and file.content_type not in (
        "text/csv",
        "application/vnd.ms-excel",
        "text/plain",
    ):
        raise ValidationError(f"Tipo de archivo no soportado: {file.content_type}")
