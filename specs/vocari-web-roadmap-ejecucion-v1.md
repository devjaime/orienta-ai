# Vocari Web — Roadmap de ejecución v1

> Este documento ordena entregables. Cada fase debe cerrar con documentación, migraciones, código, pruebas, métricas y una demo verificable.

## Métrica norte

Usuarios activos semanales que completan una acción vocacional basada en evidencia (WAEU).

## Fase 0 — Fundaciones (1–2 semanas)

### Resultado

Una sola definición de producto, datos y medición sobre la cual construir.

### Entregables

- aprobar `vocari-web-experiencia-producto-v1.md`;
- declarar Next.js/FastAPI como producto principal;
- mapa de rutas actuales y plan de retiro de React/Vite;
- taxonomía de eventos y diccionario de propiedades;
- modelo de `user_journeys`, progreso, evidencia y eventos;
- estrategia i18n `es-CL`/`en`;
- configuración de pruebas frontend;
- diagnóstico del bloqueo local de build/lint/pytest.

### Definition of Done

- migración sube y baja en una base de prueba;
- eventos aceptan identificador anónimo y luego se vinculan a usuario;
- contratos de API documentados;
- pruebas unitarias de reglas de progresión y entitlements;
- CI ejecuta lint, tipos, unidad y backend.

## Fase 1 — Bucle gratuito de vocación inicial (2–3 semanas)

### Historias

1. Como visitante, completo un microdiagnóstico y veo una primera señal antes de registrarme.
2. Como usuario nuevo, elijo objetivo y ritmo sin perder el resultado invitado.
3. Como estudiante, veo una misión principal y un mapa de etapas.
4. Como estudiante, completo RIASEC en bloques y mi progreso se guarda.
5. Como estudiante, recibo 3 rutas iniciales y una acción siguiente explicada.
6. Como equipo, puedo medir adquisición, registro, activación y D7.

### Pruebas obligatorias

- migración de sesión invitada a cuenta;
- reanudación de test en otro dispositivo;
- cálculo de PE e Impulso semanal;
- no otorgar doble progreso ante reintentos;
- recorrido completo móvil en español;
- smoke del mismo recorrido en inglés;
- accesibilidad de teclado y lector de pantalla en misión.

## Fase 2 — Reconversión persistente (2–3 semanas)

### Historias

1. Un adulto elige `career_transition` y registra restricciones reales.
2. Importa o escribe experiencia y obtiene habilidades transferibles editables.
3. Compara tres tipos de ruta por ajuste, ingreso, tiempo y riesgo.
4. Completa un experimento barato antes de elegir formación.
5. Guarda un plan de 30/90 días y registra avances.

### Pruebas obligatorias

- cambio de recorrido sin pérdida de evidencia;
- localización de moneda, fechas y mercados;
- datos faltantes se muestran como no disponibles;
- rutas no prometen ingreso o empleabilidad;
- informe y plan se pueden regenerar sin duplicar historial.

## Fase 3 — Premium y Valeria (2–4 semanas)

### Historias

1. El usuario gratuito entiende qué valor adicional recibirá antes del paywall.
2. Valeria usa perfil y progreso para hacer preguntas y sugerir acciones.
3. Cada acción ofrecida puede aceptarse, completarse y medirse.
4. Los límites dependen de entitlements, no de contadores locales.
5. El usuario premium recibe revisión adaptativa y plan continuo.

### Pruebas obligatorias

- matrices de entitlement free/premium/institución;
- idempotencia de webhooks de pago;
- límites por usuario y protección de costos;
- validación de salida estructurada de IA;
- pruebas de prompt en español e inglés;
- respuestas sin fuente, promesas o decisiones absolutas son rechazadas;
- derivación segura a humano cuando corresponde.

## Fase 4 — Crecimiento orgánico (continuo)

### Entregables

- microherramientas públicas indexables;
- tarjetas compartibles sin PII;
- atribución UTM desde contenido hasta activación y pago;
- programa de invitación basado en acompañamiento, no spam;
- experimentos A/B con hipótesis y guardrails de utilidad;
- panel semanal de adquisición, activación, retención y WAEU.

### Primeros experimentos

1. CTA “haz el test” vs “descubre tu próxima misión”.
2. Registro antes vs después de la primera señal (recomendado: después).
3. Objetivo semanal de 2 vs 3 misiones.
4. Paywall tras shortlist vs tras primera conversación con Valeria.
5. Tarjeta compartible de perfil vs tarjeta de experimento completado.

## Fase 5 — Internacionalización y expansión

### Condiciones para abrir un nuevo país

- catálogo de educación y ocupaciones localizado;
- fuentes laborales con fecha y cobertura claras;
- moneda, salarios y requisitos locales;
- revisión lingüística humana de contenidos críticos;
- términos, privacidad y consentimiento adaptados;
- soporte y protocolo de escalamiento en el idioma;
- métricas separadas por país/locale.

## Backlog técnico P0

| ID | Entregable | Criterio verificable |
|---|---|---|
| WEB-001 | Modelo de recorridos | Usuario posee recorrido, objetivo, ritmo y locale |
| WEB-002 | Catálogo de nodos versionado | Dos caminos pueden compartir o variar misiones |
| WEB-003 | Progreso idempotente | Reintentar una misión no duplica PE ni eventos |
| WEB-004 | Evidencia estructurada | Cada señal tiene fuente, confianza y fecha |
| WEB-005 | Evento canónico | API persiste eventos válidos sin PII libre |
| WEB-006 | Sesión invitada | Evidencia anónima migra al registrarse |
| WEB-007 | Home gamificada | Misión, mapa e Impulso usan datos reales |
| WEB-008 | i18n base | Rutas y namespaces `es-CL`/`en` operativos |
| WEB-009 | Entitlements | Free/premium/institución resuelven capacidades |
| WEB-010 | Suite frontend | Unidad, componentes y al menos un E2E crítico |

## Secuencia inmediata recomendada

1. Resolver el bloqueo de herramientas local y fijar línea base.
2. Implementar WEB-001 a WEB-005 con Alembic y pruebas backend.
3. Implementar WEB-006 y onboarding bilingüe.
4. Reemplazar el dashboard estático con WEB-007.
5. Instrumentar el primer embudo completo.
6. Liberar a un grupo pequeño y revisar activación/D7 antes de construir premium.

