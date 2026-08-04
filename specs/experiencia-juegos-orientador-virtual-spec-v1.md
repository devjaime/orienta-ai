# Spec v1 - Experiencia de Juegos + Orientador Virtual Adaptativo

## 1. Objetivo
Evolucionar la experiencia del estudiante para que:

1. La sección de juegos deje de verse vacía y se convierta en un recorrido guiado.
2. El orientador virtual recomiende dinámicamente juegos y tests según avance, dudas y señales de indecisión.
3. Todo el flujo sea demostrable con usuarios de prueba generados por `POST /api/v1/auth/dev/setup`.

## 2. Problema actual
1. `/estudiante/juegos` puede quedar sin contenido útil percibido.
2. Orientador virtual responde, pero no orquesta próximos pasos accionables en plataforma.
3. No hay motor explícito de “siguiente mejor acción” para estudiante.
4. Gap técnico detectado:
   - frontend consulta `GET /api/v1/games?slug=...`
   - backend no filtra por `slug` en ese endpoint.

## 3. Resultado esperado
1. Estudiante recibe una “ruta recomendada” de 3 pasos:
   - juego sugerido
   - test sugerido
   - siguiente conversación con orientador virtual
2. Orientador virtual muestra CTAs concretos con links internos:
   - ir a juego específico
   - ir a test RIASEC u otro test disponible
   - volver con resultados para reinterpretación
3. Panel orientador/admin puede observar avance de ruta.

## 4. Alcance funcional (MVP comercial)

## 4.1 Nueva experiencia en `/estudiante/juegos`
1. Header con estado de progreso:
   - juegos completados
   - habilidad dominante
   - recomendación actual
2. Bloque “Ruta recomendada para ti”:
   - Juego 1 (prioridad alta)
   - Juego 2 (complementario)
   - Test sugerido posterior
3. Cada tarjeta de juego debe incluir:
   - propósito vocacional (“para qué te sirve”)
   - habilidades evaluadas
   - duración real esperada
   - botón “Jugar ahora”
4. Al terminar un juego:
   - mostrar resumen breve de habilidades detectadas
   - botón “Continuar ruta” (siguiente juego/test)
   - botón “Hablar con Valeria sobre este resultado”

## 4.2 Orientador virtual con derivación a acciones
1. Detectar intención de estudiante:
   - “estoy indeciso”
   - “quiero algo práctico”
   - “no me convence mi resultado”
   - “quiero comparar opciones”
2. Respuesta debe incluir:
   - recomendación explicada
   - CTA navegable (ruta interna)
3. Tipos de CTA mínimos:
   - `go_to_game` -> `/estudiante/juegos/[slug]`
   - `go_to_test` -> `/estudiante/tests/riasec`
   - `go_to_careers` -> `/estudiante/carreras`
4. Al volver del juego/test, Valeria utiliza ese nuevo resultado para continuar.

## 4.3 Motor de “Siguiente Mejor Acción” (NBA)
Entradas:
1. resultado RIASEC (si existe)
2. historial de juegos (`/api/v1/games/results/my`)
3. claridad vocacional (`leads.clarity_score`)
4. interacción de chat (últimos mensajes)

Salida:
1. `action_type` (`game|test|chat|careers`)
2. `target_url`
3. `reason`
4. `priority` (1-3)

Regla MVP:
1. si no hay RIASEC -> test primero.
2. si hay RIASEC y 0 juegos -> juego base según perfil.
3. si claridad <= 2 -> juego + chat de profundización + sugerir sesión orientador.
4. si completó 2+ juegos -> recomendar comparación de carreras.

## 5. Cambios técnicos

## 5.1 Backend
1. `GET /api/v1/games`:
   - agregar soporte a filtro `slug` (query param).
2. Nuevo endpoint:
   - `GET /api/v1/students/me/next-actions`
   - retorna lista ordenada de acciones sugeridas.
3. Chat orientador:
   - extender response con `actions[]` opcional:
     - `type`
     - `label`
     - `url`
4. (Opcional MVP+) persistencia:
   - `student_recommendation_events` para auditar sugerencias.

## 5.2 Frontend
1. `/estudiante/juegos`:
   - rediseño con foco en recorrido guiado.
2. `/estudiante/juegos/[slug]`:
   - corregir carga por slug con endpoint confiable.
3. `/estudiante/orientador-virtual`:
   - render de CTA cards al final de cada respuesta.
   - botón de “aplicar recomendación” que navega directo.

## 6. Analítica mínima
Eventos:
1. `game_recommended`
2. `game_started_from_advisor`
3. `game_completed`
4. `next_action_clicked`
5. `test_started_from_advisor`
6. `advisor_cta_accepted`

Campos:
1. `student_id`
2. `holland_code`
3. `clarity_score`
4. `source` (`juegos_page|orientador_virtual`)
5. `target_url`
6. `timestamp`

## 7. QA con usuario de test

Setup:
1. `POST /api/v1/auth/dev/setup` con secret válido.
2. usar `login_url_estudiante`.

Flujo de validación:
1. ingresar a `/estudiante/juegos` y ver ruta recomendada.
2. abrir juego sugerido desde CTA.
3. completar juego y ver resumen + siguiente paso.
4. ir a `/estudiante/orientador-virtual`.
5. solicitar ayuda (“no sé qué estudiar”).
6. verificar que Valeria entregue CTA a juego/test/carreras.
7. ejecutar CTA y confirmar navegación correcta.

## 8. Criterios de aceptación
1. Siempre hay una recomendación accionable en `/estudiante/juegos`.
2. Orientador virtual entrega al menos 1 CTA navegable cuando detecta necesidad.
3. El usuario de test puede completar flujo full sin errores 5xx.
4. `/api/v1/games?slug=...` o equivalente devuelve juego correcto.
5. Se registran eventos de interacción clave.

## 9. Riesgos y mitigación
1. Riesgo: recomendaciones repetitivas.
   - Mitigación: reglas de no repetición de última acción sugerida.
2. Riesgo: orientador virtual demasiado genérico.
   - Mitigación: respuesta estructurada con acciones y razón explícita.
3. Riesgo: fricción en mobile.
   - Mitigación: tarjetas CTA y juegos con diseño mobile-first y validación real.

