"""
Vocari Backend - Servicio del recorrido movil.
"""

import uuid
from datetime import UTC, date, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.common.crypto import hash_token, new_secret_token
from app.common.exceptions import AuthenticationError, NotFoundError, ValidationError
from app.mobile.catalog import (
    ACHIEVEMENTS,
    ADULT_PATH_SLUG,
    ADULT_PATH_TITLE,
    JOURNEY_NODES,
    PLAN_TEMPLATES,
)
from app.mobile.deps import MobileActor
from app.mobile.models import (
    Achievement,
    ActionPlanItem,
    DevicePushToken,
    JourneyNode,
    LearningPath,
    MobileGuest,
    NodeAttempt,
    UserAchievement,
    UserJourney,
    UserStreak,
    XpLedger,
)
from app.mobile.schemas import (
    AchievementItem,
    AchievementsResponse,
    ActionPlanItemResponse,
    ActionPlanPatchRequest,
    ActionPlanResponse,
    JourneyNodeState,
    JourneyResponse,
    MobileGuestClaimResponse,
    MobileGuestCreateResponse,
    NextActionResponse,
    NodeAttemptRequest,
    NodeAttemptResponse,
    PushTokenRequest,
    PushTokenResponse,
    StreakResponse,
)


def _level_from_xp(xp_total: int) -> int:
    return 1 + xp_total // 50


async def _ensure_catalog(db: AsyncSession) -> tuple[LearningPath, list[JourneyNode]]:
    result = await db.execute(select(LearningPath).where(LearningPath.slug == ADULT_PATH_SLUG))
    path = result.scalar_one_or_none()
    if path is None:
        path = LearningPath(
            slug=ADULT_PATH_SLUG,
            audience="adult",
            version="v1",
            title=ADULT_PATH_TITLE,
            is_active=True,
        )
        db.add(path)
        await db.flush()

    nodes_result = await db.execute(
        select(JourneyNode).where(JourneyNode.path_id == path.id).order_by(JourneyNode.position)
    )
    nodes = list(nodes_result.scalars().all())
    if not nodes:
        for spec in JOURNEY_NODES:
            db.add(
                JourneyNode(
                    path_id=path.id,
                    slug=spec["slug"],
                    node_type=spec["node_type"],
                    title=spec["title"],
                    position=spec["position"],
                    prerequisites=spec["prerequisites"],
                    content_version="v1",
                    xp_reward=spec["xp_reward"],
                    estimated_minutes=spec["estimated_minutes"],
                )
            )
        await db.flush()
        nodes_result = await db.execute(
            select(JourneyNode).where(JourneyNode.path_id == path.id).order_by(JourneyNode.position)
        )
        nodes = list(nodes_result.scalars().all())

    existing_achievements = await db.execute(select(Achievement))
    if existing_achievements.scalars().first() is None:
        for spec in ACHIEVEMENTS:
            db.add(
                Achievement(
                    slug=spec["slug"],
                    title=spec["title"],
                    description=spec["description"],
                    version="v1",
                )
            )
        await db.flush()

    return path, nodes


async def _get_or_create_journey(
    db: AsyncSession,
    actor: MobileActor,
    path: LearningPath,
    first_node: JourneyNode,
) -> UserJourney:
    query = select(UserJourney).where(UserJourney.path_id == path.id)
    if actor.user is not None:
        query = query.where(UserJourney.user_id == actor.user.id)
    elif actor.guest is not None:
        query = query.where(UserJourney.guest_id == actor.guest.id)
    result = await db.execute(query)
    journey = result.scalar_one_or_none()
    if journey is not None:
        return journey

    journey = UserJourney(
        user_id=actor.user.id if actor.user is not None else None,
        guest_id=actor.guest.id if actor.guest is not None else None,
        path_id=path.id,
        current_node_id=first_node.id,
        status="in_progress",
    )
    db.add(journey)
    await db.flush()
    db.add(
        UserStreak(
            journey_id=journey.id,
            timezone=journey.timezone,
            current_days=0,
            best_days=0,
            freeze_available=True,
        )
    )
    await db.flush()
    return journey


async def _xp_total(db: AsyncSession, journey_id: uuid.UUID) -> int:
    result = await db.execute(
        select(func.coalesce(func.sum(XpLedger.amount), 0)).where(XpLedger.journey_id == journey_id)
    )
    return int(result.scalar_one())


async def _completed_slugs(db: AsyncSession, journey_id: uuid.UUID) -> set[str]:
    result = await db.execute(
        select(JourneyNode.slug)
        .join(NodeAttempt, NodeAttempt.node_id == JourneyNode.id)
        .where(NodeAttempt.journey_id == journey_id)
    )
    return set(result.scalars().all())


def _node_status(node: JourneyNode, completed: set[str], current_slug: str | None) -> str:
    if node.slug in completed:
        return "completado"
    prereqs = {str(item) for item in (node.prerequisites or [])}
    if not prereqs.issubset(completed):
        return "bloqueado"
    if current_slug == node.slug:
        return "en_curso"
    return "disponible"


def _to_node_state(
    node: JourneyNode,
    completed: set[str],
    current_slug: str | None,
) -> JourneyNodeState:
    return JourneyNodeState(
        id=node.id,
        slug=node.slug,
        node_type=node.node_type,
        title=node.title,
        position=node.position,
        status=_node_status(node, completed, current_slug),
        xp_reward=node.xp_reward,
        estimated_minutes=node.estimated_minutes,
        content_version=node.content_version,
    )


async def create_guest(db: AsyncSession) -> MobileGuestCreateResponse:
    path, nodes = await _ensure_catalog(db)
    raw_token = new_secret_token()
    guest = MobileGuest(token_hash=hash_token(raw_token))
    db.add(guest)
    await db.flush()
    actor = MobileActor(guest=guest)
    await _get_or_create_journey(db, actor, path, nodes[0])
    await db.commit()
    await db.refresh(guest)
    return MobileGuestCreateResponse(
        guest_id=guest.id,
        guest_token=raw_token,
        path_slug=path.slug,
        created_at=guest.created_at,
    )


async def claim_guest(
    db: AsyncSession,
    user: User,
    guest_token: str,
) -> MobileGuestClaimResponse:
    result = await db.execute(
        select(MobileGuest).where(
            MobileGuest.token_hash == hash_token(guest_token),
            MobileGuest.revoked_at.is_(None),
        )
    )
    guest = result.scalar_one_or_none()
    if guest is None:
        raise AuthenticationError("Invitado no valido")
    if guest.claimed_user_id is not None and guest.claimed_user_id != user.id:
        raise ValidationError("Este progreso ya fue reclamado por otra cuenta")

    now = datetime.now(UTC)
    guest.claimed_user_id = user.id
    guest.claimed_at = now

    journeys = await db.execute(select(UserJourney).where(UserJourney.guest_id == guest.id))
    claimed_journey: UserJourney | None = None
    for journey in journeys.scalars():
        if journey.user_id is None:
            journey.user_id = user.id
        claimed_journey = journey

    await db.commit()
    return MobileGuestClaimResponse(
        guest_id=guest.id,
        user_id=user.id,
        claimed_at=now,
        journey_id=claimed_journey.id if claimed_journey is not None else None,
    )


async def get_journey(db: AsyncSession, actor: MobileActor) -> JourneyResponse:
    path, nodes = await _ensure_catalog(db)
    journey = await _get_or_create_journey(db, actor, path, nodes[0])
    completed = await _completed_slugs(db, journey.id)
    xp_total = await _xp_total(db, journey.id)
    current = next((node for node in nodes if node.id == journey.current_node_id), nodes[0])
    await db.commit()
    return JourneyResponse(
        journey_id=journey.id,
        path_slug=path.slug,
        path_title=path.title,
        status=journey.status,
        version=journey.version,
        current_node_slug=current.slug,
        xp_total=xp_total,
        level=_level_from_xp(xp_total),
        nodes=[_to_node_state(node, completed, current.slug) for node in nodes],
    )


async def get_next_actions(db: AsyncSession, actor: MobileActor) -> NextActionResponse:
    journey = await get_journey(db, actor)
    next_node = next(
        (node for node in journey.nodes if node.status in {"disponible", "en_curso"}),
        None,
    )
    if next_node is None:
        message = "Ya completaste el recorrido. Revisa tu plan de 30 dias."
    else:
        message = f"Siguiente accion: {next_node.title} ({next_node.estimated_minutes} min)."
    return NextActionResponse(journey_id=journey.journey_id, node=next_node, message=message)


async def _grant_xp(
    db: AsyncSession,
    journey_id: uuid.UUID,
    event_type: str,
    event_id: str,
    amount: int,
) -> int:
    existing = await db.execute(
        select(XpLedger).where(
            XpLedger.journey_id == journey_id,
            XpLedger.event_type == event_type,
            XpLedger.event_id == event_id,
        )
    )
    if existing.scalar_one_or_none() is not None:
        return 0
    db.add(
        XpLedger(
            journey_id=journey_id,
            event_type=event_type,
            event_id=event_id,
            amount=amount,
        )
    )
    return amount


async def _grant_achievement(db: AsyncSession, journey_id: uuid.UUID, slug: str) -> None:
    achievement_result = await db.execute(select(Achievement).where(Achievement.slug == slug))
    achievement = achievement_result.scalar_one_or_none()
    if achievement is None:
        return
    existing = await db.execute(
        select(UserAchievement).where(
            UserAchievement.journey_id == journey_id,
            UserAchievement.achievement_id == achievement.id,
        )
    )
    if existing.scalar_one_or_none() is not None:
        return
    db.add(UserAchievement(journey_id=journey_id, achievement_id=achievement.id))


async def _touch_streak(db: AsyncSession, journey: UserJourney) -> None:
    result = await db.execute(select(UserStreak).where(UserStreak.journey_id == journey.id))
    streak = result.scalar_one_or_none()
    if streak is None:
        streak = UserStreak(journey_id=journey.id, timezone=journey.timezone)
        db.add(streak)
        await db.flush()
    today = datetime.now(UTC).date()
    if streak.last_active_date == today:
        return
    if streak.last_active_date == today - timedelta(days=1):
        streak.current_days += 1
    elif streak.last_active_date is None:
        streak.current_days = 1
    elif streak.freeze_available:
        streak.freeze_available = False
        streak.current_days += 1
    else:
        streak.current_days = 1
    streak.last_active_date = today
    streak.best_days = max(streak.best_days, streak.current_days)


async def _ensure_plan(db: AsyncSession, journey_id: uuid.UUID) -> None:
    existing = await db.execute(
        select(ActionPlanItem).where(ActionPlanItem.journey_id == journey_id)
    )
    if existing.scalars().first() is not None:
        return
    start = date.today()
    for index, title in enumerate(PLAN_TEMPLATES):
        db.add(
            ActionPlanItem(
                journey_id=journey_id,
                title=title,
                due_date=start + timedelta(days=7 * (index + 1)),
                status="pending",
                evidence_json={},
            )
        )


async def submit_node_attempt(
    db: AsyncSession,
    actor: MobileActor,
    node_id: uuid.UUID,
    idempotency_key: str,
    payload: NodeAttemptRequest,
) -> NodeAttemptResponse:
    path, nodes = await _ensure_catalog(db)
    journey = await _get_or_create_journey(db, actor, path, nodes[0])
    node = next((item for item in nodes if item.id == node_id), None)
    if node is None:
        raise NotFoundError("Nodo no encontrado")

    replay = await db.execute(
        select(NodeAttempt).where(
            NodeAttempt.journey_id == journey.id,
            NodeAttempt.idempotency_key == idempotency_key,
        )
    )
    existing_attempt = replay.scalar_one_or_none()
    if existing_attempt is not None:
        xp_total = await _xp_total(db, journey.id)
        completed = await _completed_slugs(db, journey.id)
        next_node = next(
            (item for item in nodes if _node_status(item, completed, None) == "disponible"),
            None,
        )
        return NodeAttemptResponse(
            journey_id=journey.id,
            node_id=node.id,
            node_slug=node.slug,
            status="completado",
            xp_awarded=0,
            xp_total=xp_total,
            result=existing_attempt.result_json,
            next_node_slug=next_node.slug if next_node is not None else None,
        )

    completed = await _completed_slugs(db, journey.id)
    status = _node_status(node, completed, None if node.slug in completed else node.slug)
    if status == "bloqueado":
        raise ValidationError("Este nodo todavia no esta disponible")

    result = {
        "signal_summary": payload.signal_summary
        or "Senal de exploracion registrada. No es un diagnostico ni un destino.",
        "hypothesis": True,
    }
    db.add(
        NodeAttempt(
            journey_id=journey.id,
            node_id=node.id,
            idempotency_key=idempotency_key,
            answers_json=payload.answers,
            result_json=result,
        )
    )
    xp_awarded = await _grant_xp(db, journey.id, "node_completed", str(node.id), node.xp_reward)
    await _touch_streak(db, journey)
    await _grant_achievement(db, journey.id, "primera-mision")
    if node.slug == "mapa":
        await _grant_achievement(db, journey.id, "comparar-rutas")
    if node.slug == "plan-30":
        await _grant_achievement(db, journey.id, "plan-iniciado")
        await _ensure_plan(db, journey.id)

    completed.add(node.slug)
    next_node = next(
        (item for item in nodes if _node_status(item, completed, None) == "disponible"),
        None,
    )
    journey.current_node_id = next_node.id if next_node is not None else node.id
    journey.version += 1
    if next_node is None:
        journey.status = "completed"
        journey.completed_at = datetime.now(UTC)
    await db.commit()
    xp_total = await _xp_total(db, journey.id)
    return NodeAttemptResponse(
        journey_id=journey.id,
        node_id=node.id,
        node_slug=node.slug,
        status="completado",
        xp_awarded=xp_awarded,
        xp_total=xp_total,
        result=result,
        next_node_slug=next_node.slug if next_node is not None else None,
    )


async def get_streak(db: AsyncSession, actor: MobileActor) -> StreakResponse:
    journey = await get_journey(db, actor)
    result = await db.execute(select(UserStreak).where(UserStreak.journey_id == journey.journey_id))
    streak = result.scalar_one_or_none()
    if streak is None:
        return StreakResponse(
            journey_id=journey.journey_id,
            current_days=0,
            best_days=0,
            last_active_date=None,
            freeze_available=True,
            timezone="America/Santiago",
        )
    return StreakResponse(
        journey_id=journey.journey_id,
        current_days=streak.current_days,
        best_days=streak.best_days,
        last_active_date=streak.last_active_date,
        freeze_available=streak.freeze_available,
        timezone=streak.timezone,
    )


async def get_achievements(db: AsyncSession, actor: MobileActor) -> AchievementsResponse:
    journey = await get_journey(db, actor)
    catalog = await db.execute(select(Achievement))
    granted = await db.execute(
        select(UserAchievement).where(UserAchievement.journey_id == journey.journey_id)
    )
    granted_by_id = {item.achievement_id: item.granted_at for item in granted.scalars()}
    items = [
        AchievementItem(
            slug=achievement.slug,
            title=achievement.title,
            description=achievement.description,
            granted_at=granted_by_id.get(achievement.id),
        )
        for achievement in catalog.scalars()
    ]
    return AchievementsResponse(journey_id=journey.journey_id, items=items)


async def get_action_plan(db: AsyncSession, actor: MobileActor) -> ActionPlanResponse:
    journey = await get_journey(db, actor)
    result = await db.execute(
        select(ActionPlanItem)
        .where(ActionPlanItem.journey_id == journey.journey_id)
        .order_by(ActionPlanItem.due_date)
    )
    items = [
        ActionPlanItemResponse(
            id=item.id,
            title=item.title,
            status=item.status,
            due_date=item.due_date,
            route_slug=item.route_slug,
            evidence_json=item.evidence_json,
        )
        for item in result.scalars()
    ]
    return ActionPlanResponse(journey_id=journey.journey_id, items=items)


async def patch_action_plan_item(
    db: AsyncSession,
    actor: MobileActor,
    item_id: uuid.UUID,
    payload: ActionPlanPatchRequest,
) -> ActionPlanItemResponse:
    journey = await get_journey(db, actor)
    result = await db.execute(
        select(ActionPlanItem).where(
            ActionPlanItem.id == item_id,
            ActionPlanItem.journey_id == journey.journey_id,
        )
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise NotFoundError("Accion no encontrada")
    item.status = payload.status
    item.evidence_json = payload.evidence_json
    if payload.due_date is not None:
        item.due_date = payload.due_date
    await db.commit()
    await db.refresh(item)
    return ActionPlanItemResponse(
        id=item.id,
        title=item.title,
        status=item.status,
        due_date=item.due_date,
        route_slug=item.route_slug,
        evidence_json=item.evidence_json,
    )


async def register_push_token(
    db: AsyncSession,
    actor: MobileActor,
    payload: PushTokenRequest,
) -> PushTokenResponse:
    token_hash = hash_token(payload.token)
    result = await db.execute(select(DevicePushToken).where(DevicePushToken.token_hash == token_hash))
    record = result.scalar_one_or_none()
    now = datetime.now(UTC)
    if record is None:
        record = DevicePushToken(
            user_id=actor.user.id if actor.user is not None else None,
            guest_id=actor.guest.id if actor.guest is not None else None,
            platform=payload.platform,
            token_hash=token_hash,
            locale=payload.locale,
            last_seen_at=now,
        )
        db.add(record)
    else:
        record.last_seen_at = now
        record.revoked_at = None
        record.locale = payload.locale
        record.platform = payload.platform
    await db.commit()
    await db.refresh(record)
    return PushTokenResponse(
        id=record.id,
        platform=record.platform,
        locale=record.locale,
        last_seen_at=record.last_seen_at,
    )


async def revoke_push_token(
    db: AsyncSession,
    actor: MobileActor,
    token_id: uuid.UUID,
) -> None:
    result = await db.execute(select(DevicePushToken).where(DevicePushToken.id == token_id))
    record = result.scalar_one_or_none()
    if record is None:
        raise NotFoundError("Token no encontrado")
    belongs = False
    if actor.user is not None and record.user_id == actor.user.id:
        belongs = True
    if actor.guest is not None and record.guest_id == actor.guest.id:
        belongs = True
    if not belongs:
        raise NotFoundError("Token no encontrado")
    record.revoked_at = datetime.now(UTC)
    await db.commit()
