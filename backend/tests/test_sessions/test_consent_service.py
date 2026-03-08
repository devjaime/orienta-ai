"""
Tests del servicio de consent — grant, revoke, verify, permissions.

Usa BD real (testcontainers PostgreSQL).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import ParentStudentLink, User, UserRole
from app.common.exceptions import AuthorizationError, ConsentRequiredError
from app.consent.models import ConsentMethod, ConsentRecord, ConsentType
from app.consent.schemas import ConsentGrantType
from app.consent.service import (
    get_consent_status,
    grant_consent,
    require_consent_for_session,
    revoke_consent,
    verify_consent_for_session,
)
from app.institutions.models import Institution, InstitutionPlan


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def institution(db_session: AsyncSession) -> Institution:
    inst = Institution(
        id=uuid.uuid4(),
        name="Colegio Consent Test",
        slug=f"col-consent-{uuid.uuid4().hex[:6]}",
        plan=InstitutionPlan.FREE,
        max_students=50,
        is_active=True,
    )
    db_session.add(inst)
    await db_session.flush()
    return inst


@pytest_asyncio.fixture
async def estudiante(db_session: AsyncSession, institution: Institution) -> User:
    user = User(
        id=uuid.uuid4(),
        email=f"est-consent-{uuid.uuid4().hex[:6]}@test.cl",
        google_id=f"google-{uuid.uuid4().hex[:12]}",
        name="Estudiante Consent",
        role=UserRole.ESTUDIANTE,
        institution_id=institution.id,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def apoderado(db_session: AsyncSession, institution: Institution) -> User:
    user = User(
        id=uuid.uuid4(),
        email=f"apod-{uuid.uuid4().hex[:6]}@test.cl",
        google_id=f"google-{uuid.uuid4().hex[:12]}",
        name="Apoderado Test",
        role=UserRole.APODERADO,
        institution_id=institution.id,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def admin(db_session: AsyncSession, institution: Institution) -> User:
    user = User(
        id=uuid.uuid4(),
        email=f"admin-consent-{uuid.uuid4().hex[:6]}@test.cl",
        google_id=f"google-{uuid.uuid4().hex[:12]}",
        name="Admin Consent",
        role=UserRole.SUPER_ADMIN,
        institution_id=institution.id,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def parent_student_link(
    db_session: AsyncSession, apoderado: User, estudiante: User
) -> ParentStudentLink:
    """Vinculo verificado apoderado-estudiante."""
    link = ParentStudentLink(
        parent_id=apoderado.id,
        student_id=estudiante.id,
        verified=True,
    )
    db_session.add(link)
    await db_session.flush()
    return link


# ===========================================================================
# Tests: grant_consent
# ===========================================================================


class TestGrantConsent:
    """Tests para otorgar consentimiento."""

    @pytest.mark.asyncio
    async def test_estudiante_otorga_su_propio_consentimiento(
        self, db_session: AsyncSession, estudiante: User
    ):
        """Estudiante otorga consentimiento de grabacion para si mismo."""
        records = await grant_consent(
            db_session,
            granting_user=estudiante,
            student_id=estudiante.id,
            consent_type=ConsentGrantType.RECORDING,
            method=ConsentMethod.DIGITAL,
            ip_address="127.0.0.1",
        )

        assert len(records) == 1
        assert records[0].consent_type == ConsentType.RECORDING
        assert records[0].granted is True
        assert records[0].student_id == estudiante.id

    @pytest.mark.asyncio
    async def test_otorgar_all_crea_tres_registros(
        self, db_session: AsyncSession, estudiante: User
    ):
        """ConsentGrantType.ALL crea registros de recording, ai_processing, data_storage."""
        records = await grant_consent(
            db_session,
            granting_user=estudiante,
            student_id=estudiante.id,
            consent_type=ConsentGrantType.ALL,
            method=ConsentMethod.DIGITAL,
            ip_address="127.0.0.1",
        )

        assert len(records) == 3
        types = {r.consent_type for r in records}
        assert types == {
            ConsentType.RECORDING,
            ConsentType.AI_PROCESSING,
            ConsentType.DATA_STORAGE,
        }

    @pytest.mark.asyncio
    async def test_apoderado_otorga_para_hijo_con_vinculo(
        self,
        db_session: AsyncSession,
        apoderado: User,
        estudiante: User,
        parent_student_link: ParentStudentLink,
    ):
        """Apoderado con vinculo verificado otorga consentimiento para su hijo."""
        records = await grant_consent(
            db_session,
            granting_user=apoderado,
            student_id=estudiante.id,
            consent_type=ConsentGrantType.RECORDING,
            method=ConsentMethod.DIGITAL,
            ip_address="192.168.1.1",
        )

        assert len(records) == 1
        assert records[0].granted_by == apoderado.id
        assert records[0].student_id == estudiante.id

    @pytest.mark.asyncio
    async def test_apoderado_sin_vinculo_lanza_error(
        self, db_session: AsyncSession, apoderado: User, estudiante: User
    ):
        """Apoderado SIN vinculo verificado no puede otorgar consentimiento."""
        with pytest.raises(AuthorizationError, match="No tienes un vinculo verificado"):
            await grant_consent(
                db_session,
                granting_user=apoderado,
                student_id=estudiante.id,
                consent_type=ConsentGrantType.RECORDING,
                method=ConsentMethod.DIGITAL,
                ip_address="127.0.0.1",
            )

    @pytest.mark.asyncio
    async def test_admin_puede_otorgar_para_cualquier_estudiante(
        self, db_session: AsyncSession, admin: User, estudiante: User
    ):
        """Super admin puede otorgar consentimiento para cualquier estudiante."""
        records = await grant_consent(
            db_session,
            granting_user=admin,
            student_id=estudiante.id,
            consent_type=ConsentGrantType.ALL,
            method=ConsentMethod.PHYSICAL,
            ip_address="10.0.0.1",
        )

        assert len(records) == 3

    @pytest.mark.asyncio
    async def test_otorgar_revoca_registro_anterior(
        self, db_session: AsyncSession, estudiante: User
    ):
        """Otorgar consentimiento revoca registro anterior del mismo tipo."""
        # Primer grant
        records1 = await grant_consent(
            db_session,
            granting_user=estudiante,
            student_id=estudiante.id,
            consent_type=ConsentGrantType.RECORDING,
            method=ConsentMethod.DIGITAL,
            ip_address="127.0.0.1",
        )
        first_id = records1[0].id

        # Segundo grant (debe revocar el primero)
        records2 = await grant_consent(
            db_session,
            granting_user=estudiante,
            student_id=estudiante.id,
            consent_type=ConsentGrantType.RECORDING,
            method=ConsentMethod.DIGITAL,
            ip_address="127.0.0.2",
        )

        assert records2[0].id != first_id

    @pytest.mark.asyncio
    async def test_estudiante_no_puede_otorgar_para_otro(
        self, db_session: AsyncSession, estudiante: User, institution: Institution
    ):
        """Estudiante no puede otorgar consentimiento para otro estudiante."""
        otro = User(
            id=uuid.uuid4(),
            email=f"otro-est-{uuid.uuid4().hex[:6]}@test.cl",
            google_id=f"google-{uuid.uuid4().hex[:12]}",
            name="Otro Estudiante",
            role=UserRole.ESTUDIANTE,
            institution_id=institution.id,
            is_active=True,
        )
        db_session.add(otro)
        await db_session.flush()

        # Estudiante intenta otorgar para si mismo (resolve_student_id lo fuerza)
        # El student_id se resuelve a estudiante.id, no a otro.id
        records = await grant_consent(
            db_session,
            granting_user=estudiante,
            student_id=otro.id,  # sera ignorado, se usa estudiante.id
            consent_type=ConsentGrantType.RECORDING,
            method=ConsentMethod.DIGITAL,
            ip_address="127.0.0.1",
        )

        # Se crea para el propio estudiante, no para otro
        assert records[0].student_id == estudiante.id

    @pytest.mark.asyncio
    async def test_orientador_no_puede_otorgar_consentimiento(
        self, db_session: AsyncSession, estudiante: User, institution: Institution
    ):
        """Orientador no tiene permiso para otorgar consentimiento."""
        orientador = User(
            id=uuid.uuid4(),
            email=f"orient-consent-{uuid.uuid4().hex[:6]}@test.cl",
            google_id=f"google-{uuid.uuid4().hex[:12]}",
            name="Orientador",
            role=UserRole.ORIENTADOR,
            institution_id=institution.id,
            is_active=True,
        )
        db_session.add(orientador)
        await db_session.flush()

        with pytest.raises(AuthorizationError, match="Rol no autorizado"):
            await grant_consent(
                db_session,
                granting_user=orientador,
                student_id=estudiante.id,
                consent_type=ConsentGrantType.RECORDING,
                method=ConsentMethod.DIGITAL,
                ip_address="127.0.0.1",
            )


# ===========================================================================
# Tests: revoke_consent
# ===========================================================================


class TestRevokeConsent:
    """Tests para revocar consentimiento."""

    @pytest.mark.asyncio
    async def test_revoca_consentimiento(
        self, db_session: AsyncSession, estudiante: User
    ):
        """Revocar consentimiento de grabacion."""
        # Primero otorgar
        await grant_consent(
            db_session,
            granting_user=estudiante,
            student_id=estudiante.id,
            consent_type=ConsentGrantType.RECORDING,
            method=ConsentMethod.DIGITAL,
            ip_address="127.0.0.1",
        )

        # Revocar
        data_deletion = await revoke_consent(
            db_session,
            revoking_user=estudiante,
            student_id=estudiante.id,
            consent_type=ConsentGrantType.RECORDING,
        )

        assert data_deletion is False  # Solo fue recording, no data_storage

    @pytest.mark.asyncio
    async def test_revocar_data_storage_programa_eliminacion(
        self, db_session: AsyncSession, estudiante: User
    ):
        """Revocar data_storage marca data_deletion_scheduled como True."""
        await grant_consent(
            db_session,
            granting_user=estudiante,
            student_id=estudiante.id,
            consent_type=ConsentGrantType.DATA_STORAGE,
            method=ConsentMethod.DIGITAL,
            ip_address="127.0.0.1",
        )

        data_deletion = await revoke_consent(
            db_session,
            revoking_user=estudiante,
            student_id=estudiante.id,
            consent_type=ConsentGrantType.DATA_STORAGE,
        )

        assert data_deletion is True

    @pytest.mark.asyncio
    async def test_revocar_all_programa_eliminacion(
        self, db_session: AsyncSession, estudiante: User
    ):
        """Revocar ALL incluye data_storage, marca eliminacion."""
        await grant_consent(
            db_session,
            granting_user=estudiante,
            student_id=estudiante.id,
            consent_type=ConsentGrantType.ALL,
            method=ConsentMethod.DIGITAL,
            ip_address="127.0.0.1",
        )

        data_deletion = await revoke_consent(
            db_session,
            revoking_user=estudiante,
            student_id=estudiante.id,
            consent_type=ConsentGrantType.ALL,
        )

        assert data_deletion is True


# ===========================================================================
# Tests: get_consent_status
# ===========================================================================


class TestGetConsentStatus:
    """Tests para consultar estado de consentimiento."""

    @pytest.mark.asyncio
    async def test_sin_consentimiento(
        self, db_session: AsyncSession, estudiante: User
    ):
        """Sin registros, todos los flags en False."""
        status = await get_consent_status(db_session, estudiante.id)

        assert status["recording_consent"] is False
        assert status["ai_processing_consent"] is False
        assert status["data_storage_consent"] is False
        assert status["consent_date"] is None

    @pytest.mark.asyncio
    async def test_con_consentimiento_parcial(
        self, db_session: AsyncSession, estudiante: User
    ):
        """Con solo recording, solo ese flag en True."""
        await grant_consent(
            db_session,
            granting_user=estudiante,
            student_id=estudiante.id,
            consent_type=ConsentGrantType.RECORDING,
            method=ConsentMethod.DIGITAL,
            ip_address="127.0.0.1",
        )

        status = await get_consent_status(db_session, estudiante.id)

        assert status["recording_consent"] is True
        assert status["ai_processing_consent"] is False
        assert status["data_storage_consent"] is False
        assert status["consent_date"] is not None

    @pytest.mark.asyncio
    async def test_con_consentimiento_completo(
        self, db_session: AsyncSession, estudiante: User
    ):
        """Con ALL, todos los flags en True."""
        await grant_consent(
            db_session,
            granting_user=estudiante,
            student_id=estudiante.id,
            consent_type=ConsentGrantType.ALL,
            method=ConsentMethod.DIGITAL,
            ip_address="127.0.0.1",
        )

        status = await get_consent_status(db_session, estudiante.id)

        assert status["recording_consent"] is True
        assert status["ai_processing_consent"] is True
        assert status["data_storage_consent"] is True

    @pytest.mark.asyncio
    async def test_consentimiento_revocado_no_aparece(
        self, db_session: AsyncSession, estudiante: User
    ):
        """Despues de revocar, el flag vuelve a False."""
        await grant_consent(
            db_session,
            granting_user=estudiante,
            student_id=estudiante.id,
            consent_type=ConsentGrantType.RECORDING,
            method=ConsentMethod.DIGITAL,
            ip_address="127.0.0.1",
        )

        await revoke_consent(
            db_session,
            revoking_user=estudiante,
            student_id=estudiante.id,
            consent_type=ConsentGrantType.RECORDING,
        )

        status = await get_consent_status(db_session, estudiante.id)
        assert status["recording_consent"] is False


# ===========================================================================
# Tests: verify_consent_for_session / require_consent_for_session
# ===========================================================================


class TestVerifyConsentForSession:
    """Tests para verificacion de consentimiento pre-sesion."""

    @pytest.mark.asyncio
    async def test_sin_consentimiento_retorna_false(
        self, db_session: AsyncSession, estudiante: User
    ):
        """Sin consentimiento, verify retorna False."""
        result = await verify_consent_for_session(db_session, estudiante.id)
        assert result is False

    @pytest.mark.asyncio
    async def test_solo_recording_retorna_false(
        self, db_session: AsyncSession, estudiante: User
    ):
        """Solo recording no es suficiente (falta ai_processing)."""
        await grant_consent(
            db_session,
            granting_user=estudiante,
            student_id=estudiante.id,
            consent_type=ConsentGrantType.RECORDING,
            method=ConsentMethod.DIGITAL,
            ip_address="127.0.0.1",
        )

        result = await verify_consent_for_session(db_session, estudiante.id)
        assert result is False

    @pytest.mark.asyncio
    async def test_recording_y_ai_processing_retorna_true(
        self, db_session: AsyncSession, estudiante: User
    ):
        """Recording + AI processing es suficiente para sesion."""
        for ct in [ConsentGrantType.RECORDING, ConsentGrantType.AI_PROCESSING]:
            await grant_consent(
                db_session,
                granting_user=estudiante,
                student_id=estudiante.id,
                consent_type=ct,
                method=ConsentMethod.DIGITAL,
                ip_address="127.0.0.1",
            )

        result = await verify_consent_for_session(db_session, estudiante.id)
        assert result is True

    @pytest.mark.asyncio
    async def test_require_sin_consentimiento_lanza_error(
        self, db_session: AsyncSession, estudiante: User
    ):
        """require_consent_for_session lanza ConsentRequiredError si no hay consentimiento."""
        with pytest.raises(ConsentRequiredError):
            await require_consent_for_session(db_session, estudiante.id)

    @pytest.mark.asyncio
    async def test_require_con_consentimiento_no_lanza(
        self, db_session: AsyncSession, estudiante: User
    ):
        """require_consent_for_session no lanza si hay consentimiento completo."""
        for ct in [ConsentGrantType.RECORDING, ConsentGrantType.AI_PROCESSING]:
            await grant_consent(
                db_session,
                granting_user=estudiante,
                student_id=estudiante.id,
                consent_type=ct,
                method=ConsentMethod.DIGITAL,
                ip_address="127.0.0.1",
            )

        # No debe lanzar
        await require_consent_for_session(db_session, estudiante.id)
