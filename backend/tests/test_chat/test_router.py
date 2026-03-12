"""
Tests de integracion para chat orientador con acciones CTA.
"""

from __future__ import annotations

import uuid

import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, UserRole
from app.institutions.models import Institution, InstitutionPlan
from app.leads.models import Lead  # noqa: F401
from app.sessions.models import Session  # noqa: F401


@pytest_asyncio.fixture
async def institution(db_session: AsyncSession) -> Institution:
    inst = Institution(
        id=uuid.uuid4(),
        name="Colegio Chat",
        slug=f"colegio-chat-{uuid.uuid4().hex[:6]}",
        plan=InstitutionPlan.FREE,
        max_students=100,
        is_active=True,
    )
    db_session.add(inst)
    await db_session.flush()
    return inst


@pytest_asyncio.fixture
async def estudiante(db_session: AsyncSession, institution: Institution) -> User:
    user = User(
        id=uuid.uuid4(),
        email=f"student-chat-{uuid.uuid4().hex[:8]}@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:12]}",
        name="Estudiante Chat",
        role=UserRole.ESTUDIANTE,
        institution_id=institution.id,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


class TestChatOrientadorRouter:
    async def test_chat_retorna_acciones_cta(self, client, estudiante: User, auth_headers):
        payload = {
            "messages": [
                {"role": "user", "content": "Estoy indeciso, no se que estudiar"},
            ],
            "student_context": True,
        }
        response = await client.post(
            "/api/v1/chat/orientador",
            json=payload,
            headers=auth_headers(estudiante),
        )
        assert response.status_code == 200
        body = response.json()
        assert "reply" in body
        assert "actions" in body
        assert isinstance(body["actions"], list)
        assert len(body["actions"]) >= 1
        assert "url" in body["actions"][0]
