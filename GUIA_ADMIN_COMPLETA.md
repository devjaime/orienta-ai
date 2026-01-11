# 👑 Guía Completa del Administrador - OrientaIA

## 🚀 INICIO RÁPIDO

### 1. Arreglar Recursión Infinita (URGENTE)

Si ves el error `infinite recursion detected`, ejecuta INMEDIATAMENTE:

**En Supabase SQL Editor:**
```
scripts/fix-rls-with-admin-powers.sql
```

Luego:
1. Recarga la app con `Ctrl+Shift+R`
2. Cierra sesión
3. Vuelve a iniciar sesión

---

## 🎯 Flujo de Trabajo del Administrador

### Paso 1: Configurarte como Admin

```sql
-- En Supabase SQL Editor
-- Reemplaza TU-EMAIL con tu email de Google

UPDATE user_profiles
SET role = 'admin', status = 'active', approved_at = NOW()
WHERE user_email = 'TU-EMAIL@gmail.com';
```

### Paso 2: Crear Perfiles de Usuarios

Tienes dos opciones:

#### Opción A: Desde SQL (Recomendado para empezar)

```sql
-- Crear un orientador
SELECT admin_create_user_profile(
  p_email := 'orientador@gmail.com',
  p_nombre := 'Dr. Juan Pérez',
  p_role := 'orientador',
  p_edad := 35,
  p_genero := 'Hombre',
  p_telefono := '+56912345678'
);

-- Crear un apoderado
SELECT admin_create_user_profile(
  p_email := 'apoderado@gmail.com',
  p_nombre := 'María González',
  p_role := 'apoderado',
  p_edad := 40,
  p_genero := 'Mujer',
  p_telefono := '+56987654321'
);

-- Crear un estudiante
SELECT admin_create_user_profile(
  p_email := 'estudiante@gmail.com',
  p_nombre := 'Pedro López',
  p_role := 'estudiante',
  p_edad := 16,
  p_genero := 'Hombre',
  p_telefono := '+56911111111'
);
```

#### Opción B: Desde JavaScript (para UI futura)

```javascript
import { createUserProfile } from '../lib/adminService';

// Crear orientador
await createUserProfile(
  'orientador@gmail.com',
  'Dr. Juan Pérez',
  'orientador',
  35,
  'Hombre',
  '+56912345678'
);

// Crear apoderado
await createUserProfile(
  'apoderado@gmail.com',
  'María González',
  'apoderado',
  40,
  'Mujer',
  '+56987654321'
);

// Crear estudiante
await createUserProfile(
  'estudiante@gmail.com',
  'Pedro López',
  'estudiante',
  16,
  'Hombre'
);
```

---

## 📋 Gestión de Usuarios

### Ver Todos los Usuarios

```sql
SELECT
  user_email,
  nombre,
  role,
  status,
  telefono,
  created_at
FROM user_profiles
ORDER BY created_at DESC;
```

### Ver Usuarios Pendientes

```sql
SELECT * FROM get_pending_users();
```

### Aprobar un Usuario Pendiente

```javascript
import { approveUser } from '../lib/adminService';
import { getCurrentUser } from '../lib/supabase';

const admin = await getCurrentUser();

await approveUser(
  'user-id-uuid',      // UUID del usuario
  'orientador',        // Rol a asignar
  admin.id,           // Tu UUID de admin
  'Aprobado por reunir requisitos'  // Notas opcionales
);
```

O desde SQL:
```sql
SELECT approve_user_with_role(
  p_user_id := 'user-id-uuid',
  p_role := 'orientador',
  p_admin_id := 'tu-admin-id-uuid',
  p_notes := 'Aprobado'
);
```

### Rechazar un Usuario

```javascript
import { rejectUser } from '../lib/adminService';
import { getCurrentUser } from '../lib/supabase';

const admin = await getCurrentUser();

await rejectUser(
  'user-id-uuid',
  admin.id,
  'No cumple con los requisitos de certificación'
);
```

### Cambiar Estado de Usuario

```javascript
import { changeUserStatus } from '../lib/adminService';
import { getCurrentUser } from '../lib/supabase';

const admin = await getCurrentUser();

// Activar usuario
await changeUserStatus('user-id-uuid', admin.id, 'active', 'Usuario verificado');

// Suspender usuario
await changeUserStatus('user-id-uuid', admin.id, 'suspended', 'Comportamiento inapropiado');

// Desactivar usuario
await changeUserStatus('user-id-uuid', admin.id, 'inactive', 'Solicitó baja temporal');
```

### Cambiar Rol de Usuario

```javascript
import { changeUserRole } from '../lib/adminService';
import { getCurrentUser } from '../lib/supabase';

const admin = await getCurrentUser();

await changeUserRole(
  'user-id-uuid',
  admin.id,
  'admin',  // Nuevo rol
  'Promoción a administrador'
);
```

---

## 👨‍👩‍👧 Gestión de Apoderados y Estudiantes

### Límite de Estudiantes por Apoderado

- **Máximo: 5 estudiantes por apoderado**
- El sistema verifica automáticamente con un trigger
- Si se intenta vincular más de 5, sale error

### Ver Vínculos Apoderado-Estudiante

```sql
SELECT
  p.user_email as apoderado_email,
  p.nombre as apoderado_nombre,
  s.user_email as estudiante_email,
  s.nombre as estudiante_nombre,
  psl.relationship_type,
  psl.status,
  psl.created_at
FROM parent_student_links psl
JOIN user_profiles p ON psl.parent_id = p.user_id
JOIN user_profiles s ON psl.student_id = s.user_id
ORDER BY p.nombre, psl.created_at;
```

### Contar Estudiantes por Apoderado

```sql
SELECT
  p.user_email as apoderado,
  p.nombre,
  COUNT(*) as total_estudiantes
FROM parent_student_links psl
JOIN user_profiles p ON psl.parent_id = p.user_id
WHERE psl.status = 'accepted'
GROUP BY p.user_id, p.user_email, p.nombre
ORDER BY total_estudiantes DESC;
```

### Forzar Desvinculación (si excede límite)

```sql
-- Eliminar vínculo específico
DELETE FROM parent_student_links
WHERE id = 'link-id-uuid';

-- O bloquear vínculo sin eliminar
UPDATE parent_student_links
SET status = 'blocked'
WHERE id = 'link-id-uuid';
```

---

## 📊 Estadísticas y Reportes

### Estadísticas Generales

```javascript
import { getUserStats } from '../lib/adminService';

const stats = await getUserStats();
console.log(stats);
// {
//   total: 150,
//   by_role: {
//     estudiante: 100,
//     apoderado: 30,
//     orientador: 15,
//     admin: 5
//   },
//   by_status: {
//     active: 120,
//     pending: 25,
//     inactive: 3,
//     suspended: 2,
//     rejected: 0
//   },
//   pending_approval: 25,
//   recent_registrations: 12
// }
```

### Ver Vista Completa de Gestión

```sql
SELECT * FROM admin_users_management
ORDER BY created_at DESC
LIMIT 50;
```

Esta vista incluye:
- Datos del usuario
- Rol y estado
- Quién lo aprobó
- Estadísticas (tests, sesiones, última actividad)

---

## 🔧 Comandos Útiles de Administración

### Ver Políticas RLS Actuales

```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'user_profiles';
```

Deberías ver:
- `rls_select_profiles` (SELECT)
- `rls_insert_profiles` (INSERT)
- `rls_update_profiles` (UPDATE)
- `rls_delete_profiles` (DELETE)

### Verificar Funciones Helper

```sql
-- Verificar si estás reconocido como admin
SELECT public.is_admin();  -- Debe retornar true

-- Ver todos los admins activos
SELECT user_email, nombre
FROM user_profiles
WHERE role = 'admin' AND status = 'active';
```

### Limpiar Usuarios Rechazados Antiguos

```sql
-- Ver usuarios rechazados hace más de 30 días
SELECT user_email, nombre, rejection_reason, approved_at
FROM user_profiles
WHERE status = 'rejected'
AND approved_at < NOW() - INTERVAL '30 days';

-- Eliminarlos (CUIDADO: irreversible)
DELETE FROM user_profiles
WHERE status = 'rejected'
AND approved_at < NOW() - INTERVAL '30 days';
```

---

## 🛠️ Solución de Problemas

### Error: "No tienes permisos de administrador"

```sql
-- Verificar tu rol y estado
SELECT role, status FROM user_profiles WHERE user_email = 'TU-EMAIL@gmail.com';

-- Si no es admin/active, corregir:
UPDATE user_profiles
SET role = 'admin', status = 'active', approved_at = NOW()
WHERE user_email = 'TU-EMAIL@gmail.com';
```

### Error: "El usuario con email X no existe"

El usuario debe registrarse PRIMERO con Google en la app.
Luego el admin puede crear su perfil.

**Solución:**
1. Pide al usuario que vaya a la landing page
2. Que haga clic en "Seleccionar perfil" (cualquiera)
3. Que inicie sesión con Google
4. Eso lo crea en `auth.users`
5. AHORA tú puedes crear su perfil con `admin_create_user_profile()`

### Error: "Ya tiene un perfil creado"

Si el usuario ya tiene perfil, en lugar de crear uno nuevo, actualízalo:

```sql
UPDATE user_profiles
SET
  nombre = 'Nuevo Nombre',
  role = 'orientador',
  status = 'active',
  telefono = '+56912345678'
WHERE user_email = 'usuario@gmail.com';
```

### Error: "Recursión infinita" (otra vez)

```sql
-- Volver a ejecutar el script de corrección
-- Ver: scripts/fix-rls-with-admin-powers.sql
```

---

## 📱 Flujo Completo de Ejemplo

### Caso: Agregar un nuevo orientador

1. **El orientador se registra:**
   - Va a la landing page
   - Selecciona perfil "Orientador"
   - Inicia sesión con Google
   - Ve pantalla "Solicitud Pendiente"

2. **Tú como admin apruebas:**

**Opción A:** Desde SQL
```sql
-- Ver usuarios pendientes
SELECT * FROM get_pending_users();

-- Aprobar al orientador
SELECT approve_user_with_role(
  p_user_id := 'uuid-del-orientador',
  p_role := 'orientador',
  p_admin_id := 'tu-uuid',
  p_notes := 'Certificación verificada'
);
```

**Opción B:** Desde AdminDashboard (UI futura)
- Ve a `/admin`
- Sección "Usuarios Pendientes"
- Clic en "Aprobar"
- Selecciona rol "Orientador"
- Confirmar

3. **El orientador recibe acceso:**
   - Vuelve a iniciar sesión
   - Es redirigido a `/orientador/dashboard`
   - Puede configurar su disponibilidad

---

### Caso: Apoderado vincula 3 estudiantes

1. **Apoderado se registra:**
   - Selecciona perfil "Apoderado"
   - Google login
   - Solicitud pendiente

2. **Admin aprueba:**
```sql
SELECT approve_user_with_role(
  p_user_id := 'uuid-apoderado',
  p_role := 'apoderado',
  p_admin_id := 'tu-uuid',
  p_notes := 'Apoderado verificado'
);
```

3. **Apoderado vincula estudiantes:**
   - Va a `/parent`
   - Clic "Vincular Estudiante"
   - Ingresa email del hijo: `hijo1@gmail.com`
   - Repite para `hijo2@gmail.com` y `hijo3@gmail.com`

4. **Estudiantes aceptan:**
   - Cada estudiante recibe solicitud
   - La aceptan desde su dashboard

5. **Límite automático:**
   - Apoderado puede vincular hasta 2 estudiantes más (total máx: 5)
   - Si intenta vincular el 6to, el sistema rechaza automáticamente

---

## 🎓 Roles y Capacidades

| Rol | Puede hacer test | Aprobación | Límite de estudiantes | Rutas |
|-----|-----------------|------------|----------------------|-------|
| **Admin** | ❌ | Auto-aprobado | N/A | `/admin` + **TODAS las rutas** ✨ |
| **Orientador** | ❌ | Requiere admin | N/A | `/orientador/*` |
| **Apoderado** | ❌ | Requiere admin | Máx 5 estudiantes | `/parent` |
| **Estudiante** | ✅ | Auto-aprobado | N/A | `/dashboard`, `/test` |

### 🎭 Acceso Especial del Admin

Como administrador, tienes **acceso completo a TODAS las vistas** para hacer demos y pruebas:

- ✅ Puedes entrar a `/dashboard` (vista estudiante)
- ✅ Puedes entrar a `/parent` (vista apoderado)
- ✅ Puedes entrar a `/orientador/dashboard` (vista orientador)
- ✅ Puedes entrar a `/admin` (tu panel)

**En el Panel Admin verás un selector "Vista Demo"** con botones para cambiar rápidamente entre roles.

---

## ✅ Checklist del Administrador

Tareas diarias:
- [ ] Revisar usuarios pendientes: `SELECT * FROM get_pending_users();`
- [ ] Aprobar/rechazar solicit udes
- [ ] Verificar límites de apoderados
- [ ] Revisar usuarios suspendidos/inactivos
- [ ] Monitorear actividad reciente

Tareas semanales:
- [ ] Estadísticas generales: `SELECT * FROM get_user_stats();`
- [ ] Limpiar usuarios rechazados antiguos
- [ ] Verificar orientadores activos
- [ ] Revisar vínculos apoderado-estudiante

---

## 🆘 Soporte

Si encuentras problemas:

1. **Revisa las guías:**
   - `SETUP_ADMIN_GUIDE.md` - Setup inicial
   - `SOLUCION_ACCESO_DENEGADO.md` - Problemas de acceso
   - `GUIA_ADMIN_COMPLETA.md` - Esta guía

2. **Scripts de diagnóstico:**
   - `scripts/diagnose-user-access.sql`
   - `scripts/fix-rls-with-admin-powers.sql`

3. **Verifica:**
   - Políticas RLS correctas
   - Funciones helper funcionando
   - Tu rol es 'admin' y status 'active'

---

¡Éxito con la administración de OrientaIA! 🎉
