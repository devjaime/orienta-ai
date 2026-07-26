# Vocari Mobile — Producto gamificado de reconversión y exploración vocacional

> Versión: 1.0
> Estado: propuesta para descubrimiento y MVP
> Fecha: 25 de julio de 2026

## 1. Visión

Crear una aplicación Flutter de sesiones breves que ayude a jóvenes y adultos a comprender su perfil, explorar opciones reales y avanzar mediante acciones verificables. La experiencia toma como referencia el aprendizaje por recorridos, sin copiar mecánicas ni identidad de terceros.

Vocari Mobile no promete descubrir una profesión correcta. Construye hipótesis, las contrasta con decisiones y convierte el resultado en un plan de exploración.

## 2. Decisión de producto

- Crear un repositorio independiente llamado `vocari-mobile`.
- Mantener `orienta-ai/backend` como API y fuente de lógica compartida.
- Lanzar primero el recorrido para adultos en reconversión.
- Incorporar después un recorrido escolar con lenguaje, consentimiento y actividades propias.
- Mantener scoring y reglas de decisión deterministas. Usar IA solo para explicar, resumir y adaptar el lenguaje.

## 3. Audiencia inicial

### Primaria

Adultos de 24 a 45 años que sienten estancamiento, desempleo, agotamiento o necesidad de adquirir una nueva especialidad.

### Secundaria

Estudiantes de enseñanza media y personas que eligen su primera ruta educativa. Esta audiencia entra después del MVP adulto.

## 4. Promesa

En sesiones de 5 a 8 minutos, la persona puede:

1. reconocer qué actividades le dan o quitan energía;
2. identificar habilidades transferibles;
3. comparar rutas con tiempo, ingresos, fricción e inglés;
4. seleccionar una hipótesis de futuro;
5. ejecutar un plan de 30 días para validarla.

## 5. Principios de experiencia

1. **Progreso, no veredicto:** comunicar ajuste estimado y señales, nunca destino o certeza.
2. **Acción antes que consumo:** cada módulo debe terminar con una decisión o tarea observable.
3. **Sesiones pequeñas:** una misión diaria debe poder completarse en menos de ocho minutos.
4. **Contexto adulto:** evitar estética infantil, culpa por perder rachas o recompensas manipulativas.
5. **Evidencia visible:** ingresos, empleabilidad y demanda deben indicar país, fuente y fecha.
6. **Privacidad desde el diseño:** pedir solo los datos necesarios y permitir borrar o exportar el perfil.
7. **Accesibilidad:** contraste AA, controles grandes, lectores de pantalla y movimiento reducido.

## 6. Recorrido principal

### Etapa 0 — Entrada

- Elegir objetivo: explorar vocación, cambiar de profesión, mejorar trabajo actual o decidir qué aprender.
- Continuar como invitado o crear cuenta.
- Registrar contexto mínimo: etapa, profesión actual, país, tiempo disponible y restricciones.

### Etapa 1 — Descubrir

- Diagnóstico base dividido en seis misiones de cinco preguntas.
- Mapa de energía laboral.
- Inventario de habilidades transferibles.
- Resultado intermedio después de cada bloque.

### Etapa 2 — Contrastar

- Simulador de trade-offs.
- Microescenarios laborales.
- Test confirmatorio adaptado a señales dominantes.
- Registro explícito de dudas o tensiones del perfil.

### Etapa 3 — Explorar

- Tres rutas recomendadas y una ruta alternativa.
- Ficha de cada ruta con ajuste, fricción, duración, ingresos, modalidad, inglés y aprendizajes.
- Guardar, descartar o comparar rutas.
- Misiones para revisar ofertas, conversar con alguien del área o probar una tarea.

### Etapa 4 — Actuar

- Elegir una hipótesis principal.
- Generar plan de 30 días.
- Check-in semanal de energía, confianza y evidencia reunida.
- Ajustar la ruta con el comportamiento real, no solo con respuestas iniciales.

## 7. Bucle diario

1. Mostrar una única siguiente mejor acción.
2. Completar una misión de 5 a 8 minutos.
3. Entregar feedback breve y explicar qué señal se obtuvo.
4. Otorgar XP por la acción, sin premiar una respuesta particular.
5. Actualizar el mapa y desbloquear el siguiente nodo.
6. Ofrecer una reflexión o tarea para el mundo real.

## 8. Gamificación responsable

### MVP

- XP por completar misiones y validaciones externas.
- Nivel de exploración.
- Racha flexible con un comodín semanal.
- Camino visual con nodos bloqueados y completados.
- Logros por conductas: comparar, investigar, conversar y ejecutar.
- Meta semanal configurable.

### Fuera del MVP

- Ligas competitivas.
- Monedas, tienda o economía virtual.
- Feed social.
- Ranking público.
- Penalizaciones que generen ansiedad.

## 9. Funcionalidades MVP

### Inicio

- saludo, racha, nivel y progreso semanal;
- recorrido visual;
- siguiente misión;
- acceso a rutas guardadas y plan.

### Diagnóstico

- preguntas de una en una;
- guardado automático local y remoto;
- pausa y reanudación;
- feedback por bloque;
- soporte offline para misiones descargadas.

### Desafíos

- mapa de energía;
- decisiones con trade-offs;
- habilidades transferibles;
- escenario laboral breve.

### Resultados

- perfil en lenguaje prudente;
- tres rutas recomendadas;
- comparación de rutas;
- informe compartible;
- plan de 30 días.

### Perfil y operación

- autenticación Google y Apple;
- invitado recuperable;
- preferencias de notificación;
- exportación y eliminación de datos;
- analítica con consentimiento.

## 10. Animaciones y sonido

- Usar Rive para el acompañante visual y celebraciones complejas.
- Usar animaciones implícitas de Flutter para progreso, selección y transiciones.
- Reservar Lottie para recursos no interactivos de bajo costo.
- Añadir respuesta háptica suave a decisiones y logros.
- Mantener celebraciones entre 600 y 1.200 ms.
- Respetar `reduce motion` y permitir desactivar sonidos.

## 11. Métricas

### Activación

- porcentaje que completa la primera misión;
- tiempo hasta la primera señal útil;
- porcentaje que vuelve al día siguiente.

### Valor

- porcentaje que guarda al menos una ruta;
- porcentaje que inicia un plan;
- acciones reales completadas por semana;
- cambio en claridad autopercibida después de 7 y 30 días.

### Salud

- D1, D7 y D30;
- finalización por misión;
- errores de sincronización;
- abandono por pregunta;
- opt-out de notificaciones.

Métrica norte sugerida: **usuarios que completan al menos una acción de validación vocacional real por semana**.

## 12. Alcance de beta

- iOS y Android.
- Idioma español y mercado Chile.
- Recorrido adulto.
- Cuatro desafíos.
- Tres rutas recomendadas por sesión.
- Plan de 30 días.
- Notificaciones básicas.
- Panel web existente para revisión agregada.

## 13. Criterios de éxito del MVP

1. Una persona completa la primera misión en menos de ocho minutos.
2. El progreso puede retomarse en otro dispositivo.
3. Ninguna respuesta se pierde al cerrar la aplicación.
4. Cada recomendación explica señales, limitaciones y fuente de datos.
5. El usuario puede iniciar una acción real desde el resultado.
6. El recorrido funciona con IA deshabilitada mediante explicaciones base.
7. La beta alcanza estabilidad libre de fallos superior al 99,5%.

## 14. Mockups conceptuales

- `public/blog/vocari-mobile/mockup-ruta-diaria.png`
- `public/blog/vocari-mobile/mockup-desafio-energia.png`
- `public/blog/vocari-mobile/mockup-mapa-resultados.png`

Los mockups fijan intención, jerarquía y tono. No constituyen un sistema de diseño aprobado ni especificaciones pixel-perfect.
