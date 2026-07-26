# Vocari Mobile — Especificación de arquitectura v1

> Fecha: 25 de julio de 2026
> Dependencia: `vocari-mobile-product-spec-v1.md`

## 1. Decisión de repositorios

Crear `vocari-mobile` como repositorio Flutter independiente y conservar API, base de datos y paneles en `orienta-ai`.

Motivos:

- ciclos de publicación distintos para web, App Store y Google Play;
- firma, secretos y pipelines móviles aislados;
- dependencias Dart separadas de Node y Python;
- ownership y rollback móvil independientes;
- backend único para evitar duplicar scoring y datos.

## 2. Arquitectura objetivo

```text
Flutter iOS/Android
  ├─ almacenamiento local cifrado
  ├─ caché de misiones
  ├─ analítica y crash reporting
  └─ API REST /api/v1
          │
          ▼
FastAPI existente
  ├─ auth móvil e invitados
  ├─ reconversión
  ├─ journey y gamificación
  ├─ carreras y datos laborales
  ├─ informes
  └─ notificaciones
          │
          ▼
PostgreSQL + Redis + workers
```

## 3. Stack Flutter recomendado

- Flutter estable y Dart estable fijados por versión.
- Riverpod para estado e inyección.
- GoRouter para navegación declarativa.
- Dio para HTTP, interceptores y refresh token.
- Freezed y `json_serializable` para contratos.
- Drift para caché local y cola offline.
- `flutter_secure_storage` para credenciales.
- Rive para animaciones interactivas.
- Firebase Cloud Messaging para push.
- Sentry o Crashlytics para errores.

## 4. Estructura del cliente

```text
lib/
├── app/
│   ├── bootstrap/
│   ├── router/
│   └── theme/
├── core/
│   ├── analytics/
│   ├── api/
│   ├── auth/
│   ├── storage/
│   ├── sync/
│   └── widgets/
├── features/
│   ├── onboarding/
│   ├── journey/
│   ├── diagnostics/
│   ├── challenges/
│   ├── career_paths/
│   ├── action_plan/
│   ├── achievements/
│   ├── advisor/
│   └── profile/
└── main.dart
```

Organizar cada feature en `data`, `domain` y `presentation` solo cuando exista complejidad real. Evitar capas vacías por convención.

## 5. Reutilización del backend

Reutilizar:

- `/api/v1/reconversion` y su scoring;
- catálogo de carreras y datos MINEDUC;
- informes y enlaces compartibles;
- permisos y paneles internos;
- motor de siguiente mejor acción cuando esté disponible.

No trasladar scoring al cliente. Flutter puede calcular progreso visual, pero el resultado canónico debe provenir del servidor.

## 6. Cambios previos necesarios

### Seguridad

- Asociar una sesión pública a un token privado o usuario.
- Evitar lectura o modificación usando solamente `session_id`.
- Rotar refresh tokens y almacenar su hash.
- Añadir rate limiting e idempotency keys.
- Separar el token para compartir informes del token para editar una sesión.

### Persistencia

- Sustituir alteraciones de esquema en el arranque por migraciones Alembic.
- Permitir `user_id` opcional en sesiones iniciadas como invitado.
- Implementar fusión explícita al convertir invitado en usuario.
- Añadir `version` o control optimista para sincronización.

### Contrato

- Publicar OpenAPI versionado.
- Generar modelos Dart desde el contrato o verificar DTO manualmente con pruebas de contrato.
- Mantener errores estructurados con `code`, `detail` y campos recuperables.

## 7. Modelo de datos nuevo

### `learning_paths`

- `id`, `slug`, `audience`, `version`, `title`, `is_active`.

### `journey_nodes`

- `id`, `path_id`, `node_type`, `position`, `prerequisites`, `content_version`, `xp_reward`.

### `user_journeys`

- `id`, `user_id`, `guest_id`, `path_id`, `current_node_id`, `status`, `started_at`, `completed_at`.

### `node_attempts`

- `id`, `journey_id`, `node_id`, `idempotency_key`, `answers_json`, `result_json`, `completed_at`.

### `xp_ledger`

- `id`, `journey_id`, `event_type`, `event_id`, `amount`, `created_at`.
- Restricción única por evento para impedir XP duplicado.

### `user_streaks`

- `journey_id`, `timezone`, `current_days`, `best_days`, `last_active_date`, `freeze_available`.

### `achievements` y `user_achievements`

- Catálogo versionado y asignaciones auditables.

### `action_plan_items`

- `id`, `journey_id`, `route_slug`, `title`, `due_date`, `status`, `evidence_json`.

### `device_push_tokens`

- `user_id`, `guest_id`, `platform`, `token_hash`, `locale`, `last_seen_at`, `revoked_at`.

## 8. Endpoints mínimos

```text
POST   /api/v1/mobile/guests
POST   /api/v1/mobile/guests/claim
GET    /api/v1/mobile/me/journey
GET    /api/v1/mobile/me/next-actions
POST   /api/v1/mobile/journey/nodes/{node_id}/attempts
GET    /api/v1/mobile/me/streak
GET    /api/v1/mobile/me/achievements
GET    /api/v1/mobile/me/action-plan
PATCH  /api/v1/mobile/me/action-plan/{item_id}
POST   /api/v1/mobile/me/push-tokens
DELETE /api/v1/mobile/me/push-tokens/{token_id}
```

Las escrituras deben aceptar `Idempotency-Key` y responder con el mismo resultado ante reintentos.

## 9. Offline y sincronización

- Descargar el nodo actual y los dos siguientes.
- Guardar cada respuesta primero en una cola local.
- Sincronizar en orden con idempotencia.
- Mostrar estado `guardado`, `pendiente` o `requiere atención`.
- Resolver progreso con el servidor como autoridad.
- No generar XP definitivamente en el cliente.

## 10. Autenticación

### Invitado

- Crear identificador aleatorio y credencial revocable.
- Mantener sesión en almacenamiento seguro.
- Permitir completar el diagnóstico sin registro obligatorio.

### Cuenta

- Google en Android e iOS.
- Sign in with Apple en iOS.
- Intercambiar credencial del proveedor por tokens Vocari.
- Reclamar progreso invitado mediante operación transaccional.

## 11. Observabilidad

- Correlation ID desde el dispositivo hasta FastAPI.
- Eventos analíticos sin respuestas sensibles.
- Métricas de latencia, errores, sincronización y generación de informes.
- Crash reporting con versión de app y modelo de dispositivo.
- Feature flags para recorridos, animaciones y notificaciones.

## 12. CI/CD móvil

- Análisis estático y pruebas en cada pull request.
- Build Android e iOS en ramas protegidas.
- Distribución beta con TestFlight y Google Play Internal Testing.
- Firma mediante secretos del proveedor CI.
- Versionado semántico del producto y número de build monotónico.
- Publicación manual aprobada durante el MVP.

## 13. Puertas de calidad

1. `flutter analyze` sin errores.
2. Pruebas unitarias de scoring visual, estado y sincronización.
3. Pruebas de widgets para los cuatro desafíos.
4. Pruebas de integración del recorrido feliz y recuperación offline.
5. Pruebas de contrato contra OpenAPI.
6. Validación de accesibilidad y movimiento reducido.
7. Ningún secreto incluido en el binario o repositorio.
