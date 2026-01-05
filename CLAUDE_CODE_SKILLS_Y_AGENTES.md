# SKILLS DE CLAUDE CODE Y AGENTES - GUÍA COMPLETA

## TABLA DE CONTENIDOS

1. [¿Qué son los Skills de Claude Code?](#1-qué-son-los-skills-de-claude-code)
2. [Estructura de un Skill](#2-estructura-de-un-skill)
3. [Skills Implementados en OrientaIA](#3-skills-implementados-en-orientaia)
4. [¿Qué son los Agentes de Claude Code?](#4-qué-son-los-agentes-de-claude-code)
5. [Uso de Agentes - Conceptual](#5-uso-de-agentes-conceptual)
6. [Uso de Agentes - Implementación Incremental](#6-uso-de-agentes-implementación-incremental)
7. [Best Practices](#7-best-practices)
8. [Ejemplos Prácticos](#8-ejemplos-prácticos)

---

## 1. ¿Qué son los Skills de Claude Code?

### Definición

Los **Skills** son módulos de funcionalidad documentados que:
- Definen **qué hace** un componente del sistema
- Especifican **entradas y salidas** esperadas
- Documentan **flujos y dependencias**
- Sirven como **contrato** entre diferentes partes del código
- Ayudan a Claude Code a **entender el contexto** del proyecto

### Propósito

Los skills NO son código ejecutable, son **documentación estructurada** que:

1. **Para desarrolladores humanos:**
   - Documentación clara de cada módulo
   - Especificación de requisitos
   - Guía de implementación

2. **Para Claude Code (IA):**
   - Contexto sobre la arquitectura
   - Restricciones y reglas de negocio
   - Ayuda a generar código consistente
   - Evita reinventar la rueda

### Analogía

Piensa en los skills como:
- **Blueprints** (planos arquitectónicos)
- **Contratos de API**
- **User Stories técnicas**
- **Especificaciones funcionales**

---

## 2. Estructura de un Skill

### Template Estándar

Todos los skills en OrientaIA siguen este formato:

```markdown
# Skill XX: Nombre del Skill

## Propósito
[Una frase clara y concisa del objetivo]

## Responsabilidades
- [ ] Responsabilidad 1
- [ ] Responsabilidad 2
- [ ] Responsabilidad 3

## Entradas
[Especificación de inputs con tipos y descripciones]

## Salidas
[Especificación de outputs con tipos y descripciones]

## Restricciones
### Negocio
- Regla de negocio 1
- Regla de negocio 2

### Técnica
- Restricción técnica 1
- Restricción técnica 2

### UX
- Consideración de experiencia de usuario 1

## Dependencias
### Externas
- Servicio externo 1
- Servicio externo 2

### Internas
- Skill A
- Módulo B

## Estados / Flujo
[Diagramas de flujo, estados, o secuencias]

## Casos de Uso
1. Caso de uso 1
2. Caso de uso 2

## Notas de Implementación
[Detalles técnicos, ejemplos de código, decisiones de arquitectura]

## Checklist de Implementación
- [ ] Tarea 1
- [ ] Tarea 2

---

**Estado:** 🟢 Implementado | 🟡 En progreso | 🔴 Pendiente
**Prioridad:** Alta | Media | Baja
**Tiempo estimado:** X días
**Última actualización:** YYYY-MM-DD
```

### Secciones Clave

#### 1. **Propósito**
Una frase que responde: "¿Qué problema resuelve este skill?"

**Ejemplo:**
```markdown
## Propósito
Gestionar el registro, inicio de sesión, roles y persistencia
de sesión de usuarios usando Supabase Auth.
```

#### 2. **Responsabilidades**
Lista de checkboxes de TODO lo que el skill debe hacer.

**Ejemplo:**
```markdown
## Responsabilidades
- [x] Registro de nuevos usuarios
- [x] Login de usuarios existentes
- [x] Logout (cierre de sesión)
- [ ] Autenticación con Google OAuth (pendiente)
```

#### 3. **Entradas y Salidas**
Contratos de API claramente definidos.

**Ejemplo:**
```typescript
## Entradas
{
  email: string,        // Email válido
  password: string,     // Mínimo 8 caracteres
  nombre: string
}

## Salidas
// Éxito
{
  ok: true,
  user: { id: string, email: string },
  session: { access_token: string }
}

// Error
{
  ok: false,
  error: string
}
```

#### 4. **Restricciones**
Reglas que NO se pueden violar.

**Ejemplo:**
```markdown
## Restricciones

### Negocio
- Un email = una cuenta (no duplicados)
- Roles mutuamente excluyentes

### Seguridad
- Contraseñas: mínimo 8 caracteres
- Rate limiting: 5 intentos por IP en 15 min

### UX
- Mensajes de error en español
- Feedback inmediato en validación
```

#### 5. **Flujos**
Diagramas de texto o mermaid explicando el flujo.

**Ejemplo:**
```
[Usuario] → [Formulario Login]
    ↓
[Validación frontend]
    ↓
[Supabase.auth.signInWithPassword()]
    ↓
    ├─ ✅ Válido → [Retorna session]
    │               ↓
    │          [Redirect /dashboard]
    │
    └─ ❌ Inválido → [Error "Credenciales inválidas"]
```

#### 6. **Casos de Uso**
Escenarios concretos de uso.

**Ejemplo:**
```markdown
### 1. Estudiante Nuevo - Registro

**Actor:** Visitante sin cuenta

**Objetivo:** Crear cuenta para acceder al test

**Flujo:**
1. Usuario hace clic en "Crear cuenta"
2. Selecciona rol "Estudiante"
3. Completa formulario
4. Submit → Validación
5. Redirección a /dashboard
```

---

## 3. Skills Implementados en OrientaIA

### Inventario Actual

El proyecto tiene **8 skills definidos** en `/skills/`:

```
skills/
├── 01-auth.skill.md                      # ✅ Autenticación
├── 02-test-holland-riasec.skill.md       # ✅ Test vocacional
├── 03-motor-recomendacion.skill.md       # 🟡 Motor carreras
├── 04-calculadora-roi.skill.md           # 🔴 Calculadora ROI
├── 05-dashboard-estudiante.skill.md      # 🟡 Dashboard estudiante
├── 06-dashboard-apoderado.skill.md       # 🔴 Dashboard apoderado
├── 07-ia-explicacion.skill.md            # ✅ IA explicaciones
└── auth.skill.md                         # [Legacy - duplicado]
```

### Mapa de Dependencias

```
┌─────────────────────────────────────────┐
│  01-auth.skill                          │
│  (Base - Todo depende de esto)          │
└────────────┬────────────────────────────┘
             │
             ├───────────────┬───────────────┐
             │               │               │
             ▼               ▼               ▼
    ┌────────────────┐  ┌────────────┐  ┌────────────┐
    │ 02-test-riasec │  │ 05-dash-   │  │ 06-dash-   │
    │                │  │ estudiante │  │ apoderado  │
    └───────┬────────┘  └────────────┘  └────────────┘
            │
            ├───────────────┬───────────────┐
            │               │               │
            ▼               ▼               ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ 03-motor-    │  │ 07-ia-       │  │ 04-calc-     │
    │ recomendacion│  │ explicacion  │  │ roi          │
    └──────────────┘  └──────────────┘  └──────────────┘
```

### Skill Destacado: 02-test-holland-riasec.skill.md

Este es el más completo. Incluye:

✅ **Algoritmo de scoring determinístico** completo
✅ **Sistema de desempate** en 4 pasos (suma → intensidad → rechazo → alfabético)
✅ **36 preguntas** del test documentadas
✅ **Cálculo de certeza** (Alta/Media/Exploratoria)
✅ **Esquema de base de datos** SQL completo
✅ **Código de ejemplo** de implementación
✅ **Casos de uso** detallados
✅ **Checklist de implementación**

**Lecciones aprendidas:**
- Documentar el algoritmo ANTES de codear evitó refactors
- Los casos de empate se identificaron en papel primero
- El skill sirvió como "test de mesa" antes de escribir código

---

## 4. ¿Qué son los Agentes de Claude Code?

### Definición

Los **Agentes** son instancias especializadas de Claude Code que:
- Se enfocan en una **tarea específica**
- Tienen acceso a **herramientas limitadas** según su rol
- Trabajan de forma **autónoma** o **asistida**
- Pueden ser **resumidos** para continuidad

### Tipos de Agentes Disponibles

Claude Code ofrece varios agentes especializados:

#### 1. **general-purpose** (Agente General)
**Herramientas:** Todas (*)

**Cuándo usar:**
- Tareas complejas multi-paso
- Búsqueda de keywords en múltiples archivos
- Refactoring grande
- Implementación de features completas

**Ejemplo:**
```bash
"Implementa el sistema de autenticación completo
siguiendo el skill 01-auth.skill.md"
```

#### 2. **Explore** (Explorador de Código)
**Herramientas:** Glob, Grep, Read

**Cuándo usar:**
- Explorar estructura del proyecto
- Buscar patrones de código
- Entender cómo funciona algo
- Investigar antes de implementar

**Niveles de profundidad:**
- `quick`: Búsqueda básica
- `medium`: Exploración moderada
- `very thorough`: Análisis exhaustivo

**Ejemplo:**
```bash
"Explora cómo está implementada la autenticación OAuth
en el proyecto. Nivel: medium"
```

#### 3. **Plan** (Arquitecto de Software)
**Herramientas:** Todas

**Cuándo usar:**
- Diseñar implementación de features
- Planificar refactoring grande
- Identificar archivos críticos
- Analizar trade-offs de arquitectura

**Output:** Plan paso a paso para implementar

**Ejemplo:**
```bash
"Planifica cómo implementar el sistema de suscripciones
con Stripe considerando los skills existentes"
```

#### 4. **claude-code-guide** (Guía de Documentación)
**Herramientas:** Glob, Grep, Read, WebFetch, WebSearch

**Cuándo usar:**
- Preguntas sobre cómo usar Claude Code
- Consultas sobre Claude API
- Documentación de Anthropic SDK
- Integración con otras herramientas

**Ejemplo:**
```bash
"¿Cómo implemento hooks de Claude Code para validar
commits antes de pushear?"
```

### Cómo Invocar Agentes

#### Método 1: Via Tool (programático)

```python
# Desde dentro de Claude Code
Task(
    subagent_type="Explore",
    description="Analizar arquitectura",
    prompt="""
    Explora el proyecto OrientaIA y documenta:
    1. Estructura de carpetas
    2. Patrones de arquitectura usados
    3. Dependencias principales

    Nivel: very thorough
    """
)
```

#### Método 2: Via Comando (manual)

```bash
# En la CLI de Claude Code
/explore "¿Cómo funciona el algoritmo RIASEC?" --depth=medium
```

### Características de los Agentes

#### Autonomía
- Ejecutan múltiples pasos sin intervención
- Deciden qué herramientas usar
- Exploran archivos relevantes automáticamente

#### Contexto Preservado
- Pueden ser **resumidos** para continuar después
- Retienen información de ejecuciones anteriores
- Acumulan conocimiento del proyecto

#### Especialización
- Cada agente tiene un propósito claro
- Herramientas limitadas = respuestas más enfocadas
- Menos distracciones, mejor performance

---

## 5. Uso de Agentes - Conceptual

### Estrategia General

**Principio:** Usa el agente más especializado para la tarea.

```
┌──────────────────────────────────────────────────┐
│              ÁRBOL DE DECISIÓN                   │
└──────────────────────────────────────────────────┘

¿Necesitas ENTENDER código existente?
    │
    └─→ Usa: Explore
        • "¿Cómo funciona X?"
        • "¿Dónde está implementado Y?"
        • "Explora la arquitectura de Z"

¿Necesitas PLANIFICAR nueva funcionalidad?
    │
    └─→ Usa: Plan
        • "Diseña la implementación de X"
        • "Planifica el refactor de Y"
        • "Identifica archivos para cambiar en Z"

¿Necesitas IMPLEMENTAR algo complejo?
    │
    └─→ Usa: general-purpose
        • "Implementa feature X end-to-end"
        • "Refactoriza módulo Y"
        • "Migra de X a Y"

¿Tienes PREGUNTAS sobre Claude Code?
    │
    └─→ Usa: claude-code-guide
        • "¿Cómo uso hooks?"
        • "¿Cómo integro MCP servers?"
```

### Workflow Recomendado

#### Fase 1: EXPLORACIÓN (Explore)
```
Objetivo: Entender qué existe y cómo funciona

1. "Explora cómo está implementada la autenticación actual"
   → Agente Explore nivel "medium"

2. Resultado: Lista de archivos, patrones usados, dependencias

3. Decisión: ¿Puedo reusar código existente o necesito refactorizar?
```

#### Fase 2: PLANIFICACIÓN (Plan)
```
Objetivo: Diseñar la solución

1. "Planifica cómo agregar OAuth de Google considerando
    el código existente en src/lib/auth/"
   → Agente Plan

2. Resultado:
   - Archivos a crear
   - Archivos a modificar
   - Orden de implementación
   - Trade-offs identificados

3. Decisión: ¿El plan tiene sentido? ¿Necesito ajustar algo?
```

#### Fase 3: IMPLEMENTACIÓN (general-purpose)
```
Objetivo: Escribir el código

1. "Implementa OAuth de Google siguiendo el plan anterior
    y el skill 01-auth.skill.md"
   → Agente general-purpose

2. Resultado: Código implementado, tests creados, docs actualizadas

3. Decisión: ¿Funciona correctamente? ¿Necesito iterar?
```

### Ejemplo Completo: Agregar Dashboard de Apoderado

```
TAREA: Implementar dashboard para apoderados que puedan ver
       el progreso de sus hijos en el test vocacional

┌────────────────────────────────────────────────────┐
│  PASO 1: EXPLORAR (Agente: Explore)                │
└────────────────────────────────────────────────────┘

Prompt:
"Explora el proyecto para entender:
1. Cómo funciona el dashboard de estudiante actual
2. Cómo se almacenan los resultados del test
3. Cómo funciona la vinculación apoderado-estudiante

Nivel: very thorough"

Output del agente:
✓ Dashboard estudiante en src/pages/DashboardEstudiante.jsx
✓ Usa hook useAuth() para obtener usuario
✓ Consulta test_results desde Supabase
✓ Tabla parent_student_links relaciona apoderados con estudiantes
✓ RLS policy permite a apoderados ver datos de hijos vinculados

┌────────────────────────────────────────────────────┐
│  PASO 2: PLANIFICAR (Agente: Plan)                 │
└────────────────────────────────────────────────────┘

Prompt:
"Planifica la implementación del dashboard de apoderado basándote en:
- Skill 06-dashboard-apoderado.skill.md
- El código existente del dashboard de estudiante
- La tabla parent_student_links

Identifica:
1. Archivos a crear
2. Archivos a modificar
3. Queries de Supabase necesarias
4. Componentes reutilizables"

Output del agente:
Plan de Implementación:

1. Crear src/pages/DashboardApoderado.jsx
   - Reutilizar estructura de DashboardEstudiante
   - Fetch de hijos vinculados
   - Mostrar resultados de tests de cada hijo

2. Modificar src/lib/supabase.js
   - Agregar función getLinkedStudents()
   - Agregar función getStudentTestResults(student_id)

3. Crear componentes:
   - src/components/StudentCard.jsx (resumen de hijo)
   - src/components/TestResultSummary.jsx (reutilizable)

4. Modificar App.jsx
   - Agregar ruta /dashboard/apoderado
   - Proteger con ProtectedRoute requiredRole="apoderado"

5. Queries Supabase:
   ```sql
   SELECT student_id FROM parent_student_links
   WHERE parent_id = auth.uid()

   SELECT * FROM test_results
   WHERE user_id = student_id
   ORDER BY created_at DESC
   ```

Trade-offs:
- ✅ Reutilizar componentes reduce código
- ⚠️ Necesita RLS policies correctas en Supabase
- ⚠️ Considerar privacidad: ¿qué puede ver el apoderado?

┌────────────────────────────────────────────────────┐
│  PASO 3: IMPLEMENTAR (Agente: general-purpose)     │
└────────────────────────────────────────────────────┘

Prompt:
"Implementa el dashboard de apoderado siguiendo el plan anterior.

Requisitos:
1. Sigue el skill 06-dashboard-apoderado.skill.md
2. Reutiliza componentes donde sea posible
3. Agrega manejo de errores
4. Implementa loading states
5. Mobile responsive

Crea tests unitarios para las nuevas funciones de Supabase."

Output del agente:
✓ Creado DashboardApoderado.jsx
✓ Agregado getLinkedStudents() y getStudentTestResults()
✓ Creado StudentCard component
✓ Actualizado App.jsx con nueva ruta
✓ Agregados tests para nuevas funciones
✓ Documentación actualizada en README

Archivos modificados: 5
Archivos creados: 3
Tests: 8 passing

```

---

## 6. Uso de Agentes - Implementación Incremental

### Filosofía: Baby Steps

OrientaIA sigue la filosofía de **evolución incremental**:

```
❌ NO: Reescribir todo desde cero
✅ SÍ: Agregar features una a una, probando cada paso
```

### Estrategia de Incrementos

#### Increment Pattern

```
1. DEFINIR skill
   ↓
2. EXPLORAR código existente (Agente Explore)
   ↓
3. PLANIFICAR implementación (Agente Plan)
   ↓
4. IMPLEMENTAR MVP (Agente general-purpose)
   ↓
5. PROBAR manualmente
   ↓
6. ITERAR basándose en feedback
   ↓
7. REFINAR y optimizar
   ↓
8. MARCAR skill como completo ✅
```

### Ejemplo Incremental: Feature de Suscripciones

#### Iteración 1: Modelo de Datos

```
┌─────────────────────────────────────────┐
│  Objetivo: Solo definir la estructura   │
└─────────────────────────────────────────┘

Agente: Plan

Prompt:
"Diseña el esquema de base de datos para suscripciones Stripe.

Considera:
- 3 planes: Free, Pro, Institucional
- Tabla subscriptions con user_id, plan, status
- Tabla payments para historial
- RLS policies

Output: Solo SQL schema, NO implementar aún"

Resultado:
✓ Schema SQL documentado
✓ Políticas RLS definidas
✗ Código frontend NO creado (a propósito)
✗ Integración Stripe NO implementada (a propósito)

Estado: Modelo de datos listo para revisión
```

#### Iteración 2: Integración Stripe (Backend)

```
┌─────────────────────────────────────────┐
│  Objetivo: Conectar Stripe serverless   │
└─────────────────────────────────────────┘

Agente: general-purpose

Prompt:
"Implementa la integración con Stripe:

1. Crea netlify/functions/stripe-create-checkout.js
2. Crea netlify/functions/stripe-webhook.js
3. Maneja eventos: checkout.session.completed, subscription.updated
4. Actualiza tabla subscriptions en Supabase

NO implementes UI aún, solo backend."

Resultado:
✓ Funciones serverless creadas
✓ Webhook configurado
✓ Logs implementados
✗ UI NO creada (esperando)

Estado: Backend listo para testing con Stripe CLI
```

#### Iteración 3: UI de Planes

```
┌─────────────────────────────────────────┐
│  Objetivo: Mostrar planes disponibles   │
└─────────────────────────────────────────┘

Agente: general-purpose

Prompt:
"Crea componente PricingPlans que muestre los 3 planes.

Requisitos:
1. Cards con precio, features, CTA
2. Botón "Suscribirse" llama a /stripe-create-checkout
3. Redirige a Stripe Checkout
4. NO implementes lógica de success/cancel aún

Referencia: Usa estilo de tailwind similar a landing page"

Resultado:
✓ Componente PricingPlans.jsx creado
✓ Integración con función serverless
✓ Redirección a Stripe
✗ Confirmación post-pago NO implementada (next)

Estado: Usuario puede hacer checkout, falta confirmar pago
```

#### Iteración 4: Confirmación y Acceso

```
┌─────────────────────────────────────────┐
│  Objetivo: Confirmar pago y dar acceso  │
└─────────────────────────────────────────┘

Agente: general-purpose

Prompt:
"Implementa flujo de confirmación post-pago:

1. Página /subscription/success con mensaje de éxito
2. Verificar subscription activa en Supabase
3. Actualizar estado de usuario en AuthContext
4. Mostrar features desbloqueadas en dashboard

Maneja casos:
- Usuario cancela en Stripe → volver a /pricing
- Webhook falla → polling de verificación
- Usuario recarga página → verificar estado actualizado"

Resultado:
✓ Página de éxito creada
✓ Verificación de subscription
✓ Casos edge manejados
✓ Testing manual completo

Estado: Feature completa ✅
```

### Ventajas del Enfoque Incremental

✅ **Menos riesgo** - Cambios pequeños son más seguros
✅ **Más fácil debuggear** - Sabes exactamente qué cambió
✅ **Feedback rápido** - Puedes probar cada incremento
✅ **Rollback simple** - Git commits atómicos
✅ **Progreso visible** - Cada día algo funciona mejor

---

## 7. Best Practices

### 1. Definir Skill ANTES de Codear

```
❌ MAL:
"Hey Claude, implementa suscripciones con Stripe"
→ Resultado: Código inconsistente, falta de plan

✅ BIEN:
1. Crear skill 08-suscripciones.skill.md
2. Definir entradas, salidas, restricciones
3. Revisar skill con equipo
4. LUEGO pedir a agente que implemente siguiendo el skill
→ Resultado: Implementación consistente y documentada
```

### 2. Usa el Agente Correcto para la Tarea

```
❌ MAL:
Usar general-purpose para todo
→ Resultado: Respuestas largas, contexto perdido

✅ BIEN:
- Explorar → Explore agent
- Planificar → Plan agent
- Implementar → general-purpose agent
- Dudas de Claude Code → claude-code-guide agent
→ Resultado: Respuestas enfocadas, menos tokens usados
```

### 3. Prompt Específico con Contexto

```
❌ MAL:
"Agrega OAuth"

✅ BIEN:
"Implementa Google OAuth siguiendo:
- Skill 01-auth.skill.md sección 'OAuth Providers'
- Reutiliza componentes en src/lib/auth/
- Mantén consistencia con signInWithPassword existente
- Agrega botón de Google en Login.jsx línea 45

Restricciones:
- No modificar estructura de AuthContext
- Guardar provider en user_metadata
- Redirect después de OAuth: /dashboard/estudiante"
```

### 4. Checkpoint con Skills

```
Después de cada feature implementada:

1. Actualizar skill correspondiente
   - Marcar responsabilidades como [x] completadas
   - Agregar notas de implementación
   - Documentar decisiones tomadas

2. Actualizar claude.config.md si hay cambios arquitectónicos

3. Commit atómico:
   git commit -m "feat(auth): implementar Google OAuth [Skill 01]"
```

### 5. Iteración con Feedback

```
Workflow:

┌──────────────────────┐
│ Agente implementa    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Pruebas manuales     │
└──────┬───────────────┘
       │
       ├─→ ¿Funciona? ──→ ✅ Commit y seguir
       │
       └─→ ¿Bugs? ──→ Retroalimentar al agente con error específico
              │
              ▼
         "El botón de Google OAuth no redirige correctamente.
          Error en consola: 'redirect_uri mismatch'.

          Revisa:
          - URL de redirect en supabaseClient.js
          - Configuración en Supabase Dashboard > Auth > URL Configuration
          - Comparar con signInWithPassword que sí funciona"
              │
              ▼
         Agente corrige específicamente ese issue
              │
              ▼
         Volver a probar
```

### 6. Documentar Decisiones en Skills

```
Cuando tomes una decisión de arquitectura, documéntala:

## Notas de Implementación

### Decisión: ¿Supabase Auth vs Auth0?

**Opción elegida:** Supabase Auth

**Razones:**
1. ✅ Ya usamos Supabase para BD (menos servicios)
2. ✅ RLS nativo con auth.uid()
3. ✅ Gratis hasta 50,000 usuarios
4. ✅ Email templates personalizables

**Trade-offs:**
- ⚠️ Menos providers que Auth0 (pero suficiente para MVP)
- ⚠️ Vendor lock-in con Supabase

**Fecha:** 2025-01-04
**Decidido por:** Equipo técnico
```

### 7. Skills como Single Source of Truth

```
Si el skill dice X pero el código hace Y:

1. ¿El skill está desactualizado?
   → Actualizar skill para reflejar realidad

2. ¿El código se desvió del plan?
   → Refactorizar código para seguir skill

3. ¿El skill estaba mal diseñado?
   → Revisar skill, discutir con equipo, actualizar

NUNCA: Dejar skill y código inconsistentes
```

---

## 8. Ejemplos Prácticos

### Ejemplo 1: Debugging con Agente Explore

**Problema:** El cálculo de certeza del test RIASEC siempre retorna "Alta"

```
┌──────────────────────────────────────────────────┐
│  PASO 1: Explorar el código                      │
└──────────────────────────────────────────────────┘

Agente: Explore (nivel: medium)

Prompt:
"Busca en el código dónde se calcula el nivel de certeza
del test RIASEC.

Específicamente:
- Función que calcula certeza
- Fórmula usada
- Tests unitarios de esta función
- Dónde se llama esta función"

Output:
✓ Función encontrada: src/lib/riasecScoring.js:461-472
✓ Fórmula: promedio de diferencias entre top 3 y siguientes
✓ Thresholds: ≥5 = Alta, ≥3 = Media, <3 = Exploratoria
✗ No hay tests unitarios para calcularNivelCerteza()

┌──────────────────────────────────────────────────┐
│  PASO 2: Analizar la función                     │
└──────────────────────────────────────────────────┘

Agente: general-purpose

Prompt:
"Analiza la función calcularNivelCerteza en
src/lib/riasecScoring.js líneas 461-472.

¿Por qué siempre retorna 'Alta'?

Casos de prueba:
- Puntajes: { I: 28, S: 25, A: 22, R: 18, E: 15, C: 12 }
  Esperado: Media
  Actual: Alta ❌

Dame el análisis paso a paso"

Output:
Análisis:
1. diff1a2 = 28 - 25 = 3
2. diff2a3 = 25 - 22 = 3
3. diff3a4 = 22 - 18 = 4
4. promedio = (3 + 3 + 4) / 3 = 3.33

BUG ENCONTRADO:
```javascript
if (diferenciaPromedio >= 5) return 'Alta'  // ❌ Threshold muy alto
if (diferenciaPromedio >= 3) return 'Media'
```

Con promedio = 3.33, debería retornar 'Media',
pero como 3.33 >= 3, retorna 'Media' ✅

WAIT... entonces no hay bug?

Revisar nuevamente el problema...

AH! El issue es que SIEMPRE retorna 'Alta'.
Esto significa que diferenciaPromedio siempre es >= 5.

¿Por qué?

Revisar cómo se llama la función...

┌──────────────────────────────────────────────────┐
│  PASO 3: Revisar cómo se llama                   │
└──────────────────────────────────────────────────┘

Agente: Explore

Prompt:
"Busca todos los lugares donde se llama calcularNivelCerteza.
Muéstrame el código exacto de la llamada."

Output:
Llamada encontrada en src/lib/riasecScoring.js:448
```javascript
const certeza = calcularNivelCerteza(ranking)
```

Pero `ranking` es un array de arrays: [["I", 28], ["S", 25], ...]

La función espera eso y accede con ranking[0][1], ranking[1][1]...

WAIT... revisar nuevamente la función...

```javascript
function calcularNivelCerteza(ranking) {
  // BUG: Esto accede al VALOR (puntaje), no a la dimensión
  const diff1a2 = ranking[0][1] - ranking[1][1]  // 28 - 25 = 3 ✅
  const diff2a3 = ranking[1][1] - ranking[2][1]  // 25 - 22 = 3 ✅
  const diff3a4 = ranking[2][1] - ranking[3][1]  // 22 - 18 = 4 ✅

  // ESTO está bien...
}
```

Entonces el bug NO está en calcularNivelCerteza...

Debe estar en OTRO LADO.

┌──────────────────────────────────────────────────┐
│  PASO 4: Buscar DÓNDE se muestra al usuario      │
└──────────────────────────────────────────────────┘

Agente: Grep

Pattern: "certeza.*Alta"
Output:
src/pages/Resultados.jsx:87
```javascript
{resultado.certeza === 'Alta' && (  // ❌ BUG AQUÍ
  <span className="badge-alta">Alta certeza</span>
)}
{resultado.certeza === 'Media' && (
  <span className="badge-media">Media certeza</span>
)}
{resultado.certeza === 'Exploratoria' && (
  <span className="badge-baja">Certeza exploratoria</span>
)}
```

PERO este código parece correcto...

WAIT... ¿qué tiene `resultado.certeza`?

console.log(resultado):
```json
{
  "codigo": "ISA",
  "certeza": "Media",  // ✅ Valor correcto
  ...
}
```

PERO en pantalla se muestra "Alta" ❌

AH!!!!! Encontrado!

src/pages/Resultados.jsx:45
```javascript
const [certezaMostrada, setCertezaMostrada] = useState('Alta')  // ❌ BUG

useEffect(() => {
  if (resultado) {
    setCertezaMostrada(resultado.certeza)  // Esto nunca se ejecuta
  }
}, [])  // ❌ Falta 'resultado' en dependencias
```

SOLUCIÓN:
```javascript
useEffect(() => {
  if (resultado) {
    setCertezaMostrada(resultado.certeza)
  }
}, [resultado])  // ✅ Agregar resultado
```

O mejor aún, no usar estado separado:

```javascript
// Simplemente:
<span>{resultado.certeza}</span>  // ✅ Usar directamente
```

CONCLUSIÓN:
Bug no estaba en el algoritmo, sino en el UI que no reactualizaba.
```

**Lección:** El agente Explore es excelente para debugging paso a paso.

### Ejemplo 2: Implementación Completa con Plan

**Tarea:** Agregar feature de "Guardar carreras favoritas"

```
┌──────────────────────────────────────────────────┐
│  ITERACIÓN 1: Crear Skill                        │
└──────────────────────────────────────────────────┘

Manualmente crear: skills/09-carreras-favoritas.skill.md

## Propósito
Permitir a estudiantes guardar carreras favoritas para revisarlas después

## Responsabilidades
- [ ] Marcar carrera como favorita
- [ ] Desmarcar carrera favorita
- [ ] Ver lista de carreras favoritas
- [ ] Persistir en base de datos

## Entradas
{
  user_id: string,
  carrera_id: number,
  accion: "add" | "remove"
}

## Salidas
{
  ok: boolean,
  favoritas: Array<Carrera>
}

[... etc ...]

┌──────────────────────────────────────────────────┐
│  ITERACIÓN 2: Planificar (Agente: Plan)          │
└──────────────────────────────────────────────────┘

Prompt:
"Planifica la implementación de carreras favoritas siguiendo
skill 09-carreras-favoritas.skill.md.

Considera:
- BD: tabla career_favorites
- Frontend: botón "Agregar a favoritas" en CarrerasRecomendadas
- Persistencia: funciones en src/lib/supabase.js
- UX: feedback visual (toast o similar)

Identifica:
1. Archivos a crear
2. Archivos a modificar
3. SQL schema necesario
4. Componentes UI nuevos"

Output del Plan:
```
Plan de Implementación: Carreras Favoritas

1. BASE DE DATOS
   Crear tabla:
   ```sql
   CREATE TABLE career_favorites (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id),
     career_id INTEGER NOT NULL,
     added_at TIMESTAMP DEFAULT NOW(),
     UNIQUE(user_id, career_id)
   );

   CREATE INDEX idx_favorites_user ON career_favorites(user_id);

   ALTER TABLE career_favorites ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Users manage own favorites"
     ON career_favorites FOR ALL
     USING (auth.uid() = user_id);
   ```

2. BACKEND (Supabase helpers)
   Modificar: src/lib/supabase.js

   Agregar funciones:
   ```javascript
   export const addFavoriteCareer = async (career_id)
   export const removeFavoriteCareer = async (career_id)
   export const getFavorites = async ()
   export const isFavorite = async (career_id)
   ```

3. FRONTEND - Componentes
   Modificar: src/components/CarrerasRecomendadas.jsx
   - Agregar botón "❤️ Agregar a favoritas"
   - Estado: esFavorita (per carrera)
   - onClick: toggleFavorite()

   Crear: src/components/FavoriteButton.jsx
   - Componente reutilizable
   - Props: carrera_id, onToggle
   - Estados: idle, loading, favorita

   Crear: src/pages/MisFavoritas.jsx
   - Lista de carreras favoritas
   - Botón "Quitar de favoritas"
   - Empty state: "No tienes favoritas aún"

4. RUTAS
   Modificar: src/App.jsx
   - Agregar ruta /favoritas
   - Proteger con ProtectedRoute
   - Agregar link en header/sidebar

5. UX
   - Toast notification al agregar/quitar
   - Loading state en botón
   - Animación heart icon
   - Badge con contador en nav

Orden de implementación:
1. BD (SQL) → Probar en Supabase
2. Backend (helpers) → Tests unitarios
3. FavoriteButton → Probar standalone
4. Integrar en CarrerasRecomendadas
5. Página MisFavoritas
6. Conectar rutas
7. Polish (toasts, animaciones)
```

┌──────────────────────────────────────────────────┐
│  ITERACIÓN 3: Implementar BD (Agente: general)   │
└──────────────────────────────────────────────────┘

Prompt:
"Implementa SOLO la parte de base de datos del plan anterior.

1. Crea el SQL schema en db/migrations/003_career_favorites.sql
2. Aplica la migración en Supabase
3. Verifica con query de prueba que RLS funciona

NO implementes frontend aún."

Output:
✓ Archivo SQL creado
✓ Migración aplicada
✓ RLS verificado con queries de prueba
✓ Documentado en skill (sección "Esquema BD")

┌──────────────────────────────────────────────────┐
│  ITERACIÓN 4: Backend helpers (Agente: general)  │
└──────────────────────────────────────────────────┘

Prompt:
"Implementa las 4 funciones helper en src/lib/supabase.js:
- addFavoriteCareer
- removeFavoriteCareer
- getFavorites
- isFavorite

Requisitos:
- Manejo de errores con try/catch
- Retornar {ok, data, error}
- Usar tabla career_favorites
- Tests unitarios con Jest

NO implementes UI aún."

Output:
✓ 4 funciones creadas
✓ Tests unitarios: 8 passing
✓ Documentado en skill

┌──────────────────────────────────────────────────┐
│  ITERACIÓN 5: UI - Botón (Agente: general)       │
└──────────────────────────────────────────────────┘

Prompt:
"Crea componente FavoriteButton.jsx según el plan.

Props:
- carrera_id
- initialFavorite (boolean)
- onToggle (callback)

Estados:
- idle (❤️ outline)
- loading (spinner)
- favorita (❤️ filled)

Usa:
- Framer Motion para animación
- Tailwind para estilos
- addFavoriteCareer / removeFavoriteCareer

Probar standalone en Storybook (si existe) o en página de prueba"

Output:
✓ FavoriteButton.jsx creado
✓ Animaciones implementadas
✓ Loading states
✓ Probado manualmente en /test-favorites

┌──────────────────────────────────────────────────┐
│  ITERACIÓN 6: Integración (Agente: general)      │
└──────────────────────────────────────────────────┘

Prompt:
"Integra FavoriteButton en CarrerasRecomendadas.jsx:

1. Importar FavoriteButton
2. Para cada carrera, agregar botón
3. Cargar estado inicial con isFavorite()
4. Callback onToggle actualiza lista
5. Toast notification con react-hot-toast

Ubicación: Al lado del botón 'Ver detalles'"

Output:
✓ Botón integrado
✓ Estado sincronizado
✓ Toasts implementados
✓ Probado manualmente

┌──────────────────────────────────────────────────┐
│  ITERACIÓN 7: Página Favoritas (Agente: general) │
└──────────────────────────────────────────────────┘

Prompt:
"Crea página MisFavoritas.jsx:

1. Fetch favoritas con getFavorites()
2. Reutilizar CarrerasRecomendadas component
3. Empty state con CTA 'Explora carreras'
4. Loading state
5. Botón 'Quitar de favoritas' en cada carrera

Agregar ruta en App.jsx:
/favoritas (protegida para estudiantes)"

Output:
✓ Página creada
✓ Ruta agregada
✓ Link en Header
✓ Badge con contador

┌──────────────────────────────────────────────────┐
│  ITERACIÓN 8: Polish (Agente: general)           │
└──────────────────────────────────────────────────┘

Prompt:
"Mejoras finales:

1. Agregar contador de favoritas en Header
2. Animación en badge (scale on change)
3. Optimizar queries (fetch favoritas solo una vez)
4. Error boundaries
5. Mobile responsive checks

Probar flujo completo:
- Agregar 3 carreras a favoritas
- Navegar a /favoritas
- Quitar 1 favorita
- Volver a recomendaciones
- Verificar que contador actualizó"

Output:
✓ Contador implementado
✓ Optimizaciones aplicadas
✓ Tests E2E pasando
✓ Mobile responsive ✅

┌──────────────────────────────────────────────────┐
│  FINAL: Actualizar Skill                         │
└──────────────────────────────────────────────────┘

Marcar en skills/09-carreras-favoritas.skill.md:
- [x] Marcar carrera como favorita
- [x] Desmarcar carrera favorita
- [x] Ver lista de carreras favoritas
- [x] Persistir en base de datos

Estado: 🟢 Implementado
Última actualización: 2025-01-04

✅ FEATURE COMPLETA
```

**Tiempo total:** ~6-8 horas (en incrementos de 1 hora c/u)
**Commits:** 7 commits atómicos
**Tests:** 12 unitarios + 1 E2E

---

## Conclusión

### Skills son:
✅ Especificaciones funcionales
✅ Contratos de API
✅ Documentación ejecutable
✅ Single source of truth

### Agentes son:
✅ Especializados por tarea
✅ Autónomos pero guiados
✅ Incrementales y seguros
✅ Contexto preservado

### Workflow recomendado:
1. **Definir** skill antes de codear
2. **Explorar** código existente (agente Explore)
3. **Planificar** implementación (agente Plan)
4. **Implementar** incrementalmente (agente general-purpose)
5. **Iterar** basándose en feedback
6. **Documentar** decisiones en skill
7. **Actualizar** skill al completar

### Principios:
- 🚫 NO reescribir desde cero
- ✅ Evolución incremental
- 📝 Skills como contratos
- 🤖 Agente correcto para la tarea
- 🔄 Feedback loop constante

---

**Última actualización:** 2025-01-04
**Mantenido por:** Equipo OrientaIA
**Versión:** 1.0
