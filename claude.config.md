# Claude Code - OrientaIA Configuration

## Información del Proyecto

**Nombre:** OrientaIA (antes "Brújula")
**Tipo:** SaaS de orientación vocacional con IA
**Mercado:** Chile y LATAM
**Usuarios:** Estudiantes 16-24 años, apoderados, instituciones educativas

**Estado actual:** Landing page funcional → Evolución incremental a SaaS completo
**Stack:** React + Vite + Tailwind + Netlify Functions + Supabase

---

## Reglas Globales del Proyecto

### 1. Filosofía de Trabajo

- **NUNCA reescribir desde cero** - Siempre evolucionar de forma incremental
- **Cambios seguros** - Probar antes de eliminar código existente
- **Documentar decisiones** - Cada funcionalidad debe tener su Skill definida
- **Modularidad** - Código reutilizable y fácil de mantener
- **Simplicidad** - No sobre-ingeniería, solo lo necesario

### 2. Modelo Híbrido (Determinístico + IA)

**Principio central:** La lógica vocacional es determinística y explicable. La IA es auxiliar.

- **Lógica determinística:**
  - Test Holland RIASEC (6 dimensiones)
  - Triángulo Vocacional (Gustos, Habilidades, Impacto)
  - Matching carreras basado en algoritmos transparentes

- **IA generativa:**
  - Explicación de resultados en lenguaje natural
  - Chat de acompañamiento vocacional
  - Síntesis personalizada de opciones
  - **NO para decisiones** - Solo para comunicación

### 3. Estándares de Código

#### Frontend (React)
- Componentes funcionales con hooks
- Nombres en PascalCase para componentes
- Props destructuring
- PropTypes o TypeScript (futuro)
- Archivos organizados por feature/módulo

#### Backend (Netlify Functions)
- Una función = una responsabilidad
- Validación de inputs con `try/catch`
- CORS habilitado en todas las funciones
- Headers de error consistentes
- Logs claros con `console.log` / `console.error`

#### Estilos
- Tailwind CSS como primera opción
- Clases utilitarias semánticas
- Responsive mobile-first
- Colores de marca: `orienta-dark`, `orienta-light`, `orienta-accent`

### 4. Arquitectura de Datos

#### Base de Datos: Supabase (PostgreSQL)

**Tablas principales:**
```sql
- users (id, email, created_at, metadata)
- test_results (id, user_id, test_type, scores, completed_at)
- subscriptions (id, user_id, plan, status, stripe_subscription_id)
- career_recommendations (id, user_id, career_id, score, reasoning)
```

#### Funciones Serverless (Netlify)
- Cada endpoint = un archivo en `netlify/functions/`
- Naming: `{resource}-{action}.js` (ej: `auth-login.js`)
- Retorno consistente: `{ ok: boolean, data?: any, error?: string }`

### 5. Seguridad

- **Nunca exponer secrets** - Usar variables de entorno
- **Validar todo input** - Sanitizar en backend
- **Auth en edge** - Verificar token en cada función protegida
- **CORS restrictivo en producción** - `*` solo en dev
- **Rate limiting** - Implementar en endpoints críticos (login, registro)

### 6. Skills - Sistema de Documentación

Cada funcionalidad debe tener su Skill definida en `/skills/`.

**Estructura de una Skill:**
```markdown
# [Nombre de la Skill]

## Propósito
[Una frase clara del objetivo]

## Responsabilidades
- [ ] Responsabilidad 1
- [ ] Responsabilidad 2

## Entradas
- Input 1: tipo, descripción
- Input 2: tipo, descripción

## Salidas
- Output 1: tipo, descripción

## Restricciones
- Restricción 1
- Restricción 2

## Dependencias
- Skill X
- Servicio Y

## Estados / Flujo
[Diagrama o descripción del flujo]

## Casos de Uso
1. Caso 1
2. Caso 2

## Notas de Implementación
[Detalles técnicos relevantes]
```

### 7. Git y Commits

- **Commits atómicos** - Un cambio lógico por commit
- **Mensajes descriptivos** - Formato: `tipo(scope): descripción`
  - `feat(auth): agregar login con email`
  - `fix(test): corregir cálculo de puntaje RIASEC`
  - `docs(skills): actualizar skill de billing`
- **Branches por feature** - `feature/nombre-descriptivo`
- **No commitear secrets** - Revisar antes de push

### 8. Testing (Futuro)

- Unit tests para lógica de negocio (servicios)
- Integration tests para funciones serverless
- E2E tests para flujos críticos (registro, test vocacional)

### 9. Despliegue

**Netlify (actual):**
- Build: `npm run build`
- Publish dir: `dist`
- Functions dir: `netlify/functions`

**Variables de entorno requeridas:**
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
OPENAI_API_KEY=
```

### 10. Prioridades de Desarrollo

**Fase 1 - MVP (actual):**
1. Autenticación (email + password)
2. Test vocacional completo
3. Recomendaciones de carreras
4. Dashboard básico

**Fase 2 - Monetización:**
1. Suscripciones (Stripe)
2. Planes (Free, Pro, Institucional)
3. Paywall en features premium

**Fase 3 - Escala:**
1. Chat IA avanzado
2. Tracking de progreso
3. Panel de instituciones

---

## Glosario

- **RIASEC:** Test de Holland (Realista, Investigador, Artístico, Social, Emprendedor, Convencional)
- **Triángulo Vocacional:** Modelo propio (Gustos + Habilidades + Impacto)
- **Skill:** Módulo funcional documentado en `/skills/`
- **MVP:** Producto Mínimo Viable
- **SaaS:** Software as a Service

---

## Recursos

- [Documentación Supabase](https://supabase.com/docs)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Test Holland RIASEC](https://es.wikipedia.org/wiki/Test_de_Holland)

---

**Última actualización:** 2025-12-31
**Mantenido por:** Equipo OrientaIA
