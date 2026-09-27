# Corregir apariencia predictiva del informe adulto de reconversión

Feature ODD derivada de `specs/reconversion-laboral-50-mas-spec.md` §7, fila P0:
«Corregir apariencia predictiva del informe adulto previo». Criterio de aceptación
del spec: ningún monto basado en el 92 % del sueldo ni puntuación de felicidad se
presenta como pronóstico validado.

Fecha: 2026-09-27 · Rama: feat/vocari-mobile-api · Estado: en curso

## Hallazgo (evidencia)

- `backend/app/reconversion/service.py:610-612`: `income_estimate = max(base_income,
  ingreso_actual_aprox * 0.92)` cuando la preferencia por seguridad ≥ 70. Acredita
  la apariencia de conservar el sueldo sin dato de mercado.
- `service.py:641,713,727,766` y `schemas.py:247-248`: `felicidad_estimada` /
  `ingreso_estimado` presentados como estimaciones de bienestar e ingreso.
- `frontend/app/informe-reconversion/[token]/page.tsx:106,275,288` y
  `frontend/components/charts/WellbeingIncomeChart.tsx`: UI muestra «bienestar
  estimado», «ingreso estimado», «Bienestar vs ingreso», «ingreso proyectado».

## Decisiones de diseño

1. Eliminar por completo el piso salarial del 92 %: el ingreso pasa a ser solo
   referencia interna de plantilla, independiente del sueldo declarado.
2. Renombrar para retirar la apariencia predictiva (API interna, frontend y tests
   se actualizan juntos):
   - `felicidad_estimada` → `compatibilidad` (criterio interno calculado desde las
     respuestas del usuario; no es una predicción validada).
   - `ingreso_estimado` → `ingreso_referencia`.
   - `AdultReconversionGraphPoint.{felicidad,dinero}` → `{compatibilidad, ingreso_referencia}`.
   - `grafico_bienestar_ingreso` → `grafico_compatibilidad_ingreso`.
3. Explicitar procedencia: nuevo campo `ingreso_procedencia: str` con texto fijo que
   aclara que es una referencia de plantilla, no una oferta de mercado ni una
   proyección de sueldo, y que debe verificarse con fuentes reales.
4. UI: etiquetas «Compatibilidad (criterio interno)», «Ingreso de referencia»,
   nota de procedencia visible, título de gráfico y metadatos sin lenguaje
   predictivo («proyectado», «estimado»).

## Tareas

1. [x] Backend: eliminar piso 92 % y renombrar campos en `service.py` + `schemas.py`
   (incluye `_build_report_text`, la clave de ordenamiento y el shim
   `_normalize_legacy_report_payload` para informes ya guardados).
2. [x] Frontend: actualizar tipos, etiquetas, nota de procedencia, gráfico y
   metadatos en `page.tsx` y `WellbeingIncomeChart.tsx`.
3. [x] Tests y verificación:
   - `pytest tests/test_reconversion` → 16/16 pasan (incluye
     `test_report_income_is_reference_not_salary_floor` y
     `test_normalize_legacy_report_payload_maps_old_keys`).
   - `vitest run` (frontend) → 18/18 pasan.
   - eslint de los dos archivos frontend → limpio.
   - `tsc --noEmit` → 15 errores preexistentes TS2688 por directorios
     `@types/* 2` duplicados en node_modules; ninguno en los archivos de esta
     feature. Bloqueo preexistente registrado, no corregido aquí.
4. [x] Cierre: commit work-unit `fix(reconversion): ...` solo con los archivos de
   esta feature; registro de identidad del commit abajo.

### Nota de incidente (diagnóstico separado)

Durante la verificación, `pytest` y `tsc` colgaron varias veces por presión de
memoria del sistema (swap 3,1 GB / 4 GB, `Pages free` mínimas, uptime 27 días).
Se comprobó en un worktree prístino de HEAD que el comportamiento es ambiental y
preexistente, no causado por esta feature. Con la carga normalizada, la suite
completa corre en ~2 s.

## No-goals

- No tocar RIASEC escolar, `next-stage` (nueva herramienta) ni las fases P1/P2.
- No introducir fuentes de mercado reales (eso es P1 del spec).
- No modificar otras entregas locales no confirmadas ya presentes en el worktree.

## Registro de commits

- `b11ac02` (rama `feat/vocari-mobile-api`, padre `678976a`) —
  fix(reconversion): retirar apariencia predictiva del informe adulto.
  6 archivos, +290/−45 (incluye este documento).

## Revisión nativa (RDD)

- Inspect listo; el único START ofrecido proyecta los cambios sin commitear
  del workspace (32 archivos de trabajo previo de otras sesiones), no este
  commit. El proveedor rechazó proyectar el rango commiteado
  (`candidate-target-projection-drift`).
- El usuario eligió revisar el candidato del workspace.
- El START falló 3 veces de forma determinista:
  `candidate-view Git checkout-index timed out after 10000ms`. Sin lineage
  creado y sin mutación. Diagnóstico ambiental aparte: `git checkout-index
  -a -f` directo tarda 0,35 s; sin `index.lock`; `gentle-ai` CLI 3.7.0.
  Pendiente: reintentar START del workspace cuando el maquinario del
  proveedor funcione, o diagnóstico del proveedor en sesión aparte.

### Diagnóstico del incidente (cerrado, con causa raíz)

- **Causa raíz confirmada**: clase de defecto conocida y pública del
  proveedor — la materialización del candidato recorre el repo completo
  bajo un timeout fijo de 10 s por comando Git (gentle-pi issue #252,
  cerrado fixed 2.2.0; gentle-ai issues #1778 y #1957, amplificación
  per-path de subprocesos Git). Nuestro repo tiene 1.137 archivos y la
  máquina está bajo presión de memoria sostenida (swap 3,1/4 GB, uptime
  27 días): algún hijo de git del lote de `checkout-index` supera los 10 s.
- Fuente instalada: `gentle-pi@3.7.0`, `lib/review-candidate-view.ts:12`
  (`CANDIDATE_GIT_TIMEOUT_MS = 10_000`) y `:797` (`checkout-index -f --
  <lote>` por lotes de ~16 KB).
- **Escape hatch documentado del proveedor**: variable de entorno
  `GENTLE_PI_CANDIDATE_GIT_TIMEOUT_MS` (default 10.000 ms, máximo 120.000
  ms), leída del `process.env` del host de pi.
- Equivalentes manuales medidos (todos ≤0,5 s en la misma máquina):
  `read-tree` + `checkout-index` con índice temporal, hacia `/tmp` y hacia
  `.git/gentle-ai/candidate-views/`, `worktree add`, spawn de git (~5 ms).
- **Workaround recomendado**: reiniciar la máquina (27 días de uptime,
  swap saturada) y relanzar pi con
  `GENTLE_PI_CANDIDATE_GIT_TIMEOUT_MS=120000`; después reintentar el START
  del candidato workspace (elección ya registrada arriba).
- Restos de los intentos fallidos: dos vistas de candidato con 0 archivos
  en `.git/gentle-ai/candidate-views/` — inofensivas, el proveedor las
  regenera por intento.
