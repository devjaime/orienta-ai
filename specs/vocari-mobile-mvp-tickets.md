# Vocari Mobile — Roadmap y tickets del MVP

> Estimación de referencia: 9 a 12 semanas para una persona desarrolladora, sujeta a validación de diseño, disponibilidad de backend y publicación en tiendas.

## Hito 0 — Descubrimiento y contrato (semana 1)

### MOB-001 — Definir recorrido adulto

- Cerrar mapa de nodos, duración y criterios de desbloqueo.
- Definir qué señal entrega cada misión.
- Aceptación: recorrido completo trazable desde onboarding hasta plan de 30 días.

### MOB-002 — Contrato API móvil

- Auditar endpoints actuales de reconversión.
- Definir OpenAPI, errores e idempotencia.
- Aceptación: DTO de cada pantalla documentado y versionado.
- Estado: implementado en `backend/app/mobile/` y documentado en `specs/vocari-mobile-openapi-v1.md`.

### MOB-003 — Prototipo probado

- Convertir mockups conceptuales en prototipo navegable.
- Probar con cinco adultos en reconversión.
- Aceptación: al menos cuatro comprenden la siguiente acción sin ayuda.

## Hito 1 — Base segura (semanas 2 y 3)

### MOB-010 — Repositorio Flutter

- Crear `vocari-mobile`.
- Configurar ambientes development, staging y production.
- Añadir lint, pruebas, CI y gestión de secretos.
- Estado: repo en KINGSTON (`vocari-mobile`) con Riverpod, GoRouter, Dio, CI y shell de onboarding/journey.

### MOB-011 — Invitado y cuenta

- Implementar invitado recuperable, Google y Apple.
- Implementar claim de progreso.
- Aceptación: progreso iniciado como invitado aparece después del registro.

### MOB-012 — Proteger sesiones públicas

- Token privado de edición, rate limiting e idempotencia.
- Separar enlace público de informe.
- Aceptación: un UUID ajeno no permite leer PII ni modificar progreso.
- Estado: `X-Vocari-Edit-Token` hasheado, `share_token` solo para informe público, rate limit e `Idempotency-Key`.

### MOB-013 — Migraciones confiables

- Llevar tablas y cambios móviles a Alembic.
- Retirar cambios equivalentes del arranque.
- Aceptación: base vacía y base existente llegan al mismo esquema.
- Estado: migración `c3f8a91d4e20_mobile_reconversion_security.py`. El arranque sigue usando `create_all` como red de seguridad del resto del schema legado.

## Hito 2 — Núcleo Flutter (semanas 4 y 5)

### MOB-020 — Shell y diseño

- Tema Vocari, navegación, tipografía, componentes y accesibilidad.
- Aceptación: contraste AA y soporte de texto ampliado en pantallas base.

### MOB-021 — Journey

- Inicio, camino de nodos, progreso, nivel y siguiente acción.
- Aceptación: estado bloqueado, disponible, en curso y completado.

### MOB-022 — Persistencia local

- Drift, almacenamiento seguro y cola de sincronización.
- Aceptación: completar una misión sin red y sincronizarla una sola vez.

### MOB-023 — Analítica y errores

- Eventos mínimos, correlation ID y crash reporting.
- Aceptación: eventos no contienen email ni respuestas sensibles.

## Hito 3 — Diagnóstico y desafíos (semanas 6 y 7)

### MOB-030 — Diagnóstico base

- Misiones de cinco preguntas, pausa y reanudación.
- Aceptación: 30 preguntas guardadas sin pérdida ni duplicación.

### MOB-031 — Mapa de energía

- Clasificación energiza, neutral o drena.
- Aceptación: feedback y resumen coherentes con backend.

### MOB-032 — Habilidades transferibles

- Selección, ejemplos y evidencia laboral.
- Aceptación: habilidades persisten y alimentan recomendaciones.

### MOB-033 — Trade-offs

- Ocho decisiones y resultado de preparación al cambio.
- Aceptación: soporte completo de teclado, lector y movimiento reducido.

## Hito 4 — Resultados y acción (semanas 8 y 9)

### MOB-040 — Mapa de posibilidades

- Perfil, señales y limitaciones.
- Aceptación: no presentar resultados como diagnóstico o certeza.

### MOB-041 — Comparador de rutas

- Ajuste, ingresos, fricción, tiempo, inglés y modalidad.
- Aceptación: cada dato laboral muestra fuente, país y fecha.

### MOB-042 — Plan de 30 días

- Crear, completar y reprogramar acciones.
- Aceptación: primera acción disponible desde la pantalla de resultado.

### MOB-043 — Informe compartible

- Abrir enlace público seguro y controlar vigencia.
- Aceptación: compartir no entrega capacidad de edición.

## Hito 5 — Retención responsable y beta (semanas 10 a 12)

### MOB-050 — XP, racha y logros

- Ledger en servidor, racha flexible y logros conductuales.
- Aceptación: reintentos de red no duplican XP.

### MOB-051 — Animaciones

- Rive, háptica y celebraciones breves.
- Aceptación: modo reducido mantiene toda la información y navegación.

### MOB-052 — Notificaciones

- Permiso contextual, horario local y baja inmediata.
- Aceptación: no enviar más de una sugerencia diaria durante beta.

### MOB-053 — Beta cerrada

- TestFlight, Play Internal Testing y piloto de 20 a 50 personas.
- Aceptación: estabilidad libre de fallos superior a 99,5% y recorrido crítico sin bloqueos P0.

## Backlog posterior

- Recorrido escolar y consentimiento de apoderado.
- Orientador virtual conversacional.
- Nuevos escenarios laborales.
- Localización para otros países.
- Integración con orientadores humanos.
- Experimentos A/B mediante feature flags.
