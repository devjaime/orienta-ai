# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vocari is a SaaS vocational guidance platform for students aged 16-24 in Chile/LATAM. It combines deterministic vocational algorithms (Holland RIASEC test, career matching) with optional AI-assisted explanations via Claude API. The codebase is entirely in Spanish.

## Commands

```bash
npm run dev          # Vite dev server on localhost:5173
npm run build        # Production build to dist/
npm run preview      # Preview production build
npm run lint         # ESLint check

# MINEDUC data pipeline (run sequentially)
npm run sync-mineduc-full   # process-matricula → merge-carreras → upload-supabase
npm run analytics-full      # analyze-trends → project-future → analyze-riasec
```

No test framework is configured. There are no automated tests.

## Architecture

**Stack:** React 19 + Vite 7 + Tailwind CSS 3 + Supabase (PostgreSQL + Auth) + Framer Motion

### Hybrid Model (core design principle)

Vocational logic is **deterministic and explainable** -- RIASEC scoring, career matching algorithms, saturation checking. AI (Claude API) is only used for natural language explanations and chat, never for decisions. The AI feature is behind a `VITE_AI_ENABLED` flag (currently disabled).

### Routing & Access Control

`src/App.jsx` defines all routes using React Router v6. Protected routes use lazy loading via `React.lazy()` and are wrapped with `<ProtectedRoute allowedRoles={[...]}>`.

**Role hierarchy:**
- `super_admin`, `admin` -- full system access
- `admin_colegio` -- institution-scoped admin
- `orientador` -- counselor features (also gets admin-level route access for orientador paths)
- `apoderado` -- parent/guardian dashboard
- `estudiante` -- test, results, dashboard

Route groups: public (`/`, `/auth/callback`, `/activate`), student (`/test`, `/resultados`, `/dashboard`), parent (`/parent`), orientador (`/orientador/*`), admin (`/admin`, `/admin/institutions/:id/students`).

### Service Layer

All backend interaction goes through service files in `src/lib/`:

| File | Responsibility |
|------|---------------|
| `supabase.js` | Supabase client init, auth helpers (`getCurrentUser`, `getUserProfile`, `signInWithGoogle`) |
| `adminService.js` | User management, approvals, status changes |
| `orientadorService.js` | Counselor availability, student assignment, session notes |
| `parentService.js` | Parent-child linking, viewing child results |
| `institutionService.js` | Multi-tenant institution/school management |
| `riasecScoring.js` | RIASEC test scoring algorithm |
| `recomendacionCarreras.js` | Career recommendation matching engine |
| `claudeAPI.js` | Claude AI integration for explanations |
| `saturationChecker.js` | Career market saturation alerts |
| `usageLimits.js` | Rate limiting |
| `auditLog.js` | Activity/audit logging |

### Auth Flow

Google OAuth via Supabase: `signInWithGoogle()` → redirect to `/auth/callback` → session validation → profile linking to `user_profiles` table → role-based redirect. Profiles can be pre-created by admins before user registration (linked on first login).

### Multi-Tenant Architecture

Institutions (schools) are managed via `institutions` and `institution_students` tables. The `admin_colegio` role is scoped to their institution. Students can be bulk-imported via CSV through `StudentImporter.jsx`.

### Data Pipeline

`scripts/` contains numbered Node.js scripts (00-08) for processing Chilean MINEDUC education data (enrollment, graduates, admissions). Raw data lives in `data/mineduc-raw/`, processed output in `data/processed/`. The pipeline feeds career statistics into Supabase.

### Tailwind Theme

Custom colors defined in `tailwind.config.cjs`: `orienta-dark` (#0C1E3C), `orienta-blue` (#33B5E5), `orienta-light` (#F5F7FA). Fonts: Inter, Poppins.

## Key Conventions

- All UI text, comments, and commit messages are in **Spanish**
- Commit format: `tipo(scope): descripción` (e.g., `feat(auth): agregar login con email`)
- Functional components with hooks only; names in PascalCase
- Tailwind utility classes for all styling, mobile-first
- Feature skill specifications live in `skills/*.skill.md`
- Database migrations are SQL files in `scripts/`
- Never rewrite from scratch -- always evolve incrementally

## Environment Variables

```
VITE_SUPABASE_URL          # Supabase project URL
VITE_SUPABASE_ANON_KEY     # Supabase public anon key
VITE_CLAUDE_API_KEY        # Anthropic API key (for AI features)
VITE_AI_ENABLED            # "true"/"false" - toggle AI features
```
