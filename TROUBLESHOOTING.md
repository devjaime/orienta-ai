# 🔧 Guía de Solución de Problemas

## ✅ Estado Actual

- **Servidor:** ✅ Corriendo en http://localhost:5173/
- **Sin errores de servidor**
- **Todos los archivos existen**

---

## 📋 Diagnóstico Rápido

### Paso 1: Verificar que el navegador carga la página

1. Abre tu navegador
2. Ve a: **http://localhost:5173/**
3. ¿Qué ves?

**Opción A: Página en blanco**
→ Continúa al Paso 2

**Opción B: Error en pantalla**
→ Anota el mensaje de error y ve al Paso 3

**Opción C: La página carga pero con errores**
→ Ve al Paso 2

---

### Paso 2: Revisar la Consola del Navegador

**IMPORTANTE:** Este es el paso más importante para diagnosticar el problema.

1. Presiona **F12** (o Cmd+Option+I en Mac)
2. Ve a la pestaña **"Console"**
3. Busca mensajes en **ROJO** (errores)
4. Copia y pega TODO el error aquí

**Errores comunes y sus soluciones:**

#### Error: "Failed to fetch dynamically imported module"
```
Solución:
1. Detener el servidor (Ctrl+C)
2. Borrar cache de Vite:
   rm -rf node_modules/.vite
3. Reiniciar:
   npm run dev
```

#### Error: "Cannot find module" o "Module not found"
```
Solución:
Reinstalar dependencias:
rm -rf node_modules package-lock.json
npm install
npm run dev
```

#### Error: "Unexpected token" o "SyntaxError"
```
Problema: Archivo con error de sintaxis
Solución: Copiar el nombre del archivo del error y reportarlo
```

#### Error: 404 en archivos JSON
```
Error: GET http://localhost:5173/data/processed/future-projections.json 404

Solución:
Verificar que los archivos existen:
ls -la public/data/processed/

Si no existen:
npm run analytics-full
cp data/processed/*.json public/data/processed/
```

---

### Paso 3: Verificar Rutas Específicas

Prueba cada una de estas URLs y anota cuál funciona y cuál no:

- [ ] http://localhost:5173/ (Landing page)
- [ ] http://localhost:5173/test (Test RIASEC)
- [ ] http://localhost:5173/dashboard (Dashboard principal)
- [ ] http://localhost:5173/parent (Dashboard de apoderados)

**Si ninguna funciona:** Problema general (ve al Paso 4)
**Si solo algunas fallan:** Problema específico de componentes (reporta cuáles)

---

### Paso 4: Verificar que las Dependencias están Instaladas

```bash
# Verificar node_modules
ls node_modules | wc -l
# Debería mostrar un número > 200

# Verificar package.json
cat package.json | grep -A 20 "dependencies"
```

**Dependencias críticas que deben estar:**
- `react` y `react-dom`
- `react-router-dom`
- `framer-motion`
- `lucide-react`
- `recharts`
- `@supabase/supabase-js`

**Si falta alguna:**
```bash
npm install
npm run dev
```

---

### Paso 5: Limpiar Todo y Empezar de Nuevo

Si nada de lo anterior funciona:

```bash
# 1. Detener el servidor (Ctrl+C)

# 2. Limpiar todo
rm -rf node_modules package-lock.json
rm -rf node_modules/.vite
rm -rf dist

# 3. Reinstalar
npm install

# 4. Verificar archivos de datos
ls public/data/processed/
# Deberías ver: carreras-enriquecidas.json, future-projections.json, etc.

# Si no existen:
npm run analytics-full
mkdir -p public/data/processed
cp data/processed/*.json public/data/processed/

# 5. Reiniciar servidor
npm run dev
```

---

## 🐛 Errores Específicos por Funcionalidad

### Error al Cargar Proyecciones en Resultados

**Síntoma:** Página de resultados se carga pero sin proyecciones

**Diagnóstico:**
```bash
# Verificar que el archivo existe
ls -lh public/data/processed/future-projections.json

# Verificar contenido
head -20 public/data/processed/future-projections.json
```

**Solución:**
```bash
npm run project-future
cp data/processed/future-projections.json public/data/processed/
```

---

### Error en Comparador de Carreras

**Síntoma:** Dashboard carga pero comparador no aparece o da error

**Archivo a verificar:** `src/components/CareerComparator.jsx`

**Solución:**
Verificar en consola del navegador (F12) si hay error específico

---

### Error en Alertas de Saturación

**Síntoma:** El test funciona pero no aparecen alertas

**Esto es normal si:**
- No has llegado a la pregunta 15/30
- Tu perfil no coincide con carreras saturadas

**Para probar:** Responde las primeras 15 preguntas favoreciendo perfil Social/Artístico/Emprendedor (SAE)

---

### Error en Dashboard de Apoderados

**Síntoma:** Error 500 o "relation does not exist"

**Causa:** No se ejecutó el SQL schema en Supabase

**Solución:**
1. Ir a https://app.supabase.com
2. SQL Editor
3. Ejecutar `scripts/create-audit-tables.sql`

---

## 📞 Información para Reportar Problemas

Si ninguna solución funciona, reporta:

1. **Qué URL estás intentando acceder:**
   - Ejemplo: http://localhost:5173/test

2. **Qué ves en pantalla:**
   - Página en blanco
   - Mensaje de error específico
   - Página se carga parcialmente

3. **Errores en consola del navegador (F12):**
   - Copia TODOS los mensajes en rojo
   - Incluye el stack trace completo

4. **Versión de Node:**
   ```bash
   node --version
   npm --version
   ```

5. **Sistema operativo:**
   - macOS / Windows / Linux
   - Versión

6. **Navegador:**
   - Chrome / Firefox / Safari
   - Versión

---

## ✅ Checklist de Verificación

Antes de reportar un error, verifica:

- [ ] El servidor está corriendo (ves el mensaje "VITE ready")
- [ ] Puedes acceder a http://localhost:5173/
- [ ] Has revisado la consola del navegador (F12)
- [ ] Los archivos en `public/data/processed/` existen
- [ ] Las dependencias están instaladas (`ls node_modules`)
- [ ] Has probado limpiar cache y reinstalar
- [ ] Has copiado el error exacto de la consola

---

## 🆘 Solución de Emergencia

Si NADA funciona y necesitas ver la aplicación básica funcionando:

```bash
# 1. Hacer checkout de los archivos originales (antes de las nuevas funcionalidades)
git stash

# 2. Reinstalar
npm install
npm run dev

# 3. Si esto funciona, el problema está en las nuevas funcionalidades
# 4. Para volver a las nuevas funcionalidades:
git stash pop

# Y reporta qué archivo específico causa el problema
```

---

## 📊 Comando de Diagnóstico Completo

Ejecuta esto y copia la salida completa:

```bash
echo "=== DIAGNÓSTICO ORIENTA-AI ==="
echo ""
echo "Node version:"
node --version
echo ""
echo "NPM version:"
npm --version
echo ""
echo "Archivos en public/data/processed:"
ls -lh public/data/processed/ 2>&1
echo ""
echo "Componentes nuevos:"
ls -la src/components/Career*.jsx src/components/Saturation*.jsx 2>&1
echo ""
echo "Librerías nuevas:"
ls -la src/lib/saturation*.js src/lib/historical*.js src/lib/audit*.js 2>&1
echo ""
echo "Página de apoderados:"
ls -la src/pages/ParentDashboard.jsx 2>&1
echo ""
echo "Estado del servidor:"
ps aux | grep vite | grep -v grep
echo ""
echo "=== FIN DIAGNÓSTICO ==="
```

Copia TODO el resultado y compártelo para diagnóstico completo.

---

**¿El servidor se detiene inesperadamente?**

Revisa:
```bash
# Ver últimos 50 líneas de logs
tail -50 /tmp/claude/-Users-devjaime-Documents-orienta-ai/tasks/*.output
```
