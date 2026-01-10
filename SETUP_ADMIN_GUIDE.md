# Guía Rápida: Configurar Primer Administrador

## 🚨 Problema: "Acceso Denegado - No se encontró el perfil"

Esto ocurre porque iniciaste sesión con Google, pero tu cuenta no tiene un perfil en la tabla `user_profiles`.

---

## ✅ Solución: Crear tu Perfil de Administrador

### Opción 1: Script Automático (Recomendado)

1. **Ve a Supabase Dashboard**
   - Abre tu proyecto en https://supabase.com
   - Ve a **SQL Editor** (menú izquierdo)

2. **Ejecuta este query:**

```sql
-- PASO 1: Ver tu email registrado
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at ASC;
```

Copia tu email de la lista.

3. **Ejecuta este query** (reemplaza TU-EMAIL con el que copiaste):

```sql
DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'TU-EMAIL@gmail.com'; -- CAMBIA ESTO
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró usuario con email: %', v_email;
  END IF;

  INSERT INTO user_profiles (
    user_id,
    user_email,
    nombre,
    role,
    status,
    edad,
    genero,
    motivaciones,
    approved_at
  )
  VALUES (
    v_user_id,
    v_email,
    'Administrador',
    'admin',
    'active',
    30,
    'Prefiero no decir',
    'Administrador del sistema OrientaIA',
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    role = 'admin',
    status = 'active',
    approved_at = NOW();

  RAISE NOTICE '✅ Usuario % es ahora ADMIN', v_email;
END $$;
```

4. **Recarga la aplicación** y vuelve a iniciar sesión

---

### Opción 2: Usar Script Preparado

1. En **Supabase SQL Editor**, ejecuta el contenido de:
   ```
   scripts/list-users-and-create-admin.sql
   ```

2. Sigue las instrucciones del script

---

## 🎯 Verificar que Funciona

Después de ejecutar el script:

1. **Cierra sesión** en la aplicación
2. **Vuelve a iniciar sesión** con Google
3. Deberías ser redirigido automáticamente a `/admin`

Si ves el panel de administrador: **¡Éxito! 🎉**

---

## 📋 Flujo Completo del Sistema

### 1️⃣ ESTUDIANTE (Auto-aprobado)

```
Usuario → Selecciona "Estudiante" → Google Login → Completa Perfil
                                                    ↓
                                              [Auto-aprobado]
                                                    ↓
                                              /dashboard
                                                    ↓
                                              Hace Test RIASEC
                                                    ↓
                                              Ve resultados
```

**Funcionalidades:**
- ✅ Hacer test vocacional RIASEC
- ✅ Ver resultados y recomendaciones
- ✅ Agendar sesiones con orientador
- ✅ Chat IA para orientación

**Rutas:**
- `/dashboard` - Dashboard del estudiante
- `/test` - Test vocacional (SOLO estudiantes)
- `/resultados` - Resultados del test

---

### 2️⃣ APODERADO (Requiere aprobación)

```
Usuario → Selecciona "Apoderado" → Google Login → Completa Perfil
                                                    ↓
                                              [Estado: pending]
                                                    ↓
                                    Admin aprueba en /admin
                                                    ↓
                                          [Estado: active]
                                                    ↓
                                              /parent
                                                    ↓
                                    Vincula estudiantes (hijos)
                                                    ↓
                                    Ve tests y sesiones
```

**Funcionalidades:**
- ✅ Vincular estudiantes (hijos) por email
- ✅ Ver resultados de tests de sus hijos
- ✅ Seguimiento de sesiones con orientador
- ✅ Acceso a resúmenes IA del orientador
- ❌ NO puede hacer tests

**Rutas:**
- `/parent` - Dashboard del apoderado

**Base de datos:**
- Tabla: `parent_student_links`
- Servicio: `src/lib/parentService.js`

---

### 3️⃣ ORIENTADOR (Requiere aprobación)

```
Usuario → Selecciona "Orientador" → Google Login → Completa Perfil
                                                    ↓
                                              [Estado: pending]
                                                    ↓
                                    Admin aprueba en /admin
                                                    ↓
                                          [Estado: active]
                                                    ↓
                                        /orientador/dashboard
                                                    ↓
                        Configura disponibilidad horaria
                                                    ↓
                            Sistema asigna estudiantes
                                                    ↓
                        Realiza sesiones y toma notas
                                                    ↓
                                IA genera resúmenes
```

**Funcionalidades:**
- ✅ Dashboard con estudiantes asignados
- ✅ Gestión de disponibilidad horaria
- ✅ Sistema de asignación automática
- ✅ Notas de sesión con resumen IA
- ✅ Timeline de progreso de estudiantes
- ✅ Análisis de tests RIASEC
- ❌ NO puede hacer tests

**Rutas:**
- `/orientador` - Dashboard principal
- `/orientador/disponibilidad` - Configurar horarios
- `/orientador/estudiante/:id` - Perfil de estudiante
- `/orientador/notas/:sessionId` - Notas de sesión

**Base de datos:**
- Tabla: `orientador_availability`
- Tabla: `session_notes`
- Tabla: `student_orientador_assignments`
- Servicio: `src/lib/orientadorService.js`

---

### 4️⃣ ADMINISTRADOR (Configuración manual)

```
DBA → Ejecuta script SQL → Crea perfil admin
                                ↓
                          [Role: admin]
                          [Status: active]
                                ↓
                            /admin
                                ↓
                Gestiona usuarios pendientes
                                ↓
                    Aprueba/Rechaza
                                ↓
                Controla estados y roles
```

**Funcionalidades:**
- ✅ Ver usuarios pendientes de aprobación
- ✅ Aprobar/rechazar orientadores y apoderados
- ✅ Cambiar roles de usuarios
- ✅ Activar/desactivar/suspender usuarios
- ✅ Ver estadísticas globales
- ✅ Acceso a todos los dashboards
- ❌ NO puede hacer tests

**Rutas:**
- `/admin` - Panel de administración

**Servicios:**
- `src/lib/adminService.js`
  - `getPendingUsers()`
  - `approveUser(userId, role, adminId, notes)`
  - `rejectUser(userId, adminId, reason)`
  - `changeUserStatus(userId, adminId, newStatus, reason)`
  - `changeUserRole(userId, adminId, newRole, reason)`

---

## 🔒 Sistema de Seguridad

### Estados de Usuario

```
pending    → Esperando aprobación del admin
active     → Usuario aprobado y activo
inactive   → Usuario desactivado (puede reactivarse)
suspended  → Usuario suspendido (sanción)
rejected   → Solicitud rechazada
```

### Roles y Permisos

| Funcionalidad              | Estudiante | Apoderado | Orientador | Admin |
|---------------------------|------------|-----------|------------|-------|
| Hacer test RIASEC         | ✅         | ❌        | ❌         | ❌    |
| Ver propios resultados    | ✅         | ❌        | ❌         | ❌    |
| Vincular estudiantes      | ❌         | ✅        | ❌         | ❌    |
| Ver tests de hijos        | ❌         | ✅        | ❌         | ❌    |
| Configurar disponibilidad | ❌         | ❌        | ✅         | ❌    |
| Tomar notas de sesión     | ❌         | ❌        | ✅         | ✅    |
| Aprobar usuarios          | ❌         | ❌        | ❌         | ✅    |
| Cambiar roles             | ❌         | ❌        | ❌         | ✅    |

### Flujo de Aprobación

```
Estudiante:
  Registro → Auto-aprobado → Acceso inmediato ✅

Apoderado/Orientador:
  Registro → pending → Espera admin → Aprobado/Rechazado
```

---

## 🧪 Cómo Probar Todo el Sistema

### 1. Configurar Admin (TÚ)

```bash
# En Supabase SQL Editor
# Ejecuta el script para hacerte admin
# Ver scripts/list-users-and-create-admin.sql
```

### 2. Probar Flujo de Estudiante

1. Abre ventana de incógnito
2. Ve a la landing page
3. Selecciona perfil "Estudiante"
4. Inicia sesión con Google (usa otro email)
5. Completa el perfil
6. Verifica redirección a `/dashboard`
7. Haz el test RIASEC
8. Ve los resultados en `/resultados`

### 3. Probar Flujo de Orientador

1. Nueva ventana de incógnito
2. Selecciona perfil "Orientador"
3. Inicia sesión con Google (otro email diferente)
4. Completa el perfil
5. Verifica que te dice "Solicitud Pendiente"
6. Como ADMIN, ve a `/admin`
7. Aprueba al orientador
8. Vuelve a la cuenta del orientador
9. Verifica acceso a `/orientador/dashboard`
10. Configura disponibilidad en `/orientador/disponibilidad`

### 4. Probar Flujo de Apoderado

1. Nueva ventana de incógnito
2. Selecciona perfil "Apoderado"
3. Inicia sesión con Google
4. Completa el perfil
5. Solicitud pendiente
6. Como ADMIN, aprueba al apoderado
7. Vuelve a la cuenta del apoderado
8. Ve a `/parent`
9. Vincula al estudiante creado en paso 2 (por email)
10. El estudiante debe aceptar el vínculo
11. El apoderado puede ver tests y sesiones del estudiante

### 5. Probar Admin

Como admin, prueba:
- Ver usuarios pendientes
- Aprobar/rechazar usuarios
- Cambiar estados
- Cambiar roles
- Ver estadísticas

---

## 📊 Base de Datos

### Tablas Principales

```
auth.users              → Autenticación de Supabase
user_profiles           → Perfiles de usuarios
test_results            → Resultados de tests RIASEC
scheduled_sessions      → Sesiones agendadas

# Sistema Orientador
orientador_availability              → Horarios disponibles
session_notes                        → Notas de sesiones
student_orientador_assignments       → Asignaciones
orientador_workload_stats           → Estadísticas

# Sistema Apoderados
parent_student_links                → Vínculos padre-hijo

# Auditoría
audit_log                           → Registro de eventos
```

### Vistas

```
admin_users_management       → Vista completa para admins
parent_dashboard_summary     → Resumen para apoderados
orientador_stats            → Estadísticas de orientadores
```

---

## 🛠️ Comandos Útiles SQL

### Ver todos los usuarios y sus roles

```sql
SELECT
  au.email,
  up.nombre,
  up.role,
  up.status,
  up.created_at
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
ORDER BY up.created_at DESC;
```

### Hacer admin a un usuario

```sql
UPDATE user_profiles
SET role = 'admin', status = 'active', approved_at = NOW()
WHERE user_email = 'tu-email@gmail.com';
```

### Ver usuarios pendientes

```sql
SELECT * FROM get_pending_users();
```

### Ver vínculos apoderado-estudiante

```sql
SELECT
  p.email as apoderado,
  s.email as estudiante,
  psl.relationship_type,
  psl.status
FROM parent_student_links psl
JOIN user_profiles p ON psl.parent_id = p.user_id
JOIN user_profiles s ON psl.student_id = s.user_id;
```

---

## 🎉 ¡Listo para Usar!

Después de configurar tu cuenta de admin, tendrás acceso completo para:
1. Aprobar orientadores y apoderados
2. Gestionar usuarios
3. Ver estadísticas del sistema
4. Supervisar sesiones
5. Controlar accesos

¿Necesitas ayuda? Revisa los archivos:
- `PARENT_SYSTEM_GUIDE.md` - Sistema de apoderados
- `PROFILE_SELECTOR_GUIDE.md` - Selector de perfiles
- `src/lib/adminService.js` - Funciones de admin
- `src/lib/parentService.js` - Funciones de apoderados
- `src/lib/orientadorService.js` - Funciones de orientador
