# 🧪 Guía de Pruebas - OrientaAI

## ✅ Estado del Servidor

**🚀 Servidor corriendo en: http://localhost:5174/**

Todas las funcionalidades están implementadas y el servidor está funcionando sin errores.

---

## 🎯 Funcionalidades Listas para Probar

### 1️⃣ Proyecciones en Página de Resultados

**Ruta:** `http://localhost:5174/test` → Completar test → Ver resultados

**Qué probar:**
- [ ] Completar el test vocacional RIASEC (30 preguntas)
- [ ] En la página de resultados, verificar sección "Proyecciones del Mercado Laboral"
- [ ] Ver tarjetas de proyección para las 6 carreras principales
- [ ] Verificar que se muestran:
  - Índice de oportunidad (0-100)
  - Crecimiento proyectado a 2030
  - Salario estimado 2030
  - Matrícula actual
  - Alertas de saturación (si aplica)
- [ ] Click en "Ver Dashboard Completo" para ir al dashboard

**Ejemplo de carrera con proyección:**
- Ingeniería Civil en Informática
- Psicología (con alerta de saturación)
- Medicina

---

### 2️⃣ Comparador de Carreras

**Ruta:** `http://localhost:5174/dashboard`

**Qué probar:**
- [ ] Scroll hasta la sección "Comparador de Carreras"
- [ ] Buscar y agregar 2-3 carreras diferentes
  - Ejemplo: "Medicina", "Ingeniería", "Psicología"
- [ ] Verificar gráfico de líneas con proyecciones 2025-2030
- [ ] Verificar tabla comparativa con:
  - Índice de oportunidad
  - Crecimiento proyectado
  - Matrícula actual
  - Salario proyectado
  - Nivel de saturación
  - Recomendación
- [ ] Leer conclusiones automáticas al final
- [ ] Remover carreras y agregar otras

**Carreras sugeridas para comparar:**
- Medicina (crecimiento positivo)
- Psicología (saturada)
- Ingeniería Civil (alto crecimiento)

---

### 3️⃣ Alertas de Saturación en Test

**Ruta:** `http://localhost:5174/test`

**Qué probar:**
- [ ] Iniciar el test vocacional
- [ ] Responder preguntas favoreciendo perfil SAE (Social-Artístico-Emprendedor)
  - Responder "Me gusta mucho" a preguntas sociales/artísticas
  - Responder "No me gusta" a preguntas técnicas/científicas
- [ ] Al llegar a la pregunta 15/30, debería aparecer alerta
- [ ] Verificar contenido de la alerta:
  - Título claro
  - Nombre de carrera saturada
  - Nivel de saturación (crítica/alta)
  - Descripción y consejo
- [ ] Click en "X" para cerrar la alerta
- [ ] Verificar que la alerta no vuelve a aparecer
- [ ] Completar el test normalmente

**Perfiles que activan alertas:**
- SAE → Psicología (saturación crítica)
- ESA → Derecho (saturación crítica)
- IRA → Ingeniería Informática (saturación alta)

---

### 4️⃣ Infraestructura de Datos Históricos

**Ruta:** `http://localhost:5174/dashboard` → Cualquier carrera

**Qué probar:**
- [ ] Click en cualquier carrera del dashboard
- [ ] Buscar sección "Tendencias Históricas" o "Datos Históricos"
- [ ] Verificar mensaje informativo:
  ```
  📊 Datos Históricos en Desarrollo

  Actualmente contamos con datos de 2025. El sistema está
  preparado para incorporar datos de años anteriores.
  ```
- [ ] Confirmar que el sistema no muestra error
- [ ] El mensaje debe explicar los beneficios de datos históricos

**Nota:** Esta funcionalidad está lista para cuando se agreguen datos de años anteriores (2024, 2023, etc.)

---

### 5️⃣ Dashboard de Apoderados

**Ruta:** `http://localhost:5174/parent`

⚠️ **IMPORTANTE: Esta funcionalidad requiere que hayas ejecutado el SQL schema en Supabase primero**

**Pre-requisitos:**
1. Ejecutar `scripts/create-audit-tables.sql` en Supabase SQL Editor
2. Tener 2 usuarios creados en Supabase Auth:
   - Usuario 1: Apoderado (ej: padre@example.com)
   - Usuario 2: Estudiante (ej: estudiante@example.com)

**Qué probar:**

**Como Apoderado:**
- [ ] Iniciar sesión con usuario apoderado
- [ ] Ir a `http://localhost:5174/parent`
- [ ] Verificar dashboard vacío con mensaje "No hay estudiantes vinculados"
- [ ] Click en "Vincular Estudiante"
- [ ] Ingresar email del estudiante
- [ ] Click en "Enviar Solicitud"
- [ ] Verificar mensaje de confirmación

**Como Estudiante (Aceptar vinculación):**
⚠️ Nota: La UI de aceptación debe implementarse en el dashboard del estudiante
- [ ] Iniciar sesión con usuario estudiante
- [ ] Verificar que existe registro en tabla `parent_student_relationships` con status='pending'
- [ ] Aceptar la vinculación (puede requerir implementación adicional de UI)

**Volver como Apoderado:**
- [ ] Verificar que el estudiante aparece en "Mis Hijos"
- [ ] Click en el estudiante
- [ ] Verificar estadísticas:
  - Total de actividades (últimos 30 días)
  - Tests completados
  - Última actividad
  - Código Holland (si completó test)
- [ ] Verificar log de actividad detallado
- [ ] Verificar notificaciones (si existen)

**Flujo completo:**
```
Apoderado → Solicita vinculación
    ↓
Estudiante → Recibe notificación → Acepta
    ↓
Apoderado → Ve actividad del estudiante en tiempo real
```

---

## 📊 Verificación de Datos

### Archivos de Datos Disponibles

Todos estos archivos están en `public/data/processed/`:

```bash
✅ carreras-enriquecidas.json    - 122 KB - Carreras con datos RIASEC
✅ future-projections.json       - 109 KB - Proyecciones 2025-2030
✅ matricula-agregado.json       - 4.7 MB - Datos MINEDUC agregados
✅ riasec-analysis.json          - 35 KB  - Análisis vocacional
✅ trends-analysis.json          - 30 KB  - Análisis de tendencias
```

### Verificar Carga de Datos

Abrir consola del navegador (F12) y verificar:

```javascript
// No deberían aparecer errores 404 para estos archivos
/data/processed/future-projections.json - 200 OK
/data/processed/riasec-analysis.json - 200 OK
/data/processed/trends-analysis.json - 200 OK
```

---

## 🔍 Checklist de Testing Completo

### Frontend
- [ ] Servidor corriendo sin errores en http://localhost:5174/
- [ ] Ruta `/test` funciona correctamente
- [ ] Ruta `/resultados` funciona correctamente
- [ ] Ruta `/dashboard` funciona correctamente
- [ ] Ruta `/parent` funciona correctamente
- [ ] No hay errores en consola del navegador (F12)
- [ ] Todos los archivos JSON se cargan correctamente

### Componentes Nuevos
- [ ] CareerProjectionCard se renderiza correctamente
- [ ] CareerComparator funciona con búsqueda
- [ ] CareerComparator muestra gráfico interactivo
- [ ] SaturationAlert aparece en el momento correcto
- [ ] SaturationAlert se puede cerrar
- [ ] HistoricalTrendChart muestra mensaje informativo

### Funcionalidades
- [ ] Proyecciones se muestran en resultados
- [ ] Comparador permite agregar hasta 3 carreras
- [ ] Alertas aparecen al 50% del test (pregunta 15)
- [ ] Dashboard de apoderados carga sin errores

### Base de Datos (Requiere Supabase)
- [ ] Tablas creadas: `parent_student_relationships`, `audit_log`, `user_sessions`, `parent_notifications`
- [ ] Políticas RLS activas
- [ ] Triggers funcionando
- [ ] Vinculación apoderado-estudiante funciona

---

## 🐛 Problemas Conocidos y Soluciones

### Problema: "Cannot read properties of undefined (reading 'proyecciones')"

**Causa:** El archivo `future-projections.json` no se cargó

**Solución:**
```bash
# Verificar que el archivo existe
ls -lh public/data/processed/future-projections.json

# Si falta, regenerar datos
npm run analytics-full
cp data/processed/*.json public/data/processed/
```

---

### Problema: "relation 'parent_student_relationships' does not exist"

**Causa:** El SQL schema no fue ejecutado en Supabase

**Solución:**
1. Ir a [Supabase Dashboard](https://app.supabase.com)
2. SQL Editor
3. Copiar y ejecutar `scripts/create-audit-tables.sql`

---

### Problema: Alertas de saturación no aparecen

**Causa:** El perfil RIASEC no coincide con carreras configuradas

**Solución:**
- Responder favoreciendo perfil SAE o ESA
- Verificar en `src/lib/saturationChecker.js` los mappings

---

### Problema: Dashboard de apoderados vacío incluso después de vincular

**Causa:** El estudiante no ha aceptado la vinculación o status no es 'accepted'

**Solución:**
```sql
-- Verificar en Supabase
SELECT * FROM parent_student_relationships;

-- Si status es 'pending', cambiar manualmente para testing
UPDATE parent_student_relationships
SET status = 'accepted', accepted_at = NOW()
WHERE id = 'uuid-de-la-relacion';
```

---

## 📸 Screenshots Esperados

### 1. Proyecciones en Resultados
```
┌─────────────────────────────────────────┐
│ 🎓 Ingeniería Civil en Informática     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 📈 +45.2% | ⭐ 85/100 | 💰 $3.0M      │
│ 👥 30,086 estudiantes                  │
│ ⚠️ Saturación moderada proyectada      │
│                       [Ver Dashboard]   │
└─────────────────────────────────────────┘
```

### 2. Comparador de Carreras
```
┌─────────────────────────────────────────┐
│ Comparador de Carreras                  │
│ [Buscar carrera...] [+ Agregar]        │
│                                         │
│ 📊 Gráfico de Proyecciones             │
│ ┌───────────────────────────┐           │
│ │ ╱ Medicina                │           │
│ │╱                           │           │
│ │   ╲ Psicología             │           │
│ │    ╲___                    │           │
│ └───────────────────────────┘           │
│                                         │
│ Tabla Comparativa                       │
│ Métrica      | Med | Psi | Ing |       │
│ Oportunidad  | 85  | 45  | 90  |       │
│ Crecimiento  | +25%| -22%| +45%|       │
└─────────────────────────────────────────┘
```

### 3. Alerta de Saturación
```
┌─────────────────────────────────────────┐
│ ⚠️ Alta Saturación Proyectada      [X] │
│                                         │
│ Psicología muestra saturación crítica   │
│ del mercado. Considera especializaciones│
│ de nicho o áreas emergentes.            │
│                                         │
│ Matrícula actual: 54,890 estudiantes    │
│ Tendencia: -22.3% proyectado a 2030     │
└─────────────────────────────────────────┘
```

### 4. Dashboard de Apoderados
```
┌─────────────────────────────────────────┐
│ Panel de Apoderado     [+ Vincular]     │
│                                         │
│ 🔔 Notificaciones    | Mis Hijos       │
│ • Test completado    | [👤 Juan]       │
│   Hace 2h            |   15 actividades│
│                      |                 │
│ Estadísticas de Juan                    │
│ ┌─────┬─────┬─────┬─────┐             │
│ │ 15  │  1  │ Hoy │ IRC │             │
│ │Acts │Test │Últ. │Cód. │             │
│ └─────┴─────┴─────┴─────┘             │
│                                         │
│ 📝 Actividad Reciente                   │
│ ✅ Completó test        Hoy 15:30      │
│ 📄 Inició test          Hoy 15:15      │
│ 🔍 Consultó carrera     Ayer 18:20     │
└─────────────────────────────────────────┘
```

---

## ✅ Checklist Final Pre-Producción

Antes de desplegar a producción, verificar:

- [ ] Todas las pruebas de frontend pasadas
- [ ] SQL schema ejecutado en Supabase producción
- [ ] Variables de entorno configuradas (`.env.production`)
- [ ] Archivos de datos en directorio público
- [ ] Build de producción funciona: `npm run build`
- [ ] Preview funciona: `npm run preview`
- [ ] No hay console.log() de desarrollo
- [ ] No hay console.error() sin manejar
- [ ] Políticas RLS verificadas en Supabase
- [ ] Tests de carga realizados (si es necesario)

---

## 🎉 ¡Listo para Probar!

**Servidor corriendo en:** http://localhost:5174/

**Rutas principales:**
- `/` - Landing page
- `/test` - Test vocacional RIASEC
- `/resultados` - Resultados con proyecciones
- `/dashboard` - Dashboard con comparador
- `/parent` - Dashboard de apoderados

**Documentación completa:**
- `NUEVAS_FUNCIONALIDADES.md` - Documentación técnica completa
- `DEPLOYMENT_GUIDE.md` - Guía de despliegue
- `QUICK_START.md` - Inicio rápido
- `TESTING_GUIDE.md` - Esta guía de pruebas

---

**¿Encontraste un bug?** Revisa la sección "Problemas Conocidos" arriba o consulta la documentación completa.

**¡Buenas pruebas!** 🚀
