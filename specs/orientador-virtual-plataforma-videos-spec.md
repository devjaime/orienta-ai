# Spec Funcional - Videos en Plataforma de Orientación Virtual

## 1. Objetivo
Integrar videos de avatar (HeyGen MP4) dentro de la experiencia de `app.vocari.cl/estudiante/orientador-virtual` para humanizar el acompañamiento y guiar la conversación con Valeria.

## 2. Contexto
Ya existe chat en:
- `frontend/app/(dashboard)/estudiante/orientador-virtual/page.tsx`

Este spec define cómo incorporar videos dentro de ese flujo sin bloquear el uso del chat.

## 3. Videos y puntos del flujo

## 3.1 Video A - Bienvenida al orientador virtual
- Momento: al entrar a la página antes del primer mensaje.
- Propósito: explicar cómo usar a Valeria y qué tipo de preguntas hacer.
- Duración: 20-30s.

## 3.2 Video B - Guía de interpretación
- Momento: después de la primera respuesta relevante del chat (o al detectar consulta de perfil/código Holland).
- Propósito: explicar cómo interpretar recomendaciones y datos de carreras.
- Duración: 20-30s.

## 3.3 Video C - Cierre con plan de acción
- Momento: cuando el estudiante complete una mini meta de sesión (ej. 3 interacciones) o al presionar “finalizar sesión”.
- Propósito: reforzar próximos pasos (explorar, comparar, conversar con orientador humano).
- Duración: 20-30s.

## 4. UX y comportamiento UI

Reglas:
1. No modal bloqueante full-screen.
2. Mostrar en tarjeta destacada sobre el chat o entre mensajes del asistente.
3. Botón `Continuar` y `Omitir` siempre visibles.
4. Si falla carga, mostrar texto de apoyo y seguir chat normal.
5. Mobile-first: reproductor 16:9, controles grandes y legibles.

Estados del bloque video:
- `loading`
- `ready`
- `playing`
- `completed`
- `skipped`
- `error`

## 5. Componentes frontend

## 5.1 Reutilización del componente base
Reusar:
- `frontend/components/orientador/VirtualAdvisorVideo.tsx` (spec previo)

## 5.2 Orquestador específico del chat
Nuevo componente sugerido:
- `frontend/components/orientador/OrientadorVirtualVideoMoments.tsx`

Responsabilidades:
1. decidir cuándo inyectar cada video según estado de chat.
2. persistir “ya mostrado” por sesión.
3. emitir eventos analytics por cada interacción.

## 5.3 Integración principal
Archivo:
- `frontend/app/(dashboard)/estudiante/orientador-virtual/page.tsx`

Puntos:
1. Render video A en parte superior del chat al primer acceso.
2. Inyectar video B tras condición de conversación.
3. Render video C al cierre de sesión.

## 6. Reglas de lógica

1. Mostrar cada video máximo 1 vez por sesión.
2. Si el usuario omite, no reabrir automáticamente en esa sesión.
3. Si recarga página, se puede recordar estado con `sessionStorage`.
4. Feature flag:
- `NEXT_PUBLIC_VIRTUAL_ADVISOR_CHAT_VIDEOS=true`

## 7. Analytics

Eventos:
1. `ov_video_impression`
2. `ov_video_play`
3. `ov_video_skip`
4. `ov_video_complete`
5. `ov_video_error`

Payload:
- `video_id` (`welcome_chat|guide_interpretation|closing_plan`)
- `page` (`/estudiante/orientador-virtual`)
- `lead_id` o `user_id`
- `holland_code` (si disponible)
- `message_count`
- `timestamp`

KPIs:
1. tasa de reproducción por video.
2. tasa de omisión por video.
3. impacto en profundidad de conversación (mensajes por sesión).
4. impacto en siguiente acción (comparador, sesión, reporte).

## 8. Configuración de contenido

Catálogo recomendado:
- `frontend/lib/data/orientador-virtual-chat-videos.ts`

Estructura:
- `id`
- `src`
- `poster`
- `title`
- `description`
- `duration_estimate`
- `trigger_rule`

## 9. Criterios de aceptación

1. Videos visibles en los 3 momentos definidos.
2. Usuario puede continuar sin ver video completo.
3. Chat nunca queda bloqueado por reproducción.
4. Funciona en móvil y desktop.
5. Eventos analytics quedan emitidos.

## 10. Entregables

1. Integración en `orientador-virtual/page.tsx`.
2. Componente de momentos de video.
3. Configuración por feature flag.
4. Documento QA con escenarios:
   - reproducir completo
   - omitir
   - error de carga
   - móvil
