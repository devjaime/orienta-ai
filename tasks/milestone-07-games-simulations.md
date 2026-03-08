# Milestone 7: Juegos de Habilidades y Simulaciones

> Duracion: Semanas 15-20
> Objetivo: Mini-juegos de evaluacion, simulaciones de carrera, reportes avanzados
> Dependencias: Milestone 5 (perfil longitudinal), Milestone 6 (dashboards)

---

## Resumen

Implementar juegos interactivos que evaluan habilidades cognitivas y blandas, simulaciones de carrera futura con IA, y reportes PDF comprehensivos. Esta es la fase de engagement que diferencia la plataforma.

---

## Tareas

### T7.1 - Game framework (frontend)
- **Estimacion**: 3 dias
- **Descripcion**: Framework generico para juegos: GamePlayer container, metricas tracking, result submission
- **Entregable**: `components/games/GamePlayer.tsx` con hooks de metricas

### T7.2 - Juego: Puzzle Logico
- **Estimacion**: 3 dias
- **Descripcion**: Puzzle de logica que mide razonamiento analitico, patrones, y persistencia
- **Entregable**: `components/games/games/LogicPuzzle.tsx`
- **Metricas capturadas**: tiempo por nivel, errores, estrategia, persistencia ante dificultad

### T7.3 - Juego: Reconocimiento de Patrones
- **Estimacion**: 3 dias
- **Descripcion**: Juego visual que mide reconocimiento de patrones, velocidad de procesamiento
- **Entregable**: `components/games/games/PatternRecognition.tsx`
- **Metricas**: tiempo de reaccion, precision, patron de errores

### T7.4 - Juego: Simulador de Decisiones
- **Estimacion**: 4 dias
- **Descripcion**: Escenarios de decision que miden liderazgo, trabajo en equipo, etica, riesgo
- **Entregable**: `components/games/games/DecisionSimulator.tsx`
- **Metricas**: tipo de decisiones, consistencia, balance riesgo/recompensa

### T7.5 - Juego: Desafio Creativo
- **Estimacion**: 3 dias
- **Descripcion**: Actividad abierta que mide creatividad, pensamiento divergente, originalidad
- **Entregable**: `components/games/games/CreativityChallenge.tsx`
- **Metricas**: originalidad de respuestas, diversidad, detalle

### T7.6 - Juego: Escenario de Trabajo en Equipo
- **Estimacion**: 3 dias
- **Descripcion**: Simulacion de colaboracion que mide habilidades sociales y comunicacion
- **Entregable**: `components/games/games/TeamworkScenario.tsx`
- **Metricas**: estilo de comunicacion, cooperacion, liderazgo

### T7.7 - Game backend (API + scoring)
- **Estimacion**: 2 dias
- **Descripcion**: POST /games/{id}/start, POST /games/{session_id}/submit, scoring pipeline
- **Entregable**: API completa de juegos, almacenamiento de resultados
- **Referencia**: `specs/backend.md` seccion 2.4

### T7.8 - Game results -> profile integration
- **Estimacion**: 1 dia
- **Descripcion**: Resultados de juegos alimentan perfil longitudinal via profile update worker
- **Entregable**: Juegos actualizan skills en perfil

### T7.9 - Career simulation pipeline (backend)
- **Estimacion**: 2 dias
- **Descripcion**: Pipeline IA que genera simulacion de carrera: timeline, milestones, salarios, narrativa
- **Entregable**: POST /careers/{id}/simulate
- **Referencia**: `specs/ai-engine.md` seccion 4.3

### T7.10 - Career simulation UI
- **Estimacion**: 3 dias
- **Descripcion**: Vista interactiva de simulacion: timeline visual, milestones, proyecciones salariales
- **Entregable**: `/estudiante/carreras/simulacion/[id]` con CareerSimulation component

### T7.11 - Comprehensive report generation
- **Estimacion**: 3 dias
- **Descripcion**: Generacion de reporte PDF comprehensivo: perfil completo, resultados de tests, analisis de sesiones, recomendaciones
- **Entregable**: POST /reports/generate, worker de generacion, PDF output
- **Referencia**: `specs/backend.md` seccion 6.2

### T7.12 - Report viewer UI
- **Estimacion**: 1 dia
- **Descripcion**: Listado de reportes, viewer PDF inline, descarga
- **Entregable**: `/estudiante/reportes`

---

## Criterios de Aceptacion

- [ ] 5 juegos jugables con metricas capturadas
- [ ] Resultados de juegos aparecen en perfil longitudinal
- [ ] Simulacion de carrera genera timeline coherente con datos MINEDUC
- [ ] Reportes PDF generados con datos completos del estudiante
- [ ] Juegos adaptados a mobile (touch-friendly)
- [ ] Tiempo de carga de juegos < 3 segundos

---

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|-----------|
| Juegos demasiado complejos para el tiempo estimado | Alta | Medio | Empezar con versiones simples, iterar |
| Metricas de juegos dificiles de interpretar | Media | Medio | Validar con psicologo educacional |
| Simulaciones IA poco realistas | Media | Alto | Basar fuertemente en datos MINEDUC reales |
| PDF rendering lento/pesado | Baja | Bajo | WeasyPrint es eficiente para este volumen |
