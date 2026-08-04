# Reconversion Vocacional Adultos - Tickets P0

## Objetivo del sprint
Habilitar un primer flujo publico y demostrable de reconversion vocacional para adultos, cubriendo:

1. fase 0 de captura contextual.
2. fase 1 de test base de 30 preguntas.
3. persistencia por sesion.
4. estado recuperable por `session_id`.

## Ticket 1 - Backend: crear módulo `reconversion`

### Alcance
- crear `backend/app/reconversion/`
- agregar modelos:
  - `AdultReconversionSession`
  - `AdultReconversionPhaseResult`
  - `AdultReconversionReport`
- registrar el módulo en `backend/app/main.py`

### Archivos
- `backend/app/reconversion/__init__.py`
- `backend/app/reconversion/models.py`
- `backend/app/main.py`

### Criterios de aceptación
1. La app levanta con el nuevo módulo registrado.
2. Las tablas del módulo se crean automáticamente.
3. No rompe módulos existentes.

## Ticket 2 - Backend: sesión pública fase 0

### Alcance
- endpoint `POST /api/v1/reconversion/sessions`
- guardar:
  - nombre
  - email
  - profesion_actual
  - edad
  - pais
  - ciudad
  - nivel_educativo
  - ingreso_actual_aprox
  - nivel_ingles
  - situacion_actual
  - disponibilidad_para_estudiar
  - disponibilidad_para_relocalizarse
- generar `share_token`
- dejar `current_phase = 0`

### Archivos
- `backend/app/reconversion/router.py`
- `backend/app/reconversion/schemas.py`
- `backend/app/reconversion/service.py`

### Criterios de aceptación
1. Se crea una sesión pública sin autenticación.
2. Devuelve `session_id`, `share_token` y `current_phase`.
3. El email queda normalizado.

## Ticket 3 - Backend: guardar fase 1 test base

### Alcance
- endpoint `POST /api/v1/reconversion/sessions/{session_id}/phase-1`
- guardar 30 respuestas
- calcular scores base
- persistir `phase_key = phase_1`
- actualizar `current_phase = 1`

### Criterios de aceptación
1. Rechaza payloads con menos o más de 30 respuestas.
2. Calcula un resumen base del perfil.
3. Permite reintento y sobrescribe la fase 1 más reciente de la sesión.

## Ticket 4 - Backend: consultar sesión recuperable

### Alcance
- endpoint `GET /api/v1/reconversion/sessions/{session_id}`
- devolver:
  - datos de fase 0
  - fase actual
  - fases completadas
  - resumen derivado de fase 1 si existe

### Criterios de aceptación
1. Permite retomar el flujo.
2. No expone datos de otras sesiones.

## Ticket 5 - Frontend: ruta pública `reconversion-gratis`

### Alcance
- crear `frontend/app/reconversion-gratis/page.tsx`
- fase 0 con formulario
- fase 1 con test de 30 preguntas
- persistencia real contra backend

### Criterios de aceptación
1. El usuario puede completar fase 0 y continuar.
2. El usuario puede responder 30 preguntas y guardar fase 1.
3. El estado visual muestra progreso y guardado.

## Ticket 6 - Frontend: experiencia inicial coherente con adulto

### Alcance
- tono visual menos adolescente
- lenguaje de reconversión, no escolar
- copy centrado en transición, energía laboral y futuro posible

### Criterios de aceptación
1. La experiencia se siente para adultos.
2. Mobile y desktop funcionan bien.

## Ticket 7 - QA técnico mínimo

### Alcance
- test backend de creación de sesión
- test backend de envío fase 1
- build de frontend

### Criterios de aceptación
1. `pytest` del módulo nuevo pasa.
2. `npm run build` en frontend pasa.

## Ticket 8 - Próximo sprint inmediato

### Alcance
- fase 2 `energy challenge`
- fase 3 test de confirmación
- fase 4 `trade-off challenge`
- generación del primer `adult_reconversion_report`

### Nota
No mezclar esta evolución con `test-gratis` escolar.

