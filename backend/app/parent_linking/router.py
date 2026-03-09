"""
Vocari Backend - Router de Parent-Student Linking.

Endpoints para crear, verificar y listar vinculos apoderado-estudiante.
"""

import uuid

from fastapi import APIRouter, Depends

from app.auth.middleware import get_current_user
from app.auth.models import User, UserRole
from app.auth.permissions import require_roles
from app.common.database import get_async_session
from app.parent_linking.schemas import (
    LinkCreateRequest,
    LinkListResponse,
    LinkVerifyRequest,
    ParentStudentLinkResponse,
)
from app.parent_linking.service import (
    create_link,
    delete_link,
    list_links_for_parent,
    list_pending_links,
    verify_link,
)

router = APIRouter()


@router.post("", response_model=ParentStudentLinkResponse, status_code=201)
async def create_parent_student_link(
    data: LinkCreateRequest,
    user: User = Depends(require_roles(UserRole.APODERADO)),
    db=Depends(get_async_session),
) -> ParentStudentLinkResponse:
    """Crea una solicitud de vinculacion con un estudiante. Solo apoderados."""
    link = await create_link(db, user, data.student_email)
    return _link_to_response(link)


@router.get("/my-links", response_model=LinkListResponse)
async def list_my_links(
    user: User = Depends(require_roles(UserRole.APODERADO)),
    db=Depends(get_async_session),
) -> LinkListResponse:
    """Lista los vinculos del apoderado autenticado."""
    links = await list_links_for_parent(db, user.id)
    return LinkListResponse(
        items=[_link_to_response(link) for link in links],
        total=len(links),
    )


@router.get("/pending", response_model=LinkListResponse)
async def list_pending(
    user: User = Depends(
        require_roles(UserRole.ORIENTADOR, UserRole.ADMIN_COLEGIO, UserRole.SUPER_ADMIN)
    ),
    db=Depends(get_async_session),
) -> LinkListResponse:
    """Lista vinculos pendientes de verificacion. Admin/orientador/super admin."""
    institution_id = None if user.role == UserRole.SUPER_ADMIN else user.institution_id
    links = await list_pending_links(db, institution_id)
    return LinkListResponse(
        items=[_link_to_response(link) for link in links],
        total=len(links),
    )


@router.post("/verify", response_model=ParentStudentLinkResponse)
async def verify_parent_student_link(
    data: LinkVerifyRequest,
    user: User = Depends(
        require_roles(UserRole.ORIENTADOR, UserRole.ADMIN_COLEGIO, UserRole.SUPER_ADMIN)
    ),
    db=Depends(get_async_session),
) -> ParentStudentLinkResponse:
    """Verifica un vinculo apoderado-estudiante. Admin/orientador/super admin."""
    link = await verify_link(db, data.link_id, user)
    return _link_to_response(link)


@router.delete("/{link_id}", status_code=204)
async def delete_parent_student_link(
    link_id: uuid.UUID,
    user: User = Depends(
        require_roles(UserRole.APODERADO, UserRole.ADMIN_COLEGIO, UserRole.SUPER_ADMIN)
    ),
    db=Depends(get_async_session),
) -> None:
    """Elimina un vinculo. Apoderado solo sus propios vinculos."""
    await delete_link(db, link_id, user)


def _link_to_response(link: object) -> ParentStudentLinkResponse:
    """Convierte un ParentStudentLink a su schema de respuesta."""
    # Acceder a relaciones cargadas (lazy='selectin' en modelo)
    parent_name = getattr(link, "parent", None)
    student_name = getattr(link, "student", None)

    return ParentStudentLinkResponse(
        id=link.id,  # type: ignore[attr-defined]
        parent_id=link.parent_id,  # type: ignore[attr-defined]
        student_id=link.student_id,  # type: ignore[attr-defined]
        verified=link.verified,  # type: ignore[attr-defined]
        created_at=link.created_at,  # type: ignore[attr-defined]
        parent_name=parent_name.name if parent_name else None,
        parent_email=parent_name.email if parent_name else None,
        student_name=student_name.name if student_name else None,
        student_email=student_name.email if student_name else None,
    )
