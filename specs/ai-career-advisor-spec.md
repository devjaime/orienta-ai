# AI Career Advisor - Spec Funcional y Técnico (v1)

## 1. Objetivo
Diseñar un orientador vocacional virtual útil y accionable para estudiantes de enseñanza media en Chile, evitando respuestas genéricas y conectando resultados del test con decisiones concretas.

Este módulo vive en `app.vocari.cl` (Next.js + FastAPI) y se alimenta de datos de test y mercado laboral ya existentes.

## 2. Alcance en arquitectura dual

### 2.1 `vocari.cl` (React/Vite + Supabase)
- función: adquisición y derivación.
- evento clave: `lead_created` con `nombre`, `email`, `source`.
- CTA principal: redirección a `https://app.vocari.cl/test-gratis`.

### 2.2 `app.vocari.cl` (Next.js + FastAPI + PostgreSQL)
- función: test, informe IA, seguimiento y paneles institucionales.
- módulo AI Advisor:
  - interpreta perfil RIASEC.
  - propone carreras con evidencia MINEDUC/SIES.
  - genera plan de acción 7/30 días.
  - registra histórico auditable para orientadores.

## 3. Flujo de usuario
1. estudiante completa test RIASEC.
2. sistema calcula `holland_code` + puntajes por dimensión.
3. sistema obtiene carreras recomendadas y datos de mercado.
4. AI Advisor genera informe estructurado.
5. estudiante ve informe en la misma página.
6. orientador puede revisar el informe desde `/revision-leads` y `/orientador/estudiantes/[id]`.

## 4. Entradas requeridas del motor
- identidad: `student_name`, `student_email`, `student_id`.
- vocacional: `holland_code`, `riasec_scores`, `test_answers`.
- contexto: `clarity_score`, respuestas encuesta final, curso/colegio (si existe).
- mercado: `empleabilidad`, `ingreso`, `saturacion`, `anos_estudio`, `tendencia`.
- historial: últimos informes IA y notas de orientador (si existen).

## 5. Salida obligatoria (contrato)

```json
{
  "resumen_personalizado": "string",
  "top_perfiles_riasec": ["R", "I", "A"],
  "carreras_recomendadas": [
    {
      "nombre": "string",
      "porque_encaja": "string",
      "tradeoff": "string",
      "empleabilidad": 0,
      "ingreso_promedio": 0,
      "saturacion": "baja|media|alta",
      "fuente": "Mineduc/SIES"
    }
  ],
  "plan_7_dias": ["string", "string", "string"],
  "plan_30_dias": ["string", "string", "string"],
  "preguntas_para_orientador": ["string", "string"]
}
```

Reglas:
1. siempre mencionar `student_name`.
2. mínimo 3 carreras.
3. mínimo 1 dato de mercado por carrera.
4. texto concreto y accionable (sin frases vacías).

## 6. Reglas anti-genericidad
1. Incluir al menos 2 evidencias numéricas por informe.
2. Explicar un `tradeoff` real por carrera.
3. Proponer acciones con tiempo y contexto (ejemplo: "esta semana").
4. Si falta dato, explicitarlo: "dato no disponible actualmente".
5. Restringir salida a 500-800 palabras.

## 7. Endpoints backend

### 7.1 Generación
- `POST /api/v1/leads/ai-report`
- entrada: `lead_id` o `student_id`.
- salida: estructura del punto 5 + `report_id`.

### 7.2 Consulta histórica
- `GET /api/v1/leads/{lead_id}/ai-reports`
- orden: más reciente primero.

### 7.3 Revisión orientador
- `GET /api/v1/orientador/students/{id}`
- debe incluir últimos informes IA en bloque `ai_reports`.

## 8. Persistencia mínima
Tabla recomendada: `ai_reports`
- `id` UUID PK
- `student_id` UUID FK
- `lead_id` UUID FK nullable
- `report_text` text
- `report_json` jsonb
- `holland_code` varchar(3)
- `clarity_score` int nullable
- `model_name` text
- `prompt_version` text
- `created_at` timestamptz default now()

Índices:
- `(student_id, created_at desc)`
- `(lead_id, created_at desc)`

## 9. Frontend (Next.js)

### 9.1 `app/test-gratis`
- componente: `AIReportView`.
- estados: `idle|generating|ready|error`.
- UX:
  - barra de progreso durante generación.
  - informe renderizado por secciones.
  - encuesta final breve obligatoria antes de cerrar flujo.

### 9.2 `app/orientador/estudiantes/[id]`
- bloque "Informes IA".
- lista histórica + fecha + versión prompt.
- botón "Exportar PDF" incluyendo último informe.

### 9.3 `app/revision-leads`
- tabla con `nombre`, `correo`, `holland_code`, `clarity_score`, `extracto_informe`.

## 10. Analytics
Eventos:
- `ai_report_requested`
- `ai_report_generated`
- `ai_report_failed`
- `ai_report_viewed`
- `ai_report_exported_pdf`

Campos mínimos:
- `student_id`, `lead_id`, `source`, `holland_code`, `duration_ms`, `timestamp`.

## 11. Criterios de aceptación
1. Informe muestra nombre real del estudiante.
2. Informe muestra carreras con datos de mercado.
3. Informe queda persistido y visible en revisión orientador/admin.
4. En falla IA, se muestra fallback y se registra evento `failed`.
5. Mobile y desktop sin bloqueo del flujo.

## 12. Riesgos y mitigación
- riesgo: latencia alta al final del test.
  - mitigación: pantalla de progreso + timeout con reintento.
- riesgo: informe demasiado genérico.
  - mitigación: validación server-side del JSON antes de guardar.
- riesgo: baja confianza del orientador.
  - mitigación: mostrar fuente de datos y versión de prompt.
