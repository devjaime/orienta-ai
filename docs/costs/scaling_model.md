# Vocari / OrientaIA — Modelo de Escalamiento

> Cómo evolucionan los costos de infraestructura al crecer de 10 a 5,000 estudiantes.

---

## Supuestos del Modelo

| Variable | Valor | Base |
|----------|-------|------|
| Sesiones por estudiante/mes | 4 | Supuesto de diseño de la plataforma |
| Costo IA por sesión | $2.00 | Transcripción + resumen Claude |
| Storage BD por estudiante | $0.50/mes | Estimado del tamaño de schema |
| Apoderados por estudiante | 1.0 | Un apoderado por estudiante |
| Orientadores por 100 estudiantes | 1 | Ratio estándar colegios chilenos |

**Fuentes de referencia por componente:**
| Componente | URL de Precios |
|-----------|---------------|
| Anthropic Claude API | https://www.anthropic.com/api |
| Supabase (BD + Storage + Auth) | https://supabase.com/pricing |
| Netlify (Hosting + Functions) | https://www.netlify.com/pricing |
| Google Workspace | https://workspace.google.com/pricing |
| OpenRouter (Gemini Flash) | https://openrouter.ai/google/gemini-2.0-flash-001 |
| OpenAI Whisper (transcripción) | https://openai.com/pricing |

---

## Transiciones de Tier de Infraestructura

A medida que crece la cantidad de estudiantes, los costos de infraestructura escalan en umbrales específicos:

| Umbral | Trigger | Impacto en Costo |
|--------|---------|-----------------|
| 0–200 estudiantes | Netlify Free + Supabase Free | Base: $60/mes |
| 200–1,000 estudiantes | Upgrade Supabase Pro ($25) + Netlify Pro ($19) | Base: $115–$130/mes |
| 1,000–3,000 estudiantes | Más storage Supabase, más llamadas a funciones | Base: $160/mes |
| 3,000–10,000 estudiantes | Supabase Team tier o BD dedicada | Base: $250–$600/mes |
| 10,000+ estudiantes | Infraestructura custom (AWS/GCP) | Base: $1,000+/mes |

---

## Tabla Completa de Escalamiento

| Estudiantes | Apoderados | Orientadores | Costo IA | Costo BD | Infra (Fija) | Total/Mes | Costo/Estudiante | Ingresos* | Margen Bruto* |
|-------------|-----------|-------------|----------|----------|--------------|-----------|-----------------|----------|--------------|
| 10 | 10 | 1 | $80 | $5 | $115 | $200 | $20.00 | $200 | 0% |
| 30 | 30 | 1 | $240 | $15 | $115 | $370 | $12.33 | $600 | 38% |
| 50 | 50 | 1 | $400 | $25 | $115 | $540 | $10.80 | $1,000 | 46% |
| 100 | 100 | 1 | $800 | $50 | $115 | $965 | $9.65 | $2,000 | 52% |
| 200 | 200 | 2 | $1,600 | $100 | $130 | $1,830 | $9.15 | $3,600 | 49% |
| 500 | 500 | 5 | $4,000 | $250 | $130 | $4,380 | $8.76 | $9,000 | 51% |
| 1,000 | 1,000 | 10 | $8,000 | $500 | $160 | $8,660 | $8.66 | $18,000 | 52% |
| 5,000 | 5,000 | 50 | $40,000 | $2,500 | $250 | $42,750 | $8.55 | $90,000 | 52% |

*Ingresos suponen $20/estudiante/mes. Margen = (Ingresos - Costo) / Ingresos.

---

## Análisis por Etapa

### Etapa 1: Prueba de Concepto (10–30 estudiantes)

```
10 estudiantes:
  Fijo:     $115
  Variable: 10 × $8.50 = $85
  Total:    $200/mes
  Costo/est: $20.00

30 estudiantes:
  Fijo:     $115
  Variable: 30 × $8.50 = $255
  Total:    $370/mes
  Costo/est: $12.33
```

**Desafío clave:** Los costos fijos dominan. A $20/estudiante, se llega al punto de equilibrio con 10 estudiantes pero se necesitan 15+ para comenzar a generar margen.

**Notas de infraestructura:**
- Netlify Free cubre todas las llamadas a funciones (< 125k/mes)
- Supabase Free cubre BD (< 500MB, < 1GB storage)
- Se puede operar con **$60/mes real de infraestructura** (Google Workspace + dev tools = únicos costos externos)

---

### Etapa 2: Colegio Piloto (50–100 estudiantes)

```
50 estudiantes:
  Fijo:     $115
  Variable: 50 × $8.50 = $425
  Total:    $540/mes
  Costo/est: $10.80

100 estudiantes:
  Fijo:     $115
  Variable: 100 × $8.50 = $850
  Total:    $965/mes
  Costo/est: $9.65
```

**Hito clave:** A 100 estudiantes con precio $20/estudiante, el ingreso mensual = $2,000 vs costo = $965. **Margen bruto: 52%.**

Esta etapa demuestra que la economía unitaria funciona y justifica levantar una ronda pre-seed.

---

### Etapa 3: Crecimiento Temprano (200–500 estudiantes)

```
200 estudiantes:
  Fijo:     $130 (upgrade Supabase Pro activado)
  Variable: 200 × $8.50 = $1,700
  Total:    $1,830/mes
  Costo/est: $9.15

500 estudiantes:
  Fijo:     $130
  Variable: 500 × $8.50 = $4,250
  Total:    $4,380/mes
  Costo/est: $8.76
```

**Hito clave:** A 500 estudiantes con precio $18/estudiante, ingresos = $9,000 vs costo = $4,380. **Margen bruto: 51%.**

**Upgrades de infraestructura:**
- Supabase Pro: $25/mes → https://supabase.com/pricing
- Netlify Pro: $19/mes → https://www.netlify.com/pricing

---

### Etapa 4: Escala (1,000–5,000 estudiantes)

```
1,000 estudiantes:
  Fijo:     $160
  Variable: 1,000 × $8.50 = $8,500
  Total:    $8,660/mes
  Costo/est: $8.66

5,000 estudiantes:
  Fijo:     $250
  Variable: 5,000 × $8.50 = $42,500
  Total:    $42,750/mes
  Costo/est: $8.55
```

**Hito clave:** A 5,000 estudiantes, la infraestructura es madura y los márgenes se estabilizan en ~52%.

---

## Oportunidades de Optimización de Costos IA

A medida que escala, hay oportunidades claras para reducir el costo de $8/estudiante:

| Estrategia | Ahorro | Complejidad |
|-----------|--------|------------|
| Caché de explicaciones RIASEC repetidas (mismo tipo de perfil) | 30–40% | Baja |
| Procesar resúmenes de sesión en batch (fin del día) | 10–15% | Baja |
| Cambiar a Claude Haiku para explicaciones (3.5 Haiku: 10x más barato) | 60–70% | Media |
| Usar Claude Haiku para chat, Sonnet solo para informes pagados | 40–50% | Media |
| Limitar más agresivamente las funciones IA gratuitas (3 gratis, luego upsell) | 20–30% | Baja |

**Fuente precios Claude Haiku:** https://www.anthropic.com/api

**Costo variable optimizado a escala:** Tan bajo como **$3–$4/estudiante/mes** con caché inteligente + tiering de modelos.
Esto empujaría los márgenes brutos por encima del **70%** con 1,000+ estudiantes.

---

## Punto de Equilibrio (Break-Even)

**Fórmula break-even a $20/estudiante:**
```
Ingresos = Costo
$20 × n = $115 + ($8.50 × n)
$11.50 × n = $115
n = 10 estudiantes (break-even exacto)
```

Con solo **11 estudiantes**, la plataforma genera margen bruto positivo.

---

## Escalamiento Multi-Colegio

El modelo B2B de Vocari vende a colegios (instituciones), no a estudiantes individuales.

| Colegios | Estudiantes/Colegio | Total Estudiantes | Costo Mensual | Ingresos ($18/est.) | Margen Bruto |
|---------|--------------------|--------------------|--------------|---------------------|-------------|
| 1 | 100 | 100 | $965 | $1,800 | 46% |
| 3 | 100 | 300 | $2,665 | $5,400 | 51% |
| 5 | 100 | 500 | $4,380 | $9,000 | 51% |
| 10 | 100 | 1,000 | $8,660 | $18,000 | 52% |
| 20 | 150 | 3,000 | $25,660 | $54,000 | 52% |
| 50 | 100 | 5,000 | $42,750 | $90,000 | 52% |

**Insight:** Firmar 10 colegios de 100 estudiantes genera $18,000 MRR con 52% de margen bruto — un objetivo temprano convincente para un startup pre-seed/seed.

---

*Actualizado: Marzo 2026*
