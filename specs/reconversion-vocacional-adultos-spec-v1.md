# Vocari Reconversion Vocacional Adultos - Spec v1

## 1. Objetivo
Crear un nuevo flujo gratuito orientado a adultos en reconversion vocacional, separado del producto escolar actual, que combine:

1. captura de contexto personal y laboral.
2. dos tests psicometricos/diagnosticos.
3. dos desafios intencionales tipo juego.
4. generacion de un reporte final amigable con IA.
5. una URL publica para revisar el informe.

El resultado no debe decir solo "que te gusta", sino proponer rutas realistas de futuro fuera de la profesion actual, con foco en:

- mayor felicidad laboral esperada.
- dinero percibido estimado.
- necesidad de relocalizacion.
- necesidad de aprender idiomas.
- tiempo y friccion de reconversion.

## 2. Encaje con la arquitectura actual

### 2.1 Lo reutilizable hoy
- landing y captacion publica en `vocari.cl`.
- flujo de lead + token publico en `backend/app/leads/*`.
- UI de test y resultados en `frontend/app/test-gratis/page.tsx`.
- graficos con `recharts` en `frontend/components/charts/*`.
- generacion de reportes IA en `backend/app/reports/service.py`.
- juegos y metricas de habilidades en `frontend/components/games/*` y `backend/app/games/*`.

### 2.2 Lo que no conviene reutilizar tal cual
- `test_results` exige `user_id`, por lo que no es buen contenedor para un flujo publico adulto.
- los juegos actuales dependen de usuario autenticado e institucion.
- recomendaciones basadas solo en RIASEC + MINEDUC sirven para orientacion academica, pero no alcanzan para reconversion adulta.

### 2.3 Decision de arquitectura
Este producto debe vivir como un flujo paralelo publico, no como una variante del `test-gratis` escolar.

Rutas sugeridas:
- `vocari.cl/reconversion`
- `app.vocari.cl/reconversion-gratis`
- `app.vocari.cl/informe-reconversion/[token]`

## 3. Propuesta de valor del producto
Vocari Reconversion ayuda a adultos hispanohablantes a detectar caminos laborales alternativos fuera de su profesion actual, usando una mezcla de autoconocimiento, desafios de decision y un reporte final que traduce resultados a escenarios concretos de vida y trabajo.

## 4. Flujo de usuario

### Fase 0 - Perfil inicial
Datos obligatorios:
- `nombre`
- `email`
- `profesion_actual`
- `edad`

Datos recomendados:
- `pais`
- `ciudad`
- `nivel_educativo`
- `ingreso_actual_aprox`
- `situacion_actual`
- `nivel_ingles`
- `disponibilidad_para_estudiar`
- `disponibilidad_para_relocalizarse`

Objetivo:
- capturar contexto real antes de interpretar resultados.

### Fase 1 - Test base (30 preguntas)
Test orientado a reconversion, no solo intereses.

Dimensiones sugeridas:
- `energia_social`
- `energia_analitica`
- `energia_creativa`
- `energia_practica`
- `autonomia`
- `seguridad`
- `proposito`
- `aprendizaje`
- `liderazgo`
- `tolerancia_al_cambio`

Formato:
- 30 preguntas Likert de 1 a 5.

Salida:
- perfil base.
- 3 hipotesis de vocacion/transicion.

### Fase 2 - Desafio intencional 1
Objetivo:
- detectar donde la persona siente energia, curiosidad y tolerancia a la incertidumbre.

Formato sugerido:
- dinamica interactiva tipo "Mapa de Energia Laboral".

Mecanica:
1. mostrar 12 actividades o escenarios.
2. el usuario clasifica cada uno en:
   - "me energiza"
   - "me da lo mismo"
   - "me drena"

Ejemplos:
- explicar algo a otra persona.
- ordenar procesos y planillas.
- crear contenido o ideas.
- negociar o vender.
- analizar datos.
- resolver una urgencia operativa.
- aprender software nuevo.
- trabajar con clientes.
- construir algo practico.

Salida:
- `energy_map`
- `drain_map`
- `transferable_preferences`

### Fase 3 - Test de confirmacion
Objetivo:
- confirmar o corregir el primer test.

Formato:
- 12 a 18 preguntas mas precisas.
- preguntas condicionales segun la hipotesis dominante de la fase 1.

Ejemplo:
- si predomina autonomia + creatividad, profundizar en independencia, tolerancia al riesgo y preferencia por proyecto vs estructura.
- si predomina analitico + proposito, profundizar en docencia, tecnologia, investigacion aplicada o consultoria.

Salida:
- `confirmation_score`
- `profile_consistency_score`
- `top_transition_clusters`

### Fase 4 - Desafio intencional 2
Objetivo:
- poner a prueba preferencias en escenarios mas realistas de reconversion.

Formato sugerido:
- simulador de trade-offs.

Mecanica:
1. mostrar 8 escenarios.
2. el usuario decide entre opciones con trade-offs reales.

Trade-offs:
- dinero hoy vs crecimiento futuro.
- estabilidad vs autonomia.
- trabajar con personas vs con sistemas.
- estudiar 6 meses vs 24 meses.
- remoto vs presencial.
- relocalizarse vs mantener ciudad actual.
- aprender ingles vs buscar opcion local.

Salida:
- `tradeoff_profile`
- `change_readiness`
- `mobility_readiness`
- `upskilling_readiness`

### Fase final - Reporte IA
El sistema combina fases 0 a 4 y genera un informe claro, visual y accionable.

Debe responder:
1. que partes de tu trabajo actual si te hacen sentido.
2. que partes te estan alejando de mayor felicidad laboral.
3. que rutas de futuro tienen mejor ajuste contigo.
4. cuanto dinero podrias percibir.
5. que friccion tiene cada ruta.
6. si necesitas relocalizarte.
7. si necesitas aprender ingles.
8. cual ruta parece darte mejor balance felicidad/ingreso.

## 5. Contrato de salida del reporte

```json
{
  "resumen_personalizado": "string",
  "perfil_actual": {
    "profesion_actual": "string",
    "fortalezas_transferibles": ["string"],
    "factores_que_drenan": ["string"]
  },
  "rutas_recomendadas": [
    {
      "nombre_ruta": "string",
      "tipo": "empleo|freelance|emprendimiento|reestudio",
      "porque_encaja": "string",
      "felicidad_estimada": 0,
      "ingreso_estimado": 0,
      "friccion_cambio": 0,
      "necesita_relocalizacion": false,
      "relocalizacion_detalle": "string",
      "necesita_ingles": false,
      "ingles_detalle": "string",
      "tiempo_reconversion_meses": 0,
      "aprendizajes_sugeridos": ["string"]
    }
  ],
  "grafico_bienestar_ingreso": [
    {
      "ruta": "string",
      "felicidad": 0,
      "dinero": 0
    }
  ],
  "plan_30_dias": ["string"],
  "plan_90_dias": ["string"],
  "alertas": ["string"]
}
```

## 6. Modelo de scoring

### 6.1 Principio
No presentar la "felicidad" como verdad absoluta. Presentarla como:
- `indice_estimado_de_bienestar_laboral`

### 6.2 Variables base
- `vocational_fit_score`
- `energy_alignment_score`
- `transferability_score`
- `learning_readiness_score`
- `change_readiness_score`
- `income_delta_score`
- `relocation_friction_score`
- `language_friction_score`

### 6.3 Formula MVP

```text
indice_bienestar =
  0.30 * vocational_fit_score +
  0.25 * energy_alignment_score +
  0.20 * transferability_score +
  0.10 * learning_readiness_score +
  0.15 * change_readiness_score
  - 0.10 * relocation_friction_score
  - 0.10 * language_friction_score
```

```text
indice_dinero =
  0.60 * ingreso_estimado_normalizado +
  0.20 * velocidad_de_entrada +
  0.20 * empleabilidad_esperada
```

### 6.4 Presentacion en UI
No usar una sola nota final.
Usar:
- felicidad estimada `0-100`
- dinero percibido `0-100`
- friccion de cambio `0-100`

Con texto explicativo:
- "alta"
- "media"
- "baja"

## 7. Datos de mercado

### 7.1 Datos utilizables desde hoy
- carreras y sueldos del catalogo actual.
- simulaciones de carrera existentes.
- reglas internas por area/rol.

### 7.2 Datos nuevos requeridos
Nueva tabla o catalogo:
- `transition_routes`

Campos sugeridos:
- `id`
- `slug`
- `nombre`
- `tipo`
- `descripcion`
- `areas_relacionadas`
- `rutas_desde_profesiones`
- `salary_range`
- `remote_friendly`
- `requires_degree`
- `requires_certification`
- `requires_english_level`
- `relocation_likelihood`
- `time_to_transition_months`
- `market_notes`
- `is_active`

Ejemplos:
- analista de datos junior
- customer success
- UX writing
- soporte tecnico
- reclutamiento TI
- ventas consultivas
- coordinacion de operaciones
- docente/capacitador
- project coordinator
- marketing digital

### 7.3 Regla de idioma
Asumir idioma principal: `espanol`.

Heuristica:
- si la ruta tiene alta presencia internacional o digital global, recomendar ingles.
- si la ruta es local/regional y no depende de clientes globales, no hacerlo obligatorio.

## 8. Modelo de datos recomendado

### 8.1 Nueva tabla `adult_reconversion_sessions`
- `id` UUID
- `share_token` VARCHAR(64) unique
- `nombre`
- `email`
- `profesion_actual`
- `edad`
- `pais`
- `ciudad`
- `nivel_educativo`
- `ingreso_actual_aprox`
- `nivel_ingles`
- `situacion_actual`
- `disponibilidad_para_estudiar`
- `disponibilidad_para_relocalizarse`
- `status`
- `current_phase`
- `created_at`
- `updated_at`

### 8.2 Nueva tabla `adult_reconversion_phase_results`
- `id` UUID
- `session_id` FK
- `phase_key`
- `answers_json`
- `derived_scores_json`
- `completed_at`

### 8.3 Nueva tabla `adult_reconversion_reports`
- `id` UUID
- `session_id` FK
- `report_json`
- `report_text`
- `model_name`
- `prompt_version`
- `created_at`

### 8.4 Relacion con `leads`
Opciones:

1. minimalista:
- seguir usando `leads` solo como CRM y duplicar datos relevantes en `adult_reconversion_sessions`.

2. recomendada:
- `adult_reconversion_sessions.lead_id` opcional para unir contacto y funnel.

## 9. Endpoints backend

### 9.1 Publicos
- `POST /api/v1/reconversion/sessions`
- `GET /api/v1/reconversion/sessions/{session_id}`
- `POST /api/v1/reconversion/sessions/{session_id}/phase-1`
- `POST /api/v1/reconversion/sessions/{session_id}/phase-2`
- `POST /api/v1/reconversion/sessions/{session_id}/phase-3`
- `POST /api/v1/reconversion/sessions/{session_id}/phase-4`
- `POST /api/v1/reconversion/sessions/{session_id}/generate-report`
- `GET /api/v1/reconversion/public/{token}`

### 9.2 Admin/revision
- `GET /api/v1/reconversion/review`
- `GET /api/v1/reconversion/review/{session_id}`

## 10. Frontend

### 10.1 Nueva ruta principal
- `frontend/app/reconversion-gratis/page.tsx`

### 10.2 Componentes sugeridos
- `components/reconversion/ReconvertionWizard.tsx`
- `components/reconversion/Fase0Perfil.tsx`
- `components/reconversion/Fase1TestBase.tsx`
- `components/reconversion/Fase2EnergyChallenge.tsx`
- `components/reconversion/Fase3Confirmacion.tsx`
- `components/reconversion/Fase4TradeoffChallenge.tsx`
- `components/reconversion/ReporteReconversion.tsx`
- `components/charts/HappinessMoneyChart.tsx`

### 10.3 UX esperada
- progress bar visible por fase.
- guardado automatico por fase.
- transiciones suaves entre fases.
- CTA claros: continuar, guardar y seguir despues.
- experiencia mobile-first.

## 11. Grafico felicidad vs dinero

### 11.1 Visualizacion sugerida
Scatter plot o bubble chart:
- eje X: `dinero percibido`
- eje Y: `felicidad estimada`
- tamanio de burbuja: `friccion de cambio`

### 11.2 Lectura
- arriba a la derecha: opcion mas prometedora.
- abajo a la derecha: gana dinero, pero podria desgastar.
- arriba a la izquierda: hace sentido humano, pero requiere aceptar menor ingreso.
- abajo a la izquierda: opcion descartable o menos conveniente.

## 12. IA del reporte

### 12.1 Prompt base
La IA no decide sola.
Debe recibir:
- resumen estructurado de las fases.
- 3 rutas candidatas.
- datos de ingreso, friccion, idioma, relocalizacion.

Y generar:
- narrativa amigable.
- comparacion clara.
- plan de accion.

### 12.2 Reglas
- siempre mencionar a la persona por su nombre.
- hablar en espanol.
- evitar tono adolescente.
- evitar afirmaciones absolutas del tipo "tu destino es".
- usar lenguaje adulto, claro y respetuoso.
- si no hay suficiente certeza, explicitarlo.

## 13. Analytics
Eventos:
- `adult_reconversion_started`
- `adult_phase_0_completed`
- `adult_phase_1_completed`
- `adult_phase_2_completed`
- `adult_phase_3_completed`
- `adult_phase_4_completed`
- `adult_report_generated`
- `adult_report_viewed`
- `adult_report_shared`

Campos minimos:
- `session_id`
- `email`
- `profesion_actual`
- `edad`
- `current_phase`
- `timestamp`

## 14. MVP de implementacion

### P0
1. fase 0
2. fase 1
3. fase 2
4. generacion de reporte con 3 rutas candidatas
5. URL publica del informe

### P1
1. fase 3 confirmatoria
2. fase 4 trade-offs
3. grafico felicidad vs dinero
4. recomendaciones de idioma/relocalizacion

### P2
1. seguimiento por correo
2. dashboard de reconversion
3. version premium con plan de 6 meses

## 15. Riesgos y mitigacion

### Riesgo 1
El producto se vea como "otro test mas".

Mitigacion:
- usar desafios intencionales reales.
- mostrar rutas concretas, no solo etiquetas de personalidad.

### Riesgo 2
El sistema prometa demasiado sobre felicidad.

Mitigacion:
- hablar de bienestar estimado.
- explicar que es una orientacion, no un diagnostico clinico.

### Riesgo 3
Los datos de carreras escolares no alcancen para reconversion adulta.

Mitigacion:
- crear `transition_routes` como catalogo nuevo.
- usar MINEDUC solo cuando aplique a una ruta formativa.

### Riesgo 4
El flujo sea demasiado largo y baje conversion.

Mitigacion:
- autosave por fase.
- duracion objetivo total: 12 a 18 minutos.
- permitir retomar con token/email.

## 16. Criterios de aceptacion
1. El usuario completa las 5 fases sin autenticarse.
2. Cada fase se guarda de forma independiente.
3. El reporte final muestra al menos 3 rutas alternativas.
4. El reporte incluye grafico felicidad vs dinero.
5. El reporte explica si conviene relocalizarse o aprender ingles.
6. Existe URL publica de informe.
7. El lenguaje del reporte es adulto, claro y amigable.

## 17. Recomendacion de implementacion
No mezclar este desarrollo con el funnel escolar actual.

Se recomienda abrir un modulo nuevo:
- `backend/app/reconversion/*`
- `frontend/app/reconversion-gratis/*`

Esto permite:
- separar dominio de negocio.
- separar scoring.
- separar prompts IA.
- evitar deuda tecnica en `test-gratis`.

