"""
Tests para el modulo de notifications: service y router.
"""

from __future__ import annotations

import uuid

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, UserRole
from app.notifications.models import Notification, NotificationType
from app.notifications.service import (
    create_notification,
    delete_notification,
    dispatch_notification,
    get_notification_by_id,
    get_unread_count,
    list_notifications,
    mark_all_as_read,
    mark_as_read,
)
from app.notifications.schemas import NotificationCreate
from app.common.exceptions import NotFoundError
from app.common.pagination import PaginationParams


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def estudiante(db_session: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        email=f"est-notif-{uuid.uuid4().hex[:6]}@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:12]}",
        name="Estudiante Notif",
        role=UserRole.ESTUDIANTE,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def otro_usuario(db_session: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        email=f"otro-{uuid.uuid4().hex[:6]}@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:12]}",
        name="Otro Usuario",
        role=UserRole.ORIENTADOR,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def sample_notification(db_session: AsyncSession, estudiante: User) -> Notification:
    notif = Notification(
        user_id=estudiante.id,
        notification_type=NotificationType.GENERAL,
        title="Notificacion de prueba",
        message="Este es un mensaje de prueba",
        extra_data={"key": "value"},
    )
    db_session.add(notif)
    await db_session.flush()
    return notif


# ---------------------------------------------------------------------------
# Service Tests: create_notification
# ---------------------------------------------------------------------------


class TestCreateNotification:
    async def test_crea_notificacion_basica(
        self, db_session: AsyncSession, estudiante: User,
    ):
        data = NotificationCreate(
            user_id=estudiante.id,
            notification_type=NotificationType.SESSION_SCHEDULED,
            title="Sesion programada",
            message="Tu sesion esta programada para manana",
        )
        notif = await create_notification(db_session, data)

        assert notif.id is not None
        assert notif.user_id == estudiante.id
        assert notif.notification_type == NotificationType.SESSION_SCHEDULED
        assert notif.title == "Sesion programada"
        assert notif.is_read is False

    async def test_crea_con_extra_data(
        self, db_session: AsyncSession, estudiante: User,
    ):
        data = NotificationCreate(
            user_id=estudiante.id,
            title="Con datos extra",
            message="Mensaje con metadata",
            extra_data={"session_id": "abc-123"},
        )
        notif = await create_notification(db_session, data)
        assert notif.extra_data == {"session_id": "abc-123"}

    async def test_tipo_por_defecto_es_general(
        self, db_session: AsyncSession, estudiante: User,
    ):
        data = NotificationCreate(
            user_id=estudiante.id,
            title="Sin tipo",
            message="Mensaje sin tipo explicito",
        )
        notif = await create_notification(db_session, data)
        assert notif.notification_type == NotificationType.GENERAL


# ---------------------------------------------------------------------------
# Service Tests: dispatch_notification
# ---------------------------------------------------------------------------


class TestDispatchNotification:
    async def test_dispatch_crea_notificacion(
        self, db_session: AsyncSession, estudiante: User,
    ):
        notif = await dispatch_notification(
            db_session,
            user_id=estudiante.id,
            notification_type=NotificationType.TEST_COMPLETED,
            title="Test completado",
            message="Has completado el test RIASEC",
            extra_data={"test_type": "riasec"},
        )
        assert notif.id is not None
        assert notif.title == "Test completado"
        assert notif.extra_data == {"test_type": "riasec"}

    async def test_dispatch_sin_extra_data(
        self, db_session: AsyncSession, estudiante: User,
    ):
        notif = await dispatch_notification(
            db_session,
            user_id=estudiante.id,
            notification_type=NotificationType.GENERAL,
            title="Simple",
            message="Sin extra data",
        )
        assert notif.extra_data == {}


# ---------------------------------------------------------------------------
# Service Tests: list_notifications
# ---------------------------------------------------------------------------


class TestListNotifications:
    async def test_lista_notificaciones_usuario(
        self, db_session: AsyncSession, estudiante: User, sample_notification: Notification,
    ):
        pagination = PaginationParams(page=1, per_page=20)
        result = await list_notifications(db_session, estudiante.id, pagination)

        assert result.total >= 1
        assert len(result.items) >= 1
        assert result.items[0].user_id == estudiante.id

    async def test_no_muestra_de_otro_usuario(
        self, db_session: AsyncSession, otro_usuario: User, sample_notification: Notification,
    ):
        pagination = PaginationParams(page=1, per_page=20)
        result = await list_notifications(db_session, otro_usuario.id, pagination)
        assert result.total == 0

    async def test_filtra_solo_no_leidas(
        self, db_session: AsyncSession, estudiante: User,
    ):
        # Crear una leida y una no leida
        leida = Notification(
            user_id=estudiante.id,
            notification_type=NotificationType.GENERAL,
            title="Leida",
            message="Ya la lei",
            is_read=True,
        )
        no_leida = Notification(
            user_id=estudiante.id,
            notification_type=NotificationType.GENERAL,
            title="No leida",
            message="Aun no la leo",
            is_read=False,
        )
        db_session.add_all([leida, no_leida])
        await db_session.flush()

        pagination = PaginationParams(page=1, per_page=20)
        result = await list_notifications(db_session, estudiante.id, pagination, unread_only=True)

        assert result.total == 1
        assert result.items[0].title == "No leida"

    async def test_paginacion(
        self, db_session: AsyncSession, estudiante: User,
    ):
        for i in range(5):
            db_session.add(Notification(
                user_id=estudiante.id,
                notification_type=NotificationType.GENERAL,
                title=f"Notif {i}",
                message=f"Mensaje {i}",
            ))
        await db_session.flush()

        pagination = PaginationParams(page=1, per_page=2)
        result = await list_notifications(db_session, estudiante.id, pagination)
        assert result.total == 5
        assert len(result.items) == 2


# ---------------------------------------------------------------------------
# Service Tests: get_unread_count
# ---------------------------------------------------------------------------


class TestGetUnreadCount:
    async def test_cuenta_no_leidas(
        self, db_session: AsyncSession, estudiante: User, sample_notification: Notification,
    ):
        count = await get_unread_count(db_session, estudiante.id)
        assert count == 1  # sample_notification es no leida por defecto

    async def test_cero_si_todas_leidas(
        self, db_session: AsyncSession, estudiante: User,
    ):
        notif = Notification(
            user_id=estudiante.id,
            notification_type=NotificationType.GENERAL,
            title="Leida",
            message="Ya leida",
            is_read=True,
        )
        db_session.add(notif)
        await db_session.flush()

        count = await get_unread_count(db_session, estudiante.id)
        assert count == 0


# ---------------------------------------------------------------------------
# Service Tests: mark_as_read / mark_all_as_read
# ---------------------------------------------------------------------------


class TestMarkAsRead:
    async def test_marca_una_como_leida(
        self, db_session: AsyncSession, estudiante: User, sample_notification: Notification,
    ):
        updated = await mark_as_read(
            db_session, estudiante.id, [sample_notification.id]
        )
        assert updated == 1

        count = await get_unread_count(db_session, estudiante.id)
        assert count == 0

    async def test_no_marca_de_otro_usuario(
        self, db_session: AsyncSession, otro_usuario: User, sample_notification: Notification,
    ):
        updated = await mark_as_read(
            db_session, otro_usuario.id, [sample_notification.id]
        )
        assert updated == 0

    async def test_marca_todas_como_leidas(
        self, db_session: AsyncSession, estudiante: User,
    ):
        for i in range(3):
            db_session.add(Notification(
                user_id=estudiante.id,
                notification_type=NotificationType.GENERAL,
                title=f"N {i}",
                message=f"M {i}",
            ))
        await db_session.flush()

        updated = await mark_all_as_read(db_session, estudiante.id)
        assert updated == 3

        count = await get_unread_count(db_session, estudiante.id)
        assert count == 0


# ---------------------------------------------------------------------------
# Service Tests: get_notification_by_id / delete_notification
# ---------------------------------------------------------------------------


class TestGetAndDelete:
    async def test_obtiene_por_id(
        self, db_session: AsyncSession, estudiante: User, sample_notification: Notification,
    ):
        notif = await get_notification_by_id(
            db_session, sample_notification.id, estudiante.id
        )
        assert notif.id == sample_notification.id

    async def test_not_found_si_otro_usuario(
        self, db_session: AsyncSession, otro_usuario: User, sample_notification: Notification,
    ):
        with pytest.raises(NotFoundError):
            await get_notification_by_id(
                db_session, sample_notification.id, otro_usuario.id
            )

    async def test_not_found_si_no_existe(
        self, db_session: AsyncSession, estudiante: User,
    ):
        with pytest.raises(NotFoundError):
            await get_notification_by_id(
                db_session, uuid.uuid4(), estudiante.id
            )

    async def test_elimina_notificacion(
        self, db_session: AsyncSession, estudiante: User, sample_notification: Notification,
    ):
        await delete_notification(
            db_session, sample_notification.id, estudiante.id
        )
        with pytest.raises(NotFoundError):
            await get_notification_by_id(
                db_session, sample_notification.id, estudiante.id
            )


# ---------------------------------------------------------------------------
# Router Tests
# ---------------------------------------------------------------------------


class TestNotificationsRouter:
    async def test_list_200(
        self, client, estudiante: User, sample_notification: Notification, auth_headers,
    ):
        headers = auth_headers(estudiante)
        resp = await client.get("/api/v1/notifications", headers=headers)
        assert resp.status_code == 200
        body = resp.json()
        assert body["total"] >= 1
        assert "items" in body
        assert "unread_count" in body

    async def test_unread_count_200(
        self, client, estudiante: User, sample_notification: Notification, auth_headers,
    ):
        headers = auth_headers(estudiante)
        resp = await client.get("/api/v1/notifications/unread-count", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["unread_count"] >= 1

    async def test_mark_read_200(
        self, client, estudiante: User, sample_notification: Notification, auth_headers,
    ):
        headers = auth_headers(estudiante)
        resp = await client.post(
            "/api/v1/notifications/mark-read",
            json={"notification_ids": [str(sample_notification.id)]},
            headers=headers,
        )
        assert resp.status_code == 200
        assert resp.json()["updated"] == 1

    async def test_mark_all_read_200(
        self, client, estudiante: User, sample_notification: Notification, auth_headers,
    ):
        headers = auth_headers(estudiante)
        resp = await client.post(
            "/api/v1/notifications/mark-all-read",
            headers=headers,
        )
        assert resp.status_code == 200
        assert "updated" in resp.json()

    async def test_sin_auth_401(self, client):
        resp = await client.get("/api/v1/notifications")
        assert resp.status_code == 401

        resp2 = await client.get("/api/v1/notifications/unread-count")
        assert resp2.status_code == 401
