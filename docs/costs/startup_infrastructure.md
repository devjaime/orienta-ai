# Vocari / OrientaIA — Costos de Infraestructura del Startup

> Costos mensuales reales para operar la plataforma en cada etapa del startup.

---

## Etapa 1: MVP Mínimo (0–30 estudiantes)

**Objetivo:** Validar product-market fit con el primer colegio piloto.

### Stack de Infraestructura

| Componente | Servicio | Plan | Costo Mensual | Fuente / Enlace |
|-----------|---------|------|--------------|----------------|
| Hosting frontend | Netlify | Free | $0 | https://www.netlify.com/pricing |
| Base de datos | Supabase | Free | $0 | https://supabase.com/pricing |
| Storage | Supabase Storage | Free (1GB) | $0 | https://supabase.com/pricing |
| Autenticación | Supabase Auth | Free | $0 | https://supabase.com/pricing |
| Explicaciones IA | Anthropic Claude 3.5 Sonnet | Pay-per-use | ~$50–$150 | https://www.anthropic.com/api |
| Chat IA | OpenRouter (Gemini Flash) | Pay-per-use | ~$5 | https://openrouter.ai/google/gemini-2.0-flash-001 |
| Email (equipo) | Google Workspace Business | Starter (3 usuarios) | $30 | https://workspace.google.com/pricing |
| Dev AI tools | ChatGPT Plus / Claude Pro | Fijo | $30 | https://openai.com/chatgpt/pricing |

### Costo Total MVP

| Estudiantes | Costo IA | Fijo | Total | Ingresos ($20/est.) | Neto |
|-------------|----------|------|-------|---------------------|------|
| 10 | $80 | $60 | **$140** | $200 | +$60 |
| 20 | $160 | $60 | **$220** | $400 | +$180 |
| 30 | $240 | $60 | **$300** | $600 | +$300 |

> En escala MVP, los costos reales de infraestructura son ~$60/mes fijos + uso de IA. Netlify Free + Supabase Free cubre toda la infraestructura hasta ~200 estudiantes.

**Tasa de consumo MVP: $300–$500/mes total** (incluyendo herramientas del equipo, sin salarios).

---

## Etapa 2: Etapa Temprana (100 estudiantes / 1 colegio)

**Objetivo:** Primer colegio pagante, demostrar retención, comenzar ventas.

### Stack de Infraestructura

| Componente | Servicio | Plan | Costo Mensual | Fuente / Enlace |
|-----------|---------|------|--------------|----------------|
| Hosting frontend | Netlify | Free | $0 | https://www.netlify.com/pricing |
| Base de datos | Supabase | Free → Pro | $0–$25 | https://supabase.com/pricing |
| Storage | Supabase Storage | Free | $0 | https://supabase.com/pricing |
| Autenticación | Supabase Auth | Incluido | $0 | https://supabase.com/pricing |
| Claude API | Anthropic | Pay-per-use | ~$800 | https://www.anthropic.com/api |
| OpenRouter | Gemini Flash | Pay-per-use | ~$5 | https://openrouter.ai/google/gemini-2.0-flash-001 |
| Email (equipo) | Google Workspace | 3 usuarios | $30 | https://workspace.google.com/pricing |
| Dev AI tools | ChatGPT / Claude | Fijo | $30 | https://openai.com/chatgpt/pricing |
| Dominio + SSL | Cloudflare | Anual | ~$2 | https://www.cloudflare.com/plans |

### Desglose de Costos a 100 Estudiantes

```
Costo IA:           100 × 4 × $2.00 = $800
Costo BD:           100 × $0.50     = $50
Infraestructura:                      $115
────────────────────────────────────────────
Total:                                $965/mes
Ingresos (@$20/est.):                $2,000/mes
Margen Bruto:                         52%
```

**Costo real de infraestructura: $115/mes** + uso de IA.

---

## Etapa 3: Etapa de Crecimiento (1,000 estudiantes / 10 colegios)

**Objetivo:** Escalar a 10 colegios, contratar primeros miembros del equipo, establecer ingresos recurrentes.

### Stack de Infraestructura

| Componente | Servicio | Plan | Costo Mensual | Fuente / Enlace |
|-----------|---------|------|--------------|----------------|
| Hosting frontend | Netlify | Pro | $19 | https://www.netlify.com/pricing |
| Base de datos | Supabase | Pro | $25 | https://supabase.com/pricing |
| Storage adicional BD | Supabase | Adicional | ~$10 | https://supabase.com/pricing |
| Storage (informes + archivos) | Supabase Storage | Incluido en Pro | $0 | https://supabase.com/pricing |
| Autenticación | Supabase Auth | Incluido | $0 | https://supabase.com/pricing |
| Claude API | Anthropic | Pay-per-use | ~$8,000 | https://www.anthropic.com/api |
| OpenRouter | Gemini Flash | Pay-per-use | ~$20 | https://openrouter.ai/google/gemini-2.0-flash-001 |
| Email (equipo) | Google Workspace | 5 usuarios | $50 | https://workspace.google.com/pricing |
| Dev AI tools | Varios | Fijo | $30 | — |
| Monitoreo | Sentry / LogRocket | Startup | $26 | https://sentry.io/pricing |
| Dominio + SSL | Cloudflare | Anual | ~$2 | https://www.cloudflare.com/plans |

### Desglose de Costos a 1,000 Estudiantes

```
Costo IA:           1,000 × 4 × $2.00 = $8,000
Costo BD:           1,000 × $0.50     = $500
Infraestructura:                        $160
────────────────────────────────────────────────
Total:                                  $8,660/mes
Ingresos (@$18/est.):                  $18,000/mes
Margen Bruto:                           52%
```

### Plan de Inversión en Infraestructura (Mes a Mes)

| Mes | Estudiantes | Costo Infra | Evento de Upgrade | Costo Adicional |
|-----|------------|-------------|-------------------|-----------------|
| 1 | 10–30 | $140–$300 | — | $0 |
| 2 | 30–50 | $300–$540 | — | $0 |
| 3 | 50–80 | $540–$795 | — | $0 |
| 4 | 80–100 | $795–$965 | Evaluar Supabase Pro | +$25 |
| 5–6 | 100–150 | $965–$1,390 | Netlify Pro recomendado | +$19 |
| 7–8 | 150–250 | $1,390–$2,240 | Supabase Pro obligatorio | +$25 |
| 9–10 | 250–400 | $2,240–$3,515 | Monitoreo / Sentry | +$26 |
| 11–12 | 400–600 | $3,515–$5,215 | — | $0 |
| 13–18 | 600–1,000 | $5,215–$8,660 | Revisar plan Supabase | +$10–$50 |

---

## Etapa 4: Etapa de Escala (10,000 estudiantes / 50–100 colegios)

**Objetivo:** Cobertura nacional en Chile, expansión a LATAM.

### Stack de Infraestructura

| Componente | Servicio | Plan | Costo Mensual | Fuente / Enlace |
|-----------|---------|------|--------------|----------------|
| Hosting frontend | Netlify Business | Business | $99 | https://www.netlify.com/pricing |
| Base de datos | Supabase | Team / Dedicado | $599–$1,000 | https://supabase.com/pricing |
| Storage (informes + archivos) | Supabase + S3 | Pro + S3 | $50–$100 | https://aws.amazon.com/s3/pricing |
| Autenticación | Supabase Auth | Incluido | $0 | https://supabase.com/pricing |
| Claude API | Anthropic | Enterprise | ~$60,000* | https://www.anthropic.com/api |
| OpenRouter | Gemini Flash | Pay-per-use | ~$200 | https://openrouter.ai/google/gemini-2.0-flash-001 |
| Email (equipo) | Google Workspace | 10+ usuarios | $100 | https://workspace.google.com/pricing |
| Dev AI tools | Varios | Fijo | $60 | — |
| Monitoreo | Datadog / Sentry | Business | $150 | https://www.datadoghq.com/pricing |
| CDN (LATAM) | Cloudflare Pro | Pro | $20 | https://www.cloudflare.com/plans |

*Claude Enterprise con descuento del 25% por volumen.

### Desglose de Costos a 10,000 Estudiantes

```
Costo IA (precio enterprise -25%): 10,000 × 4 × $1.50 = $60,000
Costo BD:                          10,000 × $0.50      = $5,000
Infraestructura:                                         $2,000
────────────────────────────────────────────────────────────────
Total:                                                   $67,000/mes
Ingresos (@$15/est.):                                   $150,000/mes
Margen Bruto:                                            55%
```

### Optimizaciones Disponibles en Escala

| Optimización | Ahorro Mensual | Esfuerzo |
|-------------|---------------|---------|
| Claude 3.5 Haiku para explicaciones (10x más barato) | ~$30,000 | Baja |
| Caché perfiles RIASEC idénticos (30% repetición) | ~$18,000 | Media |
| Procesamiento batch fuera de horario para resúmenes | ~$8,000 | Media |
| Descuento enterprise Anthropic por volumen (25%) | ~$20,000 | Baja (negociar) |

**Con optimizaciones: costo IA baja a ~$25,000–$30,000/mes → margen > 70%**

---

## Resumen Comparativo de Costos de Infraestructura

| Etapa | Estudiantes | Costo Infra Mensual | Ingresos Mensuales | Margen Bruto |
|-------|------------|--------------------|--------------------|-------------|
| MVP | 10–30 | $140–$300 | $200–$600 | ~50% |
| Temprana | 100 | $965 | $2,000 | 52% |
| Crecimiento | 1,000 | $8,660 | $18,000 | 52% |
| Escala | 10,000 | $67,000* | $150,000 | 55%* |

*Con precio enterprise IA negociado.

---

*Actualizado: Marzo 2026*
