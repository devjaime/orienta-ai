# Contexto de producto y sistema

## Objetivo

Vocari Mobile convierte el diagnóstico vocacional en un recorrido breve y accionable. El MVP se enfoca en adultos en reconversión; el recorrido escolar se incorpora después.

## Fuentes canónicas del repositorio

- `specs/vocari-mobile-product-spec-v1.md`: alcance, experiencia y métricas.
- `specs/vocari-mobile-architecture-spec-v1.md`: repositorios, seguridad, API, datos y offline.
- `specs/vocari-mobile-mvp-tickets.md`: orden de ejecución y aceptación.
- `specs/reconversion-vocacional-adultos-spec-v1.md`: scoring y flujo adulto existente.
- `backend/app/reconversion/`: implementación actual del backend.
- `frontend/app/reconversion-gratis/page.tsx`: referencia web, no plantilla arquitectónica para Flutter.
- `frontend/components/games/`: mecánicas existentes que pueden reinterpretarse.

## Decisiones estables

1. Crear Flutter en `vocari-mobile`, separado de `orienta-ai`.
2. Compartir FastAPI, PostgreSQL, scoring, carreras e informes.
3. Mantener scoring y progreso canónico en servidor.
4. Usar IA solo para explicación o adaptación del lenguaje.
5. Diseñar primero para adultos, con sesiones de 5 a 8 minutos.
6. Recompensar exploración y evidencia real, no respuestas específicas.

## Riesgos conocidos antes del móvil

- Operaciones públicas de reconversión requieren credencial privada adicional al UUID.
- El enlace público de informe debe ser distinto de la autorización de edición.
- El esquema debe migrar con Alembic en vez de depender de cambios al iniciar FastAPI.
- Los reintentos móviles exigen idempotencia en respuestas, progreso y XP.
- La recuperación offline debe mostrar claramente si un cambio está pendiente.

## Identidad visual conceptual

- Fondo: `#FAF8FF`.
- Tinta: `#131B2E`.
- Primario: `#4F46E5`.
- Violeta: `#7C3AED`.
- Turquesa: `#06B6D4`.
- Dorado: `#D9B44A`, solo como acento.
- Tono adulto, luminoso y confiable; evitar infantilización.

## Mockups

- `public/blog/vocari-mobile/mockup-ruta-diaria.png`.
- `public/blog/vocari-mobile/mockup-desafio-energia.png`.
- `public/blog/vocari-mobile/mockup-mapa-resultados.png`.

Usarlos para comprender jerarquía y tono. Validar toda decisión de interfaz con accesibilidad y pruebas de usuario.
