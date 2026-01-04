# Skill 03: Motor de Recomendación de Carreras

## Propósito

Generar recomendaciones personalizadas de carreras basadas en el código Holland RIASEC del usuario, usando matching determinístico con base de datos de carreras chilenas.

---

## Responsabilidades

- [x] Cargar base de datos de carreras (30 iniciales, expandible a 100+)
- [x] Matching código Holland usuario → perfiles Holland de carreras
- [x] Calcular score de compatibilidad (0-100%)
- [x] Ordenar carreras por compatibilidad
- [x] Retornar top 6 carreras recomendadas
- [x] Incluir datos económicos (empleabilidad, sueldos)
- [x] Guardar recomendaciones en DB

---

## Entradas

```typescript
{
  user_id: string,
  codigo_holland: string,      // Ej: "ISA"
  puntajes: {
    R: number,
    I: number,
    A: number,
    S: number,
    E: number,
    C: number
  }
}
```

---

## Salidas

```typescript
{
  user_id: string,
  codigo_holland: string,
  carreras_recomendadas: [
    {
      id: number,
      nombre: string,
      compatibilidad_porcentaje: number,  // 0-100
      codigo_holland_carrera: string,     // Ej: "IRC"
      match_dimensiones: string[],        // ["I", "R"]
      empleabilidad_1er_año: number,     // %
      sueldo_promedio_clp: number,
      duracion_años: number,
      universidades_principales: string[],
      descripcion_corta: string
    }
  ],
  total_carreras_analizadas: number,
  fecha_generacion: string
}
```

---

## Algoritmo de Matching

```javascript
// backend/services/vocational/matcher.js

export function generarRecomendaciones(codigo_holland, puntajes, carreras) {
  const resultados = carreras.map(carrera => {
    const score = calcularCompatibilidad(codigo_holland, puntajes, carrera)
    return { ...carrera, compatibilidad_porcentaje: score }
  })

  // Ordenar por compatibilidad descendente
  resultados.sort((a, b) => b.compatibilidad_porcentaje - a.compatibilidad_porcentaje)

  // Retornar top 6
  return resultados.slice(0, 6)
}

function calcularCompatibilidad(codigo_usuario, puntajes_usuario, carrera) {
  const codigo_carrera = carrera.codigo_holland
  const compatibilidad_carrera = carrera.compatibilidad

  let score = 0
  let peso_total = 0

  // Letra 1 (más dominante): peso 50%
  if (codigo_carrera.includes(codigo_usuario[0])) {
    score += compatibilidad_carrera[codigo_usuario[0]] * 0.5
    peso_total += 0.5
  }

  // Letra 2: peso 30%
  if (codigo_carrera.includes(codigo_usuario[1])) {
    score += compatibilidad_carrera[codigo_usuario[1]] * 0.3
    peso_total += 0.3
  }

  // Letra 3: peso 20%
  if (codigo_carrera.includes(codigo_usuario[2])) {
    score += compatibilidad_carrera[codigo_usuario[2]] * 0.2
    peso_total += 0.2
  }

  // Normalizar al 0-100
  return peso_total > 0 ? Math.round(score / peso_total) : 0
}
```

---

## Fuente de Datos

**Base de datos:** `/backend/data/carreras.json`

**Fuente:** [Mifuturo.cl - Datos Abiertos](https://datos.gob.cl/dataset/1107)

**Estructura JSON:**
```json
{
  "carreras": [
    {
      "id": 1,
      "nombre": "Ingeniería en Informática",
      "codigo_holland": "IRC",
      "compatibilidad": { "I": 90, "R": 70, "C": 60, "A": 30, "S": 20, "E": 40 },
      "duracion_años": 5,
      "empleabilidad_1er_año": 95,
      "sueldo_promedio_1er_año_clp": 800000,
      "sueldo_promedio_4to_año_clp": 1200000,
      "descripcion": "Profesional que diseña, desarrolla y mantiene sistemas informáticos...",
      "universidades_principales": ["U. de Chile", "PUC", "UTFSM"],
      "fuente_datos": "mifuturo.cl"
    }
  ]
}
```

---

## Dependencias

- **Skill 02:** Test Holland RIASEC (genera código Holland)
- **Base de datos:** Carreras de Chile con códigos Holland asignados

---

**Estado:** 🟡 Pendiente
**Prioridad:** 🔴 Alta
**Tiempo estimado:** 2 días
