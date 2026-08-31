"""Tests del contrato movil /api/v1/mobile."""


async def _create_guest(client) -> tuple[dict, dict[str, str]]:
    response = await client.post("/api/v1/mobile/guests")
    assert response.status_code == 201
    body = response.json()
    headers = {"X-Vocari-Guest-Token": body["guest_token"]}
    return body, headers


class TestMobileRouter:
    async def test_guest_journey_and_idempotent_attempt(self, client) -> None:
        guest, headers = await _create_guest(client)
        assert guest["guest_token"]
        assert guest["path_slug"] == "adult-reconversion-v1"

        journey_response = await client.get("/api/v1/mobile/me/journey", headers=headers)
        assert journey_response.status_code == 200
        journey = journey_response.json()
        assert journey["xp_total"] == 0
        assert journey["nodes"][0]["status"] in {"disponible", "en_curso"}
        first_node = journey["nodes"][0]

        missing_key = await client.post(
            f"/api/v1/mobile/journey/nodes/{first_node['id']}/attempts",
            json={"answers": {"objetivo": "cambiar"}},
            headers=headers,
        )
        assert missing_key.status_code == 422

        attempt_headers = {**headers, "Idempotency-Key": "nodo-objetivo-1"}
        first = await client.post(
            f"/api/v1/mobile/journey/nodes/{first_node['id']}/attempts",
            json={"answers": {"objetivo": "cambiar"}},
            headers=attempt_headers,
        )
        second = await client.post(
            f"/api/v1/mobile/journey/nodes/{first_node['id']}/attempts",
            json={"answers": {"objetivo": "otra"}},
            headers=attempt_headers,
        )
        assert first.status_code == 200
        assert second.status_code == 200
        assert first.json()["xp_awarded"] > 0
        assert second.json() == first.json()

        after = await client.get("/api/v1/mobile/me/journey", headers=headers)
        assert after.json()["xp_total"] == first.json()["xp_total"]
        assert after.json()["nodes"][0]["status"] == "completado"

        next_actions = await client.get("/api/v1/mobile/me/next-actions", headers=headers)
        assert next_actions.status_code == 200
        assert next_actions.json()["node"]["slug"] == "diagnostico"

        streak = await client.get("/api/v1/mobile/me/streak", headers=headers)
        assert streak.status_code == 200
        assert streak.json()["current_days"] >= 1

        unauth = await client.get("/api/v1/mobile/me/journey")
        assert unauth.status_code == 401

    async def test_claim_guest_progress(
        self,
        client,
        sample_user,
        auth_headers,
    ) -> None:
        guest, headers = await _create_guest(client)
        journey = (await client.get("/api/v1/mobile/me/journey", headers=headers)).json()
        first_node = journey["nodes"][0]
        await client.post(
            f"/api/v1/mobile/journey/nodes/{first_node['id']}/attempts",
            json={"answers": {"objetivo": "explorar"}},
            headers={**headers, "Idempotency-Key": "claim-nodo-1"},
        )

        claim = await client.post(
            "/api/v1/mobile/guests/claim",
            json={"guest_token": guest["guest_token"]},
            headers=auth_headers(sample_user),
        )
        assert claim.status_code == 200
        assert claim.json()["user_id"] == str(sample_user.id)

        user_journey = await client.get(
            "/api/v1/mobile/me/journey",
            headers=auth_headers(sample_user),
        )
        assert user_journey.status_code == 200
        assert user_journey.json()["nodes"][0]["status"] == "completado"
        assert user_journey.json()["xp_total"] > 0
