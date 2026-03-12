# Spec Funcional - Orientador Virtual con Videos (HeyGen)

## 1. Objetivo
Integrar videos de orientador virtual (MP4) para humanizar el flujo del test vocacional en `app.vocari.cl/test-gratis`, sin bloquear la experiencia.

## 2. Alcance
Se integran 3 videos en el flujo del test:

1. Video 1 - Introducción al test.
2. Video 2 - Introducción al resultado.
3. Video 3 - Cierre motivacional.

No incluye generación de video (HeyGen). Solo integración frontend + medición de interacción.

## 3. Puntos exactos del flujo

## 3.1 Video 1 - Introducción al test
- Momento: en `step = "intro"` antes de iniciar preguntas.
- Trigger: al entrar por primera vez a `/test-gratis`.
- Regla: mostrar una sola vez por sesión (local state + `sessionStorage` opcional).

## 3.2 Video 2 - Introducción al resultado
- Momento: al terminar la última pregunta y antes de renderizar recomendaciones/informe.
- Trigger: transición `step = "test"` -> `step = "results"`.
- Regla: mostrar antes de la tarjeta de “Tu perfil vocacional es…”.

## 3.3 Video 3 - Cierre motivacional
- Momento: al final de la página de resultados, después de informe IA y encuesta.
- Trigger: cuando `reportGenerated === true` o al completar el bloque de resultados.
- Regla: mostrar al final del contenido como cierre opcional.

## 4. Comportamiento UX/UI durante reproducción

## 4.1 Reglas generales
1. El video no bloquea toda la pantalla.
2. Botón visible `Continuar` siempre activo.
3. Botón `Silenciar/Activar sonido`.
4. Si falla carga del video, mostrar texto fallback y botón `Continuar`.
5. En móvil, relación 16:9 y controles táctiles simples.

## 4.2 Patrón visual recomendado
- Contenedor tipo card destacada (no modal full-screen por defecto).
- Estados UI:
  - `loading`: skeleton del reproductor + texto “Cargando orientación…”
  - `playing`: reproductor + CTA continuar
  - `ended`: badge “Video completado” + CTA siguiente acción
  - `error`: mensaje corto + CTA continuar

## 4.3 Interacción no bloqueante
- El usuario puede:
  - saltar de inmediato (`Continuar`)
  - seguir avanzando aunque no termine el video
  - volver a reproducir con botón `Ver nuevamente` (opcional)

## 5. Diseño de componentes frontend

## 5.1 Componente reutilizable principal
Ruta sugerida: `frontend/components/orientador/VirtualAdvisorVideo.tsx`

Props:
- `videoId: "intro_test" | "intro_resultado" | "cierre_motivacional"`
- `src: string`
- `title: string`
- `description?: string`
- `autoplay?: boolean`
- `showSkip?: boolean`
- `onContinue?: () => void`
- `onCompleted?: () => void`
- `onError?: (error: unknown) => void`
- `analyticsContext?: Record<string, string | number | boolean>`

Responsabilidades:
- renderizar `<video>` responsivo con `preload="metadata"`
- lazy-load al entrar en viewport (IntersectionObserver)
- exponer eventos de analítica (play, skip, end, error)
- manejar fallback

## 5.2 Componente orquestador de flujo
Ruta sugerida: `frontend/components/orientador/TestFlowVideoGate.tsx`

Responsabilidades:
- decidir qué video mostrar según etapa de flujo
- no duplicar reproducciones (estado de sesión)
- encapsular reglas de negocio de aparición

## 5.3 Integración en página
Archivo: `frontend/app/test-gratis/page.tsx`

Puntos de integración:
1. En `step === "intro"` insertar `VideoGate(intro_test)`.
2. Antes de mostrar bloque de resultados insertar `VideoGate(intro_resultado)`.
3. Al final de resultados/informe insertar `VideoGate(cierre_motivacional)`.

## 6. Estrategia de carga y performance

1. Guardar MP4 en CDN estable (Vercel Blob, S3 o storage con cache-control).
2. Configurar:
  - `preload="none"` por defecto
  - al entrar en viewport cambiar a `preload="metadata"`
3. Poster image (`poster`) liviano por video.
4. Evitar auto-descarga simultánea de los 3 videos.
5. Si el archivo > 8-10MB, evaluar versión comprimida para móvil.

## 7. Analytics e instrumentación

Eventos mínimos por video:
1. `virtual_advisor_video_impression`
2. `virtual_advisor_video_play`
3. `virtual_advisor_video_skip`
4. `virtual_advisor_video_complete`
5. `virtual_advisor_video_error`

Payload recomendado:
- `video_id`
- `step` (`intro|results|closing`)
- `lead_id` (si existe)
- `holland_code` (si existe)
- `current_question` (solo en intro/test)
- `session_id`
- `ts`

KPIs:
1. `% usuarios que reproducen cada video`.
2. `% usuarios que saltan cada video`.
3. `% completion rate por video`.
4. impacto en `% completitud del test`.
5. impacto en `% encuesta final enviada`.

## 8. Configuración de contenido

Definir catálogo de videos en constante:
Ruta sugerida: `frontend/lib/data/virtual-advisor-videos.ts`

Ejemplo de estructura:
- `intro_test`: `{ src, title, duration_estimate, poster }`
- `intro_resultado`: `{ ... }`
- `cierre_motivacional`: `{ ... }`

Así se reemplazan URLs cuando compartas los MP4 finales sin tocar lógica de UI.

## 9. Criterios de aceptación

1. Los 3 videos aparecen en los puntos definidos del flujo.
2. Todos tienen botón `Continuar`.
3. Experiencia es usable en móvil sin bloquear avance.
4. Carga diferida funcionando (no descarga 3 videos al iniciar).
5. Eventos analytics se emiten en play/skip/complete/error.
6. Si falla un video, el usuario puede continuar sin fricción.

## 10. Plan técnico de implementación (rápido)

1. Crear `VirtualAdvisorVideo.tsx` (reusable).
2. Crear `TestFlowVideoGate.tsx` (reglas de aparición).
3. Integrar en `app/test-gratis/page.tsx`.
4. Agregar catálogo `virtual-advisor-videos.ts`.
5. Instrumentar eventos en servicio de analytics existente.
6. QA desktop + móvil + red lenta.

## 11. Entregables esperados del sprint

1. Feature flag: `NEXT_PUBLIC_VIRTUAL_ADVISOR_VIDEOS=true`.
2. Integración completa con placeholders MP4.
3. Reemplazo de URLs por videos finales HeyGen al recibirlos.
4. Checklist QA con capturas y métricas iniciales.
