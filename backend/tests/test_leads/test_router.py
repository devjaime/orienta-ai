"""
Tests de integración para endpoints de leads (flujo test gratis).
"""

from __future__ import annotations

import base64
import uuid

from app.leads.models import Lead  # noqa: F401


class TestLeadsRouter:
    async def test_flujo_completo_lead_test_encuesta_informe(self, client) -> None:
        submit_payload = {
            "nombre": "Camila Perez",
            "email": "camila.perez@test.cl",
            "source": "test_gratis",
            "holland_code": "ISA",
            "test_answers": {"1": 4, "2": 5, "3": 3},
            "metadata": {"step": "test_submitted"},
        }
        submit_res = await client.post("/api/v1/tests/submit", json=submit_payload)
        assert submit_res.status_code == 200
        submit_data = submit_res.json()
        assert submit_data["success"] is True
        assert submit_data["lead_id"]
        assert submit_data["share_token"]

        lead_id = submit_data["lead_id"]
        uuid.UUID(lead_id)

        survey_payload = {
            "survey_response": {
                "claridad_resultado": 4,
                "confianza_datos_mineduc": 5,
                "recomendaria_vocari": 4,
                "comentario": "Me sirvió para ordenar opciones",
            },
            "metadata": {"step": "survey_submitted"},
        }
        survey_res = await client.post(f"/api/v1/leads/{lead_id}/survey", json=survey_payload)
        assert survey_res.status_code == 200
        survey_data = survey_res.json()
        assert survey_data["success"] is True

        ai_payload = {
            "lead_id": lead_id,
            "nombre": "Camila Perez",
            "holland_code": "ISA",
            "recommendations": [],
            "survey_response": survey_payload["survey_response"],
        }
        ai_res = await client.post("/api/v1/leads/ai-report", json=ai_payload)
        assert ai_res.status_code == 200
        ai_data = ai_res.json()
        assert ai_data["success"] is True
        assert "Camila Perez" in ai_data["report_text"]

        report_res = await client.get(f"/api/v1/informe/{lead_id}")
        assert report_res.status_code == 200
        report_data = report_res.json()
        assert report_data["success"] is True
        assert report_data["nombre"] == "Camila Perez"
        assert report_data["email"] == "camila.perez@test.cl"
        assert report_data["holland_code"] == "ISA"
        assert report_data["survey_response"]["claridad_resultado"] == 4
        assert report_data["clarity_score"] == 4.0
        assert report_data["ai_report_text"] is not None

    async def test_revision_leads_requiere_basic_auth(self, client) -> None:
        unauth_res = await client.get("/api/v1/revision/leads")
        assert unauth_res.status_code == 401

        token = base64.b64encode(b"mvp-admin:vocari-mvp-2026").decode("utf-8")
        auth_res = await client.get(
            "/api/v1/revision/leads",
            headers={"Authorization": f"Basic {token}"},
        )
        assert auth_res.status_code == 200
        data = auth_res.json()
        assert data["success"] is True
        assert isinstance(data["items"], list)
