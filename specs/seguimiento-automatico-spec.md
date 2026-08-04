# Spec - Sistema de Seguimiento Automático (D0/D7/D21)

## Objetivo
Mantener continuidad post-test mediante nudges automáticos y alertas para orientador.

## Flujos
1. Día 0 (D0)
- envío resumen de resultado + próximos pasos.

2. Día 7 (D7)
- recordatorio de exploración de carreras.

3. Día 21 (D21)
- sugerencia de sesión con orientador para casos de indecisión.

## Canales
MVP:
1. email (principal)
2. log interno en plataforma

Fase siguiente:
1. WhatsApp (opcional)

## Modelo de datos
Tabla: `followup_events`
- `id`, `lead_id|student_id`, `journey_step`, `scheduled_at`, `sent_at`, `channel`, `status`, `payload`, `created_at`.

Estados:
- `scheduled`, `sent`, `failed`, `canceled`.

## Orquestación técnica
1. Al completar test:
- crear 3 eventos programados D0/D7/D21.

2. Worker:
- usar `workers/worker.py` para procesar eventos pendientes.

3. Reglas anti-spam:
- no enviar si hubo interacción reciente (<72h).
- frecuencia máxima configurable.

## Endpoints
1. `POST /api/v1/followups/schedule`
2. `GET /api/v1/followups/{student_id}`
3. `POST /api/v1/followups/{id}/retry`
4. `POST /api/v1/followups/{id}/cancel`

## Plantillas
Variables:
- `nombre`
- `holland_code`
- `clarity_score`
- `top_careers`
- `next_actions`

## Alertas orientador
Condición:
- si `clarity_score <= 2` en D21 -> crear alerta en panel orientador.

## Analytics
1. `followup_scheduled`
2. `followup_sent`
3. `followup_opened`
4. `followup_failed`

## Criterios de aceptación
1. Eventos D0/D7/D21 se crean automáticamente.
2. Worker envía y registra estado.
3. Historial visible para orientador/admin.
