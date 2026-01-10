# ❌ SOLUCIÓN: "Acceso Denegado - No se encontró el perfil"

## 🎯 Problema
Inicias sesión con Google pero la aplicación dice "Acceso Denegado" aunque tu usuario tiene rol asignado.

## 🔍 Causa
Las **políticas RLS (Row Level Security)** de Supabase están bloqueando el acceso a tu perfil, o hay políticas duplicadas/conflictivas.

---

## ✅ SOLUCIÓN PASO A PASO

### PASO 1: Diagnosticar el problema

En **Supabase Dashboard → SQL Editor**, ejecuta:

```sql
-- Ver el contenido del archivo: scripts/diagnose-user-access.sql
```

O copia y pega todo el contenido de `scripts/diagnose-user-access.sql`.

Esto te mostrará:
- ✅ Si tu usuario tiene perfil en `user_profiles`
- ✅ Si tu rol es `admin` y status es `active`
- ✅ Si las políticas RLS están correctas
- ✅ Recomendaciones específicas para tu caso

---

### PASO 2: Arreglar las políticas RLS

En **Supabase Dashboard → SQL Editor**, ejecuta:

```sql
-- Ver el contenido del archivo: scripts/fix-rls-policies.sql
```

O copia y pega todo el contenido de `scripts/fix-rls-policies.sql`.

Este script:
1. ✅ Elimina TODAS las políticas antiguas (incluyendo duplicadas)
2. ✅ Crea políticas nuevas y correctas
3. ✅ Permite que los usuarios vean su propio perfil
4. ✅ Permite que admins/orientadores vean todos los perfiles

---

### PASO 3: Limpiar sesión y caché

1. **Cierra sesión** en la aplicación
2. **Borra el caché del navegador**:
   - Chrome/Edge: `Ctrl+Shift+Delete` → Selecciona "Cookies" y "Caché" → "Borrar datos"
   - Firefox: `Ctrl+Shift+Delete` → Selecciona "Cookies" y "Caché" → "Limpiar ahora"
3. **Cierra el navegador** completamente
4. **Abre el navegador** de nuevo
5. **Inicia sesión** otra vez con Google

---

### PASO 4: Verificar que funciona

Después de iniciar sesión:

- ✅ **Estudiante** → Debe ir a `/dashboard`
- ✅ **Apoderado** → Debe ir a `/parent`
- ✅ **Orientador** → Debe ir a `/orientador/dashboard`
- ✅ **Admin** → Debe ir a `/admin`

Si aún dice "Acceso Denegado", continúa con PASO 5.

---

### PASO 5: Verificar o crear tu perfil de admin

En **Supabase Dashboard → SQL Editor**, ejecuta:

```sql
-- OPCIÓN A: Ver si tu perfil existe
SELECT
  au.email,
  up.nombre,
  up.role,
  up.status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
WHERE au.email = 'TU-EMAIL@gmail.com'; -- CAMBIA ESTO POR TU EMAIL

-- Si el resultado muestra:
-- - nombre: NULL → Tu perfil NO existe (ve a OPCIÓN B)
-- - role: NULL → Tienes perfil pero sin rol (ve a OPCIÓN C)
-- - status: pending → Tienes perfil pero no está activo (ve a OPCIÓN D)
-- - role: admin y status: active → Tu perfil está CORRECTO (el problema es otro)
```

#### OPCIÓN B: Si tu perfil NO existe

```sql
DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'TU-EMAIL@gmail.com'; -- CAMBIA ESTO
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  INSERT INTO user_profiles (
    user_id, user_email, nombre, role, status,
    edad, genero, motivaciones, approved_at
  )
  VALUES (
    v_user_id, v_email, 'Administrador', 'admin', 'active',
    30, 'Prefiero no decir', 'Administrador del sistema', NOW()
  );

  RAISE NOTICE '✅ Perfil de ADMIN creado para: %', v_email;
END $$;
```

#### OPCIÓN C: Si tienes perfil pero sin rol

```sql
UPDATE user_profiles
SET
  role = 'admin',
  status = 'active',
  approved_at = NOW()
WHERE user_email = 'TU-EMAIL@gmail.com'; -- CAMBIA ESTO
```

#### OPCIÓN D: Si tienes perfil con rol pero status != active

```sql
UPDATE user_profiles
SET status = 'active', approved_at = NOW()
WHERE user_email = 'TU-EMAIL@gmail.com'; -- CAMBIA ESTO
```

---

### PASO 6: Volver a limpiar sesión

Después de CUALQUIER cambio en la base de datos:

1. Cierra sesión en la app
2. Borra caché del navegador
3. Cierra el navegador
4. Vuelve a iniciar sesión

---

## 🔍 Verificaciones Adicionales

### Si aún no funciona, verifica:

#### 1. ¿Estás usando el email correcto?

```sql
-- Ver TODOS los usuarios registrados
SELECT email, created_at FROM auth.users ORDER BY created_at;
```

#### 2. ¿Las políticas RLS están correctas?

```sql
-- Ver políticas actuales
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'user_profiles';

-- Deberías ver:
-- users_select_own_profile (SELECT)
-- users_insert_own_profile (INSERT)
-- users_update_own_profile (UPDATE)
-- admins_delete_profiles (DELETE)
```

#### 3. ¿RLS está habilitado?

```sql
-- Verificar que RLS esté habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'user_profiles';

-- rowsecurity debe ser: true
```

---

## 📋 Checklist Final

Antes de decir "aún no funciona", verifica:

- [ ] Ejecuté `diagnose-user-access.sql` y revisé el resultado
- [ ] Ejecuté `fix-rls-policies.sql` completamente
- [ ] Verifiqué que mi perfil existe en `user_profiles` con el query de PASO 5
- [ ] Mi perfil tiene `role = 'admin'` y `status = 'active'`
- [ ] Cerré sesión en la aplicación
- [ ] Borré el caché del navegador (cookies + caché)
- [ ] Cerré el navegador completamente
- [ ] Abrí el navegador de nuevo
- [ ] Inicié sesión con Google usando el MISMO email que está en la base de datos

---

## 🆘 Si TODO lo anterior falló

Si después de seguir TODOS los pasos aún no funciona, el problema puede ser:

### Problema en el código de ProtectedRoute

Revisa la consola del navegador (F12 → Console) y busca:
- Errores de "unauthorized" o "permission denied"
- Errores de "user profile not found"
- Errores de Supabase RLS

### Solución temporal: Deshabilitar RLS (SOLO PARA DESARROLLO)

```sql
-- ⚠️ SOLO PARA DESARROLLO - NO USES EN PRODUCCIÓN
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
```

Esto deshabilitará la seguridad temporalmente para que puedas acceder. Una vez que accedas:

1. Verifica en la app que todo funciona
2. Vuelve a habilitar RLS:
```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
```
3. Sigue los pasos para arreglar las políticas correctamente

---

## 📞 Información de Debug

Si necesitas ayuda, provee esta información:

```sql
-- Ejecuta esto y copia el resultado
SELECT
  'Usuario' as tipo,
  au.email,
  up.nombre,
  up.role,
  up.status,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'user_profiles') as num_policies,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'user_profiles') as rls_enabled
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
WHERE au.email = 'TU-EMAIL@gmail.com';
```

---

## ✅ Confirmación de Éxito

Sabrás que funciona cuando:

1. ✅ Inicias sesión con Google
2. ✅ NO ves el mensaje "Acceso Denegado"
3. ✅ Eres redirigido a `/admin` (si eres admin)
4. ✅ Ves el panel de administración con usuarios pendientes

¡Éxito! 🎉
