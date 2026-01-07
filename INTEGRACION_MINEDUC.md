# 🎓 Integración de Datos Abiertos MINEDUC

Guía paso a paso para enriquecer las carreras de Orienta-AI con datos oficiales del Ministerio de Educación de Chile.

## 📋 Tabla de Contenidos
1. [Datasets Disponibles](#datasets-disponibles)
2. [Preparación](#preparación)
3. [Paso 1: Descarga de Datos](#paso-1-descarga-de-datos)
4. [Paso 2: Procesamiento de Datos](#paso-2-procesamiento-de-datos)
5. [Paso 3: Integración con Carreras Actuales](#paso-3-integración)
6. [Paso 4: Carga a Supabase](#paso-4-carga-a-supabase)
7. [Automatización](#automatización)

---

## 📊 Datasets Disponibles

Fuente: https://datosabiertos.mineduc.cl/

### Datasets Principales

#### 1. Matrícula en Educación Superior (2007-2025)
**URL:** https://datosabiertos.mineduc.cl/matricula-en-educacion-superior/

**Contenido esperado:**
- Institución
- Carrera
- Año
- Número de matriculados
- Tipo de institución (Universidad, IP, CFT)
- Acreditación
- Modalidad (presencial, online)
- Región

**Utilidad:** Identificar carreras más populares, tendencias de matrícula

#### 2. Titulados de Educación Superior (2007-2024)
**URL:** https://datosabiertos.mineduc.cl/titulados-en-educacion-superior/

**Contenido esperado:**
- Institución
- Carrera
- Año de titulación
- Número de titulados
- Tiempo promedio de titulación

**Utilidad:** Calcular tasas de graduación, éxito académico

#### 3. Pruebas de Admisión (PAES)
**URL:** https://datosabiertos.mineduc.cl/pruebas-de-admision-a-la-educacion-superior/

**Contenido esperado:**
- Puntajes por carrera
- Puntajes de corte
- Vacantes

**Utilidad:** Requisitos de ingreso

---

## 🛠️ Preparación

### Requisitos
- Node.js 18+
- Acceso a Supabase
- Espacio en disco: ~500MB para datos raw

### Estructura de Carpetas
```
orienta-ai/
├── data/
│   ├── mineduc-raw/          # Archivos RAR/CSV descargados
│   │   ├── matricula/
│   │   ├── titulados/
│   │   └── admision/
│   └── processed/             # Datos procesados
├── scripts/
│   ├── 01-download-mineduc.js      # Script de descarga
│   ├── 02-process-matricula.js     # Procesar matrículas
│   ├── 03-process-titulados.js     # Procesar titulados
│   ├── 04-merge-carreras.js        # Fusionar con carreras.json
│   └── 05-upload-supabase.js       # Subir a Supabase
└── INTEGRACION_MINEDUC.md    # Esta guía
```

---

## 📥 Paso 1: Descarga de Datos

### Opción A: Descarga Manual (Recomendado para empezar)

1. Visita https://datosabiertos.mineduc.cl/matricula-en-educacion-superior/
2. Descarga el archivo más reciente (2024 o 2025)
3. Guarda en `data/mineduc-raw/matricula/`
4. Extrae el RAR

```bash
cd data/mineduc-raw/matricula
# Extraer RAR (necesitas unrar instalado)
unrar x Matricula-Ed-Superior-2024.rar
```

5. Repite para "Titulados":
   - https://datosabiertos.mineduc.cl/titulados-en-educacion-superior/
   - Guarda en `data/mineduc-raw/titulados/`

### Opción B: Script Automatizado (Avanzado)

Ejecuta:
```bash
npm run download-mineduc
```

---

## 🔄 Paso 2: Procesamiento de Datos

### 2.1 Explorar Estructura de CSV

Primero, inspecciona los archivos CSV descargados:

```bash
cd data/mineduc-raw/matricula
head -n 5 *.csv
```

### 2.2 Procesar Matrícula

El script `02-process-matricula.js` hará:
1. Leer CSV de matrículas
2. Agrupar por carrera
3. Calcular métricas:
   - Total matriculados 2024
   - Crecimiento vs año anterior
   - Distribución por región
   - Número de instituciones que ofrecen la carrera

```bash
npm run process-matricula
```

**Output esperado:**
```json
{
  "Ingeniería Civil en Informática": {
    "matricula_2024": 12500,
    "crecimiento_anual": 8.5,
    "instituciones_count": 45,
    "regiones": ["RM", "V", "VIII"],
    "modalidades": ["Presencial", "Online"]
  }
}
```

### 2.3 Procesar Titulados

```bash
npm run process-titulados
```

**Output esperado:**
```json
{
  "Medicina": {
    "titulados_2023": 1850,
    "tasa_titulacion": 0.78,
    "duracion_promedio_anos": 7.2
  }
}
```

---

## 🔗 Paso 3: Integración con Carreras Actuales

El script `04-merge-carreras.js` fusionará:
- Tu `src/data/carreras.json` (30 carreras con códigos RIASEC)
- Datos procesados de MINEDUC

### Lógica de Matching

**Matching por nombre de carrera:**
```javascript
// Normalizar nombres
function normalizeCareerName(name) {
  return name
    .toLowerCase()
    .replace(/ingenier[ií]a civil en/i, 'ingeniería')
    .replace(/\s+/g, ' ')
    .trim();
}

// Matching fuzzy
const similarity = stringSimilarity(
  normalizeCareerName(carreraLocal.nombre),
  normalizeCareerName(carreraMINEDUC.nombre)
);

if (similarity > 0.85) {
  // Match encontrado
}
```

**Output:**
```json
{
  "id": 1,
  "nombre": "Ingeniería Civil en Informática",
  "codigo_holland": "IRC",

  // Datos originales
  "area": "Tecnología",
  "duracion_anos": 5,
  "salario_promedio_chile_clp": 1800000,

  // Datos enriquecidos MINEDUC
  "mineduc_data": {
    "matricula_2024": 12500,
    "crecimiento_anual": 8.5,
    "titulados_2023": 2100,
    "instituciones_count": 45,
    "tasa_titulacion": 0.82,
    "duracion_real_anos": 5.8,
    "fuente": "MINEDUC 2024",
    "ultima_actualizacion": "2025-01-05"
  }
}
```

---

## 💾 Paso 4: Carga a Supabase

### 4.1 Crear Tabla en Supabase

Ejecuta este SQL en el SQL Editor de Supabase:

```sql
-- Tabla principal de carreras enriquecidas
CREATE TABLE carreras_enriquecidas (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  codigo_holland VARCHAR(3) NOT NULL,
  dimension_principal CHAR(1),
  area TEXT,

  -- Datos básicos
  duracion_anos_oficial INTEGER,
  nivel_matematicas TEXT,
  empleabilidad TEXT,
  salario_promedio_estimado INTEGER,
  descripcion TEXT,
  perfil_ideal TEXT,

  -- Datos de instituciones
  universidades_destacadas TEXT[],
  campos_laborales TEXT[],

  -- Datos MINEDUC (enriquecidos)
  matricula_actual INTEGER,
  matricula_ano INTEGER,
  crecimiento_anual NUMERIC(5,2),
  titulados_ultimo_ano INTEGER,
  instituciones_ofrecen_count INTEGER,
  tasa_titulacion NUMERIC(3,2),
  duracion_real_promedio NUMERIC(3,1),

  -- Metadatos
  fuente_datos_mineduc TEXT,
  fecha_actualizacion_mineduc TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_carreras_codigo_holland ON carreras_enriquecidas(codigo_holland);
CREATE INDEX idx_carreras_area ON carreras_enriquecidas(area);
CREATE INDEX idx_carreras_dimension ON carreras_enriquecidas(dimension_principal);

-- Tabla de log de actualizaciones
CREATE TABLE mineduc_sync_log (
  id SERIAL PRIMARY KEY,
  sync_date TIMESTAMP DEFAULT NOW(),
  dataset_name TEXT,
  records_processed INTEGER,
  records_updated INTEGER,
  status TEXT,
  error_message TEXT
);
```

### 4.2 Subir Datos

```bash
npm run upload-supabase
```

Este script:
1. Lee `data/processed/carreras-enriquecidas.json`
2. Usa `upsert` en Supabase (actualiza si existe, crea si no)
3. Registra el resultado en `mineduc_sync_log`

---

## ⚙️ Automatización

### Opción A: Cron Job Local

Actualizar datos cada mes:

```bash
# Editar crontab
crontab -e

# Agregar (ejecuta el 1 de cada mes a las 3am)
0 3 1 * * cd /ruta/a/orienta-ai && npm run sync-mineduc-full
```

### Opción B: Netlify Scheduled Functions (Recomendado)

Crear `netlify/functions/scheduled-sync-mineduc.js`:

```javascript
// Esta función corre automáticamente cada mes
// Configurar en netlify.toml

const { schedule } = require('@netlify/functions');

const handler = async function(event, context) {
  console.log('Iniciando sincronización mensual MINEDUC...');

  // 1. Descargar últimos datos (si hay API)
  // 2. Procesar
  // 3. Actualizar Supabase

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Sincronización completada',
      timestamp: new Date().toISOString()
    })
  };
};

module.exports.handler = schedule("0 3 1 * *", handler);
```

**Configurar en `netlify.toml`:**
```toml
[functions]
  directory = "netlify/functions"

[[plugins]]
  package = "@netlify/plugin-functions"
```

---

## 📈 Uso en la Aplicación

### Actualizar Componente de Recomendaciones

Modificar `src/lib/recomendacionCarreras.js`:

```javascript
export function recomendarCarreras(codigoUsuario, options = {}) {
  // ... código existente ...

  // Agregar información MINEDUC en el resultado
  const carrerasConScore = carreras.map(carrera => {
    const score = calcularCompatibilidad(codigoUsuario, carrera.codigo_holland);

    return {
      ...carrera,
      compatibilidad_score: score,

      // Datos enriquecidos MINEDUC
      datos_oficiales: carrera.mineduc_data ? {
        popularidad: carrera.mineduc_data.matricula_2024,
        tendencia: carrera.mineduc_data.crecimiento_anual > 0 ? 'creciente' : 'estable',
        instituciones: carrera.mineduc_data.instituciones_count
      } : null
    };
  });

  return carrerasConScore;
}
```

### Mostrar en UI

En `CarrerasRecomendadas.jsx`:

```jsx
{carrera.datos_oficiales && (
  <div className="bg-blue-500/10 rounded-lg p-3 mt-3">
    <p className="text-xs text-white/60 mb-1">Datos oficiales MINEDUC:</p>
    <div className="flex gap-4 text-sm text-white/80">
      <span>📊 {carrera.datos_oficiales.popularidad.toLocaleString()} estudiantes</span>
      <span>📈 Tendencia: {carrera.datos_oficiales.tendencia}</span>
      <span>🏛️ {carrera.datos_oficiales.instituciones} instituciones</span>
    </div>
  </div>
)}
```

---

## 🎯 Próximos Pasos

### Fase 1: Manual (Esta semana) ✅
- [ ] Descargar datos de Matrícula 2024
- [ ] Descargar datos de Titulados 2023
- [ ] Explorar estructura de CSV
- [ ] Crear tabla en Supabase

### Fase 2: Procesamiento (Semana 2)
- [ ] Script de procesamiento de matrícula
- [ ] Script de procesamiento de titulados
- [ ] Script de fusión con carreras.json
- [ ] Primera carga a Supabase

### Fase 3: Integración (Semana 3)
- [ ] Actualizar componentes UI
- [ ] Mostrar datos MINEDUC en recomendaciones
- [ ] Testing

### Fase 4: Automatización (Semana 4)
- [ ] Función serverless de sincronización
- [ ] Scheduled function mensual
- [ ] Monitoreo y logs

---

## 📞 Contacto MINEDUC

Para consultas sobre datasets:
**Email:** estadisticas@mineduc.cl

Preguntas sugeridas:
- ¿Existe documentación de la estructura de datos?
- ¿Los datos de empleabilidad están disponibles por carrera?
- ¿Hay un diccionario de datos?
- ¿Se planea lanzar una API REST?

---

## 📚 Recursos

- Portal Datos Abiertos: https://datosabiertos.mineduc.cl/
- SIES (Sistema de Información de Educación Superior): https://www.sies.cl/
- Mi Futuro: https://www.mifuturo.cl/ (referencia, no scraping)

---

**Última actualización:** 2025-01-05
**Autor:** Orienta-AI Team
