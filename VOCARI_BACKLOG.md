# VOCARI - Backlog Técnico y Plan de Iteraciones

## Actualización Vigente (Marzo 2026)

### Arquitectura real en producción
- `vocari.cl`: React/Vite + Netlify (sitio público y adquisición).
- `app.vocari.cl`: Next.js + FastAPI + PostgreSQL (producto institucional).

### Prioridad vigente
1. Consolidar flujo test gratis -> informe IA -> encuesta -> revisión leads.
2. Implementar panel orientador (lista, detalle, notas, tareas).
3. Implementar panel admin colegio (adopción, distribución RIASEC, indecisión).
4. Agregar seguimiento automático D0/D7/D21.

### Specs fuente (vigentes)
- `specs/product-b2b-saas-spec.md`
- `specs/plan-desarrollo-dual.md`
- `specs/saas-colegios-execution-spec-v1.md`

---

## Estado Actual del Proyecto

### ✅ Implementado
- Landing page con branding Vocari (Navy #0B1A33 + Dorado #D4AF37)
- Sistema de test RIASEC completo
- Roles: estudiante, orientador, admin, admin_colegio, apoderado
- Sistema B2B de instituciones/colegios
- Sistema de pagos Flow.cl (webhook implementado)
- Reportes pagados (Plan Esencial $10.990, Premium $14.990)
- Sesiones con orientadores
- Dashboard para cada rol

### ⚠️ Pendiente de Revisar/Mejorar
- Flujo completo de pago B2C
- Sistema de términos y condiciones
- Políticas de privacidad
- SEO avanzado
- UX mobile
- Tests automatizados

---

## Modelo de Negocio

```
B2C (Pago por reporte individual)
├── Plan Esencial: $10.990 CLP
├── Plan Premium: $14.990 CLP
└── Sessions con orientador: $X CLP

B2B (Colegios)
├── Pilot: Gratis (X estudiantes)
├── Básico: $X/año por estudiante
└── Enterprise: $X/año + características premium
```

**Estrategia:** B2C sostiene B2B. Los pagos individuales financian el desarrollo del modelo institucional.

---

## Backlog Priorizado

### 🔴 PRIORIDAD ALTA (Sprint 1-2)

#### 1. Sistema de Pagos Flow.cl - COMPLETO
- [x] Webhook de Flow implementado
- [ ] Endpoint de creación de pago
- [ ] Página de retorno (FlowReturnPage)
- [ ] Manejo de errores y reintentos
- [ ] Prueba end-to-end del flujo

#### 2. Términos y Condiciones
- [ ] Página de T&C
- [ ] Política de privacidad
- [ ] Aceptación obligatoria para menores de edad
- [ ] Consentimiento de apoderados

#### 3. Landing Page SEO
- [ ] Meta tags dinámicos por página
- [ ] Schema.org para negocio local
- [ ] Sitemap.xml
- [ ] Robots.txt
- [ ] Canonical URLs

#### 4. Flujo B2C Completo
- [ ] Selección de plan
- [ ] Creación de orden en Supabase
- [ ] Redirección a Flow
- [ ] Retorno y verificación
- [ ] Generación de reporte
- [ ] Descarga de PDF

### 🟡 PRIORIDAD MEDIA (Sprint 3-4)

#### 5. Sistema B2B - Colegio
- [ ] Panel de admin_colegio
- [ ] Importación masiva de estudiantes
- [ ] Dashboard de uso por curso
- [ ] Reportes grupales
- [ ] Facturación

#### 6. Experiencia de Usuario
- [ ] Mobile-first redesign
- [ ] Loading states y skeletons
- [ ] Animaciones fluidas
- [ ] Offline handling

#### 7. Analytics
- [ ] Eventos de tracking
- [ ] Funnels de conversión
- [ ] Métricas por rol

### 🟢 PRIORIDAD BAJA (Sprint 5+)

#### 8. Funcionalidades Avanzadas
- [ ] Chat con orientador (AI-assisted)
- [ ] Comparador de carreras
- [ ] Proyecciones laborales
- [ ] Recomendaciones personalizadas

#### 9. Escalabilidad
- [ ] Tests automatizados
- [ ] CI/CD
- [ ] Monitoring

---

## Checklist de launch B2C

### Must Have
- [x] Landing page funcional
- [x] Test RIASEC completo
- [x] Resultados con carreras
- [x] Sistema de pagos PayPal ($12 / $20 USD)
- [x] Términos y condiciones
- [ ] Política de privacidad
- [ ] Email de confirmación
- [ ] PDF del reporte

### Should Have
- [ ] Chat de soporte
- [ ] FAQ
- [ ] Blog/Recursos
- [ ] Testimonios

### Nice to Have
- [ ] Programa de referidos
- [ ] Bonificaciones por sesión
- [ ] Gamificación

---

## Métricas para Launch

| Métrica | Meta Mes 1 | Meta Mes 3 |
|---------|------------|------------|
| Visitantes únicos | 1,000 | 10,000 |
| Tests completados | 100 | 1,000 |
| Reportes vendidos | 10 | 100 |
| Ingresos | $100.000 CLP | $1.000.000 CLP |
| NPS | > 7 | > 8 |

---

## Estado del Proyecto (18 Feb 2026)

### ✅ Funcionalidades Implementadas
- Landing page con branding Vocari (Navy + Dorado)
- Test RIASEC completo con resultados
- Sistema de autenticación (Google OAuth + email)
- Roles: estudiante, orientador, admin, admin_colegio, apoderado
- Sistema B2B de instituciones/colegios
- Sistema de pagos Flow.cl (webhook)
- Reportes pagados ($10.990 - $14.990 CLP)
- Sesiones con orientadores
- Dashboard para cada rol
- Múltiples páginas: landing, B2B, resultados, informes

### ⚠️ Requiere Testing/Configuración
- Flujo de pago B2C end-to-end
- Credenciales Flow.cl
- Credenciales Supabase
- Términos y condiciones

### 🔴 Pendiente
- Página de T&C y privacidad
- SEO avanzado
- Tests automatizados

---

## Tech Stack Actual

```
Frontend: React 19 + Vite + Tailwind
Backend: Supabase (PostgreSQL + Auth + Storage + Realtime)
Pagos: Flow.cl
Hosting: Netlify
```

## Necesidades de Acceso

Para continuar el desarrollo, necesito:

1. **Supabase**
   - URL del proyecto
   - Keys (anon + service_role)

2. **Flow.cl**
   - API Key
   - Secret Key
   - merchantId

3. **Google OAuth**
   - Client ID
   - Client Secret

4. **Analytics** (opcional)
   - Google Analytics ID
   - Meta Pixel

---

## Próximos Pasos Inmediatos

1. **Hoy:** Revisar Flow webhook y hacer prueba de pago
2. **Mañana:** Agregar T&C y política de privacidad
3. **Esta semana:** Completar flujo B2C end-to-end
4. **Próxima semana:** SEO y optimizaciones de velocidad

---

*Documento actualizado: 2026-02-18*
