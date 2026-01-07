# 📊 Sistema de Visualizaciones y Proyecciones

Sistema completo de análisis predictivo, gráficos estadísticos y proyecciones a 5 años basado en datos MINEDUC.

## 🎯 Objetivos

1. **Análisis de Tendencias:** Gráficos históricos 2007-2025
2. **Proyecciones Futuras:** Predicción de demanda, salarios e ingresos a 5 años
3. **Comparativas por Vocación:** Estadísticas agrupadas por códigos RIASEC
4. **Dashboard Interactivo:** Visualizaciones dinámicas para usuarios

---

## 📈 Tipos de Visualizaciones

### 1. Por Carrera Individual

#### A. Evolución de Matrícula (2007-2025)
```
Matrícula en Ingeniería Civil en Informática
15,000 ┤                                    ╭─
14,000 ┤                                ╭───╯
13,000 ┤                            ╭───╯
12,000 ┤                        ╭───╯
11,000 ┤                    ╭───╯
10,000 ┤                ╭───╯
 9,000 ┤            ╭───╯
 8,000 ┤        ╭───╯
 7,000 ┤    ╭───╯
 6,000 ┤╭───╯
       └┴───┴───┴───┴───┴───┴───┴───┴───┴───┴
       2007 2010 2013 2016 2019 2022 2025
```

**Métricas:**
- Matrícula total por año
- Tasa de crecimiento anual
- Proyección a 2030

#### B. Empleabilidad y Titulación
```
Tasa de Titulación: 82%
Duración Real: 5.8 años vs 5.0 años oficial
Empleabilidad al año 1: 85%
```

#### C. Proyección de Salarios a 5 Años
```
Salario Promedio (CLP)
$2.5M ┤                           ╭─── Proyección
$2.3M ┤                       ╭───╯
$2.1M ┤                   ╭───╯
$1.9M ┤               ╭───╯
$1.7M ┤           ╭───╯
$1.5M ┤       ╭───╯
$1.3M ┤   ╭───╯
$1.1M ┤╭──╯ Datos reales
       └┴───┴───┴───┴───┴───┴───┴───┴───┴───
       2020  2022  2024  2026  2028  2030
```

### 2. Por Vocación RIASEC

#### A. Comparativa de Dimensiones
```
Promedio de Ingresos por Dimensión Principal

I (Investigador)    ████████████████████ $1.9M
E (Emprendedor)     ███████████████████  $1.7M
R (Realista)        ██████████████████   $1.6M
C (Convencional)    █████████████████    $1.5M
A (Artístico)       ████████████         $1.1M
S (Social)          ███████████          $0.9M
```

#### B. Empleabilidad por Vocación
```
Tasa de Empleabilidad al 1er Año

I (Investigador)    ████████████████████ 92%
E (Emprendedor)     ███████████████████  88%
C (Convencional)    ██████████████████   85%
R (Realista)        ██████████████████   84%
S (Social)          ████████████████     78%
A (Artístico)       ███████████          62%
```

#### C. Popularidad de Carreras por Dimensión
```javascript
{
  "I": {
    "total_matricula": 145000,
    "carreras_count": 8,
    "tendencia": "creciente",
    "crecimiento_5anos": 35.2
  },
  "E": {
    "total_matricula": 89000,
    "carreras_count": 6,
    "tendencia": "estable",
    "crecimiento_5anos": 8.1
  }
}
```

### 3. Análisis Predictivo

#### A. Saturación de Mercado
```
Score de Saturación (0-100)

Psicología          ████████████████████ 95  ⚠️ Alta saturación
Derecho             ███████████████████  87  ⚠️ Alta saturación
Pedagogía           ████████████         58  ⚡ Media saturación
IA/Data Science     ███                  15  ✅ Baja saturación (oportunidad)
Enfermería          ██                   12  ✅ Alta demanda
```

#### B. Proyección de Demanda Laboral
```
Crecimiento Esperado 2025-2030

IA/Machine Learning  ████████████████████ +450%
Ciberseguridad      ██████████████████   +320%
Data Science        ████████████████     +280%
Enfermería          ████████████         +180%
Ing. Ambiental      ██████████           +125%
Arquitectura        ████                 +45%
Derecho             ██                   +12%
Periodismo          █                    -5%
```

---

## 🛠️ Implementación Técnica

### Stack de Visualización

```json
{
  "charting": "recharts",
  "animations": "framer-motion",
  "predictions": "regression.js o tensorflow.js (básico)",
  "estadísticas": "simple-statistics"
}
```

### Instalación

```bash
npm install recharts regression simple-statistics
```

---

## 📊 Componentes React

### 1. TrendChart - Gráfico de Tendencias

```jsx
<TrendChart
  carrera="Ingeniería Civil en Informática"
  metric="matricula"
  years={2007-2025}
  showProjection={true}
  projectionYears={5}
/>
```

### 2. RIASECComparison - Comparativa por Vocación

```jsx
<RIASECComparison
  dimension="I"
  metrics={['salario', 'empleabilidad', 'matricula']}
/>
```

### 3. SaturationIndicator - Indicador de Saturación

```jsx
<SaturationIndicator
  carrera="Psicología"
  score={95}
  trend="alta-saturacion"
/>
```

### 4. FutureProjection - Proyección a 5 años

```jsx
<FutureProjection
  carrera="Data Science"
  projections={{
    salario: { 2030: 2800000, confidence: 0.85 },
    demanda: { 2030: 18500, confidence: 0.78 }
  }}
/>
```

---

## 🧮 Scripts de Análisis

### 1. Análisis de Tendencias Históricas

**Archivo:** `scripts/06-analyze-trends.js`

**Funcionalidad:**
- Lee datos de múltiples años (2007-2025)
- Calcula tasas de crecimiento
- Identifica tendencias (creciente, estable, decreciente)
- Detecta cambios abruptos (COVID, reformas educativas)

**Output:**
```json
{
  "Ingeniería en Informática": {
    "crecimiento_anual_promedio": 8.5,
    "tendencia": "creciente",
    "volatilidad": "baja",
    "picos": [
      { "año": 2020, "razon": "COVID - aumento demanda tech" }
    ]
  }
}
```

### 2. Proyecciones a 5 Años

**Archivo:** `scripts/07-project-future.js`

**Metodologías:**

#### A. Regresión Lineal (simple)
```javascript
// Para carreras con crecimiento estable
const trend = linearRegression(dataPoints);
const projection2030 = trend.predict(2030);
```

#### B. Media Móvil Exponencial (intermedio)
```javascript
// Para suavizar volatilidad
const ema = exponentialMovingAverage(dataPoints, alpha=0.3);
const projection = extrapolate(ema, 5);
```

#### C. Modelo ARIMA simplificado (avanzado)
```javascript
// Para series de tiempo complejas
const arima = fitARIMA(dataPoints);
const forecast = arima.forecast(5);
```

**Output:**
```json
{
  "carrera": "Ingeniería en IA",
  "proyecciones": {
    "2026": { "matricula": 13500, "confianza": 0.95 },
    "2027": { "matricula": 14800, "confianza": 0.90 },
    "2028": { "matricula": 16200, "confianza": 0.85 },
    "2029": { "matricula": 17800, "confianza": 0.78 },
    "2030": { "matricula": 19500, "confianza": 0.70 }
  },
  "modelo": "exponential_smoothing",
  "tasa_crecimiento_anual": 9.8
}
```

### 3. Análisis por Vocación RIASEC

**Archivo:** `scripts/08-analyze-riasec.js`

**Funcionalidad:**
- Agrupa todas las carreras por código Holland
- Calcula promedios por dimensión (I, R, A, S, E, C)
- Identifica fortalezas y debilidades de cada vocación

**Output:**
```json
{
  "I": {
    "nombre": "Investigador",
    "carreras_count": 8,
    "matricula_total": 145000,
    "salario_promedio": 1900000,
    "empleabilidad_promedio": 92,
    "top_carreras": [
      "Medicina",
      "Ingeniería Civil en Informática",
      "Biotecnología"
    ],
    "tendencia_5anos": "creciente",
    "saturacion_score": 35,
    "oportunidades": [
      "Alta demanda en investigación científica",
      "Salarios competitivos",
      "Baja saturación en áreas especializadas"
    ],
    "desafios": [
      "Requiere posgrados para mejores salarios",
      "Duración de estudios prolongada"
    ]
  }
}
```

### 4. Índice de Saturación del Mercado

**Archivo:** `scripts/09-saturation-index.js`

**Fórmula:**
```javascript
saturationScore = (
  titulados_promedio_3anos / vacantes_laborales * 100 * 0.4 +
  crecimiento_matricula_negativo_peso * 0.3 +
  empleabilidad_inversa * 0.3
) * 100;

// 0-30: Oportunidad (baja saturación)
// 31-60: Normal
// 61-80: Precaución (saturación media)
// 81-100: Alerta (alta saturación)
```

**Output:**
```json
{
  "Psicología": {
    "saturation_score": 95,
    "nivel": "alerta",
    "titulados_2023": 8500,
    "empleados_primer_ano": 3200,
    "tasa_empleo": 37.6,
    "recomendacion": "Considerar especialización o áreas emergentes como Psicología Organizacional o Neuropsicología"
  },
  "Data Science": {
    "saturation_score": 15,
    "nivel": "oportunidad",
    "titulados_2023": 450,
    "demanda_estimada": 2100,
    "tasa_empleo": 96,
    "recomendacion": "Alta demanda, excelentes perspectivas"
  }
}
```

---

## 🎨 Diseño de Dashboard

### Vista Principal: "Explora tu Futuro"

```
┌────────────────────────────────────────────────────┐
│  📊 Dashboard de Estadísticas                      │
│                                                     │
│  Tu perfil: ISA (Investigador-Social-Artístico)   │
└────────────────────────────────────────────────────┘

┌─────────────────────┬──────────────────────────────┐
│  💰 Proyección      │  📈 Demanda Laboral          │
│  de Ingresos        │                               │
│                     │  [Gráfico línea temporal]     │
│  [Gráfico línea]    │  2020 ──→ 2030               │
│                     │                               │
│  Promedio 2030:     │  Crecimiento esperado:        │
│  $2.1M CLP         │  +180%                        │
└─────────────────────┴──────────────────────────────┘

┌────────────────────────────────────────────────────┐
│  🎯 Carreras de tu perfil ISA                      │
│                                                     │
│  ┌─ Medicina ─────────────────────────────┐       │
│  │  Saturación: 🟡 Media (58)              │       │
│  │  Salario 2030: $2.8M                    │       │
│  │  Demanda: ↗️ +45%                        │       │
│  └────────────────────────────────────────┘       │
│                                                     │
│  ┌─ Psicología ───────────────────────────┐       │
│  │  Saturación: 🔴 Alta (95)               │       │
│  │  Salario 2030: $1.1M                    │       │
│  │  Demanda: → Estable                     │       │
│  └────────────────────────────────────────┘       │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│  📊 Comparativa RIASEC                             │
│                                                     │
│  [Gráfico radar comparando I, S, A]               │
│                                                     │
│  - Investigador (I): 💰 Alto salario, 🎓 Largo   │
│  - Social (S): 💰 Medio, 🎓 Medio, ❤️ Vocación    │
│  - Artístico (A): 💰 Variable, 🎨 Creatividad     │
└────────────────────────────────────────────────────┘
```

---

## 📝 Plan de Implementación

### Fase 1: Scripts de Análisis (Semana 1)
- [ ] `06-analyze-trends.js` - Tendencias históricas
- [ ] `07-project-future.js` - Proyecciones 5 años
- [ ] `08-analyze-riasec.js` - Análisis por vocación
- [ ] `09-saturation-index.js` - Índice de saturación

### Fase 2: Componentes de Visualización (Semana 2)
- [ ] `TrendChart.jsx` - Gráfico de líneas con proyección
- [ ] `RIASECComparison.jsx` - Comparativa vocaciones
- [ ] `SaturationIndicator.jsx` - Indicador de saturación
- [ ] `FutureProjection.jsx` - Proyección interactiva

### Fase 3: Dashboard (Semana 3)
- [ ] `EstadisticasCarrera.jsx` - Vista detallada por carrera
- [ ] `DashboardRIASEC.jsx` - Dashboard por vocación
- [ ] `ComparadorCarreras.jsx` - Comparar 2-3 carreras

### Fase 4: Integración (Semana 4)
- [ ] Integrar en página de Resultados
- [ ] Agregar a CarrerasRecomendadas
- [ ] Crear página dedicada "/estadisticas"

---

## 🎯 Casos de Uso

### 1. Usuario completa test RIASEC
**Resultado:** ISA

**Dashboard muestra:**
- Carreras ISA con mejor proyección a 5 años
- Gráfico comparativo de salarios ISA vs otras dimensiones
- Índice de saturación de cada carrera ISA
- Proyección de demanda laboral

### 2. Usuario explora carrera específica
**Carrera:** Ingeniería Civil en Informática

**Visualizaciones:**
- Evolución matrícula 2007-2025
- Proyección matrícula 2026-2030
- Tendencia salarial histórica y futura
- Empleabilidad por año
- Comparativa con carreras similares

### 3. Usuario compara vocaciones
**Comparación:** I (Investigador) vs E (Emprendedor)

**Muestra:**
- Salarios promedio lado a lado
- Tasas de empleo
- Duración de estudios
- Saturación de mercado
- Proyección de crecimiento

---

## 💡 Insights Automáticos con IA

Usando los datos procesados + Claude API:

```javascript
const insights = await generateInsights({
  perfil: 'ISA',
  carreraInteres: 'Medicina',
  datosHistoricos: trendData,
  proyecciones: futureData
});

// Output:
{
  "resumen": "Medicina es una excelente opción para tu perfil ISA...",
  "fortalezas": [
    "Alta empleabilidad (92%)",
    "Salarios competitivos ($2.8M proyectado 2030)",
    "Demanda creciente por envejecimiento poblacional"
  ],
  "consideraciones": [
    "Duración de estudios prolongada (7 años)",
    "Saturación media en algunas especialidades",
    "Requiere alta dedicación académica"
  ],
  "alternativas": [
    "Biotecnología: Menor saturación, similar perfil",
    "Enfermería: Menor duración, alta demanda"
  ]
}
```

---

## 📚 Recursos Técnicos

### Bibliotecas Recomendadas

```json
{
  "visualización": {
    "recharts": "Gráficos React nativos",
    "chart.js": "Alternativa robusta",
    "victory": "Visualizaciones complejas"
  },
  "análisis": {
    "regression": "Regresión lineal",
    "simple-statistics": "Estadísticas básicas",
    "ml.js": "Machine learning JavaScript"
  },
  "procesamiento": {
    "lodash": "Utilidades de arrays/objetos",
    "date-fns": "Manejo de fechas"
  }
}
```

### Documentación
- Recharts: https://recharts.org/
- Regression.js: https://github.com/Tom-Alexander/regression-js
- Simple Statistics: https://simplestatistics.org/

---

**Siguiente:** Crear los scripts de análisis y componentes de visualización
