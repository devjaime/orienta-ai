# Vocari Mobile — Contrato API v1

> Fuente canónica de implementación: FastAPI `/docs` y módulos `backend/app/mobile` y `backend/app/reconversion`.
> Versionado bajo `/api/v1`.

## Autenticación

| Header | Uso |
|---|---|
| `X-Vocari-Guest-Token` | Invitado recuperable. Se entrega en `POST /mobile/guests`. |
| `Authorization: Bearer` | Cuenta Vocari (Google/Apple vía backend). |
| `X-Vocari-Edit-Token` | Edición de una sesión de reconversión web. Distinto del `share_token`. |
| `Idempotency-Key` | Obligatorio en `POST /mobile/journey/nodes/{id}/attempts`. Opcional en escrituras de reconversión. |

Errores: `{ "error": { "code", "message", "details?" }, "request_id" }`.

## Mobile

| Método | Ruta | DTO respuesta |
|---|---|---|
| POST | `/api/v1/mobile/guests` | `MobileGuestCreateResponse` |
| POST | `/api/v1/mobile/guests/claim` | `MobileGuestClaimResponse` |
| GET | `/api/v1/mobile/me/journey` | `JourneyResponse` |
| GET | `/api/v1/mobile/me/next-actions` | `NextActionResponse` |
| POST | `/api/v1/mobile/journey/nodes/{node_id}/attempts` | `NodeAttemptResponse` |
| GET | `/api/v1/mobile/me/streak` | `StreakResponse` |
| GET | `/api/v1/mobile/me/achievements` | `AchievementsResponse` |
| GET | `/api/v1/mobile/me/action-plan` | `ActionPlanResponse` |
| PATCH | `/api/v1/mobile/me/action-plan/{item_id}` | `ActionPlanItemResponse` |
| POST | `/api/v1/mobile/me/push-tokens` | `PushTokenResponse` |
| DELETE | `/api/v1/mobile/me/push-tokens/{token_id}` | 204 |

Estados de nodo: `bloqueado`, `disponible`, `en_curso`, `completado`.

XP y progreso canónicos viven en servidor. Un reintento con la misma `Idempotency-Key` no duplica XP.

## Reconversión pública

| Método | Ruta | Auth |
|---|---|---|
| POST | `/api/v1/reconversion/sessions` | Rate limit. Devuelve `edit_token` una vez. |
| GET/POST | `/api/v1/reconversion/sessions/{id}...` | `X-Vocari-Edit-Token` |
| GET | `/api/v1/reconversion/public/{share_token}` | Solo informe. Sin email ni edición. |
