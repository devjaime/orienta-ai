# Vocari - Especificacion de Producto

> Version: 2.0 | Fecha: Marzo 2026
> Evolucion desde MVP actual (React+Supabase+Netlify) hacia plataforma B2B con backend FastAPI, Google Meet y AI pipeline via OpenRouter.

---

## 1. Vision del Producto

Vocari es una plataforma SaaS B2B de orientacion vocacional potenciada por IA para colegios chilenos. Combina sesiones de orientacion en vivo (Google Meet), analisis de transcripciones con LLMs, tests adaptativos, juegos de evaluacion de habilidades y un motor de recomendacion de carreras para construir un perfil longitudinal de cada estudiante.

### Propuesta de Valor

| Stakeholder | Valor Entregado |
|-------------|----------------|
| **Colegios** | Plataforma integral de orientacion vocacional que reemplaza procesos manuales, genera datos accionables y diferencia al colegio |
| **Orientadores** | Herramientas de IA que transcriben y resumen sesiones automaticamente, detectan patrones y sugieren intervenciones |
| **Estudiantes** | Experiencia personalizada con tests, juegos, exploracion guiada de carreras y simulaciones de futuro profesional |
| **Apoderados** | Visibilidad completa del proceso vocacional de su hijo, con dashboards y reportes comprensibles |
| **Administradores** | Metricas agregadas de toda la institucion, compliance, y gestion multi-sede |

### Diferenciadores

1. **Analisis de sesiones con IA**: Transcripcion automatica + resumen + deteccion de intereses/habilidades/sentimiento
2. **Perfil longitudinal**: Construido a lo largo de meses/anos con datos de sesiones, tests, juegos e interacciones
3. **Motor de recomendacion basado en datos MINEDUC**: Carreras reales chilenas con datos de matricula, titulacion y empleabilidad
4. **Simulaciones de carrera**: Proyecciones de futuro profesional basadas en datos reales del mercado laboral

---

## 2. Roles de Usuario

### 2.1 Estudiante

- **Edad**: 14-18 anos (menores de edad)
- **Acceso**: Via codigo de activacion institucional o invitacion directa
- **Capacidades**:
  - Agendar sesiones de 30 minutos con orientador via Google Meet
  - Completar Test RIASEC (36 preguntas, 6 dimensiones Holland)
  - Realizar cuestionarios adaptativos post-sesion
  - Jugar juegos de evaluacion de habilidades
  - Explorar carreras con datos reales (salarios, empleabilidad, universidades)
  - Ver perfil vocacional acumulativo
  - Ver simulaciones de carrera futura
  - Descargar reportes PDF

### 2.2 Orientador (Consejero)

- **Rol**: Profesional de orientacion vocacional del colegio
- **Capacidades**:
  - Gestionar disponibilidad de horarios
  - Realizar sesiones via Google Meet (grabadas con consentimiento)
  - Revisar transcripciones y resumenes generados por IA
  - Escribir notas de sesion (con asistencia IA)
  - Ver timeline completo de cada estudiante
  - Recibir sugerencias de tests/juegos para asignar a estudiantes
  - Ver estadisticas de carga de trabajo y cobertura

### 2.3 Apoderado (Padre/Tutor)

- **Rol**: Padre, madre o tutor legal del estudiante
- **Capacidades**:
  - Vincular cuenta con estudiante(s)
  - Ver resultados de tests y sesiones (solo lectura)
  - Ver resumenes generados por IA de las sesiones
  - Monitorear progreso vocacional del estudiante
  - Recibir notificaciones de hitos importantes

### 2.4 Administrador de Colegio

- **Rol**: Director, jefe de UTP, o encargado institucional
- **Capacidades**:
  - Dashboard con metricas agregadas de la institucion
  - Importar estudiantes via CSV o codigos de activacion
  - Gestionar orientadores asignados
  - Ver reportes de uso y engagement
  - Configurar parametros institucionales

### 2.5 Super Admin (Vocari)

- **Rol**: Equipo interno de Vocari
- **Capacidades**:
  - Gestion de todas las instituciones (multi-tenant)
  - Aprobacion/rechazo de registros
  - Gestion de roles y permisos
  - Monitoreo de costos y uso de IA
  - Auditoria de actividad del sistema

---

## 3. User Journeys

### 3.1 Journey: Primera Sesion de Orientacion

```
Estudiante                    Sistema                         Orientador
    |                            |                                |
    |-- Agenda sesion 30min ---->|                                |
    |                            |-- Notifica disponibilidad ---->|
    |                            |<-- Confirma horario -----------|
    |<-- Recibe link Meet -------|                                |
    |                            |                                |
    |============= DIA DE LA SESION ===============================
    |                            |                                |
    |-- Se une a Google Meet --->|<-- Se une a Google Meet -------|
    |                            |-- Inicia grabacion ----------->|
    |                            |                                |
    |<==========  SESION 30 MIN  ================================>|
    |                            |                                |
    |                            |-- Detiene grabacion ---------->|
    |                            |-- Recupera transcripcion ----->|
    |                            |-- Analiza con IA ------------->|
    |                            |   - Resumen                    |
    |                            |   - Intereses detectados       |
    |                            |   - Habilidades detectadas     |
    |                            |   - Sentimiento emocional      |
    |                            |   - Tests/juegos sugeridos     |
    |                            |                                |
    |<-- Recibe resumen ---------|-- Recibe analisis completo --->|
    |<-- Recibe tests asignados -|                                |
```

### 3.2 Journey: Evaluacion Adaptativa Post-Sesion

```
Estudiante                    Sistema                         IA Engine
    |                            |                                |
    |-- Abre cuestionario ------>|                                |
    |                            |-- Genera preguntas basadas  -->|
    |                            |   en transcripcion de sesion   |
    |<-- Pregunta adaptativa ----|<-- Pregunta personalizada -----|
    |-- Responde --------------->|                                |
    |                            |-- Evalua respuesta ----------->|
    |                            |<-- Siguiente pregunta ---------|
    |                            |   (ajustada por respuesta      |
    |                            |    anterior)                   |
    |<-- Siguiente pregunta -----|                                |
    |   ...repite 10-15 veces...|                                |
    |                            |                                |
    |<-- Resultados + perfil ----|-- Actualiza perfil ----------->|
    |    actualizado             |   longitudinal                 |
```

### 3.3 Journey: Juego de Evaluacion de Habilidades

```
Estudiante                    Sistema
    |                            |
    |-- Selecciona juego ------->|
    |                            |-- Carga juego adaptado al perfil
    |<-- Juego interactivo ------|
    |-- Juega (3-10 min) ------>|
    |                            |-- Captura metricas:
    |                            |   - Tiempo de reaccion
    |                            |   - Patrones de decision
    |                            |   - Persistencia ante dificultad
    |                            |   - Tipo de estrategia
    |                            |
    |<-- Resultados --------------|-- Actualiza perfil longitudinal
    |    + badge/logro           |
```

### 3.4 Journey: Exploracion de Carreras

```
Estudiante                    Sistema                         IA Engine
    |                            |                                |
    |-- Abre explorador -------->|                                |
    |                            |-- Carga carreras recomendadas  |
    |                            |   basadas en perfil RIASEC +   |
    |                            |   datos de sesiones + juegos   |
    |<-- Top 10 carreras --------|                                |
    |                            |                                |
    |-- Selecciona carrera ----->|                                |
    |                            |-- Muestra datos reales:        |
    |                            |   - Universidades              |
    |                            |   - Salarios (MINEDUC)         |
    |                            |   - Empleabilidad              |
    |                            |   - Saturacion del mercado     |
    |                            |                                |
    |-- Pide simulacion ------->|-- Genera simulacion ---------->|
    |                            |<-- Proyeccion 5-10 anos -------|
    |<-- Simulacion de futuro ---|   - Trayectoria probable       |
    |    profesional             |   - Hitos de carrera           |
    |                            |   - Rango salarial proyectado  |
```

### 3.5 Journey: Apoderado Revisa Progreso

```
Apoderado                     Sistema
    |                            |
    |-- Login (Google OAuth) --->|
    |                            |-- Verifica vinculo padre-hijo
    |<-- Dashboard hijo ---------|
    |                            |
    |   Ve:                      |
    |   - Resumen de sesiones    |
    |   - Resultados de tests    |
    |   - Perfil RIASEC          |
    |   - Intereses detectados   |
    |   - Indicadores de         |
    |     bienestar/felicidad    |
    |   - Carreras recomendadas  |
    |                            |
    |-- Descarga reporte PDF --->|
```

### 3.6 Journey: Admin Colegio Onboarding

```
Admin Colegio                 Sistema                         Vocari Team
    |                            |                                |
    |                            |<-- Crea institucion -----------|
    |<-- Recibe credenciales ----|                                |
    |-- Login ------------------>|                                |
    |-- Importa estudiantes ---->|                                |
    |   (CSV o codigos)          |                                |
    |-- Asigna orientadores ---->|                                |
    |-- Configura Google ------->|-- Vincula Google Workspace --->|
    |   Workspace del colegio    |                                |
    |                            |                                |
    |<-- Dashboard activo -------|                                |
```

---

## 4. Funcionalidades Core por Fase

### Fase 1: Fundacion (Semanas 1-8)

| Funcionalidad | Prioridad | Descripcion |
|--------------|-----------|-------------|
| Auth + multi-tenant | P0 | Google OAuth, roles, instituciones (migrar desde Supabase Auth) |
| Backend FastAPI | P0 | Migrar logica de negocio desde Netlify Functions + Supabase RPCs |
| Sesiones Google Meet | P0 | Agendar, crear meet, grabar, recuperar transcripcion |
| Pipeline IA basico | P0 | Resumen + deteccion de intereses desde transcripcion |
| Test RIASEC | P0 | Migrar test existente al nuevo stack |
| Dashboards basicos | P0 | Estudiante, orientador (vistas minimas) |

### Fase 2: Inteligencia (Semanas 9-16)

| Funcionalidad | Prioridad | Descripcion |
|--------------|-----------|-------------|
| Analisis emocional | P1 | Sentiment analysis de transcripciones |
| Cuestionarios adaptativos | P1 | Preguntas generadas por IA basadas en sesion |
| Perfil longitudinal | P1 | Acumulacion de datos multi-sesion |
| Dashboard apoderados | P1 | Vista de progreso del hijo |
| Dashboard admin colegio | P1 | Metricas agregadas institucionales |
| Recomendador de carreras v2 | P1 | Integrar datos de sesiones al matching |

### Fase 3: Engagement (Semanas 17-24)

| Funcionalidad | Prioridad | Descripcion |
|--------------|-----------|-------------|
| Juegos de habilidades | P2 | 3-5 mini-juegos que evaluan habilidades cognitivas |
| Exploracion guiada de carreras | P2 | Interfaz interactiva con datos MINEDUC |
| Simulaciones de carrera | P2 | Proyecciones de futuro profesional con IA |
| Indicadores de felicidad | P2 | Tracking de bienestar a lo largo del tiempo |
| Reportes PDF avanzados | P2 | Reportes comprensivos con graficos |

### Fase 4: Escala (Semanas 25-32)

| Funcionalidad | Prioridad | Descripcion |
|--------------|-----------|-------------|
| Super admin dashboard | P3 | Gestion multi-colegio para equipo Vocari |
| Analytics avanzados | P3 | Tendencias, cohortes, comparaciones |
| API para integraciones | P3 | Webhook/API para sistemas escolares |
| Optimizacion de costos IA | P3 | Cache, batching, model tiering |
| Expansion LATAM | P3 | i18n, datos de otros paises |

---

## 5. Metricas de Exito

### Metricas de Producto

| Metrica | Target Fase 1 | Target Fase 4 |
|---------|---------------|---------------|
| Sesiones completadas / estudiante / mes | 1 | 2-3 |
| Tests completados / estudiante / mes | 1 | 2 |
| Tiempo en plataforma / estudiante / semana | 15 min | 45 min |
| NPS estudiantes | 40+ | 60+ |
| NPS colegios (admin + orientador) | 50+ | 70+ |
| Retencion mensual colegios | 90% | 95% |

### Metricas de Negocio

| Metrica | Target Ano 1 | Target Ano 2 |
|---------|-------------|-------------|
| Colegios activos | 5-10 | 30-50 |
| Estudiantes activos | 500-1,000 | 3,000-5,000 |
| MRR (Monthly Recurring Revenue) | $9,000-$18,000 USD | $54,000-$90,000 USD |
| Churn mensual colegios | < 5% | < 3% |
| CAC (Customer Acquisition Cost) | < $500 USD / colegio | < $300 USD / colegio |
| LTV (Lifetime Value) / colegio | > $18,000 USD | > $36,000 USD |

---

## 6. Restricciones y Supuestos

### Restricciones

1. **Regulatorias**: Estudiantes son menores de edad. Requiere consentimiento parental explicito para grabacion, procesamiento de datos y uso de IA.
2. **Ley 19.628 (Chile)**: Proteccion de datos personales. Datos sensibles de menores requieren tratamiento especial.
3. **Google Workspace**: El colegio debe tener Google Workspace Business Starter (o superior) para Google Meet con grabacion.
4. **Conectividad**: Colegios chilenos pueden tener conexiones limitadas. La plataforma debe funcionar con ancho de banda moderado.
5. **Presupuestos escolares**: Los colegios tienen presupuestos limitados y ciclos de compra anuales (enero-marzo).

### Supuestos

1. Los colegios ya usan Google Workspace o estan dispuestos a adoptarlo.
2. Los orientadores tienen disponibilidad para sesiones de 30 min con cada estudiante.
3. Los apoderados firmaran consentimiento digital para grabacion y procesamiento IA.
4. OpenRouter provee acceso estable a modelos de calidad suficiente para analisis vocacional.
5. Los datos MINEDUC de carreras se actualizan anualmente y son accesibles publicamente.

---

## 7. Migracion desde MVP Actual

El MVP actual usa React+Vite+Supabase+Netlify. La nueva arquitectura implica:

| Componente | Actual | Nuevo |
|-----------|--------|-------|
| Frontend | React 19 + Vite 7 | Next.js + React |
| Backend | Supabase RPCs + Netlify Functions | Python FastAPI |
| Base de datos | Supabase (PostgreSQL) | PostgreSQL (auto-hosted o managed) |
| Auth | Supabase Auth (Google OAuth) | FastAPI + Google OAuth (o Supabase Auth mantenido) |
| IA | Claude API + OpenRouter (Gemini) | OpenRouter API (multiples modelos) |
| Sesiones | Google Meet (basico) | Google Meet con grabacion + transcripcion automatica |
| Despliegue | Netlify | Docker + Cloud (GCP/AWS) |
| Storage | Supabase Storage | Object Storage (S3/GCS) + Google Drive |

### Elementos a Conservar

- Algoritmo RIASEC (riasecScoring.js) - migrar a Python
- Datos de carreras (carreras.json + MINEDUC) - conservar intactos
- Schema de base de datos core - evolucionar, no reescribir
- UX/UI patterns - mantener consistencia visual
- Logica de multi-tenancy - refactorizar para FastAPI
