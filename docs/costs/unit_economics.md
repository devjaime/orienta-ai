# Vocari / OrientaIA — Economía Unitaria

> Costo por estudiante por mes en diferentes escalas.

---

## Estructura de Costos

### Costos Fijos (Infraestructura Base)

Estos costos se incurren independientemente del número de estudiantes:

| Componente | Costo Mensual | Fuente / Enlace |
|-----------|--------------|----------------|
| Google Workspace Business (3 emails) | $30 | https://workspace.google.com/pricing |
| Herramientas IA para dev (ChatGPT Plus, etc.) | $30 | https://openai.com/chatgpt/pricing |
| Hosting (Netlify Pro o Vercel) | $20 | https://www.netlify.com/pricing |
| Base de datos Supabase (plan Pro) | $25 | https://supabase.com/pricing |
| Storage (audio, transcripciones, informes) | $10 | https://supabase.com/pricing |
| **Total Costo Fijo Base** | **$115/mes** | |

> A pequeña escala (< 200 estudiantes), algunos componentes permanecen en tiers gratuitos (Netlify Free, Supabase Free), reduciendo la base a ~$60/mes. La tabla usa $115 para estimaciones conservadoras/honestas.

---

### Costos Variables (Por Estudiante)

Estos escalan directamente con el número de estudiantes activos:

| Driver de Costo | Fórmula | Costo por Estudiante/Mes |
|----------------|---------|--------------------------|
| Sesiones IA (transcripción + resumen) | 4 sesiones × $2.00/sesión | $8.00 |
| Storage base de datos | 1 conjunto de registros por estudiante | $0.50 |
| **Total Costo Variable por Estudiante** | | **$8.50** |

**Fórmulas utilizadas:**
```
Costo IA       = estudiantes × 4 sesiones × $2.00
Costo BD       = estudiantes × $0.50
Total Variable = estudiantes × $8.50
Total Mensual  = $115 (fijo) + (estudiantes × $8.50)
Costo/Estudiante = Total Mensual / estudiantes
```

**Fuentes de referencia:**
- Precios Claude API: https://www.anthropic.com/api
- Precios Supabase: https://supabase.com/pricing
- Precios OpenAI Whisper: https://openai.com/pricing
- Precios Netlify: https://www.netlify.com/pricing

---

## Tabla de Economía Unitaria

| Estudiantes | Padres (est.) | Costo IA | Costo BD | Infraestructura (Fija) | Total Mensual | Costo por Estudiante |
|-------------|--------------|----------|----------|------------------------|--------------|---------------------|
| 10 | 10 | $80 | $5 | $115 | **$200** | **$20.00** |
| 30 | 30 | $240 | $15 | $115 | **$370** | **$12.33** |
| 50 | 50 | $400 | $25 | $115 | **$540** | **$10.80** |
| 100 | 100 | $800 | $50 | $115 | **$965** | **$9.65** |
| 200 | 200 | $1,600 | $100 | $130 | **$1,830** | **$9.15** |
| 500 | 500 | $4,000 | $250 | $130 | **$4,380** | **$8.76** |
| 1,000 | 1,000 | $8,000 | $500 | $160 | **$8,660** | **$8.66** |
| 5,000 | 5,000 | $40,000 | $2,500 | $250 | **$42,750** | **$8.55** |

> Nota: El costo de infraestructura aumenta levemente en 200+ estudiantes (tiers mejorados de Supabase/Netlify). Ver `scaling_model.md` para desglose de tiers.

---

## Punto Clave: Dilución de Costos Fijos

Con **10 estudiantes**, los costos fijos ($115) representan el **57.5%** del gasto total.
Con **1,000 estudiantes**, los costos fijos ($160) representan solo el **1.8%** del gasto total.

Este es el efecto clásico de dilución SaaS — a medida que creces, el costo por estudiante converge hacia el **costo marginal variable de ~$8.50/estudiante**.

```
Costo por Estudiante = ($115 / n) + $8.50

Con n = 10:    ($115 / 10)  + $8.50 = $11.50 + $8.50 = $20.00
Con n = 100:   ($115 / 100) + $8.50 = $1.15  + $8.50 = $9.65
Con n = 1.000: ($160 / 1000)+ $8.50 = $0.16  + $8.50 = $8.66
Con n → ∞:    → $8.50 (piso)
```

---

## Precios SaaS Sugeridos

Para que Vocari logre márgenes saludables:

| Volumen Estudiantes | Costo/Estudiante | Precio Sugerido | Margen Bruto |
|--------------------|-----------------|-----------------|-------------|
| 1–100 | $9.65–$20.00 | $25/estudiante/mes | 20%–61% |
| 100–500 | $8.76–$9.65 | $20/estudiante/mes | 52%–64% |
| 500–1,000 | $8.55–$8.76 | $18/estudiante/mes | 51%–54% |
| 1,000+ | ~$8.55 | $15/estudiante/mes | 43% |

**Recomendación de precio B2B institucional:**
- Compromiso mínimo: 30 estudiantes (cohorte escolar mínima viable)
- Precio por estudiante: **$15–$20/mes/estudiante** (facturado anual = -15%)
- Contrato anual por colegio de 100 estudiantes: **$18,000–$24,000/año**

---

## Los Padres (Apoderados) como Usuarios Adicionales

Cada estudiante genera aproximadamente 1 cuenta de apoderado.

Los apoderados son **usuarios de solo lectura** — ven los resultados de su hijo pero no generan sesiones ni llamadas a IA. Su impacto en costos:
- Filas adicionales en BD: ~$0.05/apoderado (despreciable)
- Sin costo de IA
- **Costo efectivo por apoderado: ~$0.05/mes** (excluido del modelo principal)

---

*Actualizado: Marzo 2026*
