# Skill 04: Calculadora de ROI

## Propósito

Calcular el Retorno de Inversión (ROI) de carreras universitarias para ayudar a estudiantes y apoderados a tomar decisiones informadas basadas en datos económicos.

---

## Responsabilidades

- [x] Calcular costo total de la carrera (5 años promedio)
- [x] Proyectar ingresos futuros
- [x] Calcular tiempo de recuperación de inversión
- [x] Comparar ROI entre carreras
- [x] Considerar variables: becas, universidad, situación económica
- [x] Exportar reporte PDF

---

## Entradas

```typescript
{
  carrera_id: number,
  universidad: string,
  situacion_economica: "baja" | "media" | "alta",
  becas_disponibles: string[],  // Ej: ["gratuidad", "beca_excelencia"]
  credito_universitario: boolean
}
```

---

## Salidas

```typescript
{
  carrera: string,
  universidad: string,
  costo_total_5años_clp: number,
  sueldo_inicial_promedio_clp: number,
  tiempo_recuperacion_años: number,
  proyeccion_10años_clp: number,
  roi_porcentaje: number,
  nivel_riesgo: "bajo" | "medio" | "alto",
  grafico_flujo_caja: object
}
```

---

## Fórmulas

```javascript
// Costo total carrera
const costoTotal = (arancelAnual * 5) - (becas + creditos)

// Tiempo recuperación
const tiempoRecuperacion = costoTotal / sueldoAnualPromedio

// ROI 10 años
const ingresosTotales = sueldoAnual * 10 * (1 + tasaCrecimiento)^10
const roi = ((ingresosTotales - costoTotal) / costoTotal) * 100
```

---

**Estado:** 🟡 Pendiente
**Prioridad:** 🟠 Media
**Tiempo estimado:** 3 días
