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
4. [ ] Cierre: commit work-unit `fix(reconversion): ...` solo con los archivos de
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

- `5e20e4b` (rama `feat/vocari-mobile-api`) — fix(reconversion): retirar
  apariencia predictiva del informe adulto. 6 archivos, +288/−45
  (incluye este documento).
