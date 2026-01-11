# ⚠️ EJECUTAR SCRIPTS SQL - INSTRUCCIONES PASO A PASO

## 🔴 ERRORES ACTUALES QUE TIENES:
- ❌ `Error: function public.is_admin() does not exist`
- ❌ `Error: Could not find the function public.admin_create_user_profile`

## ✅ SOLUCIÓN: Ejecutar los 3 scripts SQL en Supabase

---

## 📝 PASO 1: Abrir Supabase SQL Editor

1. Abre tu navegador
2. Ve a: https://supabase.com/dashboard
3. Inicia sesión si es necesario
4. Selecciona el proyecto **orienta-ai**
5. En el menú lateral izquierdo, busca y haz clic en **"SQL Editor"**
6. Verás un editor de texto grande donde puedes escribir SQL

---

## 📝 PASO 2: Ejecutar Script 1 - Arreglar RLS y crear funciones admin

1. Abre el archivo: `scripts/fix-rls-with-admin-powers.sql`
2. Copia TODO el contenido del archivo (Ctrl+A, Ctrl+C)
3. Pega el contenido en el SQL Editor de Supabase
4. Haz clic en el botón **"Run"** (Ejecutar) en la esquina inferior derecha
5. Espera a que termine (verás mensajes de éxito en verde)
6. Si ves errores en rojo, cópialos y envíamelos

**¿Qué hace este script?**
- Crea la función `is_admin()` que falta
- Crea la función `is_orientador()`
- Arregla las políticas RLS para evitar recursión infinita

---

## 📝 PASO 3: Ejecutar Script 2 - Permitir crear perfiles antes de registro

1. **LIMPIA el SQL Editor** (borra todo el texto anterior)
2. Abre el archivo: `scripts/allow-profile-before-auth.sql`
3. Copia TODO el contenido del archivo
4. Pega el contenido en el SQL Editor de Supabase
5. Haz clic en **"Run"** (Ejecutar)
6. Espera a que termine

**¿Qué hace este script?**
- Crea la función `admin_create_user_profile()` que falta
- Permite que user_id sea NULL temporalmente
- Crea función para vincular automáticamente perfiles cuando el usuario se registra

---

## 📝 PASO 4: Ejecutar Script 3 - Desactivación y acceso temporal

1. **LIMPIA el SQL Editor** (borra todo el texto anterior)
2. Abre el archivo: `scripts/add-user-deactivation-and-expiration.sql`
3. Copia TODO el contenido del archivo
4. Pega el contenido en el SQL Editor de Supabase
5. Haz clic en **"Run"** (Ejecutar)
6. Espera a que termine

**¿Qué hace este script?**
- Crea función `admin_deactivate_user()` - desactivar usuarios
- Crea función `admin_grant_temporary_access()` - acceso temporal (10/15/30 días)
- Crea función `admin_reactivate_user()` - reactivar usuarios
- Crea función `admin_delete_user()` - eliminar permanentemente
- Agrega columna `expires_at` para controlar expiración

---

## 📝 PASO 5: Hacerte Administrador

1. **LIMPIA el SQL Editor**
2. Copia y pega este código (REEMPLAZA EL EMAIL):

```sql
UPDATE user_profiles
SET role = 'admin', status = 'active', approved_at = NOW()
WHERE user_email = 'TU-EMAIL-DE-GOOGLE@gmail.com';
```

3. **IMPORTANTE:** Reemplaza `TU-EMAIL-DE-GOOGLE@gmail.com` con tu email real
4. Haz clic en **"Run"**
5. Deberías ver: `UPDATE 1` (significa que se actualizó 1 registro)

---

## 📝 PASO 6: Refrescar la Aplicación

1. Vuelve a la aplicación en el navegador (localhost:5173)
2. Presiona **Ctrl+Shift+R** (o **Cmd+Shift+R** en Mac) para recargar completamente
3. Si estás logueado, **cierra sesión**
4. **Vuelve a iniciar sesión** con Google

---

## ✅ VERIFICAR QUE FUNCIONÓ

Después de hacer todos los pasos, deberías poder:

1. ✅ Entrar a `/admin` sin error de "acceso denegado"
2. ✅ Ver el botón "Crear Nuevo Usuario"
3. ✅ Crear perfiles sin error de "function does not exist"
4. ✅ Ver todos los usuarios en la tabla
5. ✅ **NUEVO:** Acceder a TODAS las vistas (Estudiante, Apoderado, Orientador) desde el botón "Vista Demo"
6. ✅ **NUEVO:** Navegar libremente entre todos los dashboards para hacer demos

---

## 🆘 SI ALGO SALE MAL

Si ves errores al ejecutar algún script, **NO CONTINÚES**:

1. Copia el mensaje de error completo
2. Hazme una captura de pantalla
3. Envíamelo para ayudarte a solucionarlo

---

## 📊 DESPUÉS DE EJECUTAR TODO

Una vez que hayas ejecutado todos los scripts y te hayas hecho admin, podrás:

- ✅ Crear perfiles de usuarios (orientador, apoderado, estudiante, admin)
- ✅ Desactivar usuarios
- ✅ Dar acceso temporal (10, 15 o 30 días)
- ✅ Reactivar usuarios
- ✅ Eliminar usuarios permanentemente
- ✅ Ver todos los usuarios en el admin dashboard

---

## 🎯 ORDEN CORRECTO (RESUMEN):

```
1. scripts/fix-rls-with-admin-powers.sql
2. scripts/allow-profile-before-auth.sql
3. scripts/add-user-deactivation-and-expiration.sql
4. UPDATE user_profiles SET role = 'admin'... (hacerte admin)
5. Refrescar app (Ctrl+Shift+R)
6. Cerrar sesión
7. Iniciar sesión de nuevo
```

---

¡Sigue estos pasos EN ORDEN y todo debería funcionar! 🚀
