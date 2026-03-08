# Milestone 4: Frontend Foundation

> Duracion: Semanas 5-8 (paralelo con Milestone 3)
> Objetivo: Next.js app con auth, layout system, y dashboards basicos
> Dependencias: Milestone 1 (backend API disponible)

---

## Resumen

Crear la aplicacion Next.js con App Router, sistema de autenticacion, layout de dashboards por rol, y las vistas basicas de estudiante y orientador. Migrar los componentes reutilizables del MVP actual.

---

## Tareas

### T4.1 - Scaffolding Next.js
- **Estimacion**: 0.5 dia
- **Descripcion**: create-next-app con App Router, TypeScript, Tailwind CSS 4, ESLint, Prettier
- **Entregable**: `frontend/` funcional con `npm run dev`

### T4.2 - Design system y UI components base
- **Estimacion**: 3 dias
- **Descripcion**: Implementar componentes base: Button, Card, Input, Select, Dialog, Badge, Avatar, Table, Tabs, Toast, Skeleton, Spinner, ProgressBar
- **Entregable**: `components/ui/` con todos los componentes base, stories o examples
- **Referencia**: `specs/frontend.md` seccion 3

### T4.3 - Layout system (dashboard shell)
- **Estimacion**: 2 dias
- **Descripcion**: Header, Sidebar (responsive), Footer, DashboardShell, MobileNav. Sidebar cambia segun rol.
- **Entregable**: `components/layout/`, navegacion funcional por rol
- **Referencia**: `specs/frontend.md` seccion 2

### T4.4 - Auth flow (Google OAuth)
- **Estimacion**: 2 dias
- **Descripcion**: Login page, redirect a backend OAuth, callback handler, token storage, refresh flow
- **Entregable**: `/auth/login`, `/auth/callback`, `useAuth` hook, `ProtectedRoute`, `RoleGuard`
- **Referencia**: `specs/frontend.md` seccion 1

### T4.5 - API client y TanStack Query setup
- **Estimacion**: 1 dia
- **Descripcion**: Fetch wrapper con auth headers, TanStack Query provider, error handling global
- **Entregable**: `lib/api.ts`, QueryClient configurado, interceptors de auth

### T4.6 - Zustand stores
- **Estimacion**: 0.5 dia
- **Descripcion**: Auth store (user, tokens), UI store (sidebar, theme), notification store
- **Entregable**: `lib/stores/`

### T4.7 - Student dashboard
- **Estimacion**: 2 dias
- **Descripcion**: Vista principal del estudiante: proximas sesiones, tests pendientes, resumen de perfil, carreras recomendadas
- **Entregable**: `/estudiante` con datos reales del backend
- **Referencia**: `specs/frontend.md` seccion 4.1

### T4.8 - Orientador dashboard
- **Estimacion**: 2 dias
- **Descripcion**: Vista principal del orientador: sesiones de hoy, reviews pendientes, stats, alertas
- **Entregable**: `/orientador` con datos reales del backend
- **Referencia**: `specs/frontend.md` seccion 4.2

### T4.9 - Session scheduling UI
- **Estimacion**: 2 dias
- **Descripcion**: Componente de agendamiento: selector de orientador, calendario de disponibilidad, confirmacion
- **Entregable**: `/estudiante/sesiones/agendar` con SessionScheduler
- **Referencia**: `specs/frontend.md` seccion 4.1

### T4.10 - Session detail + AI analysis view
- **Estimacion**: 2 dias
- **Descripcion**: Vista de detalle de sesion: transcripcion, analisis IA (resumen, intereses, habilidades, sentimiento)
- **Entregable**: `/orientador/sesiones/[id]` con TranscriptViewer y AIAnalysisPanel

### T4.11 - Migrar Test RIASEC
- **Estimacion**: 2 dias
- **Descripcion**: Migrar TestRIASEC.jsx a TypeScript, conectar con backend FastAPI, mantener UX existente
- **Entregable**: `/estudiante/tests/riasec` funcional
- **Referencia**: `specs/frontend.md` seccion 9

### T4.12 - Charts base
- **Estimacion**: 1 dia
- **Descripcion**: Migrar charts existentes a TypeScript: RIASECRadar, TrendLineChart, SalaryProjection
- **Entregable**: `components/charts/` con Recharts

### T4.13 - Dockerfile y CI
- **Estimacion**: 0.5 dia
- **Descripcion**: Dockerfile multi-stage para Next.js, GitHub Actions para lint + test + build
- **Entregable**: `.github/workflows/frontend.yml`

---

## Criterios de Aceptacion

- [ ] Login con Google OAuth funciona end-to-end (frontend -> backend -> Google -> callback)
- [ ] Sidebar muestra navegacion correcta segun rol del usuario
- [ ] Dashboard de estudiante carga datos reales del backend
- [ ] Dashboard de orientador carga datos reales del backend
- [ ] Test RIASEC completable, resultados guardados via backend
- [ ] Vista de sesion muestra transcripcion y analisis IA
- [ ] Responsive: funciona en mobile (375px) y desktop (1280px+)
- [ ] CI pipeline verde

---

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|-----------|
| Migracion de componentes JSX a TSX con errores de tipo | Media | Bajo | TypeScript strict mode gradual |
| Performance de SSR con dashboards pesados | Baja | Medio | Streaming SSR + Suspense boundaries |
| Tailwind v4 breaking changes vs v3 del MVP | Media | Bajo | Revisar migration guide antes de empezar |
