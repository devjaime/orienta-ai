# AGENTS.md - Guía para Agentes de Código

## Vocari - Plataforma de Orientación Vocacional

Este documento proporciona orientación para agentes de código que trabajan en el proyecto Vocari.

---

## Comandos

### Comandos Principales

```bash
npm run dev          # Inicia servidor de desarrollo en localhost:5173
npm run build        # Build de producción a dist/
npm run preview      # Previsualiza build de producción
npm run lint         # Ejecuta ESLint
```

### Pipeline de Datos MINEDUC

```bash
npm run sync-mineduc-full   # process-matricula → merge-carreras → upload-supabase
npm run analytics-full      # analyze-trends → project-future → analyze-riasec
```

### Scripts Individuales

```bash
npm run process-matricula   # Procesa datos de matrícula
npm run process-titulados   # Procesa datos de titulados
npm run merge-carreras      # Fusiona carreras
npm run upload-supabase     # Sube datos a Supabase
npm run analyze-trends      # Analiza tendencias
npm run project-future      # Proyecta futuro
npm run analyze-riasec     # Analiza RIASEC
```

---

## Convenciones de Código

### Idioma

- **Todo el texto de UI, comentarios y mensajes de commit deben estar en español**
- Nombres de variables y funciones pueden estar en español o inglés (preferir español para lógica de negocio)

### Nomenclatura

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| Componentes React | PascalCase | `TestRIASEC.jsx`, `CarrerasRecomendadas.jsx` |
| Funciones/Variables | camelCase | `getCurrentUser`, `testResults` |
| Constantes | UPPER_SNAKE_CASE | `MAX_RETRY`, `API_BASE_URL` |
| Archivos | kebab-case | `student-importer.jsx` |
| Rutas/URLs | kebab-case | `/resultados`, `/orientador/dashboard` |

### Componentes

- Usar solo componentes funcionales con hooks
- Usar `React.lazy()` para code splitting
- Wrappear rutas protegidas con `<ProtectedRoute allowedRoles={[...]}>`
- Usar `Suspense` con `LoadingFallback` para componentes lazy

### Estructura de Componentes

```jsx
import { useState, useEffect } from 'react'
import { SomeIcon } from 'lucide-react'
import { ComponentA } from './ComponentA'
import { service } from '@/lib/service'

export default function MiComponente({ prop1, prop2 }) {
  const [state, setState] = useState(null)

  useEffect(() => {
    // Effect logic
  }, [])

  const handleAction = async () => {
    try {
      await service.action()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="component-class">
      {/* JSX */}
    </div>
  )
}
```

### Imports

```jsx
// React core
import { useState, useEffect, useCallback } from 'react'

// Router
import { useNavigate, useParams } from 'react-router-dom'

// Third-party
import { motion } from 'framer-motion'
import { SomeIcon, AnotherIcon } from 'lucide-react'

// Local components
import LoadingSpinner from './components/LoadingSpinner'

// Services (siempre de src/lib)
import { supabase } from '@/lib/supabase'
import { getUserProfile } from '@/lib/supabase'
import { orientadorService } from '@/lib/orientadorService'
```

### Estilos con Tailwind

- **Mobile-first**: empezar con clases móviles, usar `md:`, `lg:` para breakpoints
- **Colores del theme**: usar `vocari-primary`, `vocari-accent`, `vocari-bg`, `vocari-bg-warm`
- **Colores RIASEC**: `riasec-R`, `riasec-I`, `riasec-A`, `riasec-S`, `riasec-E`, `riasec-C`
- **Cols legacy**: `orienta-dark`, `orienta-blue`, `orienta-light`

```jsx
// Ejemplos
<div className="bg-vocari-primary text-white p-4 md:p-6 lg:p-8">
<button className="bg-vocari-accent text-vocari-dark-text hover:opacity-90">
<span className="text-riasec-I font-bold">
```

### Manejo de Errores

```jsx
// Servicios - throw errors
const getData = async () => {
  const { data, error } = await supabase.from('table').select('*')
  if (error) {
    console.error('Error fetching:', error)
    throw error  // o return null/[] según contexto
  }
  return data
}

// Componentes - try/catch con user feedback
const handleSubmit = async () => {
  try {
    setLoading(true)
    await service.action()
    // Success feedback
  } catch (error) {
    console.error('Error:', error)
    // Error feedback al usuario
  } finally {
    setLoading(false)
  }
}
```

### Estado y Fetching

```jsx
// Estado simple
const [data, setData] = useState(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)

// Fetch con useEffect
useEffect(() => {
  const fetchData = async () => {
    try {
      const result = await service.getData()
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  fetchData()
}, [dependency])
```

### Reglas ESLint

El proyecto usa ESLint con configuración personalizada en `eslint.config.js`:

- `no-unused-vars`: error (ignora variables que empiezan con `_` o mayúsculas)
- `no-undef`: off (permite globales del navegador)
- React Hooks: configuración recomendada
- React Refresh: habilitado para HMR

### Formato de Commits

```
tipo(scope): descripción

Ejemplos:
feat(auth): agregar login con Google
fix(riasec): corregir cálculo de puntajes
feat(dashboard): agregar gráfico de tendencias
refactor(services): mejorar manejo de errores
```

Tipos: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`

---

## Arquitectura

### Stack

- React 19 + Vite 7
- Tailwind CSS 3
- Supabase (PostgreSQL + Auth)
- Framer Motion para animaciones
- React Router v6

### Estructura de Archivos

```
src/
├── App.jsx              # Rutas principales
├── main.jsx             # Entry point
├── lib/                 # Servicios (lógica de negocio)
│   ├── supabase.js      # Cliente Supabase y helpers auth
│   ├── riasecScoring.js # Algoritmo RIASEC
│   ├── orientadorService.js
│   └── ...
├── components/          # Componentes reutilizables
│   ├── ui/              # Componentes base
│   ├── charts/          # Gráficos
│   ├── orientador/       # Componentes de orientador
│   └── ...
└── pages/               # Páginas (rutas)
```

### Roles de Usuario

| Rol | Descripción |
|-----|-------------|
| `super_admin`, `admin` | Acceso total al sistema |
| `admin_colegio` | Admin de institución específica |
| `orientador` | Funciones de orientador/consejero |
| `apoderado` | Dashboard de padres/Apoderados |
| `estudiante` | Test, resultados, dashboard |

### Servicios en src/lib/

| Archivo | Responsabilidad |
|---------|----------------|
| `supabase.js` | Cliente Supabase, auth helpers |
| `adminService.js` | Gestión de usuarios, aprobaciones |
| `orientadorService.js` | Disponibilidad, asignación, notas |
| `parentService.js` | Linking padre-hijo, ver resultados |
| `institutionService.js` | Gestión multi-tenant |
| `riasecScoring.js` | Algoritmo de scoring RIASEC |
| `recomendacionCarreras.js` | Motor de recomendaciones |
| `claudeAPI.js` | Integración IA (deshabilitada) |
| `saturationChecker.js` | Alertas de saturación laboral |
| `usageLimits.js` | Rate limiting |
| `auditLog.js` | Logging de actividad |

---

## Base de Datos

- **Proveedor**: Supabase (PostgreSQL)
- **Auth**: Google OAuth vía Supabase
- **RLS**: Row Level Security habilitado en todas las tablas
- **Tablas principales**: `users`, `user_profiles`, `test_results`, `scheduled_sessions`, `institutions`, `institution_students`

---

## Variables de Entorno

```
VITE_SUPABASE_URL       # URL del proyecto Supabase
VITE_SUPABASE_ANON_KEY # Clave pública de Supabase
VITE_CLAUDE_API_KEY    # API key de Anthropic (para IA)
VITE_AI_ENABLED        # "true"/"false" - togglear features IA
```

---

## Notas Adicionales

- **No hay framework de tests configurado** - no hay tests automatizados
- **Hybrid Model**: La lógica vocacional es determinista (RIASEC, matching). IA solo para explicaciones, nunca para decisiones
- **Progressive enhancement**: Features pueden funcionar sin IA
- **Multitenencia**: Instituciones gestionadas vía `institutions` e `institution_students`
