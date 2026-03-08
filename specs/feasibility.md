# Vocari - Evaluacion de Factibilidad y Riesgos

> Version: 2.0 | Fecha: Marzo 2026

---

## 1. Evaluacion de Factibilidad Tecnica

### 1.1 Google Meet Recording + Transcripcion

| Aspecto | Evaluacion | Detalle |
|---------|-----------|---------|
| **Factibilidad** | **AMARILLO - Requiere validacion** | |
| Grabacion en Meet | Funcional | Google Workspace Business Starter incluye grabacion |
| Transcripcion automatica | **Requiere verificacion** | Google genera transcripciones automaticas en Google Docs, pero la calidad en espanol y la estructura del documento pueden variar |
| Acceso via API | Funcional | Drive API + Docs API acceden al contenido |
| Domain-Wide Delegation | Factible pero complejo | Requiere admin de TI del colegio configure Service Account |

**Riesgo critico**: Google Workspace Education (gratuito para colegios) NO incluye grabacion en Meet. Solo Business Starter ($6/user/mes) y superior la incluyen. Muchos colegios chilenos usan el plan Education gratuito. Esto implica un **costo adicional por colegio** que puede ser barrera de adopcion.

**Accion requerida**: Antes de iniciar Milestone 2, verificar en una cuenta Business Starter:
1. Que la grabacion genera transcripcion automatica en espanol
2. Que la transcripcion es accesible via Docs API
3. Calidad de la transcripcion en espanol chileno
4. Latencia entre fin de sesion y disponibilidad de transcripcion

**Plan B**: Si la transcripcion automatica de Google no es satisfactoria, usar OpenAI Whisper API para transcribir el audio ($0.006/minuto, ~$0.18 por sesion de 30min). Esto agrega costo pero garantiza calidad.

### 1.2 Pipeline de IA via OpenRouter

| Aspecto | Evaluacion | Detalle |
|---------|-----------|---------|
| **Factibilidad** | **VERDE - Factible** | |
| Acceso a modelos | Estable | OpenRouter tiene uptime > 99.5% |
| Calidad de analisis en espanol | Buena | Claude y Gemini manejan espanol bien |
| Structured JSON output | Requiere validacion | No todos los modelos respetan formato JSON consistentemente |
| Costos predecibles | Si | Pay-per-token con precios publicados |

**Riesgo moderado**: La calidad del analisis de intereses y habilidades depende fuertemente del prompt engineering. Requiere iteracion con sesiones reales (no simuladas) para calibrar.

### 1.3 Migracion de React+Vite a Next.js

| Aspecto | Evaluacion | Detalle |
|---------|-----------|---------|
| **Factibilidad** | **VERDE - Factible** | |
| Compatibilidad de componentes | Alta | React 19 componentes son compatibles |
| Migracion de routing | Media | React Router v6 -> Next.js App Router requiere restructuracion |
| Tailwind migration | Baja complejidad | Tailwind 3 -> 4 tiene migration path documentado |
| Esfuerzo estimado | 2-3 semanas | Para los 30+ componentes existentes |

### 1.4 Migracion de Supabase a FastAPI + PostgreSQL

| Aspecto | Evaluacion | Detalle |
|---------|-----------|---------|
| **Factibilidad** | **VERDE - Factible** | |
| Schema PostgreSQL | Conservable | Mismo motor, schema migrable directamente |
| Auth (Supabase -> custom) | Media complejidad | Google OAuth es estandar, JWT es straightforward |
| RLS -> Application-level | Media complejidad | Reemplazar RLS con middleware + query filters |
| Data migration | Baja complejidad | pg_dump/pg_restore entre PostgreSQL instances |

### 1.5 Juegos de Evaluacion

| Aspecto | Evaluacion | Detalle |
|---------|-----------|---------|
| **Factibilidad** | **AMARILLO - Alto esfuerzo** | |
| Framework de juegos | Factible | React + Canvas/SVG es suficiente |
| Validez psicometrica | **Requiere experto** | Las metricas de juegos deben ser validadas por psicologo educacional |
| Mobile compatibility | Factible | Touch events, responsive canvas |
| Desarrollo de 5 juegos | **3-4 semanas realistas** | El estimado de 3 semanas puede ser optimista |

**Riesgo**: Sin validacion psicometrica, las metricas de juegos pueden no ser significativas. Se recomienda consultar con profesional antes de implementar.

---

## 2. Privacidad y Datos de Menores

### 2.1 Marco Legal (Chile)

| Ley | Aplicabilidad | Requisitos |
|-----|-------------|-----------|
| **Ley 19.628** (Proteccion de Datos) | Directamente aplicable | Consentimiento, finalidad, seguridad, acceso, eliminacion |
| **Ley 21.430** (Garantias de la Ninez) | Aplicable (menores) | Interes superior del nino, proteccion de privacidad |
| **Proyecto Ley de Datos Personales** (en tramite) | Anticipar | Multas hasta 2% facturacion, DPO obligatorio |

### 2.2 Requisitos de Consentimiento

```
OBLIGATORIO antes de cualquier procesamiento:

1. Consentimiento Parental Informado
   - Quien: Apoderado legal del estudiante
   - Que: Documento que explica claramente:
     a. Que datos se recopilan
     b. Como se procesan (incluyendo IA)
     c. Donde se almacenan
     d. Quien tiene acceso
     e. Periodo de retencion
     f. Derecho a revocar en cualquier momento
   - Como: Firma digital (checkbox + timestamp + IP)
   - Cuando: ANTES de primera sesion grabada

2. Consentimiento de Grabacion (por sesion)
   - Quien: Estudiante + orientador
   - Como: Aviso al inicio de la sesion de Meet
   - Registro: Timestamp de aceptacion en BD

3. Consentimiento IA
   - Quien: Apoderado (puede ser parte del consentimiento general)
   - Que: Explicar que transcripciones son analizadas por IA
   - Opt-out: Estudiante puede participar SIN analisis IA

4. Consentimiento de Datos Longitudinales
   - Quien: Apoderado
   - Que: Almacenamiento de perfil a largo plazo
   - Retencion: Maximo 2 anos post-egreso
```

### 2.3 Medidas de Proteccion Implementadas

| Medida | Implementacion |
|--------|---------------|
| PII Scrubbing | Nombres reales nunca enviados a OpenRouter |
| Encriptacion at-rest | AES-256 para campos sensibles en BD |
| Encriptacion in-transit | TLS 1.3 obligatorio |
| Anonimizacion analytics | Datos agregados sin identificadores |
| Right to erasure | Endpoint de eliminacion completa de datos |
| Data portability | Export de datos del estudiante en JSON/PDF |
| Audit trail | Log de todo acceso a datos de menores |
| Access control | RBAC + multi-tenancy + role verification |
| Data minimization | Solo datos necesarios para el servicio |
| Retencion limitada | Auto-eliminacion 2 anos post-egreso |

### 2.4 Recomendacion Legal

**Se recomienda fuertemente** contratar un abogado especializado en datos personales y proteccion de menores en Chile ANTES del lanzamiento. Los temas especificos a revisar:
1. Texto del consentimiento informado
2. Politica de privacidad
3. Terminos de servicio B2B con colegios
4. DPA (Data Processing Agreement) con OpenRouter
5. Registro de base de datos ante el Servicio Nacional

---

## 3. Seguridad

### 3.1 Threat Model

| Amenaza | Probabilidad | Impacto | Mitigacion |
|---------|-------------|---------|-----------|
| Data breach (DB) | Baja | **Critico** | Encriptacion, VPC, access control, auditing |
| Unauthorized access to student data | Media | **Critico** | RBAC, multi-tenancy, consent verification |
| Cross-tenant data leakage | Media | **Critico** | Application-level tenant isolation + automated tests |
| API abuse / DDoS | Media | Medio | Cloudflare WAF, rate limiting |
| OpenRouter API key compromise | Baja | Alto | Secret Manager, key rotation, usage alerts |
| Google Service Account compromise | Baja | **Critico** | Minimal scopes, Secret Manager, audit access |
| Insider threat (dev access) | Baja | Alto | Audit logs, production access control, no PII in dev |
| LLM prompt injection | Baja | Bajo | Input sanitization, output validation |

### 3.2 Security Checklist (Pre-Launch)

- [ ] Penetration test (externo o automatizado con OWASP ZAP)
- [ ] RBAC verified on every endpoint (automated test)
- [ ] Multi-tenancy isolation verified (automated test)
- [ ] Secrets rotated from development values
- [ ] No PII in logs
- [ ] No PII sent to LLM (verified)
- [ ] CORS configured correctly (only vocari.cl)
- [ ] Rate limiting active on all public endpoints
- [ ] SQL injection protected (parameterized queries via ORM)
- [ ] XSS protected (Next.js default escaping)
- [ ] CSRF protected (SameSite cookies)
- [ ] HTTP security headers configured
- [ ] Dependency audit (no known vulnerabilities)
- [ ] Consent enforcement verified

---

## 4. Escalabilidad

### 4.1 Capacidad por Componente

| Componente | 100 estudiantes | 1,000 estudiantes | 10,000 estudiantes |
|-----------|----------------|-------------------|--------------------|
| Cloud Run Backend | 1 instance | 2-4 instances | 8-16 instances |
| Cloud Run Workers | 1 instance | 2-4 instances | 8-16 instances |
| Cloud SQL | micro (shared) | small (1.7GB) | custom-4 (15GB) + replica |
| Redis | 1GB basic | 1GB basic | 2GB standard HA |
| OpenRouter calls/day | ~10 | ~100 | ~1,000 |
| Storage | < 5GB | ~50GB | ~500GB |

### 4.2 Bottlenecks Esperados

| Bottleneck | A partir de | Solucion |
|-----------|------------|---------|
| AI processing queue | 500+ sesiones/dia | Mas workers, prioridad de queues |
| Database connections | 2,000+ concurrent users | Connection pooling (PgBouncer), read replicas |
| Google API rate limits | 1,000+ sesiones/dia | Request batching, caching, multiple service accounts |
| Redis memory | 10,000+ cached items | Eviction policy, tiered TTL |
| PDF generation | 100+ reportes simultaneos | Dedicated worker queue, async generation |

### 4.3 Path to 10,000+ Estudiantes

```
1,000 -> 5,000:
  - Cloud SQL upgrade a dedicated instance
  - Add read replica for dashboards
  - Increase worker count to 4-8
  - Cache optimization (target 50% hit rate)

5,000 -> 10,000:
  - Cloud SQL HA with failover
  - Multiple read replicas
  - Consider AlloyDB migration
  - Redis Standard HA
  - CDN caching for static assets
  - Database partitioning (audit_log, test_results by year)

10,000+:
  - Evaluate extracting AI Engine to separate service
  - Database sharding by institution
  - Multi-region deployment (Chile + other LATAM)
  - Enterprise-grade monitoring (Datadog/New Relic)
```

---

## 5. Riesgos de Negocio

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|-----------|
| **Google Workspace Edu no incluye grabacion** | **Alta** | **Critico** | Verificar ANTES. Si confirmado: el colegio debe pagar Business Starter ($6/user/mes) o usar Whisper API como transcriptor |
| Colegios con bajo presupuesto tech | Alta | Alto | Tier de pricing: plan basico sin grabacion (solo tests + matching), plan premium con sesiones grabadas |
| Ciclo de venta largo (escolar) | Alta | Medio | Pilotos gratuitos en marzo-abril, contratos anuales |
| Orientadores resistentes a tecnologia | Media | Alto | UX muy simple, capacitacion incluida, valor claro (ahorro de tiempo) |
| Datos MINEDUC desactualizados | Baja | Medio | Script de actualizacion anual, fuente publica |
| OpenRouter cambia pricing | Baja | Medio | Abstraccion de client permite cambiar de provider |
| Competencia (startups similares en Chile) | Media | Medio | Diferenciador: analisis de sesiones con IA + perfil longitudinal |
| Regulacion mas estricta | Media | Alto | Compliance by design, abogado desde el inicio |

---

## 6. Resumen de Viabilidad

### Veredicto: **VIABLE con condiciones**

| Area | Veredicto | Condicion |
|------|----------|-----------|
| Stack tecnico (FastAPI + Next.js) | **VIABLE** | Equipo con experiencia en Python y React |
| Google Workspace integration | **VIABLE CON RIESGO** | Validar plan Business Starter + transcripcion en espanol |
| Pipeline IA (OpenRouter) | **VIABLE** | Prompt engineering iterativo con datos reales |
| Privacidad de menores | **VIABLE** | Contar con abogado especializado |
| Economia del negocio | **ALTAMENTE VIABLE** | Margenes > 80% con costos IA optimizados |
| Escalabilidad | **VIABLE** | Arquitectura soporta 10,000+ estudiantes sin rediseno |
| Juegos de evaluacion | **VIABLE CON RIESGO** | Requiere validacion psicometrica profesional |
| Timeline (24 semanas) | **AGRESIVO** | Realista con equipo de 3-4 devs full-time |

### Acciones Inmediatas (Antes de Escribir Codigo)

1. **Validar Google Meet transcripcion** con cuenta Business Starter real
2. **Consultar abogado** sobre consentimiento de menores y proteccion de datos
3. **Consultar psicologo educacional** sobre validez de metricas de juegos
4. **Estimar costo real de Google Workspace** para colegios target
5. **Definir tier de pricing** que funcione sin grabacion (plan basico)

---

## 7. Timeline Consolidado

```
Semanas 1-4:   M1 - Backend Foundation
Semanas 3-6:   M2 - Google Workspace Integration
Semanas 5-8:   M3 - AI Engine Pipeline
Semanas 5-8:   M4 - Frontend Foundation (paralelo con M3)
Semanas 9-12:  M5 - Tests Adaptativos + Perfil Longitudinal
Semanas 11-14: M6 - Dashboards Completos
Semanas 15-20: M7 - Juegos + Simulaciones
Semanas 19-24: M8 - Infra + Deployment + Launch

Total: ~24 semanas (6 meses) con equipo de 3-4 devs

Hitos de entrega parcial:
  Semana 8:  Demo funcional (sesion -> transcripcion -> analisis IA)
  Semana 14: MVP deployable (todos los dashboards, tests, recomendaciones)
  Semana 20: Feature-complete (juegos, simulaciones, reportes)
  Semana 24: Production launch
```
