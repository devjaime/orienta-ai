# Vocari - Spec de QA Comercial con `auth/dev/setup` (v1)

## 1. Objetivo
Estandarizar un flujo de prueba end-to-end usando:

- `POST https://vocari-api.fly.dev/api/v1/auth/dev/setup`

para validar rápidamente la plataforma por rol y dejar evidencia para venta institucional a:

1. Colegios
2. Preuniversitarios
3. Universidades

## 2. Alcance
Este spec cubre:

1. Generación automatizada de usuarios de prueba por rol.
2. Validación funcional de rutas críticas frontend + API.
3. Checklist de readiness comercial para pilotos pagados.

No cubre:

1. Hardening de seguridad productiva del endpoint dev (va como riesgo controlado al final).

## 3. Endpoint de arranque (bootstrap)

### 3.1 Request base (curl)

```bash
curl --request POST 'https://vocari-api.fly.dev/api/v1/auth/dev/setup' \
  --header 'Content-Type: application/json' \
  --data '{"secret":"vocari-dev-2026"}'
```

### 3.2 Request base (Postman)

```bash
POST https://vocari-api.fly.dev/api/v1/auth/dev/setup
Content-Type: application/json

{
  "secret": "vocari-dev-2026"
}
```

### 3.3 Resultado esperado
Respuesta `200` con:

1. `status: "ok"`
2. `users[]` con roles:
   - `estudiante`
   - `apoderado`
   - `orientador`
   - `admin_colegio`
   - `super_admin`
3. por usuario:
   - `access_token`
   - `refresh_token`
   - `login_url`

## 4. Configuración de Postman (obligatoria)

## 4.1 Variables de environment

1. `base_url = https://vocari-api.fly.dev`
2. `dev_secret = vocari-dev-2026`
3. `token_estudiante`
4. `token_apoderado`
5. `token_orientador`
6. `token_admin_colegio`
7. `token_super_admin`
8. `login_url_estudiante`
9. `login_url_orientador`
10. `login_url_admin`

## 4.2 Script tests en `auth/dev/setup`
Guardar tokens automáticamente:

```javascript
const json = pm.response.json();
pm.test("status ok", function () {
  pm.expect(pm.response.code).to.eql(200);
  pm.expect(json.status).to.eql("ok");
});

json.users.forEach((u) => {
  pm.environment.set(`token_${u.role}`, u.access_token);
  if (u.role === "estudiante") pm.environment.set("login_url_estudiante", u.login_url);
  if (u.role === "orientador") pm.environment.set("login_url_orientador", u.login_url);
  if (u.role === "admin_colegio") pm.environment.set("login_url_admin", u.login_url);
});
```

## 5. Matriz de QA por rol

## 5.1 Base de autenticación
Todas las requests autenticadas deben enviar:

`Authorization: Bearer {{token_rol}}`

Endpoint mínimo común:

`GET {{base_url}}/api/v1/auth/me`

Esperado:

1. `200`
2. `role` coincide con token.
3. `institution` presente para roles institucionales.

## 5.2 Estudiante

### API
1. `GET /api/v1/sessions`
2. `POST /api/v1/tests/submit`
3. `GET /api/v1/careers/recommendations?holland_code=...`

### Frontend
1. Login con `login_url_estudiante`
2. Flujo `/test-gratis` completo
3. Visualización de informe en la misma página

## 5.3 Orientador

### API
1. `GET /api/v1/orientador/students`
2. `GET /api/v1/orientador/students/{id}`
3. `POST /api/v1/orientador/students/{id}/notes`
4. `POST /api/v1/orientador/students/{id}/tasks`

### Frontend
1. `/orientador/estudiantes`
2. Ficha estudiante con:
   - notas
   - tareas
   - histórico IA
   - exportación PDF

## 5.4 Admin Colegio

### API
1. `GET /api/v1/admin/metrics`
2. `GET /api/v1/admin/metrics?curso=...&periodo=YYYY-MM`
3. `GET /api/v1/admin/insights`

### Frontend
1. `/admin/metricas` (filtros + export CSV)
2. `/admin/insights` (cohortes + alertas indecisión)

## 5.5 Super Admin

### API
1. `GET /api/v1/dashboards/super-admin`

### Frontend
1. `/super-admin`
2. `/super-admin/instituciones`

## 6. Casos de prueba críticos de negocio

## 6.1 Flujo comercial mínimo demo
1. `dev/setup` crea entorno demo.
2. Estudiante completa test.
3. Se genera informe IA persistido.
4. Orientador revisa estudiante y agrega nota.
5. Admin ve impacto en métricas/insights.

## 6.2 Criterio de éxito
1. Sin errores `5xx`.
2. Tiempos de respuesta < 2s en paneles.
3. Datos visibles y coherentes entre módulos.

## 7. “Listo para vender” por segmento

## 7.1 Colegio (licencia anual)
Debe estar validado:
1. Flujo estudiante -> orientador -> admin.
2. Reporte exportable para apoderados.
3. Métricas por curso y alertas de indecisión.

## 7.2 Preuniversitario
Debe estar validado:
1. Test + informe IA rápido (fricción baja).
2. Comparación de carreras y claridad vocacional.
3. Seguimiento semanal (D0/D7/D21).

## 7.3 Universidad (admisión/retención temprana)
Debe estar validado:
1. Segmentación por cohorte.
2. Alertas de desalineación vocacional.
3. Reportes agregados exportables para gestión académica.

## 8. Artefactos de demo comercial (obligatorios)
1. Colección Postman `Vocari-Sales-QA.postman_collection.json`
2. Environment Postman `Vocari-Prod-Demo.postman_environment.json`
3. Script de bootstrap (`dev/setup`)
4. Video corto (3-5 min) mostrando flujo por rol
5. PDF one-pager de métricas de impacto

## 9. KPIs para pre-venta/piloto
1. `% estudiantes con test completo`
2. `% estudiantes con claridad >= 4`
3. `% estudiantes con alerta de indecisión`
4. `tiempo medio de revisión orientador`
5. `% uso semanal de panel admin`

## 10. Riesgos y control
1. Riesgo: endpoint `dev/setup` expuesto en productivo.
   - Control MVP: secreto robusto y rotación semanal.
   - Control siguiente fase: restringir por IP y ocultar endpoint del schema público.
2. Riesgo: datos demo mezclados con productivos.
   - Control: prefijo claro (`test.*@vocari.cl`) y limpieza semanal.

## 11. Definition of Done
1. Colección Postman corre completa sin fallos críticos.
2. Evidencia de pruebas por rol (capturas + logs).
3. Demo de 20 minutos replicable para cliente institucional.
4. Criterios comerciales por segmento marcados en verde.

