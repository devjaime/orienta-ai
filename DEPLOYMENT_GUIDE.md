# 🚀 Guía de Despliegue - OrientaAI

## ✅ Estado Actual

Todas las funcionalidades han sido implementadas exitosamente:

- ✅ Proyecciones en página de Resultados
- ✅ Comparador de carreras
- ✅ Alertas de saturación en test
- ✅ Infraestructura para datos históricos
- ✅ Sistema de auditoría para apoderados
- ✅ Archivos de datos generados y copiados a `/public/data/processed/`

## 📋 Pasos de Despliegue

### Paso 1: Desplegar Schema de Base de Datos ⚠️ REQUERIDO

El sistema de auditoría para apoderados requiere nuevas tablas en Supabase.

**Instrucciones:**

1. Abrir [Supabase Dashboard](https://app.supabase.com)
2. Seleccionar tu proyecto OrientaAI
3. Ir a **SQL Editor** (icono de base de datos en el menú lateral)
4. Click en **"New Query"**
5. Copiar **TODO** el contenido del archivo `scripts/create-audit-tables.sql`
6. Pegar en el editor SQL
7. Click en **"Run"** (o presionar `Ctrl/Cmd + Enter`)
8. Verificar que aparezca el mensaje: **"Sistema de auditoría creado exitosamente"**

**Tablas que se crearán:**
- `parent_student_relationships` - Relaciones apoderado-estudiante
- `audit_log` - Registro de actividades
- `user_sessions` - Sesiones de usuario
- `parent_notifications` - Notificaciones para apoderados

**Políticas RLS que se crearán:**
- Usuarios solo ven sus propios logs
- Apoderados solo ven logs de hijos aceptados
- Protección de privacidad completa

### Paso 2: Verificar Instalación de Dependencias

```bash
npm install
```

Asegúrate de que todas las dependencias estén instaladas:
- `recharts` - Gráficos
- `framer-motion` - Animaciones
- `lucide-react` - Iconos
- `@supabase/supabase-js` - Cliente de Supabase

### Paso 3: Iniciar Servidor de Desarrollo

```bash
npm run dev
```

El servidor debería iniciar en `http://localhost:5173`

### Paso 4: Probar las Nuevas Funcionalidades

#### 4.1 Proyecciones en Resultados
1. Ir a `http://localhost:5173/test`
2. Completar el test vocacional
3. En la página de resultados, verificar que aparezcan:
   - Tarjetas de proyección para las carreras recomendadas
   - Gráficos de crecimiento
   - Índices de oportunidad
   - Alertas de saturación

#### 4.2 Comparador de Carreras
1. Ir a `http://localhost:5173/dashboard`
2. Buscar en la sección "Comparador de Carreras"
3. Agregar 2-3 carreras
4. Verificar que aparezca:
   - Gráfico de líneas con proyecciones
   - Tabla comparativa
   - Conclusiones automáticas

#### 4.3 Alertas de Saturación
1. Ir a `http://localhost:5173/test`
2. Responder preguntas orientadas a perfiles SAE (Social-Artístico-Emprendedor)
3. Al llegar a la pregunta 15/30, debería aparecer:
   - Alerta de saturación si aplica
   - Información sobre carreras saturadas
   - Opción para descartar la alerta

#### 4.4 Dashboard de Apoderados
1. Crear dos usuarios de prueba en Supabase Auth
2. Ir a `http://localhost:5173/parent` (usuario 1 = apoderado)
3. Click en "Vincular Estudiante"
4. Ingresar email del usuario 2 (estudiante)
5. Iniciar sesión con usuario 2
6. Aceptar solicitud de vinculación (implementar UI si no existe)
7. Volver a usuario 1
8. Verificar que aparezca:
   - Estudiante en lista de "Mis Hijos"
   - Estadísticas de actividad
   - Log de actividad detallado
   - Notificaciones

## 🔧 Configuración Adicional

### Variables de Entorno

Verificar que `.env` contenga:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

### Perfiles de Usuario

Para que el sistema funcione correctamente, los usuarios deben tener un perfil en la tabla `user_profiles` con el campo `email`.

**Verificar en Supabase:**

```sql
SELECT * FROM user_profiles LIMIT 5;
```

Si no existe la tabla o está vacía, crear perfiles básicos:

```sql
-- Ejemplo: crear perfil para usuario existente
INSERT INTO user_profiles (user_id, email, role)
SELECT id, email, 'estudiante'
FROM auth.users
WHERE email = 'estudiante@example.com';
```

## 📊 Datos y Analytics

### Regenerar Datos (Opcional)

Si necesitas actualizar los análisis y proyecciones:

```bash
npm run analytics-full
```

Esto ejecutará:
1. `analyze-trends` - Análisis de tendencias actuales
2. `project-future` - Proyecciones a 5 años
3. `analyze-riasec` - Análisis vocacional RIASEC

Los archivos se generarán en `data/processed/` y deben copiarse a `public/data/processed/`:

```bash
cp data/processed/*.json public/data/processed/
```

## 🐛 Solución de Problemas

### Error: "Cannot read properties of undefined (reading 'proyecciones')"

**Causa:** El archivo `future-projections.json` no está cargado

**Solución:**
```bash
# Verificar que el archivo existe
ls -lh public/data/processed/future-projections.json

# Si no existe, copiarlo
cp data/processed/future-projections.json public/data/processed/
```

### Error: "relation 'parent_student_relationships' does not exist"

**Causa:** Las tablas de auditoría no están creadas en Supabase

**Solución:** Ejecutar `scripts/create-audit-tables.sql` en Supabase SQL Editor

### Las alertas de saturación no aparecen

**Causa:** El código RIASEC parcial no coincide con carreras configuradas

**Solución:** Verificar en `src/lib/saturationChecker.js` que los mappings RIASEC incluyan el perfil del test

### Dashboard de apoderados vacío

**Causa:** No hay relaciones aceptadas entre apoderado y estudiante

**Solución:**
1. Crear solicitud de vinculación desde dashboard de apoderado
2. El estudiante debe aceptar la solicitud
3. Verificar RLS policies en Supabase

## 🚦 Checklist de Despliegue

- [ ] SQL schema ejecutado en Supabase ⚠️ CRÍTICO
- [ ] Verificar que las 4 tablas fueron creadas
- [ ] Verificar que los triggers están activos
- [ ] Verificar que las políticas RLS están habilitadas
- [ ] Dependencias instaladas (`npm install`)
- [ ] Archivos de datos en `public/data/processed/`
- [ ] Variables de entorno configuradas
- [ ] Servidor de desarrollo funcionando
- [ ] Test de proyecciones en resultados
- [ ] Test de comparador de carreras
- [ ] Test de alertas de saturación
- [ ] Test de dashboard de apoderados
- [ ] Crear usuarios de prueba para testing
- [ ] Probar flujo completo de vinculación

## 📞 Soporte

Si encuentras problemas:

1. Revisar logs del navegador (F12 > Console)
2. Revisar logs de Supabase (Dashboard > Logs)
3. Verificar que todas las tablas existen en Supabase
4. Confirmar que los archivos JSON están en `public/data/processed/`
5. Revisar la documentación en `NUEVAS_FUNCIONALIDADES.md`

## 🎉 Próximos Pasos Después del Despliegue

Una vez que todo esté funcionando:

1. **Testing con Usuarios Reales**
   - Invitar a estudiantes de prueba
   - Recopilar feedback sobre las proyecciones
   - Ajustar alertas de saturación según necesidad

2. **Monitoreo**
   - Revisar logs de auditoría regularmente
   - Monitorear errores en consola del navegador
   - Verificar rendimiento de queries en Supabase

3. **Optimizaciones**
   - Agregar índices adicionales si queries son lentas
   - Implementar caché para proyecciones
   - Optimizar carga de gráficos

4. **Nuevas Funcionalidades**
   - Exportar reportes PDF
   - Notificaciones push para apoderados
   - Dashboard de orientador
   - Integración con Calendly

---

**¡OrientaAI está listo para desplegar!** 🚀

Si tienes alguna pregunta, revisa la documentación completa en `NUEVAS_FUNCIONALIDADES.md`
