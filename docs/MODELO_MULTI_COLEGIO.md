# Modelo Multi-Colegio (B2B) - Vocari

## Resumen de Implementación

Este documento describe el modelo multi-colegio implementado para soportar pilotos institucionales en colegios de Chile.

## Cambios Realizados

### 1. Base de Datos (SQL)

**Archivo:** `scripts/create-multi-tenant-institutions.sql`

#### Nueva Tabla: `institutions`
```sql
- id: UUID (PK)
- name: Nombre del colegio
- code: Código único (ej: CSJ001)
- rbd: RBD del Mineduc (opcional)
- type: particular, particular_subvencionado, municipal, servicio_local
- address, comuna, region: Ubicación
- contact_name, contact_email, contact_phone: Contacto
- status: pending, pilot, active, inactive, suspended
- pilot_start_date, pilot_end_date: Fechas del piloto
- max_students: Límite de estudiantes
- settings: Configuración JSON
```

#### Columnas agregadas a `user_profiles`
```sql
- institution_id: FK a institutions
- curso: "3 Medio" o "4 Medio"
- student_code: Código interno del colegio
- school_year: Año escolar
- activation_code: Código de 8 caracteres para activación
- is_activated: Boolean
- invited_by: Quién creó al usuario
```

#### Nuevos Roles
- `super_admin`: Acceso total, gestiona todas las instituciones
- `admin_colegio`: Gestiona solo su institución
- `admin`: (mantiene compatibilidad con el rol anterior)

#### Funciones RPC
- `create_institution()`: Crear institución (solo super_admin)
- `invite_student()`: Invitar estudiante con código de activación
- `batch_invite_students()`: Importar múltiples estudiantes desde JSON
- `activate_account_with_code()`: Activar cuenta con código
- `generate_activation_code()`: Generar código único

#### Políticas RLS
- Actualizadas para filtrar por institución
- `is_super_admin()`: Verifica si es super_admin
- `is_institution_admin()`: Verifica si es admin de colegio
- `same_institution()`: Verifica pertenencia a misma institución

### 2. Servicios Frontend

**Archivo:** `src/lib/institutionService.js`

Funciones principales:
- `getAllInstitutions()`: Listar instituciones
- `createInstitution()`: Crear institución
- `updateInstitution()`: Actualizar institución
- `inviteStudent()`: Invitar estudiante individual
- `batchInviteStudents()`: Importar múltiples estudiantes
- `activateAccountWithCode()`: Activar con código
- `getInstitutionStudents()`: Listar estudiantes
- `getInstitutionStats()`: Estadísticas de institución
- `parseStudentsCSV()`: Parsear CSV de estudiantes
- `generateActivationReport()`: Generar reporte de códigos
- `exportStudentsToCSV()`: Exportar estudiantes a CSV

### 3. Componentes UI

#### `src/components/admin/InstitutionManager.jsx`
- Listado de instituciones con búsqueda y filtros
- Crear nueva institución
- Editar institución existente
- Ver estadísticas por institución
- Cambiar estado de institución

#### `src/components/admin/StudentImporter.jsx`
- Importar estudiantes desde CSV
- Agregar estudiante manual
- Vista de resultados con códigos de activación
- Copiar, imprimir y descargar códigos

### 4. Páginas

#### `src/pages/ActivateAccount.jsx`
- Página pública para activar cuenta con código
- Flujo: Ingresar código → Verificar → Login con Google → Activar
- Guarda código en localStorage para después del OAuth

#### `src/pages/InstitutionStudentsPage.jsx`
- Listado de estudiantes de una institución
- Filtros por curso, estado y búsqueda
- Estadísticas: total, activados, sin activar, tests
- Modal para importar/agregar estudiantes

### 5. Actualizaciones

#### `src/pages/AdminDashboard.jsx`
- Nueva pestaña "Instituciones" (solo super_admin)
- Pestañas: Usuarios, Instituciones, Tests, Sesiones
- Soporte para nuevos roles

#### `src/pages/AuthCallback.jsx`
- Maneja activación con código guardado en localStorage
- Redirige correctamente según nuevos roles

#### `src/components/ProtectedRoute.jsx`
- Soporte para roles: admin_colegio, super_admin
- super_admin tiene acceso total

#### `src/components/GoogleSignIn.jsx`
- Enlace "¿Tienes código de activación?"
- Redirige a /activate

#### `src/App.jsx`
- Nueva ruta: `/activate`
- Nueva ruta: `/admin/institutions/:institutionId/students`

## Flujo de Uso

### 1. Setup Inicial (Super Admin)

```
1. Ejecutar SQL: scripts/create-multi-tenant-institutions.sql
2. Promover primer admin a super_admin (automático en migración)
3. Crear institución desde /admin → Instituciones → Nueva
```

### 2. Alta de Estudiantes (Admin Colegio)

```
1. Ir a /admin → Instituciones → Ver Estudiantes
2. Opción A: Importar CSV
   - Descargar plantilla
   - Llenar con: email, nombre, curso, codigo_estudiante
   - Subir archivo
3. Opción B: Agregar manual
   - Llenar formulario
4. Obtener códigos de activación
   - Copiar al portapapeles
   - Imprimir
   - Descargar CSV
```

### 3. Activación de Estudiante

```
1. Estudiante recibe código (impreso o por email)
2. Va a vocari.cl → "¿Tienes código de activación?"
3. Ingresa código de 8 caracteres
4. Verifica sus datos
5. Inicia sesión con Google
6. Cuenta activada automáticamente
7. Redirige a Dashboard
```

## Próximos Pasos

### Pendiente para completar el MVP:
1. **Feedback Estructurado** - Formulario post-sesión para orientadores
2. **Reportes** - PDF para estudiantes, dashboard para colegio
3. **Métricas de Uso** - Tracking de eventos y fricciones
4. **Email de Códigos** - Envío automático de códigos

### Ejecutar SQL en Supabase:
```bash
# En Supabase Dashboard > SQL Editor
# Copiar y ejecutar: scripts/create-multi-tenant-institutions.sql
```

### Crear Primer Super Admin:
```sql
-- Promover admin existente a super_admin
UPDATE user_profiles
SET role = 'super_admin'
WHERE user_email = 'tu-email@gmail.com';
```

## Estructura de Archivos Creados/Modificados

```
src/
├── lib/
│   └── institutionService.js       # NUEVO
├── components/
│   ├── admin/
│   │   ├── InstitutionManager.jsx  # NUEVO
│   │   └── StudentImporter.jsx     # NUEVO
│   ├── GoogleSignIn.jsx            # MODIFICADO
│   └── ProtectedRoute.jsx          # MODIFICADO
├── pages/
│   ├── ActivateAccount.jsx         # NUEVO
│   ├── InstitutionStudentsPage.jsx # NUEVO
│   ├── AdminDashboard.jsx          # MODIFICADO
│   ├── AuthCallback.jsx            # MODIFICADO
│   └── App.jsx                     # MODIFICADO
scripts/
└── create-multi-tenant-institutions.sql  # NUEVO
docs/
└── MODELO_MULTI_COLEGIO.md         # NUEVO (este archivo)
```
