# 📥 Guía Paso a Paso: Descarga y Procesamiento de Datos MINEDUC

Guía detallada para descargar, descomprimir y procesar los archivos RAR del MINEDUC.

---

## ✅ Checklist Previo

Antes de empezar, asegúrate de tener:
- [ ] Conexión a internet estable
- [ ] ~500MB de espacio libre en disco
- [ ] Programa para descomprimir RAR (ver instalación abajo)

---

## 📦 PASO 1: Instalar Descompresor RAR

### En macOS (tu caso)

```bash
# Opción 1: Con Homebrew (recomendado)
brew install unrar

# Opción 2: Verificar si ya lo tienes
which unrar
# Si muestra una ruta, ya lo tienes instalado
```

### En Windows
Descarga WinRAR o 7-Zip:
- **WinRAR:** https://www.win-rar.com/download.html
- **7-Zip:** https://www.7-zip.org/

### En Linux
```bash
sudo apt-get install unrar
# o
sudo yum install unrar
```

---

## 🌐 PASO 2: Descargar Datos de MINEDUC

### 2.1 Abrir el Portal

1. Abre tu navegador
2. Ve a: **https://datosabiertos.mineduc.cl/**

### 2.2 Navegar a Matrícula

1. En la página principal, busca la sección **"Estudiantes"**
2. Click en **"Matrícula en educación superior"**
   - O directamente: https://datosabiertos.mineduc.cl/matricula-en-educacion-superior/

### 2.3 Descargar el Archivo

Verás una lista de años. Te recomiendo descargar:

**Para empezar (rápido):**
- ✅ **2024** (más reciente, archivo pequeño)

**Para análisis completo (después):**
- ✅ 2024, 2023, 2022, 2021, 2020

**Cómo descargar:**

1. Busca la fila que dice **"2024"**
2. Verás un ícono de descarga 📥 o un link
3. Click derecho → "Guardar enlace como..."
4. Guárdalo en: `/Users/devjaime/Downloads/`
5. El archivo se llamará algo como: `Matricula-Ed-Superior-2024.rar`

**⏱️ Tiempo estimado de descarga:** 2-5 minutos

---

## 📂 PASO 3: Mover y Descomprimir

### 3.1 Mover el archivo a la carpeta del proyecto

Abre la terminal y ejecuta:

```bash
# Ir a tu proyecto
cd /Users/devjaime/Documents/orienta-ai

# Verificar que la carpeta existe
ls data/mineduc-raw/matricula

# Mover el archivo descargado
mv ~/Downloads/Matricula-Ed-Superior-2024.rar data/mineduc-raw/matricula/

# Verificar que se movió correctamente
ls -lh data/mineduc-raw/matricula/
```

Deberías ver algo como:
```
-rw-r--r--  1 devjaime  staff    45M Jan  5 23:00 Matricula-Ed-Superior-2024.rar
```

### 3.2 Descomprimir el RAR

```bash
# Ir a la carpeta
cd data/mineduc-raw/matricula

# Descomprimir
unrar x Matricula-Ed-Superior-2024.rar

# Esto mostrará algo como:
# Extracting from Matricula-Ed-Superior-2024.rar
# Extracting  Matricula_2024.csv                OK
# All OK
```

### 3.3 Verificar archivos CSV

```bash
# Ver qué archivos se extrajeron
ls -lh *.csv

# Ver las primeras líneas del CSV
head -n 5 *.csv
```

**Deberías ver algo como:**
```csv
INSTITUCION,CARRERA,REGION,MATRICULA,TIPO_INSTITUCION,ANIO
Universidad de Chile,Ingeniería Civil en Informática,Metropolitana,850,Universidad,2024
Pontificia Universidad Católica,Medicina,Metropolitana,320,Universidad,2024
...
```

---

## 🔧 PASO 4: Instalar Dependencias

Ahora instalamos las librerías necesarias:

```bash
# Volver a la raíz del proyecto
cd /Users/devjaime/Documents/orienta-ai

# Instalar dependencias
npm install

# Esto instalará:
# ✅ csv-parser (para leer CSVs)
# ✅ dotenv (para variables de entorno)
# ✅ recharts (para gráficos)
```

**⏱️ Tiempo estimado:** 1-2 minutos

---

## 📊 PASO 5: Verificar Estructura del CSV Real

Antes de procesar, necesitamos saber qué columnas tiene el CSV real:

```bash
cd data/mineduc-raw/matricula

# Ver las columnas (primera línea)
head -n 1 *.csv
```

**Anota qué columnas tiene.** Por ejemplo:
```
NOMBRE_CARRERA,NOMBRE_INSTITUCION,REGION_SEDE,TIPO_INSTITUCION,MATRICULA,ANIO
```

### 5.1 Adaptar el Script de Procesamiento

Ahora que sabes las columnas reales, abre el script y adáptalo:

**Archivo a editar:** `scripts/02-process-matricula.js`

Busca estas líneas (aprox línea 49-56):

```javascript
const carreraNombre = row['NOMBRE_CARRERA'] || row['Carrera'] || row['NOMBRE_CARRERA_GENERICA'];
const institucion = row['INSTITUCION'] || row['Institucion'] || row['NOMBRE_INSTITUCION'];
const matricula = parseInt(row['MATRICULA'] || row['Matricula'] || row['TOTAL_MATRICULA'] || 0);
const region = row['REGION'] || row['Region'] || row['REGION_SEDE'];
const tipoInstitucion = row['TIPO_INSTITUCION'] || row['Tipo'] || row['TIPO_IES'];
const modalidad = row['MODALIDAD'] || row['Modalidad'] || 'Presencial';
```

**Ajústalas según las columnas que viste.** Por ejemplo, si tu CSV tiene `CARRERA` en vez de `NOMBRE_CARRERA`:

```javascript
const carreraNombre = row['CARRERA'];
const institucion = row['INSTITUCION'];
// etc.
```

---

## 🚀 PASO 6: Procesar los Datos

Ahora sí, procesemos:

```bash
# Asegúrate de estar en la raíz del proyecto
cd /Users/devjaime/Documents/orienta-ai

# Ejecutar procesamiento
npm run process-matricula
```

**Salida esperada:**

```
🚀 Iniciando procesamiento de datos de Matrícula MINEDUC

📊 Encontrados 1 archivos CSV

📄 Procesando: Matricula_2024.csv
   ✅ Matricula_2024.csv: 3456 carreras únicas

📈 Total de carreras únicas: 3456

✅ Datos procesados guardados en: data/processed/matricula-agregado.json

📊 Estadísticas:
   - Carreras procesadas: 3456
   - Matrícula total: 1,234,567

🏆 Top 10 carreras por matrícula:
   1. Ingeniería Comercial: 45,678 estudiantes
   2. Derecho: 38,234 estudiantes
   3. Pedagogía en Educación Básica: 32,456 estudiantes
   ...

✨ ¡Procesamiento completado!

📝 Próximo paso: Ejecutar script de fusión con carreras.json
   node scripts/04-merge-carreras.js
```

---

## 🔗 PASO 7: Fusionar con tus Carreras RIASEC

Ahora vamos a fusionar los datos MINEDUC con tus 30 carreras:

```bash
npm run merge-carreras
```

**Salida esperada:**

```
🚀 Iniciando fusión de datos

📂 Cargando archivos...
   ✅ Carreras locales: 30
   ✅ Carreras MINEDUC (matrícula): 3456

🔗 Iniciando proceso de matching...

🔍 Buscando match para: Ingeniería Civil en Informática
   ✅ Match encontrado (score: 95.2%)
      Matrícula: 15,100
      Instituciones: 45

🔍 Buscando match para: Medicina
   ✅ Match encontrado (score: 100.0%)
      Matrícula: 4,720
      Instituciones: 28

🔍 Buscando match para: Psicología
   ✅ Match encontrado (score: 98.5%)
      Matrícula: 12,800
      Instituciones: 52

...

📊 RESUMEN
═══════════════════════════════════════════════════
✅ Matches encontrados: 28/30
❌ No encontrados: 2/30
📈 Tasa de éxito: 93.3%

⚠️  Carreras sin match en MINEDUC:
   - Ingeniería en Machine Learning (muy nueva, no en MINEDUC aún)
   - Diseño de Videojuegos (muy nueva)

💡 Estas carreras mantendrán solo los datos originales

💾 Archivo guardado: data/processed/carreras-enriquecidas.json

📝 Próximo paso: Cargar a Supabase
   node scripts/05-upload-supabase
```

---

## 💾 PASO 8: Verificar el Resultado

Antes de subir a Supabase, verifica el JSON generado:

```bash
# Ver una carrera de ejemplo
cat data/processed/carreras-enriquecidas.json | grep -A 30 "Ingeniería Civil en Informática"
```

O ábrelo en VS Code:
```bash
code data/processed/carreras-enriquecidas.json
```

**Deberías ver algo como:**

```json
{
  "id": 1,
  "nombre": "Ingeniería Civil en Informática",
  "codigo_holland": "IRC",
  "area": "Tecnología",
  "duracion_anos": 5,
  "salario_promedio_chile_clp": 1800000,

  "mineduc_data": {
    "matricula_actual": 15100,
    "instituciones_count": 45,
    "instituciones_ofrecen": [
      "Universidad de Chile",
      "PUC",
      "UTFSM",
      ...
    ],
    "regiones_disponibles": ["RM", "V", "VIII", "BIO"],
    "modalidades": ["Presencial", "Online"],
    "top_instituciones": [
      { "institucion": "Universidad de Chile", "matricula": 850 },
      { "institucion": "PUC", "matricula": 720 },
      ...
    ],
    "match_score": 0.95,
    "fuente": "MINEDUC Datos Abiertos",
    "fecha_actualizacion": "2025-01-05T23:15:00.000Z"
  }
}
```

✅ **¡Perfecto! Los datos se fusionaron correctamente.**

---

## 🗄️ PASO 9: Crear Tabla en Supabase

Antes de subir, necesitas crear la tabla en Supabase:

### 9.1 Abrir Supabase Dashboard

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto **orienta-ai**
3. Click en **SQL Editor** (ícono de </> en la barra lateral)

### 9.2 Ejecutar el SQL

Copia y pega este SQL completo:

```sql
-- Tabla de carreras enriquecidas
CREATE TABLE IF NOT EXISTS carreras_enriquecidas (
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

  -- Arrays
  universidades_destacadas TEXT[],
  campos_laborales TEXT[],

  -- Datos MINEDUC enriquecidos
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

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_carreras_codigo_holland
  ON carreras_enriquecidas(codigo_holland);

CREATE INDEX IF NOT EXISTS idx_carreras_area
  ON carreras_enriquecidas(area);

CREATE INDEX IF NOT EXISTS idx_carreras_dimension
  ON carreras_enriquecidas(dimension_principal);

-- Tabla de log de sincronización
CREATE TABLE IF NOT EXISTS mineduc_sync_log (
  id SERIAL PRIMARY KEY,
  sync_date TIMESTAMP DEFAULT NOW(),
  dataset_name TEXT,
  records_processed INTEGER,
  records_updated INTEGER,
  status TEXT,
  error_message TEXT
);

-- Mensaje de confirmación
SELECT 'Tablas creadas exitosamente ✅' as resultado;
```

### 9.3 Ejecutar

1. Click en **Run** (o Ctrl/Cmd + Enter)
2. Deberías ver: `"Tablas creadas exitosamente ✅"`

---

## 🚀 PASO 10: Subir Datos a Supabase

Ahora sí, subimos los datos:

```bash
# Verificar que tienes las variables de entorno
cat .env | grep SUPABASE

# Deberías ver:
# VITE_SUPABASE_URL=https://xxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJxxxx...

# Si no las tienes, créalas:
echo "VITE_SUPABASE_URL=tu_url" >> .env
echo "VITE_SUPABASE_ANON_KEY=tu_key" >> .env
```

### 10.1 Ejecutar Upload

```bash
npm run upload-supabase
```

**Salida esperada:**

```
🚀 Iniciando carga a Supabase

📂 Cargando carreras enriquecidas...
   ✅ 30 carreras cargadas

⚠️  Esta operación subirá/actualizará datos en Supabase
   Tabla: carreras_enriquecidas
   Registros: 30

📤 Subiendo 30 carreras a Supabase...

   ✅ Ingeniería Civil en Informática
   ✅ Medicina
   ✅ Psicología
   ✅ Arquitectura
   ✅ Administración de Empresas
   ✅ Contador Auditor
   ...

📊 RESUMEN DE CARGA
═══════════════════════════════════════════════════
📝 Total procesados: 30
✅ Exitosos: 30
❌ Errores: 0

✅ ¡Carga completada!

🎉 Todas las carreras fueron cargadas exitosamente

📝 Próximo paso: Actualizar el código de la app para usar estos datos
   Ver sección "Uso en la Aplicación" en INTEGRACION_MINEDUC.md
```

---

## ✅ PASO 11: Verificar en Supabase

### 11.1 Ver los Datos

1. En Supabase Dashboard, ve a **Table Editor**
2. Busca la tabla `carreras_enriquecidas`
3. Deberías ver tus 30 carreras con todos los datos

### 11.2 Hacer una Query de Prueba

En SQL Editor:

```sql
-- Ver todas las carreras con datos MINEDUC
SELECT
  nombre,
  codigo_holland,
  matricula_actual,
  instituciones_ofrecen_count
FROM carreras_enriquecidas
WHERE matricula_actual IS NOT NULL
ORDER BY matricula_actual DESC
LIMIT 10;
```

Deberías ver el top 10 de tus carreras por matrícula.

---

## 🎨 PASO 12: Ahora a Integrar en la App

Perfecto! Ya tienes:
- ✅ Datos MINEDUC descargados y procesados
- ✅ Fusionados con tus carreras RIASEC
- ✅ Cargados en Supabase

**Próximo:** Vamos a integrar los gráficos en tu app.

---

## 🆘 Troubleshooting

### Problema: "unrar: command not found"
**Solución:**
```bash
brew install unrar
```

### Problema: "No se encontraron archivos CSV"
**Solución:**
```bash
# Verificar que descomprimiste el RAR
cd data/mineduc-raw/matricula
ls -la

# Si no hay CSV, descomprimir manualmente:
unrar x *.rar
```

### Problema: "Error: Cannot find module 'csv-parser'"
**Solución:**
```bash
npm install
```

### Problema: Script no encuentra las columnas del CSV
**Solución:**
Edita `scripts/02-process-matricula.js` líneas 49-56 con los nombres exactos de las columnas de tu CSV.

### Problema: "No matches found" al fusionar
**Solución:**
Es normal que algunas carreras muy específicas no tengan match. Si tienes menos de 20/30 matches, revisa la función `normalizeCareerName()` en el script.

### Problema: Error al subir a Supabase
**Solución:**
```bash
# Verificar variables de entorno
cat .env

# Verificar que la tabla existe
# En Supabase SQL Editor:
SELECT * FROM carreras_enriquecidas LIMIT 1;
```

---

## 📞 Contacto MINEDUC

Si encuentras problemas con los datos:
- **Email:** estadisticas@mineduc.cl
- Pregunta: "¿Cuál es la estructura de columnas del dataset de Matrícula 2024?"

---

## 🎉 ¡Listo!

Ya tienes los datos MINEDUC integrados.

**Próximo paso:** Vamos a crear los gráficos y el dashboard.

¿Seguimos? 🚀
