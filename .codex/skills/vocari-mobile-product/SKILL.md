---
name: vocari-mobile-product
description: Planificar, diseñar, implementar o revisar la aplicación Flutter gamificada de Vocari para reconversión laboral y exploración vocacional. Usar cuando se trabaje en el repositorio `vocari-mobile`, en endpoints móviles del backend Vocari, recorridos, misiones, XP, rachas, desafíos, resultados, planes de acción, animaciones, sincronización offline o documentación relacionada.
---

# Vocari Mobile Product

Construir Vocari Mobile como cliente Flutter del backend existente, preservando el criterio vocacional, la privacidad y la gamificación responsable.

## Preparar el contexto

1. Localizar el repositorio `orienta-ai` y el repositorio `vocari-mobile`, si ya existe.
2. Leer `references/product-context.md`.
3. Leer la especificación necesaria según la tarea:
   - producto: `specs/vocari-mobile-product-spec-v1.md`;
   - arquitectura: `specs/vocari-mobile-architecture-spec-v1.md`;
   - ejecución: `specs/vocari-mobile-mvp-tickets.md`.
4. Leer `AGENTS.md` del repositorio en el que se harán cambios.
5. Inspeccionar contratos y código reales antes de asumir que una especificación ya está implementada.

## Clasificar la tarea

- Para producto o UX, partir del recorrido y la señal vocacional que debe obtenerse.
- Para Flutter, trabajar por feature y mantener separadas UI, estado, datos y sincronización cuando la complejidad lo requiera.
- Para backend, reutilizar módulos existentes y mantener el servidor como fuente canónica de scoring, XP y progreso.
- Para contenido, escribir en español y evitar promesas deterministas sobre felicidad, empleo o vocación.
- Para datos laborales, incluir país, fuente y fecha de actualización.

## Flujo de implementación

1. Definir el resultado observable para la persona usuaria.
2. Identificar la misión, nodo y estado del journey afectados.
3. Confirmar el contrato API y la estrategia offline.
4. Implementar el cambio más pequeño que complete el recorrido.
5. Incluir estados de carga, vacío, error, offline, reintento y completado.
6. Verificar idempotencia en escrituras y evitar XP duplicado.
7. Añadir analítica sin PII ni respuestas sensibles.
8. Validar accesibilidad, texto ampliado y movimiento reducido.
9. Ejecutar pruebas proporcionales al riesgo y actualizar la spec si cambia una decisión estable.

## Reglas de producto

- Premiar acciones de exploración, nunca una respuesta o profesión específica.
- Presentar rutas como hipótesis con ajuste estimado, no como destino.
- Mantener las misiones entre 5 y 8 minutos.
- Terminar cada módulo con feedback y una siguiente acción clara.
- Permitir pausa, reanudación y eliminación de datos.
- Mantener un recorrido funcional cuando la IA esté deshabilitada.
- Evitar ligas, culpa por perder rachas, monetización manipulativa y estética infantil en el MVP adulto.

## Reglas técnicas

- Mantener Flutter en un repositorio independiente.
- No duplicar scoring de negocio en el cliente.
- Usar tokens distintos para editar una sesión y compartir un informe.
- Usar `Idempotency-Key` en escrituras reintentables.
- Guardar credenciales únicamente en almacenamiento seguro.
- Mantener el servidor como autoridad ante conflictos de sincronización.
- Crear cambios de esquema mediante Alembic, no mediante SQL en el arranque.
- Versionar contratos bajo `/api/v1` y verificar compatibilidad antes de publicar.

## Validar la entrega

- Ejecutar `flutter analyze` y pruebas Flutter cuando el repositorio móvil exista.
- Ejecutar pruebas backend focalizadas para endpoints modificados.
- Validar el recorrido crítico con red, sin red y reconexión.
- Confirmar que reintentar una acción no duplique progreso ni recompensas.
- Revisar contraste, lector de pantalla, áreas táctiles y `reduce motion`.
- Reportar archivos cambiados, pruebas realizadas y decisiones pendientes.

## Recursos

- Leer `references/product-context.md` para límites, mapa del sistema actual y rutas fuente.
- Usar los mockups en `public/blog/vocari-mobile/` solo como intención visual; no tratarlos como especificación pixel-perfect.
