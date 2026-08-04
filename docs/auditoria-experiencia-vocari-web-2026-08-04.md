# Auditoría de experiencia Vocari Web

> Fecha: 2026-08-04
> Alcance: repositorio local, `vocari.cl` y `app.vocari.cl`

## Resumen ejecutivo

Vocari ya contiene buena parte de las capacidades necesarias: test RIASEC, informes, reconversión, juegos, datos laborales, Valeria, roles institucionales y un motor básico de siguiente acción. Sin embargo, hoy se perciben como módulos separados y no como una experiencia continua.

La prioridad no es sumar más módulos. Es construir una columna vertebral común de recorrido, progreso, evidencia, acceso freemium y analítica.

## Estado observado

### Fortalezas

- arquitectura moderna disponible en `frontend/` y `backend/`;
- separación entre adquisición y aplicación ya documentada;
- flujo público de test y flujo de reconversión implementados;
- juegos y resultados persistibles;
- perfil longitudinal y recomendaciones de siguiente acción;
- Valeria puede devolver CTA internos;
- datos MINEDUC/SIES y foco en decisiones basadas en evidencia;
- roles y paneles B2B ya modelados;
- existe telemetría cliente básica mediante `trackEvent`.

### Brechas críticas

1. El dashboard de estudiante muestra métricas fijas (`0`, `1`, `5`, `--`) y no comunica avance real.
2. No existe un onboarding que separe vocación inicial de reconversión dentro de una cuenta persistente.
3. No existe un modelo común de camino, nodos, misiones, PE, Impulso o desbloqueos.
4. La analítica del frontend solo dispara eventos en el navegador; no hay almacenamiento canónico append-only.
5. El freemium individual no está modelado. El campo `plan` actual corresponde principalmente a instituciones.
6. Valeria no tiene entitlements, memoria estructurada ni historial de acciones aceptadas/completadas.
7. La internacionalización es parcial: hay un archivo de copy, pero la mayoría de la interfaz y datos siguen codificados en español.
8. Conviven una aplicación React/Vite heredada y una aplicación Next.js. Continuar desarrollando ambas aumenta duplicación y divergencia.
9. El backend combina Alembic con DDL ejecutado en el arranque. Esto dificulta despliegues repetibles y pruebas de migración.
10. El frontend Next.js no tiene suite automatizada configurada.

## Decisiones recomendadas

1. `vocari.cl`: adquisición, contenido, SEO y entrada a diagnósticos.
2. `app.vocari.cl`: única aplicación de producto y cuentas.
3. React/Vite raíz: mantenimiento correctivo y migración, sin nuevas capacidades de producto.
4. PostgreSQL/FastAPI: fuente de verdad para cuentas, progreso, eventos y entitlements.
5. Alembic: única vía de migraciones nuevas.
6. Eventos propios primero; PostHog u otro proveedor puede actuar como destino, no como fuente de verdad.
7. Un recorrido compartido y dos configuraciones de contenido: `first_vocation` y `career_transition`.

## Diferencia con la experiencia objetivo

| Área | Hoy | Objetivo |
|---|---|---|
| Inicio | Dashboard de módulos | Misión de hoy + camino visible |
| Progreso | Valores estáticos o dispersos | Estado persistente, PE, Impulso y evidencias |
| Personalización | RIASEC + reglas aisladas | Siguiente acción basada en recorrido completo |
| Reconversión | Flujo público paralelo | Recorrido guardado dentro de la cuenta |
| IA | Chat y reportes | Agente con memoria estructurada, acciones y límites |
| Freemium | Informes/planes parciales | Entitlements individuales e institucionales |
| Métricas | Evento cliente no persistido | Evento canónico + embudos + resultados |
| Idiomas | Copy parcial en español | `es-CL` y `en` en rutas, contenido y prompts |
| Pruebas | Backend amplio; frontend sin suite | Unidad + integración + E2E de flujos críticos |

## Riesgos inmediatos

- Gamificar solo con puntos puede aumentar actividad sin mejorar decisiones.
- Un paywall prematuro puede destruir confianza después de un test largo.
- Un chat sin fuentes o memoria puede sonar convincente y ser poco útil.
- Mezclar menores y adultos en el mismo lenguaje/onboarding reduce relevancia y complica privacidad.
- Internacionalizar solo el texto no resuelve catálogo, moneda, educación ni mercado laboral por país.

## Línea base de calidad

La primera ejecución quedó detenida porque iCloud había descargado localmente los contenidos de `frontend/node_modules` y `backend/.venv`: 34.287 y 11.649 archivos figuraban como `dataless`. Se reconstruyeron ambas dependencias desde `package-lock.json` y `uv.lock`.

Después de corregir problemas de infraestructura:

- frontend `npm run build`: aprobado, 39 rutas generadas;
- frontend `npm run lint`: aprobado con 20 advertencias heredadas y 0 errores;
- frontend `npm test`: 5 pruebas aprobadas sobre el scoring RIASEC;
- backend `pytest`: 362 aprobadas, 10 omitidas y 9 fallidas.

Las 9 fallas backend restantes se agrupan en autenticación MVP/refresh (2), diferencias del algoritmo de compatibilidad de carreras frente a sus pruebas (5), procesamiento de follow-ups (1) y contrato de RIASEC sin institución (1). Deben resolverse antes de usar la suite completa como puerta de CI.
