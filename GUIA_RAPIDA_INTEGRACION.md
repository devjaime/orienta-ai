# 🚀 Guía Rápida: Integración MINEDUC

Guía paso a paso para integrar datos oficiales del MINEDUC en 30 minutos.

## ✅ Checklist Rápido

### Fase 1: Preparación (5 min)
- [ ] Instalar dependencias: `npm install`
- [ ] Verificar que Supabase está configurado (`.env`)
- [ ] Crear tabla en Supabase (SQL proporcionado)

### Fase 2: Descarga de Datos (10 min)
- [ ] Ir a https://datosabiertos.mineduc.cl/matricula-en-educacion-superior/
- [ ] Descargar archivo 2024
- [ ] Descomprimir en `data/mineduc-raw/matricula/`
- [ ] Verificar que hay archivos CSV

### Fase 3: Procesamiento (10 min)
- [ ] Ejecutar: `npm run process-matricula`
- [ ] Ejecutar: `npm run merge-carreras`
- [ ] Revisar resultado en `data/processed/carreras-enriquecidas.json`

### Fase 4: Carga a Supabase (5 min)
- [ ] Ejecutar: `npm run upload-supabase`
- [ ] Verificar en Supabase Dashboard que los datos se cargaron

---

## 📋 Comandos Principales

```bash
# 1. Instalar dependencias
npm install

# 2. Procesar matrícula MINEDUC
npm run process-matricula

# 3. Fusionar con carreras actuales
npm run merge-carreras

# 4. Subir a Supabase
npm run upload-supabase

# 5. Todo en uno (proceso completo)
npm run sync-mineduc-full
```

---

## 🗄️ SQL para Crear Tabla en Supabase

Ejecuta esto en el SQL Editor de Supabase:

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

-- Tabla de log
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

---

## 🔧 Troubleshooting

### Error: "No se encontró archivo CSV"
**Solución:** Verifica que descomprimiste el RAR en `data/mineduc-raw/matricula/`

### Error: "Cannot find module 'csv-parser'"
**Solución:** Ejecuta `npm install`

### Error: Variables de entorno faltantes
**Solución:** Crea `.env` con:
```
VITE_SUPABASE_URL=tu_url_aqui
VITE_SUPABASE_ANON_KEY=tu_key_aqui
```

### Error: "Table doesn't exist"
**Solución:** Ejecuta el SQL arriba en Supabase primero

---

## 📊 Estructura de Archivos Resultante

```
data/
├── mineduc-raw/
│   ├── matricula/
│   │   └── Matricula-Ed-Superior-2024.csv
│   └── titulados/
│       └── Titulados-Ed-Superior-2023.csv
└── processed/
    ├── matricula-agregado.json      # Generado por paso 2
    └── carreras-enriquecidas.json   # Generado por paso 3
```

---

## 🎯 Resultado Final

Después de completar estos pasos, tendrás:

✅ Tabla `carreras_enriquecidas` en Supabase con:
- 30 carreras de Orienta-AI
- Códigos Holland (RIASEC)
- Datos oficiales de matrícula MINEDUC
- Número de instituciones que ofrecen cada carrera
- Datos de empleabilidad y titulación

✅ Datos listos para usar en tu aplicación

---

## 📖 Documentación Completa

Para más detalles, ver: `INTEGRACION_MINEDUC.md`

---

**Tiempo estimado total: 30 minutos**
**Última actualización: 2025-01-05**
