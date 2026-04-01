"""
Tests de integracion para el flujo inicial de reconversion vocacional.
"""

from app.reconversion.models import (  # noqa: F401
    AdultReconversionPhaseResult,
    AdultReconversionReport,
    AdultReconversionSession,
)


def _phase_one_answers() -> dict[int, int]:
    return {question_id: ((question_id - 1) % 5) + 1 for question_id in range(1, 31)}


def _phase_two_answers() -> dict[int, str]:
    base = ["energiza", "neutral", "drena"]
    return {scenario_id: base[(scenario_id - 1) % 3] for scenario_id in range(1, 13)}


def _phase_three_answers() -> dict[int, int]:
    pattern = [5, 4, 4, 5, 3, 4, 5, 4, 4, 5, 5, 4]
    return {
        question_id: pattern[question_id - 1]
        for question_id in range(1, 13)
    }


def _phase_four_answers() -> dict[int, str]:
    pattern = ["c", "b", "a", "b", "a", "b", "b", "c"]
    return {
        scenario_id: pattern[scenario_id - 1]
        for scenario_id in range(1, 9)
    }


class TestReconversionRouter:
    async def test_create_session(self, client) -> None:
        payload = {
            "nombre": "Carla Fuentes",
            "email": "carla@example.com",
            "profesion_actual": "Contadora",
            "edad": 34,
            "pais": "Chile",
            "ciudad": "Santiago",
            "nivel_educativo": "Universitario",
            "nivel_ingles": "Basico",
            "situacion_actual": "empleada",
        }

        response = await client.post("/api/v1/reconversion/sessions", json=payload)
        assert response.status_code == 201

        body = response.json()
        assert body["nombre"] == "Carla Fuentes"
        assert body["email"] == "carla@example.com"
        assert body["current_phase"] == 0
        assert body["share_token"]

    async def test_submit_phase_one_and_retrieve_session(self, client) -> None:
        create_response = await client.post(
            "/api/v1/reconversion/sessions",
            json={
                "nombre": "Pablo Rojas",
                "email": "pablo@example.com",
                "profesion_actual": "Vendedor retail",
                "edad": 41,
            },
        )
        session_id = create_response.json()["id"]

        phase_response = await client.post(
            f"/api/v1/reconversion/sessions/{session_id}/phase-1",
            json={"answers": _phase_one_answers()},
        )
        assert phase_response.status_code == 200
        phase_body = phase_response.json()
        assert phase_body["current_phase"] == 1
        assert phase_body["phase_key"] == "phase_1"
        assert len(phase_body["summary"]["top_dimensions"]) == 3

        detail_response = await client.get(f"/api/v1/reconversion/sessions/{session_id}")
        assert detail_response.status_code == 200
        detail_body = detail_response.json()
        assert "phase_1" in detail_body["completed_phases"]
        assert detail_body["phase_1_summary"] is not None

    async def test_submit_phase_two_and_retrieve_session(self, client) -> None:
        create_response = await client.post(
            "/api/v1/reconversion/sessions",
            json={
                "nombre": "Camila Soto",
                "email": "camila@example.com",
                "profesion_actual": "Analista administrativa",
                "edad": 36,
            },
        )
        session_id = create_response.json()["id"]

        await client.post(
            f"/api/v1/reconversion/sessions/{session_id}/phase-1",
            json={"answers": _phase_one_answers()},
        )

        phase_two_response = await client.post(
            f"/api/v1/reconversion/sessions/{session_id}/phase-2",
            json={"answers": _phase_two_answers()},
        )
        assert phase_two_response.status_code == 200
        phase_two_body = phase_two_response.json()
        assert phase_two_body["current_phase"] == 2
        assert phase_two_body["phase_key"] == "phase_2"
        assert "challenge_readout" in phase_two_body["summary"]

        detail_response = await client.get(f"/api/v1/reconversion/sessions/{session_id}")
        assert detail_response.status_code == 200
        detail_body = detail_response.json()
        assert "phase_2" in detail_body["completed_phases"]
        assert detail_body["phase_2_summary"] is not None

    async def test_phase_one_rejects_invalid_answer_count(self, client) -> None:
        create_response = await client.post(
            "/api/v1/reconversion/sessions",
            json={
                "nombre": "Mariana Lopez",
                "email": "mariana@example.com",
                "profesion_actual": "Secretaria",
                "edad": 38,
            },
        )
        session_id = create_response.json()["id"]

        invalid_answers = {question_id: 3 for question_id in range(1, 12)}
        response = await client.post(
            f"/api/v1/reconversion/sessions/{session_id}/phase-1",
            json={"answers": invalid_answers},
        )
        assert response.status_code == 422

    async def test_phase_two_rejects_invalid_values(self, client) -> None:
        create_response = await client.post(
            "/api/v1/reconversion/sessions",
            json={
                "nombre": "Jorge Diaz",
                "email": "jorge@example.com",
                "profesion_actual": "Tecnico en terreno",
                "edad": 40,
            },
        )
        session_id = create_response.json()["id"]

        invalid_answers = {scenario_id: "otra_cosa" for scenario_id in range(1, 13)}
        response = await client.post(
            f"/api/v1/reconversion/sessions/{session_id}/phase-2",
            json={"answers": invalid_answers},
        )
        assert response.status_code == 422

    async def test_submit_phase_three_and_retrieve_session(self, client) -> None:
        create_response = await client.post(
            "/api/v1/reconversion/sessions",
            json={
                "nombre": "Daniela Mella",
                "email": "daniela@example.com",
                "profesion_actual": "Asistente comercial",
                "edad": 37,
            },
        )
        session_id = create_response.json()["id"]

        await client.post(
            f"/api/v1/reconversion/sessions/{session_id}/phase-1",
            json={"answers": _phase_one_answers()},
        )
        await client.post(
            f"/api/v1/reconversion/sessions/{session_id}/phase-2",
            json={"answers": _phase_two_answers()},
        )

        phase_three_response = await client.post(
            f"/api/v1/reconversion/sessions/{session_id}/phase-3",
            json={"answers": _phase_three_answers()},
        )
        assert phase_three_response.status_code == 200
        phase_three_body = phase_three_response.json()
        assert phase_three_body["current_phase"] == 3
        assert phase_three_body["phase_key"] == "phase_3"
        assert "confidence_score" in phase_three_body["summary"]

        detail_response = await client.get(f"/api/v1/reconversion/sessions/{session_id}")
        assert detail_response.status_code == 200
        detail_body = detail_response.json()
        assert "phase_3" in detail_body["completed_phases"]
        assert detail_body["phase_3_summary"] is not None

    async def test_phase_three_requires_phase_two(self, client) -> None:
        create_response = await client.post(
            "/api/v1/reconversion/sessions",
            json={
                "nombre": "Marcela Perez",
                "email": "marcela@example.com",
                "profesion_actual": "Secretaria ejecutiva",
                "edad": 42,
            },
        )
        session_id = create_response.json()["id"]

        await client.post(
            f"/api/v1/reconversion/sessions/{session_id}/phase-1",
            json={"answers": _phase_one_answers()},
        )

        response = await client.post(
            f"/api/v1/reconversion/sessions/{session_id}/phase-3",
            json={"answers": _phase_three_answers()},
        )
        assert response.status_code == 422

    async def test_submit_phase_four_and_retrieve_session(self, client) -> None:
        create_response = await client.post(
            "/api/v1/reconversion/sessions",
            json={
                "nombre": "Paula Herrera",
                "email": "paula@example.com",
                "profesion_actual": "Encargada de operaciones",
                "edad": 39,
                "nivel_ingles": "Basico",
                "disponibilidad_para_estudiar": "media",
                "disponibilidad_para_relocalizarse": "regional",
            },
        )
        session_id = create_response.json()["id"]

        await client.post(
            f"/api/v1/reconversion/sessions/{session_id}/phase-1",
            json={"answers": _phase_one_answers()},
        )
        await client.post(
            f"/api/v1/reconversion/sessions/{session_id}/phase-2",
            json={"answers": _phase_two_answers()},
        )
        await client.post(
            f"/api/v1/reconversion/sessions/{session_id}/phase-3",
            json={"answers": _phase_three_answers()},
        )

        phase_four_response = await client.post(
            f"/api/v1/reconversion/sessions/{session_id}/phase-4",
            json={"answers": _phase_four_answers()},
        )
        assert phase_four_response.status_code == 200
        phase_four_body = phase_four_response.json()
        assert phase_four_body["current_phase"] == 4
        assert phase_four_body["phase_key"] == "phase_4"
        assert "change_readiness" in phase_four_body["summary"]
        assert "tradeoff_profile" in phase_four_body["summary"]

        detail_response = await client.get(f"/api/v1/reconversion/sessions/{session_id}")
        assert detail_response.status_code == 200
        detail_body = detail_response.json()
        assert "phase_4" in detail_body["completed_phases"]
        assert detail_body["phase_4_summary"] is not None

    async def test_phase_four_requires_phase_three(self, client) -> None:
        create_response = await client.post(
            "/api/v1/reconversion/sessions",
            json={
                "nombre": "Elisa Contreras",
                "email": "elisa@example.com",
                "profesion_actual": "Ejecutiva de ventas",
                "edad": 35,
            },
        )
        session_id = create_response.json()["id"]

        await client.post(
            f"/api/v1/reconversion/sessions/{session_id}/phase-1",
            json={"answers": _phase_one_answers()},
        )
        await client.post(
            f"/api/v1/reconversion/sessions/{session_id}/phase-2",
            json={"answers": _phase_two_answers()},
        )

        response = await client.post(
            f"/api/v1/reconversion/sessions/{session_id}/phase-4",
            json={"answers": _phase_four_answers()},
        )
        assert response.status_code == 422

    async def test_generate_and_fetch_public_report(self, client) -> None:
        create_response = await client.post(
            "/api/v1/reconversion/sessions",
            json={
                "nombre": "Andrea Silva",
                "email": "andrea@example.com",
                "profesion_actual": "Administrativa comercial",
                "edad": 38,
                "nivel_ingles": "Basico",
                "disponibilidad_para_estudiar": "media",
                "disponibilidad_para_relocalizarse": "regional",
                "ingreso_actual_aprox": 950000,
            },
        )
        session_body = create_response.json()
        session_id = session_body["id"]
        share_token = session_body["share_token"]

        await client.post(
            f"/api/v1/reconversion/sessions/{session_id}/phase-1",
            json={"answers": _phase_one_answers()},
        )
        await client.post(
            f"/api/v1/reconversion/sessions/{session_id}/phase-2",
            json={"answers": _phase_two_answers()},
        )
        await client.post(
            f"/api/v1/reconversion/sessions/{session_id}/phase-3",
            json={"answers": _phase_three_answers()},
        )
        await client.post(
            f"/api/v1/reconversion/sessions/{session_id}/phase-4",
            json={"answers": _phase_four_answers()},
        )

        generate_response = await client.post(
            f"/api/v1/reconversion/sessions/{session_id}/generate-report",
        )
        assert generate_response.status_code == 200
        generate_body = generate_response.json()
        assert generate_body["share_token"] == share_token
        assert generate_body["public_url"].endswith(share_token)
        assert len(generate_body["report"]["rutas_recomendadas"]) == 3
        assert len(generate_body["report"]["grafico_bienestar_ingreso"]) == 3

        public_response = await client.get(
            f"/api/v1/reconversion/public/{share_token}",
        )
        assert public_response.status_code == 200
        public_body = public_response.json()
        assert public_body["share_token"] == share_token
        assert public_body["session"]["nombre"] == "Andrea Silva"
        assert public_body["report"]["resumen_personalizado"]

    async def test_generate_report_requires_phase_four(self, client) -> None:
        create_response = await client.post(
            "/api/v1/reconversion/sessions",
            json={
                "nombre": "Rocio Marin",
                "email": "rocio@example.com",
                "profesion_actual": "Asistente de operaciones",
                "edad": 34,
            },
        )
        session_id = create_response.json()["id"]

        await client.post(
            f"/api/v1/reconversion/sessions/{session_id}/phase-1",
            json={"answers": _phase_one_answers()},
        )
        await client.post(
            f"/api/v1/reconversion/sessions/{session_id}/phase-2",
            json={"answers": _phase_two_answers()},
        )
        await client.post(
            f"/api/v1/reconversion/sessions/{session_id}/phase-3",
            json={"answers": _phase_three_answers()},
        )

        response = await client.post(
            f"/api/v1/reconversion/sessions/{session_id}/generate-report",
        )
        assert response.status_code == 422

    async def test_list_review_reports_for_orientador(
        self,
        client,
        sample_orientador,
        auth_headers,
    ) -> None:
        create_response = await client.post(
            "/api/v1/reconversion/sessions",
            json={
                "nombre": "Patricia Nunez",
                "email": "patricia@example.com",
                "profesion_actual": "Coordinadora academica",
                "edad": 43,
                "nivel_ingles": "Intermedio",
                "disponibilidad_para_estudiar": "alta",
                "disponibilidad_para_relocalizarse": "ninguna",
                "ingreso_actual_aprox": 1250000,
            },
        )
        session_body = create_response.json()
        session_id = session_body["id"]

        await client.post(
            f"/api/v1/reconversion/sessions/{session_id}/phase-1",
            json={"answers": _phase_one_answers()},
        )
        await client.post(
            f"/api/v1/reconversion/sessions/{session_id}/phase-2",
            json={"answers": _phase_two_answers()},
        )
        await client.post(
            f"/api/v1/reconversion/sessions/{session_id}/phase-3",
            json={"answers": _phase_three_answers()},
        )
        await client.post(
            f"/api/v1/reconversion/sessions/{session_id}/phase-4",
            json={"answers": _phase_four_answers()},
        )
        await client.post(
            f"/api/v1/reconversion/sessions/{session_id}/generate-report",
        )

        response = await client.get(
            "/api/v1/reconversion/review/reports?search=patricia",
            headers=auth_headers(sample_orientador),
        )
        assert response.status_code == 200

        body = response.json()
        assert body["total"] >= 1
        assert len(body["items"]) >= 1
        matching_item = next(
            item
            for item in body["items"]
            if item["session_id"] == session_id
        )
        assert matching_item["nombre"] == "Patricia Nunez"
        assert matching_item["public_url"].endswith(session_body["share_token"])
        assert matching_item["top_routes"]
