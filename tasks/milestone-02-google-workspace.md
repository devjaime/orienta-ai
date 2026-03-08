# Milestone 2: Google Workspace Integration

> Duracion: Semanas 3-6
> Objetivo: Sesiones via Google Meet con grabacion y extraccion de transcripcion
> Dependencias: Milestone 1 (auth + backend base)

---

## Resumen

Integrar Google Workspace APIs para crear sesiones de orientacion via Google Meet, gestionar grabaciones automaticas, y extraer transcripciones desde Google Drive/Docs. Esto es el pilar diferenciador de la plataforma.

---

## Tareas

### T2.1 - Google Service Account setup
- **Estimacion**: 1 dia
- **Descripcion**: Documentar y automatizar setup de Service Account con Domain-Wide Delegation. Crear script de verificacion.
- **Entregable**: Guia de setup, script de verificacion de permisos, credenciales almacenadas en Secret Manager

### T2.2 - Google Calendar API integration
- **Estimacion**: 2 dias
- **Descripcion**: Crear eventos en Google Calendar con conferencia Meet, leer/actualizar/cancelar eventos
- **Entregable**: `sessions/google_meet.py` con funciones: create_meet_event, update_event, cancel_event, get_event
- **Referencia**: `specs/architecture.md` seccion 7

### T2.3 - Session scheduling module
- **Estimacion**: 2 dias
- **Descripcion**: Endpoints de agendamiento: listar disponibilidad, agendar sesion, cancelar. Integracion con Calendar API.
- **Entregable**: POST /sessions (crea sesion + evento Calendar + Meet link), GET /sessions, DELETE /sessions/{id}
- **Referencia**: `specs/backend.md` seccion 2.2

### T2.4 - Orientador availability management
- **Estimacion**: 1 dia
- **Descripcion**: CRUD de disponibilidad horaria del orientador, validacion de conflictos
- **Entregable**: Endpoints para gestionar bloques de disponibilidad semanal

### T2.5 - Google Meet recording access
- **Estimacion**: 2 dias
- **Descripcion**: Detectar fin de sesion (polling o webhook), acceder a grabacion en Google Drive del organizador
- **Entregable**: Funcion que obtiene metadata y URL de grabacion post-sesion
- **Nota**: Google Meet genera grabaciones automaticamente en Drive. Vocari NO descarga el video, solo accede a metadata.

### T2.6 - Transcript extraction from Google Docs
- **Estimacion**: 2 dias
- **Descripcion**: Google Meet genera transcripciones automaticas como Google Docs. Extraer texto estructurado con timestamps y speaker identification.
- **Entregable**: Funcion que extrae transcripcion completa, la parsea en segmentos [{speaker, text, timestamp}], y la almacena en BD
- **Referencia**: `specs/architecture.md` seccion 7

### T2.7 - Session completion flow
- **Estimacion**: 1 dia
- **Descripcion**: Endpoint POST /sessions/{id}/complete que: marca sesion como completada, recupera transcripcion, encola job de analisis IA
- **Entregable**: Flujo completo: sesion -> transcripcion -> enqueue AI job

### T2.8 - Session models y schemas
- **Estimacion**: 1 dia
- **Descripcion**: SQLAlchemy models para SessionRecording, SessionTranscript, SessionAIAnalysis. Pydantic schemas.
- **Entregable**: Modelos y migrations

### T2.9 - Tests de integracion Google APIs
- **Estimacion**: 1 dia
- **Descripcion**: Mock tests para Calendar, Drive, Docs APIs. Test end-to-end del flujo de sesion (con mocks).
- **Entregable**: Tests que cubren happy path y error cases

### T2.10 - Consent verification pre-session
- **Estimacion**: 1 dia
- **Descripcion**: Verificar que el estudiante tiene consentimiento parental activo para grabacion y procesamiento IA antes de permitir agendar sesion
- **Entregable**: Consent module basico con endpoints de consulta y otorgamiento

---

## Criterios de Aceptacion

- [ ] Crear sesion produce evento Calendar con link Meet funcional
- [ ] Despues de la sesion, la transcripcion se extrae automaticamente de Google Drive
- [ ] Transcripcion almacenada en BD con segmentos estructurados
- [ ] Consentimiento verificado antes de agendar sesion
- [ ] Flujo de completion encola job de analisis IA (aunque worker aun no procese)
- [ ] Tests con mocks de Google APIs pasan

---

## Riesgos Criticos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|-----------|
| Google Meet transcripcion automatica no disponible en plan Business Starter | Media | **Critico** | Verificar con cuenta de prueba ANTES de empezar. Fallback: Whisper API ($0.006/min) |
| Latencia en disponibilidad de grabacion/transcripcion (puede tomar minutos) | Alta | Medio | Polling con backoff exponencial, notificar orientador cuando este listo |
| Domain-Wide Delegation rechazada por admin de TI del colegio | Media | Alto | Documentacion clara, soporte de onboarding, alternativa per-user OAuth |
| Formato de transcripcion de Google Docs cambia sin aviso | Baja | Medio | Parser robusto con fallback a texto plano |
