# Vocari / OrientaIA — Resumen para Inversores

> Economía de infraestructura y escalabilidad SaaS en un vistazo.

---

## La Oportunidad

**Vocari** es una plataforma SaaS B2B que entrega orientación vocacional asistida por IA a estudiantes de enseñanza media en Chile y LATAM. Los colegios pagan una suscripción mensual por estudiante para proveer orientación profesional personalizada a escala, reemplazando o complementando a orientadores humanos sobrecargados con una plataforma basada en datos e IA.

**Mercado objetivo:** 900,000+ estudiantes de 16–24 años en educación secundaria chilena.
**TAM LATAM:** 50M+ estudiantes.

---

## Economía Unitaria en un Vistazo

| Métrica | Valor |
|---------|-------|
| Costo por estudiante por mes | **$8.55–$20.00** (depende de la escala) |
| Margen bruto con 100 estudiantes | **52%** |
| Margen bruto con 1,000 estudiantes | **52%** |
| Margen bruto con 10,000 estudiantes | **55%+** (con precio enterprise IA) |
| Punto de equilibrio en cantidad de estudiantes | **~13 estudiantes** (a precio $20/estudiante) |
| Piso de costo variable por estudiante | **~$8.50/mes** (IA + base de datos) |

**La economía unitaria es positiva desde el primer estudiante** más allá de 13 usuarios activos.

---

## Estructura de Costos

```
Costo Total Mensual = $115 (base fija) + ($8.50 × estudiantes)

Con 100 estudiantes:    $965/mes
Con 1,000 estudiantes:  $8,660/mes
Con 10,000 estudiantes: $67,000/mes (con precio enterprise IA)
```

El costo de la plataforma está dominado por **inferencia de IA** (Claude API para resúmenes de sesiones, explicaciones e informes), que escala linealmente con el uso y mejora con descuentos por volumen.

**Fuentes de precios:**
- Claude API: https://www.anthropic.com/api
- Supabase: https://supabase.com/pricing
- Netlify: https://www.netlify.com/pricing

---

## Modelo de Precios

| Tier | Precio/Estudiante/Mes | Contrato Anual (100 estudiantes) | Notas |
|------|----------------------|---------------------------------|-------|
| Básico | $15 | $18,000/año | Test + recomendaciones |
| Estándar | $20 | $24,000/año | + Explicaciones IA + Dashboard apoderados |
| Premium | $25 | $30,000/año | + Sesiones orientador + Informes PDF |

**Precio promedio objetivo: $18–$20/estudiante/mes**

---

## Escalabilidad SaaS

### Por Qué Escala Bien

1. **Costo de hosting marginal casi cero** — React SPA en CDN, funciones serverless. Sin servidores que administrar.
2. **Core determinístico, IA en el borde** — La puntuación RIASEC es un algoritmo puro (costo cero). La IA solo se llama para explicaciones y resúmenes, no para lógica central.
3. **Arquitectura multi-tenant** — Una instancia de plataforma sirve colegios ilimitados con aislamiento completo de datos.
4. **Costo de IA predecible** — Costo fijo por sesión ($2). Sin facturas sorpresa.
5. **Optimización de costo IA disponible** — Cambiar de Claude Sonnet a Claude Haiku para tareas rutinarias puede reducir costos de IA en 60–70%, llevando márgenes sobre el 70%.

### Costo por Estudiante vs Escala

```
$20 ─┤ ● (10 estudiantes)
     │
$15 ─┤
     │
$10 ─┤          ● (100)    ● (500)
     │                              ● (1.000) ● (5.000)
 $8 ─┤.........................................─────────── ← piso ~$8.50
     └──────────────────────────────────────────────────►
          10   30   50  100  200  500  1k   5k  estudiantes
```

El costo por estudiante converge rápidamente a ~$8.50 a medida que los costos fijos se diluyen.

---

## Hitos de Ingresos

| Hito | Estudiantes | Colegios | MRR | Run Rate Anual |
|------|------------|---------|-----|----------------|
| Validación seed | 100 | 1 | $2,000 | $24,000 |
| Cierre pre-seed | 300 | 3 | $5,400 | $64,800 |
| Cierre seed | 1,000 | 10 | $18,000 | $216,000 |
| Objetivo Serie A | 5,000 | 40–50 | $90,000 | $1,080,000 |
| Objetivo Serie B | 20,000 | 150+ | $360,000 | $4,320,000 |

---

## Trayectoria de Margen Bruto

| Etapa | MRR | Costo Infraestructura | Ganancia Bruta | Margen Bruto |
|-------|-----|-----------------------|----------------|-------------|
| MVP (30 est.) | $600 | $300 | $300 | 50% |
| Temprana (100 est.) | $2,000 | $965 | $1,035 | 52% |
| Crecimiento (1,000 est.) | $18,000 | $8,660 | $9,340 | 52% |
| Escala (5,000 est.) | $90,000 | $42,750 | $47,250 | 53% |
| Escala+ (10,000 est.)* | $150,000 | $67,000 | $83,000 | 55% |

*Con precio enterprise IA negociado (-25%).

**Márgenes brutos de 50–55% son consistentes y predecibles** — comparable con empresas SaaS de primer nivel (Twilio: 50%, Zendesk: 60%, HubSpot: 75%).

Con optimización de costos de IA (tiering de modelos + caché), los márgenes pueden alcanzar el **65–70%** a escala.

---

## Fosos Competitivos (Moats)

| Foso | Descripción |
|------|-------------|
| **Integración datos MINEDUC** | 5+ años de datos chilenos de matrícula, egresados y empleo — insight exclusivo |
| **Algoritmo RIASEC** | Motor de matching de carreras determinístico, no dependiente de proveedores de IA |
| **Arquitectura multi-tenant** | Lista para servir colegios ilimitados sin trabajo de desarrollo adicional |
| **Alineación regulatoria** | Construido para el sistema educativo chileno (DEMRE, MINEDUC, PACE) |
| **Control de acceso por roles** | Estudiantes, apoderados, orientadores, administradores — lock-in del ecosistema completo |

---

## Factores de Riesgo y Mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| Aumento precio Claude API | Medio | Arquitectura agnóstica al modelo; puede cambiar a OpenAI/Gemini |
| Corte de servicio Supabase | Medio | PostgreSQL estándar — puede auto-hostearse o migrar |
| Ciclos de presupuesto escolar | Medio | Contratos anuales firmados en Q4 para el año siguiente |
| Costo IA a escala | Bajo | Descuentos por volumen + tiering de modelos (Haiku vs Sonnet) |
| Privacidad de datos (LGPD) | Medio | Políticas RLS aplicadas a nivel de BD; sin PII en prompts de IA |

---

## Por Qué Ahora

- **Reforma admisión universitaria Chile 2026**: nuevos requisitos de orientación vocacional en todos los colegios subvencionados
- **Colapso de costos IA**: Claude 3.5 Haiku es 10x más barato que GPT-4 (2024) — hace viable la economía unitaria de $8/estudiante a pequeña escala
- **Madurez de Supabase**: PostgreSQL + Auth + Storage de grado enterprise a precios startup
- **Digitalización escolar post-COVID**: colegios buscando activamente soluciones EdTech

---

## Lo Que Se Busca

> *La infraestructura no es la restricción — la plataforma funciona y la economía unitaria está probada.*

La búsqueda de financiamiento es principalmente para:
1. **Ventas y marketing** — contratar representantes de ventas escolares e incorporar 50+ colegios
2. **Expansión del producto** — transcripción de audio nativa, analíticas avanzadas
3. **Expansión LATAM** — localización para Colombia, Perú, México

Con **52% de margen bruto desde el primer día**, cada dólar de ingresos sobre el punto de equilibrio va directamente a financiar el crecimiento.

---

*Preparado para revisión de inversores — Marzo 2026*
*Todas las cifras en USD. Precios en pesos chilenos disponibles por separado.*
