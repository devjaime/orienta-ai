# Vocari / OrientaIA — Visión General de Infraestructura

> Arquitectura y componentes de infraestructura que generan costos en la plataforma.

---

## Resumen de Arquitectura

Vocari es una **SPA React 19** desplegada en Netlify, respaldada por **Supabase** (PostgreSQL + Auth + Storage), con funcionalidades de IA impulsadas por **Anthropic Claude** (vía funciones serverless de Netlify) y **OpenRouter / Gemini 2.0 Flash** (para el widget de chat). Toda la lógica de negocio se divide entre un motor vocacional determinístico (puntuación RIASEC, matching de carreras) y explicaciones opcionales generadas por IA.

```
Navegador (React SPA)
    │
    ├── Netlify CDN  ─────────────── Hosting estático + funciones serverless
    │       └── /functions/          (generate-explanation, generate-report,
    │                                 generate-session-summary, pagos)
    │
    ├── Supabase
    │       ├── PostgreSQL           Usuarios, resultados de tests, sesiones, informes
    │       ├── Auth                 Google OAuth + email/contraseña
    │       └── Storage              Informes PDF, archivos subidos (futuro)
    │
    ├── Anthropic API (Claude 3.5 Sonnet)
    │       └── Explicaciones + informes pagados + resúmenes de sesión
    │
    ├── OpenRouter (Gemini 2.0 Flash)
    │       └── Widget de chat con tier gratuito
    │
    └── Google Meet API
            └── Links de sesión con orientadores
```

---

## Componentes que Generan Costos

### 1. Hosting (Netlify)

**Fuente oficial de precios:** https://www.netlify.com/pricing/

| Tier | Costo | Capacidad |
|------|-------|-----------|
| Free | $0 | 100GB ancho de banda, 125k invocaciones de funciones/mes |
| Pro | $19/mes | 400GB ancho de banda, 500k invocaciones/mes |
| Business | $99/mes | Ancho de banda ilimitado, funcionalidades de equipo |

**Qué corre en Netlify:**
- SPA React servida como archivos estáticos (costo muy bajo)
- 4 funciones serverless (`generate-explanation`, `generate-report`, `generate-session-summary`, manejadores de pago)
- Cada llamada de IA = 1 invocación de función (tiempo de ejecución ≤ 10 segundos)

**Estimación por 1,000 estudiantes:** ~4,000 sesiones/mes → 4,000 invocaciones de función. Dentro del tier gratuito hasta ~3,000 estudiantes.

---

### 2. Base de Datos (Supabase)

**Fuente oficial de precios:** https://supabase.com/pricing

| Tier | Costo | Tamaño BD | Storage | Edge Functions |
|------|-------|-----------|---------|----------------|
| Free | $0 | 500MB | 1GB | 500k invocaciones |
| Pro | $25/mes | 8GB | 100GB | 2M invocaciones |
| Team | $599/mes | Ilimitado | Ilimitado | Personalizado |

**Tablas principales y su tasa de crecimiento:**

| Tabla | Tamaño por registro | Driver de crecimiento |
|-------|--------------------|-----------------------|
| `user_profiles` | ~2KB | Nuevos usuarios |
| `test_results` | ~5KB | 1 por sesión de test |
| `scheduled_sessions` | ~3KB | 4 sesiones/estudiante/mes |
| `session_notes` | ~8KB | Notas por sesión de orientación |
| `paid_reports` | ~50KB | Informes comprados |
| `institutions` | ~1KB | Colegios nuevos |
| `audit_logs` | ~1KB | Cada acción de usuario |

**Uso estimado de BD por 1,000 estudiantes:**
- Registros: ~50,000–80,000 filas
- Storage: ~200–400MB (cabe en Free; Pro necesario en ~2,000+ estudiantes)

---

### 3. Storage (Supabase Storage + CDN)

**Fuente oficial de precios:** https://supabase.com/pricing (incluido en planes)

Actualmente, el storage se usa para:
- Informes PDF generados (vía `@react-pdf/renderer`)
- Fotos de perfil (avatares Google OAuth, URLs externas — sin costo de storage)
- Futuro: grabaciones de audio de sesiones con orientadores

**Los datos estáticos públicos** (datos MINEDUC ~5MB) están en la carpeta `public/` y se sirven vía CDN de Netlify — sin costo por request.

| Tipo de Activo | Tamaño por Unidad | Volumen Mensual (100 estudiantes) |
|---------------|------------------|------------------------------------|
| Informe PDF (pagado) | ~200KB | ~20–30 informes |
| Audio de sesión (futuro) | ~10MB/sesión | ~400 archivos |
| Transcripciones de texto (futuro) | ~50KB/sesión | ~400 archivos |

---

### 4. Servicios de IA

Este es el **costo variable dominante** de la plataforma.

#### Claude API (Anthropic) — vía Netlify Functions

**Fuente oficial de precios:** https://www.anthropic.com/api

Usado para:
- `generate-explanation`: Explicación de perfil RIASEC (~500 tokens entrada, ~400 tokens salida)
- `generate-report`: Informe vocacional pagado completo (~2,000 tokens entrada, ~3,000 tokens salida)
- `generate-session-summary`: Resumen post-sesión para orientadores (~1,000 tokens entrada, ~800 tokens salida)

**Modelo:** `claude-3-5-sonnet-20241022`

| Caso de Uso | Tokens Entrada | Tokens Salida | Costo por Llamada* |
|-------------|---------------|---------------|-------------------|
| Explicación RIASEC | ~500 | ~400 | ~$0.003 |
| Informe pagado completo | ~2,000 | ~3,000 | ~$0.024 |
| Resumen de sesión | ~1,000 | ~800 | ~$0.009 |

*Basado en precios Claude 3.5 Sonnet: $3/M tokens entrada, $15/M tokens salida.

> **Supuesto simplificado del modelo:** **$2 por sesión** (incluye transcripción + resumen IA como costo combinado).

#### OpenRouter (Gemini 2.0 Flash) — Widget de Chat IA

**Fuente oficial de precios:** https://openrouter.ai/google/gemini-2.0-flash-001

Usado para: Widget de chat con tier gratuito (3 mensajes gratis por usuario).
Costo: Muy bajo — Gemini 2.0 Flash ~$0.075/M tokens. A 3 mensajes por estudiante: ~$0.001/estudiante.

**Costo AI combinado usado en el modelo: $2 por sesión × 4 sesiones/estudiante/mes = $8/estudiante/mes.**

---

### 5. Autenticación (Supabase Auth)

**Fuente:** https://supabase.com/docs/guides/auth

Supabase Auth está incluido en todos los tiers de Supabase sin costo adicional.

**Costo: $0** (incluido en el plan Supabase).

---

### 6. Video / Audio Processing

#### Estado Actual
- Integración con **Google Meet** para sesiones orientador-estudiante (servicio externo, sin costo para Vocari)
- Las sesiones ocurren vía links de Google Meet; Vocari solo almacena los metadatos de agenda

#### Hoja de Ruta Futura (si se implementa)

**Fuentes de precios:**
- OpenAI Whisper: https://openai.com/pricing (transcripción)
- AWS S3: https://aws.amazon.com/s3/pricing/ (almacenamiento audio)
- AssemblyAI: https://www.assemblyai.com/pricing (alternativa)

| Servicio | Modelo de Costo | Estimación por Sesión |
|---------|----------------|----------------------|
| OpenAI Whisper (transcripción) | $0.006/minuto | ~$0.30/sesión de 45 min |
| AWS S3 (storage de audio) | $0.023/GB/mes | ~$0.23/sesión (10MB audio) |
| Assembly AI (alternativa) | $0.37/hora | ~$0.28/sesión |

**Costo total por sesión (solo audio):** ~$0.50–$0.80
**Con resumen IA agregado:** ~$1.50–$2.50/sesión → **valida el supuesto de $2/sesión**

---

### 7. Herramientas de Equipo

**Fuentes de precios:**
- Google Workspace: https://workspace.google.com/pricing
- ChatGPT Plus: https://openai.com/chatgpt/pricing/

| Herramienta | Plan | Costo Mensual | Fuente |
|-------------|------|--------------|--------|
| Google Workspace Business Starter | 3 usuarios | $30 | workspace.google.com/pricing |
| ChatGPT Plus / Claude Pro | Dev tools | $30 | openai.com/chatgpt/pricing |

---

## Resumen de Categorías de Costo

| Componente | Tipo | Costo Actual | Escala Con |
|-----------|------|-------------|-----------|
| Netlify hosting | Fijo + uso | $0–$19/mes | Llamadas a funciones (umbral alto) |
| Supabase BD | Fijo + uso | $0–$25/mes | Tamaño BD, usuarios |
| Supabase Storage | Por uso | $0–$10/mes | Informes, audio futuro |
| Claude API | Por llamada | Variable | Sesiones por mes |
| OpenRouter | Por llamada | ~$0 | Uso del chat |
| Google Meet | $0 | N/A | Servicio externo |
| Google Workspace | Fijo | $30/mes | Headcount del equipo |
| Dev AI tools | Fijo | $30/mes | Uso del equipo |
| Flow pagos | Por transacción | 2.9% + $0.30 | Ventas de informes |

---

*Actualizado: Marzo 2026*
