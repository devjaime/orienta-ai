# Vocari - Especificacion de Frontend

> Version: 2.0 | Fecha: Marzo 2026
> Stack: Next.js 15 | React 19 | Tailwind CSS 4 | Recharts | Framer Motion

---

## 1. Estructura del Proyecto Frontend

```
frontend/
├── app/                           # Next.js App Router
│   ├── layout.tsx                 # Root layout (providers, fonts, metadata)
│   ├── page.tsx                   # Landing page (/)
│   ├── globals.css                # Tailwind + custom styles
│   │
│   ├── (marketing)/               # Grupo de rutas publicas
│   │   ├── b2b/page.tsx           # Landing B2B para colegios
│   │   ├── demo/page.tsx          # Demo interactiva
│   │   ├── precios/page.tsx       # Pricing
│   │   ├── terminos/page.tsx      # Terminos de servicio
│   │   └── privacidad/page.tsx    # Politica de privacidad
│   │
│   ├── auth/                      # Rutas de autenticacion
│   │   ├── login/page.tsx         # Login con Google
│   │   ├── callback/page.tsx      # OAuth callback
│   │   ├── completar-perfil/page.tsx
│   │   └── activar/page.tsx       # Activacion con codigo
│   │
│   ├── (dashboard)/               # Grupo protegido (requiere auth)
│   │   ├── layout.tsx             # Dashboard layout (sidebar, header)
│   │   │
│   │   ├── estudiante/
│   │   │   ├── page.tsx           # Dashboard principal estudiante
│   │   │   ├── sesiones/
│   │   │   │   ├── page.tsx       # Listar sesiones
│   │   │   │   ├── agendar/page.tsx
│   │   │   │   └── [id]/page.tsx  # Detalle de sesion
│   │   │   ├── tests/
│   │   │   │   ├── page.tsx       # Listar tests disponibles
│   │   │   │   ├── riasec/page.tsx
│   │   │   │   └── adaptativo/[id]/page.tsx
│   │   │   ├── juegos/
│   │   │   │   ├── page.tsx       # Catalogo de juegos
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── carreras/
│   │   │   │   ├── page.tsx       # Explorador de carreras
│   │   │   │   ├── [id]/page.tsx  # Detalle de carrera
│   │   │   │   └── simulacion/[id]/page.tsx
│   │   │   ├── perfil/page.tsx    # Perfil longitudinal
│   │   │   └── reportes/page.tsx  # Mis reportes
│   │   │
│   │   ├── orientador/
│   │   │   ├── page.tsx           # Dashboard orientador
│   │   │   ├── agenda/page.tsx    # Gestion de disponibilidad
│   │   │   ├── sesiones/
│   │   │   │   ├── page.tsx       # Sesiones pasadas y futuras
│   │   │   │   └── [id]/page.tsx  # Detalle + analisis IA
│   │   │   ├── estudiantes/
│   │   │   │   ├── page.tsx       # Lista de estudiantes asignados
│   │   │   │   └── [id]/page.tsx  # Perfil completo del estudiante
│   │   │   └── notas/
│   │   │       └── [session_id]/page.tsx
│   │   │
│   │   ├── apoderado/
│   │   │   ├── page.tsx           # Dashboard apoderado
│   │   │   ├── hijos/
│   │   │   │   └── [id]/page.tsx  # Perfil del hijo
│   │   │   └── consentimiento/page.tsx
│   │   │
│   │   ├── admin/
│   │   │   ├── page.tsx           # Dashboard admin colegio
│   │   │   ├── estudiantes/page.tsx
│   │   │   ├── orientadores/page.tsx
│   │   │   ├── metricas/page.tsx
│   │   │   ├── importar/page.tsx  # Import CSV
│   │   │   └── configuracion/page.tsx
│   │   │
│   │   └── super-admin/
│   │       ├── page.tsx           # Dashboard super admin
│   │       ├── instituciones/page.tsx
│   │       ├── usuarios/page.tsx
│   │       └── monitoreo/page.tsx
│   │
│   └── api/                       # API Routes (BFF layer)
│       └── [...proxy]/route.ts    # Proxy a FastAPI (opcional)
│
├── components/
│   ├── ui/                        # Componentes base (design system)
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Dialog.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── Table.tsx
│   │   ├── Tabs.tsx
│   │   ├── Toast.tsx
│   │   ├── Skeleton.tsx
│   │   ├── ProgressBar.tsx
│   │   └── Spinner.tsx
│   │
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   ├── DashboardShell.tsx
│   │   └── MobileNav.tsx
│   │
│   ├── auth/
│   │   ├── GoogleSignInButton.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── RoleGuard.tsx
│   │   └── ConsentBanner.tsx
│   │
│   ├── sessions/
│   │   ├── SessionCard.tsx
│   │   ├── SessionScheduler.tsx
│   │   ├── SessionDetail.tsx
│   │   ├── TranscriptViewer.tsx
│   │   ├── AIAnalysisPanel.tsx
│   │   └── SessionTimeline.tsx
│   │
│   ├── tests/
│   │   ├── RIASECTest.tsx
│   │   ├── RIASECResults.tsx
│   │   ├── AdaptiveQuestion.tsx
│   │   ├── TestProgress.tsx
│   │   └── TestHistory.tsx
│   │
│   ├── games/
│   │   ├── GameCard.tsx
│   │   ├── GamePlayer.tsx          # Contenedor generico de juegos
│   │   ├── GameResults.tsx
│   │   └── games/                  # Juegos individuales
│   │       ├── LogicPuzzle.tsx
│   │       ├── PatternRecognition.tsx
│   │       ├── DecisionSimulator.tsx
│   │       ├── CreativityChallenge.tsx
│   │       └── TeamworkScenario.tsx
│   │
│   ├── careers/
│   │   ├── CareerCard.tsx
│   │   ├── CareerDetail.tsx
│   │   ├── CareerExplorer.tsx
│   │   ├── CareerComparator.tsx
│   │   ├── CareerSimulation.tsx
│   │   ├── SaturationAlert.tsx
│   │   └── UniversityList.tsx
│   │
│   ├── profiles/
│   │   ├── LongitudinalProfile.tsx
│   │   ├── SkillsRadar.tsx
│   │   ├── InterestEvolution.tsx
│   │   ├── HappinessTracker.tsx
│   │   └── ProfileTimeline.tsx
│   │
│   ├── charts/
│   │   ├── RIASECRadar.tsx
│   │   ├── TrendLineChart.tsx
│   │   ├── SalaryProjection.tsx
│   │   ├── EngagementChart.tsx
│   │   ├── MatriculaTrend.tsx
│   │   └── SentimentTimeline.tsx
│   │
│   ├── dashboards/
│   │   ├── StudentDashboard.tsx
│   │   ├── OrientadorDashboard.tsx
│   │   ├── ParentDashboard.tsx
│   │   ├── AdminDashboard.tsx
│   │   └── SuperAdminDashboard.tsx
│   │
│   └── common/
│       ├── DataTable.tsx
│       ├── SearchBar.tsx
│       ├── FileUploader.tsx
│       ├── PDFViewer.tsx
│       ├── NotificationBell.tsx
│       ├── EmptyState.tsx
│       └── ErrorBoundary.tsx
│
├── lib/
│   ├── api.ts                     # API client (fetch wrapper)
│   ├── auth.ts                    # Auth utilities, token management
│   ├── hooks/
│   │   ├── useAuth.ts             # Authentication hook
│   │   ├── useSession.ts          # Session management
│   │   ├── useProfile.ts          # Student profile data
│   │   ├── useCareers.ts          # Career data and recommendations
│   │   ├── useDashboard.ts        # Dashboard data fetching
│   │   ├── useRealtime.ts         # WebSocket connection
│   │   └── useConsent.ts          # Consent status
│   ├── stores/
│   │   ├── auth-store.ts          # Zustand auth store
│   │   ├── ui-store.ts            # UI state (sidebar, theme)
│   │   └── notification-store.ts  # Notifications
│   ├── utils/
│   │   ├── dates.ts               # Date formatting (es-CL)
│   │   ├── currency.ts            # CLP formatting
│   │   ├── validation.ts          # Form validation helpers
│   │   └── constants.ts           # App-wide constants
│   └── types/
│       ├── api.ts                 # API response types
│       ├── user.ts                # User, Profile types
│       ├── session.ts             # Session types
│       ├── career.ts              # Career types
│       └── game.ts                # Game types
│
├── public/
│   ├── images/
│   ├── icons/
│   └── data/
│       └── processed/             # Datos MINEDUC procesados (estaticos)
│
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
├── package.json
└── Dockerfile
```

---

## 2. State Management

### Estrategia: Server State + Minimal Client State

```
Server State (90% del estado):
  - TanStack Query (React Query) v5
  - Toda la data del backend se maneja como server state
  - Caching automatico, invalidacion, refetch
  - Optimistic updates para acciones del usuario

Client State (10% del estado):
  - Zustand para estado local de UI
  - Solo para: sidebar open/close, theme, modals, toast queue
  - No persistir datos del backend en client state

Form State:
  - React Hook Form + Zod para validacion
  - Formularios complejos: test RIASEC, scheduler, profile editor

Real-time State:
  - WebSocket via useRealtime hook
  - Notificaciones push
  - Estado de procesamiento IA (polling como fallback)
```

### Hooks Principales

```typescript
// Especificacion de hooks - NO es codigo ejecutable

// useAuth: Gestion de autenticacion
interface UseAuth {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: () => void          // redirect a Google OAuth
  logout: () => void
  hasRole: (role: Role) => boolean
  hasConsent: (type: ConsentType) => boolean
}

// useSession: Datos de sesiones
interface UseSession {
  sessions: Session[]
  isLoading: boolean
  scheduleSession: (data: ScheduleInput) => Promise<Session>
  cancelSession: (id: string) => Promise<void>
  getSessionDetail: (id: string) => UseQueryResult<SessionDetail>
}

// useProfile: Perfil longitudinal
interface UseProfile {
  profile: LongitudinalProfile | null
  isLoading: boolean
  riasecHistory: RIASECResult[]
  skills: SkillSet
  interests: InterestSet
  happinessScore: number
  careerRecommendations: CareerRecommendation[]
}

// useDashboard: Datos agregados por rol
interface UseDashboard {
  data: DashboardData  // tipo varia segun rol
  isLoading: boolean
  refresh: () => void
}
```

---

## 3. Design System

### 3.1 Tokens de Diseno

```css
/* Colores principales - manteniendo identidad Vocari */
--vocari-primary:    #1a365d;   /* Azul oscuro - confianza */
--vocari-accent:     #38b2ac;   /* Teal - frescura */
--vocari-bg:         #f7fafc;   /* Fondo claro */
--vocari-bg-warm:    #fffaf0;   /* Fondo calido */
--vocari-text:       #2d3748;   /* Texto principal */
--vocari-text-muted: #718096;   /* Texto secundario */

/* Colores RIASEC (identidad del producto) */
--riasec-R: #e53e3e;  /* Realista - Rojo */
--riasec-I: #3182ce;  /* Investigador - Azul */
--riasec-A: #805ad5;  /* Artistico - Purpura */
--riasec-S: #38a169;  /* Social - Verde */
--riasec-E: #d69e2e;  /* Emprendedor - Amarillo */
--riasec-C: #4a5568;  /* Convencional - Gris */

/* Colores de estado */
--success: #48bb78;
--warning: #ed8936;
--error:   #f56565;
--info:    #4299e1;

/* Espaciado base: 4px */
/* Border radius: 8px (cards), 6px (buttons), 4px (inputs) */
/* Sombras: sm, md, lg (Tailwind defaults) */
```

### 3.2 Tipografia

```
Font family: Inter (variable weight)
Fallback: system-ui, -apple-system, sans-serif

Escala:
  - xs:   0.75rem / 1rem
  - sm:   0.875rem / 1.25rem
  - base: 1rem / 1.5rem
  - lg:   1.125rem / 1.75rem
  - xl:   1.25rem / 1.75rem
  - 2xl:  1.5rem / 2rem
  - 3xl:  1.875rem / 2.25rem
  - 4xl:  2.25rem / 2.5rem
```

### 3.3 Componentes Base

| Componente | Variantes | Notas |
|-----------|-----------|-------|
| Button | primary, secondary, ghost, danger; sm, md, lg | Loading state integrado |
| Card | default, elevated, interactive | Hover state para interactive |
| Input | text, email, password, search; con/sin label | Error state, helper text |
| Select | single, multi | Keyboard navigable |
| Dialog | modal, drawer, alert | Escape to close, focus trap |
| Badge | success, warning, error, info, neutral | Dot variant para estados |
| Avatar | xs, sm, md, lg | Fallback con iniciales |
| Table | default, compact, striped | Sortable headers, pagination |
| Tabs | underline, pills | Keyboard navigable |
| Toast | success, error, warning, info | Auto-dismiss, stackable |
| Skeleton | text, circle, rect | Para loading states |
| Spinner | sm, md, lg | Tailwind animate-spin |
| ProgressBar | determinate, indeterminate | Con porcentaje label |

---

## 4. Paginas por Rol

### 4.1 Estudiante

| Pagina | Ruta | Componentes Principales |
|--------|------|------------------------|
| Dashboard | `/estudiante` | UpcomingSessions, PendingTests, ProfileSummary, RecommendedCareers |
| Agendar Sesion | `/estudiante/sesiones/agendar` | SessionScheduler (calendario, horarios disponibles) |
| Detalle Sesion | `/estudiante/sesiones/[id]` | SessionDetail, AIAnalysisPanel (vista simplificada) |
| Test RIASEC | `/estudiante/tests/riasec` | RIASECTest (36 preguntas), RIASECResults |
| Test Adaptativo | `/estudiante/tests/adaptativo/[id]` | AdaptiveQuestion (iterativo) |
| Juegos | `/estudiante/juegos` | GameCard grid, filtros por habilidad |
| Jugar | `/estudiante/juegos/[slug]` | GamePlayer, GameResults |
| Explorar Carreras | `/estudiante/carreras` | CareerExplorer (busqueda + filtros + mapa interactivo) |
| Detalle Carrera | `/estudiante/carreras/[id]` | CareerDetail, UniversityList, SaturationAlert |
| Simulacion | `/estudiante/carreras/simulacion/[id]` | CareerSimulation (timeline interactivo) |
| Mi Perfil | `/estudiante/perfil` | LongitudinalProfile, SkillsRadar, InterestEvolution, HappinessTracker |
| Reportes | `/estudiante/reportes` | ReportList, PDFViewer |

### 4.2 Orientador

| Pagina | Ruta | Componentes Principales |
|--------|------|------------------------|
| Dashboard | `/orientador` | TodaySessions, PendingReviews, WorkloadStats, Alerts |
| Agenda | `/orientador/agenda` | AvailabilityManager (calendario semanal) |
| Sesiones | `/orientador/sesiones` | SessionList (filtros por estado, fecha) |
| Detalle Sesion | `/orientador/sesiones/[id]` | TranscriptViewer, AIAnalysisPanel (completa), SessionNotes |
| Estudiantes | `/orientador/estudiantes` | StudentList, SearchBar, filtros |
| Perfil Estudiante | `/orientador/estudiantes/[id]` | LongitudinalProfile (vista completa), SessionTimeline, Notes |

### 4.3 Apoderado

| Pagina | Ruta | Componentes Principales |
|--------|------|------------------------|
| Dashboard | `/apoderado` | ChildrenOverview, RecentActivity |
| Perfil Hijo | `/apoderado/hijos/[id]` | ProfileSummary, SessionHistory, TestResults, HappinessTracker |
| Consentimiento | `/apoderado/consentimiento` | ConsentForm (recording, IA, storage) |

### 4.4 Admin Colegio

| Pagina | Ruta | Componentes Principales |
|--------|------|------------------------|
| Dashboard | `/admin` | InstitutionStats, EngagementChart, OrientadorWorkload |
| Estudiantes | `/admin/estudiantes` | DataTable (filtros, busqueda, acciones batch) |
| Orientadores | `/admin/orientadores` | OrientadorList, AssignmentMatrix |
| Metricas | `/admin/metricas` | Charts (engagement, sesiones, tests, carreras populares) |
| Importar | `/admin/importar` | CSVUploader, PreviewTable, ValidationErrors |
| Config | `/admin/configuracion` | InstitutionSettings, GoogleWorkspaceSetup |

### 4.5 Super Admin

| Pagina | Ruta | Componentes Principales |
|--------|------|------------------------|
| Dashboard | `/super-admin` | PlatformStats, RevenueChart, ActiveInstitutions |
| Instituciones | `/super-admin/instituciones` | InstitutionTable, CreateInstitution |
| Usuarios | `/super-admin/usuarios` | UserTable, ApprovalQueue, RoleManager |
| Monitoreo | `/super-admin/monitoreo` | AIUsageChart, CostTracker, ErrorLog |

---

## 5. Responsive Design

### Breakpoints

```
sm:  640px   # Telefono horizontal
md:  768px   # Tablet vertical
lg:  1024px  # Tablet horizontal / laptop pequeno
xl:  1280px  # Desktop
2xl: 1536px  # Desktop grande
```

### Estrategia Mobile-First

```
Mobile (default):
  - Sidebar colapsado (hamburger menu)
  - Cards apiladas verticalmente
  - Tablas con scroll horizontal o vista card
  - Juegos adaptados a touch
  - Test RIASEC: una pregunta por pantalla

Tablet (md+):
  - Sidebar visible (colapsable)
  - Grid de 2 columnas para cards
  - Tablas completas visibles

Desktop (lg+):
  - Sidebar fijo
  - Grid de 3-4 columnas
  - Split views (lista + detalle)
  - Graficos completos
```

---

## 6. Performance

### Estrategias

```
1. Next.js App Router con streaming SSR
   - Dashboards renderizan layout inmediato, datos streameados
   - Suspense boundaries para cada seccion

2. Code Splitting automatico
   - Cada pagina es un chunk separado
   - Componentes pesados (juegos, charts) lazy-loaded

3. Image Optimization
   - next/image para todas las imagenes
   - WebP/AVIF automatico
   - Lazy loading por defecto

4. Data Fetching
   - TanStack Query con staleTime configurado por tipo de dato:
     - Carreras: 1 hora (datos estaticos)
     - Dashboard: 5 minutos
     - Sesiones: 1 minuto
     - Perfil: 5 minutos
   - Prefetch en hover para navegacion predictiva

5. Bundle Size Budget
   - First Load JS: < 100 KB
   - Pagina individual: < 50 KB adicionales
   - Total (con juegos): < 500 KB
```

---

## 7. Accesibilidad

```
Target: WCAG 2.1 Level AA

Requisitos:
  - Contraste minimo 4.5:1 para texto
  - Navegacion completa por teclado
  - Screen reader compatible (aria labels)
  - Focus visible en todos los elementos interactivos
  - Textos alternativos para graficos
  - Reduccion de movimiento respetada (prefers-reduced-motion)

Tests:
  - axe-core en CI
  - Manual con VoiceOver (macOS) y NVDA (Windows)
```

---

## 8. Internacionalizacion (i18n)

```
Fase 1: Solo espanol (es-CL)
  - Formato de fecha: dd/mm/yyyy
  - Formato de moneda: $XXX.XXX CLP
  - Formato de numeros: 1.000,50

Fase 4 (expansion LATAM):
  - next-intl para i18n
  - Locales: es-CL, es-CO, es-MX, es-PE, pt-BR
  - Contenido de carreras localizado por pais
```

---

## 9. Migracion desde MVP

### Componentes Reutilizables (migrar de JSX a TSX)

| Componente Actual | Nuevo Componente | Esfuerzo |
|-------------------|-----------------|---------|
| TestRIASEC.jsx | tests/RIASECTest.tsx | Medio (agregar TypeScript) |
| Resultados.jsx | tests/RIASECResults.tsx | Bajo |
| CarrerasRecomendadas.jsx | careers/CareerExplorer.tsx | Alto (rediseno) |
| CareerComparator.jsx | careers/CareerComparator.tsx | Bajo |
| AIChat.jsx | Eliminar (reemplazar por analisis de sesion) | N/A |
| GoogleSignIn.jsx | auth/GoogleSignInButton.tsx | Bajo |
| Header.jsx | layout/Header.tsx | Medio |
| Footer.jsx | layout/Footer.tsx | Bajo |
| Charts/*.jsx | charts/*.tsx | Medio (TypeScript + Recharts update) |
| OrientadorDashboard.jsx | dashboards/OrientadorDashboard.tsx | Alto (nuevas features) |
| ParentDashboard.jsx | dashboards/ParentDashboard.tsx | Medio |

### Componentes Nuevos (sin equivalente en MVP)

| Componente | Prioridad | Complejidad |
|-----------|-----------|------------|
| SessionScheduler | P0 | Alta (Google Calendar integration) |
| TranscriptViewer | P0 | Media |
| AIAnalysisPanel | P0 | Media |
| AdaptiveQuestion | P1 | Alta (interaccion iterativa con IA) |
| GamePlayer + 5 juegos | P2 | Muy Alta |
| CareerSimulation | P2 | Alta (visualizacion de timeline) |
| LongitudinalProfile | P1 | Alta (multiples visualizaciones) |
| ConsentBanner/Form | P0 | Baja |
| HappinessTracker | P2 | Media |

---

## 10. Dependencias Frontend

```json
{
  "dependencies": {
    "next": "^15",
    "react": "^19",
    "react-dom": "^19",
    "tailwindcss": "^4",
    "@tanstack/react-query": "^5",
    "zustand": "^5",
    "react-hook-form": "^7",
    "zod": "^3",
    "@hookform/resolvers": "^3",
    "recharts": "^2",
    "framer-motion": "^12",
    "lucide-react": "^0.470",
    "date-fns": "^4",
    "@react-pdf/renderer": "^4",
    "next-intl": "^4"
  },
  "devDependencies": {
    "typescript": "^5.7",
    "@types/react": "^19",
    "eslint": "^9",
    "prettier": "^3",
    "vitest": "^3",
    "@testing-library/react": "^16",
    "playwright": "^1.49"
  }
}
```
