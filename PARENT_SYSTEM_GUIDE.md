# Guía del Sistema de Apoderados - OrientaIA

## 🎯 Sistema Implementado

Se ha creado un sistema completo para **Apoderados** (padres, madres, tutores legales) que les permite:
- Vincular estudiantes (hijos)
- Ver resultados de tests vocacionales
- Seguir el progreso de sesiones con orientador
- Acceder a resúmenes IA generados por el orientador

---

## 📦 Archivos Creados/Modificados

### Nuevos Archivos
- `scripts/create-parent-student-links.sql` - Base de datos completa
- `src/lib/parentService.js` - Servicio de apoderados (725 líneas)

### Archivos Modificados
- `src/components/ProfileSelector.jsx` - Ahora incluye perfil Apoderado (4 perfiles totales)

---

## 🎨 Selector de Perfil Actualizado

### Ahora Muestra 4 Perfiles:

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ ESTUDIANTE  │  │  APODERADO  │  │ ORIENTADOR  │  │ADMINISTRADOR│
│     🎓      │  │     👥      │  │     👥      │  │     🛡️      │
│    (Azul)   │  │   (Verde)   │  │  (Púrpura)  │  │   (Rojo)    │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

### Funcionalidades por Perfil:

#### 👨‍🎓 Estudiante (Único que hace test)
- ✅ Test vocacional con IA
- Recomendaciones de carreras
- Chat con orientador virtual
- Seguimiento de progreso

#### 👨‍👩‍👧 Apoderado (NUEVO - Verde)
- ✅ Vincular estudiantes (hijos)
- ✅ Ver resultados de tests
- ✅ Seguimiento de sesiones
- ✅ Resúmenes IA del orientador

#### 👨‍🏫 Orientador (NO hace test)
- Dashboard de estudiantes
- Gestión de disponibilidad
- Apuntes con resumen IA
- Timeline de progreso

#### 🛡️ Administrador (NO hace test)
- Panel de control completo
- Gestión de usuarios
- Estadísticas globales
- Configuración del sistema

---

## 🗄️ Base de Datos

### Tabla: `parent_student_links`

Gestiona los vínculos entre apoderados y estudiantes.

```sql
CREATE TABLE parent_student_links (
  id UUID PRIMARY KEY,
  parent_id UUID REFERENCES auth.users(id),
  student_id UUID REFERENCES auth.users(id),

  -- Relación
  relationship_type TEXT, -- padre/madre, tutor legal, familiar, otro

  -- Estado del vínculo
  status TEXT, -- pending, accepted, rejected, blocked

  -- Información
  student_nickname TEXT, -- Ej: "Mi hijo mayor"
  notes TEXT,

  -- Permisos
  can_view_tests BOOLEAN DEFAULT TRUE,
  can_view_sessions BOOLEAN DEFAULT TRUE,
  can_view_notes BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  accepted_at TIMESTAMP
);
```

### Vista: `parent_dashboard_summary`

Proporciona un resumen completo para el dashboard del apoderado:
- Información del estudiante
- Total de tests y último test
- Total de sesiones y próxima sesión
- Orientador asignado

### Funciones SQL:

#### `request_parent_student_link()`
Solicita vincular un estudiante por email.

```sql
SELECT request_parent_student_link(
  p_parent_id := 'uuid-del-apoderado',
  p_student_email := 'estudiante@example.com',
  p_relationship := 'padre/madre',
  p_nickname := 'Mi hijo Juan'
);
```

#### `get_parent_student_ai_summaries()`
Obtiene todos los resúmenes IA de sesiones que el apoderado puede ver.

```sql
SELECT * FROM get_parent_student_ai_summaries(
  p_parent_id := 'uuid-del-apoderado',
  p_student_id := 'uuid-del-estudiante'
);
```

---

## 💻 Servicio: parentService.js

### Gestión de Vínculos

#### Obtener estudiantes vinculados
```javascript
import { getLinkedStudents } from '../lib/parentService';

const students = await getLinkedStudents(parentId);
// Retorna: [{ student_id, student_name, total_tests, total_sessions, ... }]
```

#### Solicitar nuevo vínculo
```javascript
import { requestStudentLink } from '../lib/parentService';

const linkId = await requestStudentLink(
  parentId,
  'estudiante@example.com',
  'padre/madre',
  'Mi hijo Juan'
);
```

#### Obtener vínculos pendientes
```javascript
import { getPendingLinks } from '../lib/parentService';

const pending = await getPendingLinks(parentId);
// Retorna vínculos en estado "pending"
```

### Acceso a Resultados de Tests

#### Ver tests del estudiante
```javascript
import { getStudentTests } from '../lib/parentService';

const tests = await getStudentTests(parentId, studentId);
// Retorna todos los tests del estudiante
```

#### Último test
```javascript
import { getStudentLastTest } from '../lib/parentService';

const lastTest = await getStudentLastTest(parentId, studentId);
// Retorna: { codigo_holland, certeza, completed_at, ... }
```

### Seguimiento de Sesiones

#### Ver todas las sesiones
```javascript
import { getStudentSessions } from '../lib/parentService';

const sessions = await getStudentSessions(parentId, studentId);
// Retorna todas las sesiones del estudiante
```

#### Próxima sesión
```javascript
import { getStudentNextSession } from '../lib/parentService';

const nextSession = await getStudentNextSession(parentId, studentId);
// Retorna la próxima sesión programada o null
```

### Resúmenes IA del Orientador

#### Obtener todos los resúmenes IA
```javascript
import { getStudentAISummaries } from '../lib/parentService';

const summaries = await getStudentAISummaries(parentId, studentId);
// Retorna: [{ session_id, ai_summary, ai_analysis, orientador_name, ... }]
```

Cada resumen incluye:
- **ai_summary**: Resumen en texto plano
- **ai_analysis**: Objeto JSON con:
  - `puntos_clave`: Array de puntos importantes
  - `recomendaciones`: Array de recomendaciones
  - `proximos_pasos`: Array de acciones a realizar
  - `areas_preocupacion`: Array de áreas que requieren atención
  - `sentimiento_general`: "positivo", "neutro" o "negativo"
  - `nivel_compromiso`: "alto", "medio" o "bajo"

### Dashboard Completo

#### Estadísticas de un estudiante
```javascript
import { getStudentDashboardStats } from '../lib/parentService';

const stats = await getStudentDashboardStats(parentId, studentId);
// Retorna objeto completo con todas las métricas
```

Incluye:
- Información del estudiante
- Total y último test
- Sesiones (total, completadas, pendientes, próxima)
- Resúmenes IA
- Timeline de actividad reciente

#### Resumen de todos los hijos
```javascript
import { getAllStudentsSummary } from '../lib/parentService';

const summaries = await getAllStudentsSummary(parentId);
// Retorna array con estadísticas de cada estudiante vinculado
```

---

## 🔐 Seguridad (RLS)

### Políticas Implementadas:

1. **Apoderados ven sus vínculos**
   - Solo pueden ver vínculos donde son el `parent_id`
   - O donde son el `student_id` (para aceptar/rechazar)

2. **Apoderados crean vínculos**
   - Solo usuarios con rol "apoderado" pueden crear vínculos
   - Solo pueden crearse como `parent_id`

3. **Estudiantes aceptan/rechazan**
   - Estudiantes pueden actualizar vínculos en estado "pending"
   - Solo pueden cambiar a "accepted" o "rejected"

4. **Permisos granulares**
   - `can_view_tests`: Ver resultados de tests
   - `can_view_sessions`: Ver sesiones programadas
   - `can_view_notes`: Ver notas privadas del orientador (por defecto FALSE)

5. **Orientadores y admins**
   - Tienen acceso de supervisión a todos los vínculos

---

## 🚀 Flujo de Uso

### 1. Registro del Apoderado

```
Usuario → Selecciona perfil "Apoderado" → Se registra con Google → /parent
```

### 2. Vincular un Estudiante

```javascript
// En el dashboard del apoderado
const linkId = await requestStudentLink(
  parentId,
  'hijo@example.com',
  'padre/madre',
  'Juan'
);
// Estado: pending
```

### 3. Estudiante Acepta/Rechaza

El estudiante recibe notificación y puede:
- Aceptar: `status = 'accepted'`
- Rechazar: `status = 'rejected'`

### 4. Apoderado Accede a Datos

Una vez aceptado:

```javascript
// Ver tests
const tests = await getStudentTests(parentId, studentId);

// Ver sesiones
const sessions = await getStudentSessions(parentId, studentId);

// Ver resúmenes IA
const summaries = await getStudentAISummaries(parentId, studentId);
```

---

## 📊 Ejemplo de Dashboard del Apoderado

```jsx
import { useEffect, useState } from 'react';
import { getAllStudentsSummary } from '../lib/parentService';
import { getCurrentUser } from '../lib/supabase';

function ParentDashboard() {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    async function loadData() {
      const user = await getCurrentUser();
      const summaries = await getAllStudentsSummary(user.id);
      setStudents(summaries);
    }
    loadData();
  }, []);

  return (
    <div>
      <h1>Mis Hijos</h1>
      {students.map(student => (
        <div key={student.student_id}>
          <h2>{student.student_nickname || student.student_name}</h2>
          <p>Tests: {student.total_tests}</p>
          <p>Sesiones: {student.completed_sessions}/{student.total_sessions}</p>
          {student.last_test && (
            <p>Último test: {student.last_test.codigo_holland}</p>
          )}
          {student.next_session && (
            <p>Próxima sesión: {student.next_session.scheduled_date}</p>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 📝 Pasos para Implementar

### 1. Ejecutar Script SQL

```bash
# En Supabase Dashboard > SQL Editor
# Ejecutar: scripts/create-parent-student-links.sql
```

### 2. Actualizar ParentDashboard

```javascript
// Reemplazar imports antiguos por:
import {
  getLinkedStudents,
  requestStudentLink,
  getStudentDashboardStats,
  getStudentAISummaries
} from '../lib/parentService';
```

### 3. Agregar Funcionalidad de Vincular

```jsx
// Botón para agregar estudiante
<button onClick={() => setShowLinkModal(true)}>
  Vincular Estudiante
</button>

// Modal con formulario
{showLinkModal && (
  <div>
    <input
      type="email"
      placeholder="Email del estudiante"
      value={studentEmail}
      onChange={(e) => setStudentEmail(e.target.value)}
    />
    <select value={relationship} onChange={(e) => setRelationship(e.target.value)}>
      <option value="padre/madre">Padre/Madre</option>
      <option value="tutor legal">Tutor Legal</option>
      <option value="familiar">Familiar</option>
    </select>
    <button onClick={handleLink}>Solicitar Vínculo</button>
  </div>
)}
```

---

## ✅ Estado Actual

- [x] Base de datos completa (tabla, vista, funciones)
- [x] Servicio completo (parentService.js)
- [x] ProfileSelector actualizado con 4 perfiles
- [x] RLS configurado
- [x] Commit y push a GitHub
- [ ] ParentDashboard actualizado (pendiente)
- [ ] UI para vincular estudiantes (pendiente)
- [ ] Sistema de notificaciones (pendiente)

---

## 🎯 Características Clave

### ✅ Solo Estudiantes Hacen Test
- Orientadores y Administradores NO hacen test
- Solo acceden a su dashboard respectivo

### ✅ Apoderados NO Hacen Test
- Solo vinculan y monitorean estudiantes
- Ven resultados explicados con IA

### ✅ Resúmenes IA para Apoderados
- Acceso a análisis del orientador
- Lenguaje claro y comprensible
- Puntos clave, recomendaciones, próximos pasos

### ✅ Control Granular de Permisos
- El apoderado puede no ver notas privadas
- Configuración por vínculo
- Respeta la privacidad del estudiante

---

## 🔮 Próximas Mejoras

1. **Sistema de Notificaciones**
   - Notificar al estudiante cuando recibe solicitud de vínculo
   - Notificar al apoderado cuando es aceptado/rechazado
   - Notificar cuando hay nuevo resumen IA

2. **Chat Apoderado-Orientador**
   - Permitir comunicación directa
   - Mensajería privada

3. **Reportes PDF**
   - Generar reportes descargables
   - Incluir gráficos de progreso

4. **Calendario Compartido**
   - Ver sesiones programadas
   - Recordatorios automáticos

---

¡El sistema de apoderados está listo! 🎉
