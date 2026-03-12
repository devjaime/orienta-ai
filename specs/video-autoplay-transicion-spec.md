# Spec - Autoplay Mobile/Desktop y Transición Automática de Videos

## Objetivo
Mejorar la UX de videos del orientador virtual para que:
1. Se reproduzcan automáticamente en desktop y mobile.
2. Se puedan pausar/detener manualmente.
3. Al finalizar, avancen automáticamente a la siguiente sección con transición suave.

## Alcance
- `app/test-gratis`
- `app/(dashboard)/estudiante/orientador-virtual`
- componente reusable `VirtualAdvisorVideo`
- orquestadores `TestFlowVideoGate` y `OrientadorVirtualVideoMoments`

## Reglas funcionales
1. `autoplay` activo por defecto.
2. `muted` inicial en `true` para permitir autoplay mobile.
3. Botones explícitos:
   - `Pausar / Reanudar`
   - `Activar sonido / Silenciar`
   - `Continuar`
4. Fin de video:
   - dispara `onCompleted`
   - inicia transición visual de salida
   - luego ejecuta avance automático (`onContinue`)
5. Si usuario presiona `Continuar` antes de terminar:
   - se salta inmediatamente
   - registra evento de skip

## UX de transición
Patrón:
- fade-out + desplazamiento vertical leve (`opacity + translateY`)
- duración 350-450ms
- luego desmonta componente y muestra siguiente sección

## Analytics
Eventos:
1. `virtual_advisor_video_impression`
2. `virtual_advisor_video_play`
3. `virtual_advisor_video_pause`
4. `virtual_advisor_video_resume`
5. `virtual_advisor_video_skip`
6. `virtual_advisor_video_complete`
7. `virtual_advisor_video_error`

## Criterios de aceptación
1. Video inicia automáticamente en mobile/desktop.
2. Usuario puede pausar y retomar sin bloquear flujo.
3. Al terminar, avanza solo a la siguiente etapa.
4. Transición visual perceptible y fluida.
5. No quedan pantallas “pegadas” esperando interacción manual.
