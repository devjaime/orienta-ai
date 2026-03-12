"""Tests para followups automáticos D0/D7/D21."""

from __future__ import annotations

import uuid

import pytest_asyncio
from sqlalchemy import select

from app.auth.models import User, UserRole
from app.followups.models import FollowupEvent, FollowupStatus
from app.institutions.models import Institution, InstitutionPlan
from app.leads.models import Lead as _LeadModel  # noqa: F401
from app.sessions.models import Session as _SessionModel  # noqa: F401
from app.tests_vocational.models import TestResult as _TestResultModel  # noqa: F401


@pytest_asyncio.fixture
async def institution(db_session) -> Institution:
    inst = Institution(
        id=uuid.uuid4(),
        name="Colegio Followups",
        slug=f"colegio-followups-{uuid.uuid4().hex[:6]}",
        plan=InstitutionPlan.FREE,
        max_students=200,
        is_active=True,
    )
    db_session.add(inst)
    await db_session.flush()
    return inst


@pytest_asyncio.fixture
async def admin(db_session, institution: Institution) -> User:
    user = User(
        id=uuid.uuid4(),
        email="admin.followups@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:8]}",
        name="Admin Followups",
        role=UserRole.ADMIN_COLEGIO,
        institution_id=institution.id,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def student(db_session, institution: Institution) -> User:
    user = User(
        id=uuid.uuid4(),
        email="lead.followups@test.cl",
        google_id=f"g-{uuid.uuid4().hex[:8]}",
        name="Estudiante Followups",
        role=UserRole.ESTUDIANTE,
        institution_id=institution.id,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


class TestFollowupsRouter:
    async def test_submit_test_programa_followups(
        self,
        client,
        db_session,
    ) -> None:
        response = await client.post(
            "/api/v1/tests/submit",
            json={
                "nombre": "Lead Followup",
                "email": "lead.followups@test.cl",
                "source": "test_gratis",
                "holland_code": "RIA",
                "test_answers": {"1": 5},
            },
        )
        assert response.status_code == 200
        data = response.json()
        lead_id = uuid.UUID(data["lead_id"])

        rows = (
            await db_session.execute(
                select(FollowupEvent).where(FollowupEvent.lead_id == lead_id)
            )
        ).scalars().all()
        assert len(rows) == 3
        assert {row.journey_step for row in rows} == {"D0", "D7", "D21"}

    async def test_list_and_process_followups(
        self,
        client,
        auth_headers,
        db_session,
        admin: User,
        student: User,
    ) -> None:
        await client.post(
            "/api/v1/tests/submit",
            json={
                "nombre": student.name,
                "email": student.email,
                "source": "test_gratis",
                "holland_code": "SIA",
                "test_answers": {"1": 4},
            },
        )

        list_res = await client.get(
            f"/api/v1/followups/{student.id}",
            headers=auth_headers(admin),
        )
        assert list_res.status_code == 200
        items = list_res.json()["items"]
        assert len(items) == 3

        # Fuerza D0 a pendiente de envío y procesa
        first_id = items[-1]["id"]
        d0 = (
            await db_session.execute(select(FollowupEvent).where(FollowupEvent.id == first_id))
        ).scalar_one()
        d0.status = FollowupStatus.SCHEDULED
        await db_session.flush()

        process_res = await client.post(
            "/api/v1/followups/process-due",
            headers=auth_headers(admin),
        )
        assert process_res.status_code == 200
        payload = process_res.json()
        assert payload["processed"] >= 1
