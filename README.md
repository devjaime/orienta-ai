# Vocari — Prototipo de Plataforma de Orientación Vocacional

> **Estado:** Proyecto cerrado como startup. Código abierto para estudio y referencia técnica.
> Uso comercial reservado — ver [Licencia](#licencia) y [Modelo B2B](#modelo-b2b--socios).

---

## Autoría y participantes

| Rol | Persona |
|-----|---------|
| Desarrollo, arquitectura de plataforma y dirección técnica | **Jaime Hernández** |
| Participante en etapa temprana del proyecto | **Natalia Soto** |

**Contacto:** hernandez.hs@gmail.com

---

## Qué es este proyecto

**Vocari** nació como una idea de startup en etapa temprana: una plataforma de orientación
vocacional para jóvenes de 16–24 años de Chile y Latinoamérica, que combina algoritmos
deterministas (test Holland RIASEC, matching de carreras con datos MINEDUC) con explicaciones
asistidas por IA generativa (Claude API de Anthropic).

Ante el cierre de la etapa comercial, el proyecto se convierte en:

- **Prototipo de referencia** para quienes quieran estudiar arquitecturas de producto SaaS en el
  espacio EdTech/orientación vocacional.
- **Base tecnológica** disponible para socios interesados en un modelo B2B institucional
  (colegios, universidades, empresas de RRHH).
- **Material de portafolio técnico** que demuestra implementación real de: autenticación multi-rol,
  multi-tenancy, pipelines de datos públicos, integración de LLMs y dashboards operativos.

> **La plataforma se presenta únicamente como demostración funcional.**
> No está operando comercialmente ni gestionando datos reales de usuarios.

---

## Arquitectura del sistema

```
vocari.cl (landing / portafolio)          app.vocari.cl (plataforma)
        │                                          │
  React 19 + Vite 7                       Next.js 14 (App Router)
  Tailwind CSS + Framer Motion            TypeScript + Tailwind CSS
        │                                          │
        └──────────────┬───────────────────────────┘
                       │
              Supabase (PostgreSQL)
              Auth (Google OAuth)
              Row Level Security por rol
                       │
              FastAPI (Python) — API REST
              Algoritmo RIASEC determinista
              Pipeline datos MINEDUC
                       │
              Claude API (Anthropic)
              IA generativa para explicaciones
              (flag VITE_AI_ENABLED)
```

### Roles de usuario

| Rol | Acceso |
|-----|--------|
| `estudiante` | Test RIASEC, resultados, informe, dashboard personal |
| `orientador` | Dashboard de estudiantes, notas de sesión, timeline |
| `apoderado` | Vista del progreso de su hijo/a |
| `admin_colegio` | Gestión de estudiantes de su institución |
| `admin` / `super_admin` | Acceso completo al sistema |

---

## Mapa del repositorio

```
├── src/                  Frontend React/Vite (vocari.cl — landing)
├── frontend/             Frontend Next.js (app.vocari.cl — plataforma)
├── backend/              API FastAPI + Python
├── specs/                Documentos de producto, roadmap y especificaciones
├── scripts/              Pipeline de datos MINEDUC (scripts Node.js 00–08)
├── data/                 Datos MINEDUC procesados (no incluidos en repo)
├── postman/              Colecciones para QA por roles
└── LICENSE               Licencia de uso con atribución y restricción comercial
```

---

## Desarrollo local

### Landing (Vite)

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
npm run lint
```

### App B2B — Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

### Backend (FastAPI)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

### Pipeline de datos MINEDUC

```bash
npm run sync-mineduc-full    # process-matricula → merge-carreras → upload-supabase
npm run analytics-full       # analyze-trends → project-future → analyze-riasec
```

---

## Variables de entorno

| Archivo | Descripción |
|---------|-------------|
| `.env` (raíz) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_CLAUDE_API_KEY`, `VITE_AI_ENABLED` |
| `frontend/.env.local` | URL API backend, configuración auth cliente |
| `backend/.env` | Base de datos, CORS, JWT, proveedor IA, correo |

Ver ejemplos: `.env.example`, `frontend/.env.local.example`, `backend/.env.example`

---

## Licencia

Este proyecto está protegido bajo una **Licencia de Uso con Atribución y Restricción Comercial**
(ver archivo [`LICENSE`](./LICENSE)).

### Resumen

| | |
|---|---|
| **Puedes** | Estudiar el código · Aprender de él · Crear forks educativos con atribución · Referenciar en tu portafolio |
| **No puedes** | Usarlo comercialmente · Eliminar la autoría · Usar la marca "Vocari" |
| **Contacta si** | Quieres implementarlo en un colegio, empresa o institución (B2B) |

Atribución obligatoria en proyectos derivados:
```
Basado en el trabajo original de Jaime Hernández (Vocari, 2026).
```

**Copyright (c) 2026 Jaime Hernández. Todos los derechos reservados.**

---

## Modelo B2B — Socios

El proyecto queda abierto exclusivamente para acuerdos de **licencia comercial B2B** con
instituciones o empresas interesadas en:

- Implementar la plataforma en colegios o redes educativas.
- Adaptar el motor RIASEC para programas de RRHH o universidades.
- Desarrollar un producto derivado con soporte y evolución continua.

Para negociar términos: **hernandez.hs@gmail.com**

---

## Reconocimientos

- Datos de matrículas y egresados: **MINEDUC Chile** (datos públicos 2024–2025).
- Motor de IA generativa: **Anthropic Claude API**.
- Método vocacional: **Holland RIASEC** (dominio público, adaptación propia).
- Participante en etapa temprana: **Natalia Soto**.
