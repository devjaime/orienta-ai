# Tickets - Integración Videos Orientador Virtual (HeyGen)

## Ticket 1 - Componente reusable de video guiado
### Objetivo
Crear componente base reutilizable para videos del orientador virtual.

### Archivo
- `frontend/components/orientador/VirtualAdvisorVideo.tsx`

### Criterios
1. Soporta `src`, `title`, `onContinue`, `onCompleted`.
2. Incluye botón `Continuar`.
3. Maneja estados `loading`, `playing`, `error`, `ended`.

## Ticket 2 - Orquestación por etapa de flujo
### Objetivo
Controlar qué video se muestra según etapa (`intro`, `results`, `closing`).

### Archivo
- `frontend/components/orientador/TestFlowVideoGate.tsx`

### Criterios
1. Muestra video correcto por etapa.
2. Evita mostrar el mismo video dos veces por sesión.
3. Permite skip sin romper navegación.

## Ticket 3 - Integración en /test-gratis
### Objetivo
Inyectar videos en los 3 momentos del journey.

### Archivo
- `frontend/app/test-gratis/page.tsx`

### Criterios
1. Video 1 antes del test.
2. Video 2 antes de resultados.
3. Video 3 al cierre del informe.

## Ticket 4 - Configuración de catálogo de videos
### Objetivo
Separar URLs y metadata de videos de la lógica de render.

### Archivo
- `frontend/lib/data/virtual-advisor-videos.ts`

### Criterios
1. Permite reemplazar fácilmente URLs MP4 finales.
2. Incluye `poster` y `duration_estimate`.

## Ticket 5 - Analytics de interacción
### Objetivo
Medir adopción y efectividad de los videos.

### Eventos
1. `virtual_advisor_video_impression`
2. `virtual_advisor_video_play`
3. `virtual_advisor_video_skip`
4. `virtual_advisor_video_complete`
5. `virtual_advisor_video_error`

### Criterios
1. Todos los eventos incluyen `video_id` y `step`.
2. Datos disponibles para análisis de conversión.
