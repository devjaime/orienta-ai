"""
Vocari Backend - Router de Games.
"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.common.database import get_async_session
from app.common.pagination import PaginatedResult, PaginationParams
from app.games import schemas as game_schemas
from app.games import service

router = APIRouter()


@router.get("", response_model=list[game_schemas.GameResponse])
async def list_games(
    db: AsyncSession = Depends(get_async_session),
    include_inactive: bool = Query(False, description="Incluir juegos inactivos"),
    current_user: User = Depends(get_current_user),
) -> list[game_schemas.GameResponse]:
    """Lista todos los juegos disponibles."""
    games = await service.list_games(db, include_inactive)
    return games


@router.get("/{game_id}", response_model=game_schemas.GameResponse)
async def get_game(
    game_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
) -> game_schemas.GameResponse:
    """Obtiene un juego por ID."""
    game = await service.get_game_by_id(db, game_id)
    return game


@router.get("/slug/{slug}", response_model=game_schemas.GameResponse)
async def get_game_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
) -> game_schemas.GameResponse:
    """Obtiene un juego por slug."""
    game = await service.get_game_by_slug(db, slug)
    return game


@router.post("/start", response_model=game_schemas.GameSessionStartResponse)
async def start_game_session(
    game_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
) -> game_schemas.GameSessionStartResponse:
    """Inicia una sesion de juego."""
    if not current_user.institution_id:
        raise ValueError("Usuario sin institucion asignada")

    game = await service.get_game_by_id(db, game_id)
    return game_schemas.GameSessionStartResponse(
        session_id=uuid.uuid4(),
        game=game,
        started_at=datetime.now(timezone.utc),
    )


@router.post("/submit", response_model=game_schemas.GameResultResponse)
async def submit_game_result(
    result_data: game_schemas.GameResultCreate,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
) -> game_schemas.GameResultResponse:
    """Envía el resultado de un juego."""
    if not current_user.institution_id:
        raise ValueError("Usuario sin institucion asignada")

    skills_scores = service.calculate_skills_scores(
        result_data.game_id, result_data.metrics.model_dump()
    )

    result = await service.create_game_result(
        db=db,
        student_id=current_user.id,
        institution_id=current_user.institution_id,
        game_id=result_data.game_id,
        metrics=result_data.metrics.model_dump(),
        skills_scores=skills_scores,
        duration_seconds=result_data.duration_seconds,
    )
    return result


@router.get("/results/my", response_model=game_schemas.GameResultListResponse)
async def get_my_game_results(
    game_id: uuid.UUID | None = Query(None, description="Filtrar por juego"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
) -> game_schemas.GameResultListResponse:
    """Obtiene los resultados de juegos del estudiante actual."""
    results, total = await service.get_student_game_results(
        db, current_user.id, game_id, page, per_page
    )
    return game_schemas.GameResultListResponse(
        items=results,
        total=total,
        page=page,
        per_page=per_page,
    )
