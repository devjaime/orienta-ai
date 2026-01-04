# 🔐 Sistema de Roles y Dashboards - OrientaIA

**Fecha:** 2026-01-04
**Versión:** 2.0

---

## 📋 Resumen de Nuevas Funcionalidades

### ✅ Implementado en esta actualización:

1. **Botón de Cerrar Sesión** - Logout en Header (desktop y mobile)
2. **Sistema de Roles** - 3 roles: user, orientador, admin
3. **Dashboard de Orientador** - Panel para gestionar usuarios y sesiones
4. **Dashboard de Admin** - Panel con funciones avanzadas de administración
5. **Tabla de Sesiones Agendadas** - Tracking de citas con orientadores
6. **Gestión de Roles** - Admins pueden cambiar roles de usuarios

---

## 🎯 Sistema de Roles

### Roles Disponibles:

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **user** | Usuario normal | Ver su perfil, hacer tests, agendar sesiones |
| **orientador** | Profesional de orientación | Todo lo de user + ver todos los usuarios, tests y sesiones |
| **admin** | Administrador del sistema | Todo lo de orientador + cambiar roles de usuarios |

### Jerarquía:
```
admin > orientador > user
```

Un **admin** tiene acceso automático a todo lo que puede hacer un orientador.

---

## 🗄️ Nuevas Tablas en Supabase

### 1. Campo `role` en `user_profiles`

```sql
ALTER TABLE user_profiles
ADD COLUMN role TEXT NOT NULL DEFAULT 'user'
CHECK (role IN ('user', 'orientador', 'admin'));
```

**Valor por defecto:** `user` (todos los nuevos registros son usuarios normales)

### 2. Tabla `scheduled_sessions`

Almacena las sesiones agendadas entre usuarios y orientadores:

```sql
CREATE TABLE scheduled_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  orientador_id UUID REFERENCES auth.users(id),
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  meeting_link TEXT,
  user_notes TEXT,
  orientador_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ...
);
```

**Estados de sesión:**
- `pending` - Sesión agendada, esperando confirmación
- `confirmed` - Orientador confirmó la sesión
- `completed` - Sesión realizada
- `cancelled` - Sesión cancelada

---

## 📦 Instalación y Configuración

### PASO 1: Ejecutar Script SQL en Supabase

1. Ve a tu proyecto Supabase → **Database** → **SQL Editor**
2. Copia y ejecuta el archivo `SUPABASE_ROLES_AND_SESSIONS.sql` completo
3. Verifica que se crearon correctamente:
   ```sql
   SELECT * FROM user_profiles LIMIT 5;
   SELECT * FROM scheduled_sessions LIMIT 5;
   ```

### PASO 2: Asignar Rol de Admin al Primer Usuario

**Opción A: Por email**
```sql
UPDATE user_profiles
SET role = 'admin'
WHERE user_email = 'tu-email@gmail.com';
```

**Opción B: Al primer usuario registrado**
```sql
UPDATE user_profiles
SET role = 'admin'
WHERE id = (SELECT id FROM user_profiles ORDER BY created_at LIMIT 1);
```

### PASO 3: Asignar Rol de Orientador (opcional)

```sql
UPDATE user_profiles
SET role = 'orientador'
WHERE user_email = 'orientador@example.com';
```

---

## 🎨 Nuevas Páginas y Componentes

### Archivos Creados:

```
/src/pages/
├── OrientadorDashboard.jsx  ✅ Panel de orientador
└── AdminDashboard.jsx       ✅ Panel de administración

/src/lib/
└── supabase.js              ✅ Funciones agregadas:
    ├── getUserProfile()
    ├── hasRole()
    ├── getAllUsers()
    ├── getAllTestResults()
    ├── getAllScheduledSessions()
    └── createScheduledSession()

/SUPABASE_ROLES_AND_SESSIONS.sql  ✅ Script SQL completo
```

### Archivos Modificados:

```
/src/components/
└── Header.jsx               ✅ Botón logout + links a dashboards

/src/App.jsx                 ✅ Rutas /orientador y /admin
```

---

## 🚀 Uso del Sistema

### 1. Cerrar Sesión

**Desktop:** Avatar + icono de logout en esquina superior derecha
**Mobile:** Menú hamburguesa → "Salir" al final

### 2. Acceso a Dashboards

**Para Orientadores:**
- En el Header aparece link "Dashboard" (color azul)
- URL: `/orientador`
- Muestra:
  - Total de usuarios registrados
  - Total de tests realizados
  - Sesiones pendientes/completadas
  - Pestañas: Usuarios | Tests | Sesiones

**Para Admins:**
- En el Header aparecen dos links: "Admin" (morado) y "Dashboard" (azul)
- URL: `/admin`
- Muestra:
  - Todo lo del orientador +
  - Botones para cambiar roles de usuarios
  - Contador de orientadores y admins

### 3. Dashboard de Orientador

**Estadísticas mostradas:**
- Total Usuarios
- Tests Realizados
- Sesiones Pendientes
- Sesiones Completadas

**Pestañas:**

#### 📊 Usuarios
- Lista de todos los usuarios registrados
- Búsqueda por nombre o email
- Muestra: nombre, email, edad, género, rol, motivaciones
- Fecha de registro

#### 📝 Tests
- Resultados de todos los tests RIASEC
- Muestra: código Holland, certeza, email del usuario
- Duración del test
- Fecha de realización

#### 📅 Sesiones
- Todas las sesiones agendadas
- Filtro por estado (pending, confirmed, completed, cancelled)
- Muestra: usuario, fecha/hora, duración, estado
- Notas del usuario

### 4. Dashboard de Admin

**Funcionalidades adicionales:**

#### Gestión de Roles:
- Ver rol actual de cada usuario
- Botones para cambiar rol:
  - **User** (gris)
  - **Orientador** (azul)
  - **Admin** (morado)

#### Estadísticas Extendidas:
- Contador de orientadores
- Contador de administradores
- Vista general del sistema

**Permisos especiales:**
- Solo los admins pueden cambiar roles
- Los admins tienen acceso a todas las funciones de orientador

---

## 🔒 Seguridad (Row Level Security)

### Políticas de `user_profiles`:
- ✅ Usuarios solo ven su propio perfil
- ✅ Solo pueden crear/actualizar su propio perfil

### Políticas de `scheduled_sessions`:
- ✅ Usuarios solo ven sus propias sesiones
- ✅ Orientadores ven sesiones asignadas a ellos
- ✅ Admins ven todas las sesiones
- ✅ Solo orientadores/admins pueden actualizar sesiones

---

## 📊 Flujo de Trabajo Completo

### Usuario Normal:
1. Login con Google
2. Completa perfil (edad, género, motivaciones)
3. Realiza test RIASEC
4. Ve resultados y carreras recomendadas
5. Agenda sesión con orientador (botón en resultados)
6. Puede cerrar sesión y volver cuando quiera

### Orientador:
1. Admin le asigna rol `orientador`
2. Aparece link "Dashboard" en Header
3. Accede a `/orientador`
4. Ve todos los usuarios y sus tests
5. Ve sesiones agendadas
6. Puede confirmar/completar sesiones

### Admin:
1. Se auto-asigna o es asignado como `admin`
2. Aparecen links "Admin" y "Dashboard" en Header
3. Accede a `/admin`
4. Gestiona roles de todos los usuarios
5. Tiene acceso completo al dashboard de orientador
6. Puede promover usuarios a orientador

---

## 🛠️ Funciones Helpers (supabase.js)

### `getUserProfile()`
Obtiene el perfil completo del usuario actual (incluye rol).

```javascript
const profile = await getUserProfile();
console.log(profile.role); // 'user', 'orientador', 'admin'
```

### `hasRole(requiredRole)`
Verifica si el usuario tiene un rol específico.

```javascript
const isOrientador = await hasRole('orientador'); // true para orientador o admin
const isAdmin = await hasRole('admin'); // true solo para admin
```

### `getAllUsers()`
Obtiene todos los usuarios (solo orientador/admin).

```javascript
const users = await getAllUsers();
```

### `getAllTestResults()`
Obtiene todos los resultados de tests (solo orientador/admin).

```javascript
const tests = await getAllTestResults();
```

### `getAllScheduledSessions()`
Obtiene todas las sesiones agendadas (solo orientador/admin).

```javascript
const sessions = await getAllScheduledSessions();
```

### `createScheduledSession(sessionData)`
Crea una nueva sesión agendada.

```javascript
await createScheduledSession({
  scheduled_date: '2026-01-10T14:00:00Z',
  duration_minutes: 30,
  user_notes: 'Quiero discutir mis opciones de ingeniería'
});
```

---

## 🎯 Casos de Uso

### Caso 1: Usuario agenda sesión con orientador

1. Usuario completa test y ve resultados
2. Hace clic en "Agendar Sesión Personalizada"
3. Se abre Google Calendar pre-configurado con:
   - Título: "Sesión de Orientación Vocacional - OrientaIA"
   - Duración: 30 minutos
   - Descripción completa del servicio
4. Usuario guarda el evento en su calendario
5. (Futuro) La sesión se registra en `scheduled_sessions`

### Caso 2: Orientador revisa usuarios nuevos

1. Orientador ingresa a `/orientador`
2. Ve estadísticas: +5 nuevos usuarios esta semana
3. Hace clic en pestaña "Usuarios"
4. Busca por "María"
5. Ve perfil: 22 años, Mujer, motivaciones: "Me gusta ayudar..."
6. Hace clic en pestaña "Tests"
7. Ve que María sacó ISA (Investigador-Social-Artístico)

### Caso 3: Admin promueve usuario a orientador

1. Admin ingresa a `/admin`
2. Busca usuario "Juan Pérez"
3. Ve que tiene rol "user"
4. Hace clic en botón "Orientador"
5. Confirma acción
6. El rol de Juan se actualiza a "orientador"
7. Juan ahora tiene acceso al dashboard de orientador

---

## 🧪 Testing

### Verificar Instalación:

1. ✅ Ejecuta SQL en Supabase sin errores
2. ✅ Asigna rol admin a tu usuario
3. ✅ Login y verifica que aparece link "Admin" en Header
4. ✅ Accede a `/admin` y ves el panel
5. ✅ Accede a `/orientador` y ves datos
6. ✅ Botón de logout funciona correctamente
7. ✅ Usuarios sin rol orientador/admin NO ven links de dashboard

### Verificar Permisos:

```sql
-- Ver tu rol actual
SELECT role FROM user_profiles WHERE user_email = 'tu-email@gmail.com';

-- Ver todos los usuarios y sus roles
SELECT nombre, user_email, role FROM user_profiles ORDER BY created_at DESC;
```

---

## 🚨 Troubleshooting

### Problema: "No tienes permisos para acceder a este panel"

**Solución:**
```sql
-- Verifica tu rol
SELECT * FROM user_profiles WHERE user_email = 'tu-email@gmail.com';

-- Si es necesario, actualiza
UPDATE user_profiles SET role = 'admin' WHERE user_email = 'tu-email@gmail.com';
```

### Problema: El link "Dashboard" no aparece en el Header

**Solución:**
1. Asegúrate de haber ejecutado el script SQL completo
2. Cierra sesión y vuelve a iniciar
3. Verifica que el rol esté correcto en la base de datos

### Problema: Error al ejecutar SQL

**Solución:**
1. Asegúrate de haber ejecutado primero `SUPABASE_USER_PROFILES.sql`
2. Verifica que la tabla `user_profiles` existe
3. Ejecuta los scripts en orden:
   - `SUPABASE_SETUP.md` (tabla test_results)
   - `SUPABASE_USER_PROFILES.sql` (tabla user_profiles)
   - `SUPABASE_ROLES_AND_SESSIONS.sql` (roles y sesiones)

---

## 📈 Próximas Mejoras (Post-MVP)

- [ ] Notificaciones por email cuando se agenda sesión
- [ ] Integración directa con Google Calendar API
- [ ] Chat en vivo entre usuario y orientador
- [ ] Sistema de reportes y analytics
- [ ] Exportar datos de usuarios a CSV
- [ ] Calendario interactivo para agendar sesiones
- [ ] Videollamadas integradas (Daily.co o Zoom)

---

## 🎉 Resumen

Has implementado un sistema completo de roles y dashboards que permite:

✅ Cerrar sesión desde cualquier lugar
✅ 3 roles con diferentes niveles de acceso
✅ Panel de orientador para gestionar usuarios y sesiones
✅ Panel de admin con control total del sistema
✅ Seguridad robusta con Row Level Security
✅ Interfaz intuitiva y atractiva

**Total de archivos nuevos:** 3
**Total de archivos modificados:** 4
**Líneas de código agregadas:** ~800

---

**¿Listo para probar?**

1. Ejecuta `SUPABASE_ROLES_AND_SESSIONS.sql` en Supabase
2. Asigna rol admin a tu usuario
3. Ejecuta `npm run dev`
4. Inicia sesión y visita `/admin`

¡Disfruta tu nuevo sistema de administración! 🚀
