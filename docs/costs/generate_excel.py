#!/usr/bin/env python3
"""
Vocari / OrientaIA — Generador de Modelo de Costos v2
Incluye: CLP + USD, flujo completo del estudiante, Google Meet + Workspace,
         nuevos costos de IA, plan de inversión mensual detallado.

Ejecutar: python3 docs/costs/generate_excel.py
Salida:   docs/costs/vocari_modelo_costos.xlsx
"""

import xlsxwriter
import os

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "vocari_modelo_costos.xlsx")

# ─── TIPO DE CAMBIO ───────────────────────────────────────────────────────────
USD_TO_CLP = 950   # 1 USD ≈ 950 CLP (Marzo 2026, referencial)

def clp(usd):
    return usd * USD_TO_CLP

# ─── NUEVO MODELO DE COSTOS ───────────────────────────────────────────────────
# Google Workspace Business Standard incluye:
# - Grabación de Google Meet a Drive (automático)
# - Transcripción automática de Meet (≈ gratis, sin costo extra)
# - 2TB Drive por usuario
# Por lo tanto, el costo de transcripción DESAPARECE del modelo variable.

# COSTO AI POR ESTUDIANTE/MES (Claude 3.5 Sonnet + Haiku)
# Desglose por interacción:
# - Resumen sesión (Sonnet): 4 × $0.045 = $0.18
# - Cuestionario post-sesión (Sonnet): 4 × $0.039 = $0.16
# - Juegos/tests interactivos (Haiku): 20 × $0.002 = $0.04
# - Informe de progreso mensual (Sonnet): 1 × $0.09 = $0.09
# - Proyección de carrera (Sonnet): 1 × $0.06 = $0.06
# - Simulación "vida futura" (Sonnet): 1 × $0.10 = $0.10
# - Check-in felicidad (Haiku): 2 × $0.001 = $0.002
# - Informe para apoderados (Sonnet): 1 × $0.05 = $0.05
# Total aprox.: $0.70 → redondeamos a $0.80 (conservador)

AI_POR_ESTUDIANTE = 0.80          # USD/estudiante/mes
BD_POR_ESTUDIANTE = 0.30          # USD/estudiante/mes
SESIONES_POR_MES  = 4             # sesiones de 30 min
PRECIO_ESTUDIANTE = 20.00         # precio sugerido B2B

ESCENARIOS = [
    (10,    10,    1),
    (30,    30,    1),
    (50,    50,    1),
    (100,   100,   1),
    (200,   200,   2),
    (500,   500,   5),
    (1000,  1000,  10),
    (5000,  5000,  50),
]

def infra_fija(n):
    """Costo fijo mensual de infraestructura según escala."""
    if n <= 100:
        return 100    # Workspace Standard + tiers gratuitos + dev tools
    elif n <= 500:
        return 125    # + Supabase Pro ($25)
    elif n <= 2000:
        return 155    # + Netlify Pro ($19) + monitoreo
    elif n <= 5000:
        return 230    # + Netlify Business + Supabase enhanced
    else:
        return 650    # + Supabase Team

def calcular(n, a, o):
    ai   = n * AI_POR_ESTUDIANTE
    bd   = n * BD_POR_ESTUDIANTE
    fija = infra_fija(n)
    total   = ai + bd + fija
    por_est = total / n
    ingresos = n * PRECIO_ESTUDIANTE
    margen   = (ingresos - total) / ingresos if ingresos > 0 else 0
    return ai, bd, fija, total, por_est, ingresos, margen

ROWS = [(n, a, o, *calcular(n, a, o)) for n, a, o in ESCENARIOS]

# ─── COLORES ──────────────────────────────────────────────────────────────────
NAVY    = "#0C1E3C"
BLUE    = "#33B5E5"
LIGHT   = "#F5F7FA"
GREEN   = "#27AE60"
ORANGE  = "#E67E22"
RED     = "#E74C3C"
GOLD    = "#F39C12"
WHITE   = "#FFFFFF"
DGRAY   = "#2C3E50"
MGRAY   = "#7F8C8D"
LGRAY   = "#ECF0F1"
TEAL    = "#1ABC9C"
PURPLE  = "#8E44AD"

# ─── WORKBOOK ─────────────────────────────────────────────────────────────────
wb = xlsxwriter.Workbook(OUTPUT_PATH)
wb.set_properties({
    "title":   "Vocari — Modelo de Costos de Infraestructura v2",
    "subject": "Costos SaaS en USD y CLP — Flujo completo con Google Meet",
    "author":  "Vocari / OrientaIA",
})

def fmt(d):
    return wb.add_format(d)

# ─── FORMATOS ─────────────────────────────────────────────────────────────────
F = {}

# Títulos
F["title"] = fmt({"bold":True,"font_size":18,"font_color":WHITE,
    "bg_color":NAVY,"align":"center","valign":"vcenter"})
F["title_teal"] = fmt({"bold":True,"font_size":14,"font_color":WHITE,
    "bg_color":TEAL,"align":"center","valign":"vcenter"})
F["subtitle"] = fmt({"bold":True,"font_size":10,"font_color":BLUE,
    "align":"left","bottom":2,"bottom_color":BLUE})

# Headers de tabla
F["th"] = fmt({"bold":True,"font_size":9,"font_color":WHITE,
    "bg_color":NAVY,"align":"center","valign":"vcenter",
    "border":1,"border_color":BLUE,"text_wrap":True})
F["th_blue"] = fmt({"bold":True,"font_size":9,"font_color":WHITE,
    "bg_color":BLUE,"align":"center","valign":"vcenter",
    "border":1,"border_color":NAVY,"text_wrap":True})
F["th_teal"] = fmt({"bold":True,"font_size":9,"font_color":WHITE,
    "bg_color":TEAL,"align":"center","valign":"vcenter",
    "border":1,"border_color":NAVY,"text_wrap":True})

# Números
F["num"]     = fmt({"num_format":"#,##0","align":"center","border":1,"border_color":"#D5D8DC"})
F["num_a"]   = fmt({"num_format":"#,##0","align":"center","border":1,"border_color":"#D5D8DC","bg_color":LIGHT})
F["usd"]     = fmt({"num_format":"US$#,##0.00","align":"right","border":1,"border_color":"#D5D8DC"})
F["usd_a"]   = fmt({"num_format":"US$#,##0.00","align":"right","border":1,"border_color":"#D5D8DC","bg_color":LIGHT})
F["usd2"]    = fmt({"num_format":"US$#,##0","align":"right","border":1,"border_color":"#D5D8DC"})
F["usd2_a"]  = fmt({"num_format":"US$#,##0","align":"right","border":1,"border_color":"#D5D8DC","bg_color":LIGHT})
F["clp"]     = fmt({"num_format":"$#,##0","align":"right","border":1,"border_color":"#D5D8DC","font_color":"#1A5276"})
F["clp_a"]   = fmt({"num_format":"$#,##0","align":"right","border":1,"border_color":"#D5D8DC","font_color":"#1A5276","bg_color":LIGHT})
F["pct"]     = fmt({"num_format":"0.0%","align":"center","border":1,"border_color":"#D5D8DC"})
F["pct_a"]   = fmt({"num_format":"0.0%","align":"center","border":1,"border_color":"#D5D8DC","bg_color":LIGHT})

# Especiales
F["total"]   = fmt({"bold":True,"num_format":"US$#,##0","align":"right",
    "bg_color":NAVY,"font_color":WHITE,"border":1,"border_color":BLUE})
F["total_clp"]= fmt({"bold":True,"num_format":"$#,##0","align":"right",
    "bg_color":DGRAY,"font_color":GOLD,"border":1,"border_color":BLUE})
F["green_pct"]= fmt({"bold":True,"num_format":"0%","align":"center",
    "bg_color":GREEN,"font_color":WHITE,"border":1,"border_color":BLUE})
F["orange_pct"]= fmt({"bold":True,"num_format":"0%","align":"center",
    "bg_color":ORANGE,"font_color":WHITE,"border":1,"border_color":BLUE})
F["red_pct"] = fmt({"bold":True,"num_format":"0%","align":"center",
    "bg_color":RED,"font_color":WHITE,"border":1,"border_color":BLUE})

# Texto
F["txt"]     = fmt({"align":"left","valign":"vcenter","border":1,"border_color":"#D5D8DC","font_size":9})
F["txt_a"]   = fmt({"align":"left","valign":"vcenter","border":1,"border_color":"#D5D8DC","font_size":9,"bg_color":LIGHT})
F["txt_c"]   = fmt({"align":"center","valign":"vcenter","border":1,"border_color":"#D5D8DC","font_size":9})
F["txt_ca"]  = fmt({"align":"center","valign":"vcenter","border":1,"border_color":"#D5D8DC","font_size":9,"bg_color":LIGHT})
F["section"] = fmt({"bold":True,"font_size":10,"font_color":NAVY,"bg_color":LGRAY,
    "align":"left","valign":"vcenter","left":3,"left_color":BLUE,
    "bottom":1,"bottom_color":"#BDC3C7"})
F["formula"] = fmt({"font_name":"Courier New","font_size":9,"font_color":DGRAY,
    "bg_color":"#F8F9FA","align":"left","border":1,"border_color":"#D5D8DC"})
F["note"]    = fmt({"font_size":8,"font_color":MGRAY,"italic":True,"align":"left"})
F["link"]    = fmt({"font_size":8,"font_color":BLUE,"underline":1,"align":"left"})
F["flow_box"]= fmt({"bold":True,"font_size":9,"font_color":WHITE,"bg_color":NAVY,
    "align":"center","valign":"vcenter","border":2,"border_color":BLUE,"text_wrap":True})
F["flow_ai"] = fmt({"bold":True,"font_size":9,"font_color":WHITE,"bg_color":PURPLE,
    "align":"center","valign":"vcenter","border":2,"border_color":PURPLE,"text_wrap":True})
F["flow_data"]= fmt({"bold":True,"font_size":9,"font_color":WHITE,"bg_color":TEAL,
    "align":"center","valign":"vcenter","border":2,"border_color":TEAL,"text_wrap":True})
F["flow_out"]= fmt({"bold":True,"font_size":9,"font_color":WHITE,"bg_color":GREEN,
    "align":"center","valign":"vcenter","border":2,"border_color":GREEN,"text_wrap":True})
F["arrow"]   = fmt({"font_size":14,"align":"center","valign":"vcenter","font_color":BLUE})
F["highlight"]= fmt({"bold":True,"font_size":10,"font_color":WHITE,"bg_color":TEAL,
    "align":"center","valign":"vcenter","border":1,"border_color":NAVY})
F["upgrade"] = fmt({"bold":True,"font_size":8,"font_color":ORANGE,"bg_color":"#FEF9E7",
    "align":"left","valign":"vcenter","border":1,"border_color":"#D5D8DC","text_wrap":True})

# ══════════════════════════════════════════════════════════════════════════════
# HOJA 0 — TIPO DE CAMBIO Y SUPUESTOS
# ══════════════════════════════════════════════════════════════════════════════
ws0 = wb.add_worksheet("⚙️ Supuestos y Tipo Cambio")
ws0.set_zoom(95)
ws0.set_column("A:A", 38)
ws0.set_column("B:B", 20)
ws0.set_column("C:C", 22)
ws0.set_column("D:D", 40)
ws0.set_row(0, 48)

ws0.merge_range("A1:D1", "Vocari / OrientaIA — Supuestos del Modelo Financiero", F["title"])
ws0.merge_range("A2:D2",
    "Todos los costos se muestran en USD (dólares) y CLP (pesos chilenos) — Marzo 2026",
    fmt({"font_size":10,"font_color":BLUE,"bg_color":NAVY,"align":"center","italic":True}))
ws0.set_row(2, 14)

# Tipo de cambio
ws0.set_row(3, 24)
ws0.merge_range("A3:D3", "TIPO DE CAMBIO Y CONFIGURACIÓN GLOBAL", F["section"])
ws0.set_row(4, 20)
ws0.write(4, 0, "Parámetro", F["th"])
ws0.write(4, 1, "Valor USD", F["th"])
ws0.write(4, 2, "Equivalente CLP", F["th"])
ws0.write(4, 3, "Fuente / Nota", F["th"])

params = [
    ("Tipo de cambio USD → CLP", 1.00, USD_TO_CLP,
     "Referencial Marzo 2026 — Actualizar según mercado"),
    ("Precio por estudiante/mes (B2B)", 20.00, clp(20.00),
     "Precio sugerido promedio; rango $15–$25"),
    ("Sesiones de orientación por mes", f"{SESIONES_POR_MES} sesiones", "30 min c/u",
     "4 sesiones de 30 minutos = 2 horas/mes de orientación"),
    ("Duración por sesión", "30 min", "1.800 segundos",
     "Sesión estándar de orientación vocacional"),
    ("Costo IA por estudiante/mes", f"US${AI_POR_ESTUDIANTE}", f"${clp(AI_POR_ESTUDIANTE):,.0f} CLP",
     "Claude Sonnet (resúmenes/informes) + Haiku (juegos/tests)"),
    ("Costo BD por estudiante/mes", f"US${BD_POR_ESTUDIANTE}", f"${clp(BD_POR_ESTUDIANTE):,.0f} CLP",
     "Supabase: registros de usuario, sesiones, tests, progreso"),
    ("Almacenamiento video sesión", "750MB/sesión", "7 días en Drive",
     "Borrado automático a los 7 días — transcripción permanente en Supabase"),
    ("Transcripción Meet", "GRATIS", "Incluida en Workspace Standard",
     "Business Standard ($12/usuario) genera transcripción automática"),
]
for i, (p, usd_val, clp_val, nota) in enumerate(params):
    r = 5 + i
    alt = i % 2 == 1
    bg = LIGHT if alt else WHITE
    bfmt = fmt({"align":"left","valign":"vcenter","border":1,"border_color":"#D5D8DC",
                "bg_color":bg,"font_size":9})
    cfmt = fmt({"align":"right","valign":"vcenter","border":1,"border_color":"#D5D8DC",
                "bg_color":bg,"font_size":9,"bold":True,"font_color":NAVY})
    clpfmt = fmt({"align":"right","valign":"vcenter","border":1,"border_color":"#D5D8DC",
                  "bg_color":bg,"font_size":9,"bold":True,"font_color":"#1A5276"})
    nfmt = fmt({"align":"left","valign":"vcenter","border":1,"border_color":"#D5D8DC",
                "bg_color":bg,"font_size":8,"italic":True,"font_color":MGRAY})
    ws0.write(r, 0, p,       bfmt)
    ws0.write(r, 1, str(usd_val), cfmt)
    ws0.write(r, 2, str(clp_val), clpfmt)
    ws0.write(r, 3, nota,    nfmt)
    ws0.set_row(r, 16)

ws0.set_row(13, 16)
ws0.merge_range("A13:D13", "SUPUESTOS DE COSTOS IA — DESGLOSE POR INTERACCIÓN", F["section"])
ws0.set_row(14, 18)
ws0.write(14, 0, "Tipo de Interacción IA", F["th"])
ws0.write(14, 1, "Frecuencia/mes", F["th"])
ws0.write(14, 2, "Costo unitario USD", F["th"])
ws0.write(14, 3, "Modelo Claude usado / Fuente", F["th"])

ai_breakdown = [
    ("Resumen post-sesión (transcripción → insights)",
     "4 × sesión", "US$0.045", "Claude 3.5 Sonnet — anthropic.com/api"),
    ("Generación de cuestionario/juego personalizado",
     "4 × sesión", "US$0.039", "Claude 3.5 Sonnet — 3k tokens in + 2k out"),
    ("Respuestas interactivas juegos/tests (Haiku)",
     "~20 exchanges", "US$0.002 c/u", "Claude 3.5 Haiku — 10x más barato"),
    ("Informe mensual de progreso (estudiante + orientador)",
     "1/mes", "US$0.090", "Claude 3.5 Sonnet — 15k tokens in + 3k out"),
    ("Proyección de carrera actualizada",
     "1/mes", "US$0.060", "Claude 3.5 Sonnet + datos MINEDUC"),
    ("Simulación 'vida futura' (materias → trabajo → salario)",
     "1/mes", "US$0.100", "Claude 3.5 Sonnet — prompt enriquecido"),
    ("Check-in de felicidad / bienestar (Haiku)",
     "2/mes", "US$0.001 c/u", "Claude 3.5 Haiku — muy liviano"),
    ("Informe para apoderados y administrador",
     "1/mes", "US$0.050", "Claude 3.5 Sonnet — resumen ejecutivo"),
    ("TOTAL ESTIMADO POR ESTUDIANTE/MES",
     "—", "≈ US$0.80", "Conservador — incluye overhead y variabilidad"),
]
for i, (tipo, freq, costo, modelo) in enumerate(ai_breakdown):
    r = 15 + i
    alt = i % 2 == 1
    is_total = "TOTAL" in tipo
    bg = NAVY if is_total else (LIGHT if alt else WHITE)
    fc = WHITE if is_total else DGRAY
    bfmt = fmt({"align":"left","valign":"vcenter","border":1,"border_color":"#D5D8DC",
                "bg_color":bg,"font_size":9,"font_color":fc,
                "bold":is_total,"italic":not is_total and "Haiku" in modelo})
    ws0.write(r, 0, tipo,   bfmt)
    ws0.write(r, 1, freq,   fmt({"align":"center","valign":"vcenter","border":1,
        "border_color":"#D5D8DC","bg_color":bg,"font_size":9,"font_color":fc,"bold":is_total}))
    ws0.write(r, 2, costo,  fmt({"align":"right","valign":"vcenter","border":1,
        "border_color":"#D5D8DC","bg_color":bg,"font_size":9,"font_color":GOLD if is_total else fc,
        "bold":is_total}))
    ws0.write(r, 3, modelo, fmt({"align":"left","valign":"vcenter","border":1,
        "border_color":"#D5D8DC","bg_color":bg,"font_size":8,"font_color":fc,
        "italic":not is_total}))
    ws0.set_row(r, 16)

r0 = 15 + len(ai_breakdown) + 1
ws0.merge_range(r0, 0, r0, 3,
    "* La transcripción automática de Google Meet (Business Standard) elimina el costo de transcripción "
    "del modelo anterior ($2/sesión). El nuevo costo variable de IA cae de $8.00 a $0.80/estudiante/mes.",
    fmt({"font_size":9,"font_color":GREEN,"bold":True,"italic":True,
         "bg_color":"#EAFAF1","border":1,"border_color":GREEN}))
ws0.set_row(r0, 28)

# ── Fuentes de precios ────────────────────────────────────────────────────────
r0 += 2
ws0.merge_range(r0, 0, r0, 3, "FUENTES OFICIALES DE PRECIOS", F["section"])
r0 += 1
ws0.write(r0, 0, "Componente", F["th"])
ws0.write(r0, 1, "Plan Recomendado", F["th"])
ws0.write(r0, 2, "Costo USD/mes", F["th"])
ws0.write(r0, 3, "URL Oficial de Precios", F["th"])
r0 += 1

fuentes = [
    ("Google Workspace",          "Business Standard × 3 usuarios", "US$36",
     "https://workspace.google.com/pricing"),
    ("Supabase (BD + Auth + Storage)", "Free → Pro ($25)",           "US$0–25",
     "https://supabase.com/pricing"),
    ("Netlify (Hosting + Functions)",  "Free → Pro ($19)",           "US$0–19",
     "https://www.netlify.com/pricing"),
    ("Anthropic Claude API",      "Pay-per-use (Sonnet + Haiku)",   "Variable",
     "https://www.anthropic.com/api"),
    ("OpenRouter (Gemini Flash)",  "Pay-per-use",                    "~US$0–5",
     "https://openrouter.ai/google/gemini-2.0-flash-001"),
    ("Sentry (monitoreo errores)", "Startup tier",                   "US$26",
     "https://sentry.io/pricing"),
    ("Cloudflare (CDN + DNS)",     "Free → Pro",                     "US$0–20",
     "https://www.cloudflare.com/plans"),
    ("Google Calendar API",        "Incluido en Workspace",         "US$0",
     "https://developers.google.com/calendar/api"),
    ("Google Drive API",           "Incluido en Workspace",         "US$0",
     "https://developers.google.com/drive"),
    ("Google Meet Transcript API", "Incluido en Business Standard", "US$0",
     "https://developers.google.com/meet/api"),
]
for i, (comp, plan, costo, url) in enumerate(fuentes):
    alt = i % 2 == 1
    bg = LIGHT if alt else WHITE
    bfmt = fmt({"align":"left","valign":"vcenter","border":1,"border_color":"#D5D8DC",
                "bg_color":bg,"font_size":9})
    lfmt = fmt({"align":"left","valign":"vcenter","border":1,"border_color":"#D5D8DC",
                "bg_color":bg,"font_size":8,"font_color":BLUE,"underline":1})
    ws0.write(r0 + i, 0, comp,  bfmt)
    ws0.write(r0 + i, 1, plan,  bfmt)
    ws0.write(r0 + i, 2, costo, fmt({"align":"right","valign":"vcenter","border":1,
        "border_color":"#D5D8DC","bg_color":bg,"font_size":9,"bold":True,"font_color":NAVY}))
    ws0.write_url(r0 + i, 3, url, lfmt, url.replace("https://",""))
    ws0.set_row(r0 + i, 16)

# ══════════════════════════════════════════════════════════════════════════════
# HOJA 1 — FLUJO DEL ESTUDIANTE (Journey Map)
# ══════════════════════════════════════════════════════════════════════════════
ws1 = wb.add_worksheet("🎓 Flujo del Estudiante")
ws1.set_zoom(85)
ws1.set_column("A:A", 22)
ws1.set_column("B:B", 3)
ws1.set_column("C:C", 22)
ws1.set_column("D:D", 3)
ws1.set_column("E:E", 22)
ws1.set_column("F:F", 3)
ws1.set_column("G:G", 22)
ws1.set_column("H:H", 3)
ws1.set_column("I:I", 22)
ws1.set_row(0, 48)

ws1.merge_range("A1:I1",
    "Vocari — Flujo Completo del Estudiante y Generación de Datos IA",
    F["title"])
ws1.merge_range("A2:I2",
    "Cada interacción genera datos → IA analiza → Orientador + Apoderado + Admin reciben reportes en tiempo real",
    fmt({"font_size":10,"font_color":BLUE,"bg_color":NAVY,"align":"center","italic":True}))
ws1.set_row(2, 14)

# ── Leyenda ───────────────────────────────────────────────────────────────────
ws1.set_row(3, 18)
leg_items = [
    ("Acción del Estudiante", NAVY),
    ("Procesamiento IA",      PURPLE),
    ("Almacenamiento Datos",  TEAL),
    ("Resultado / Entregable",GREEN),
]
for col, (lbl, color) in enumerate(leg_items):
    c = col * 2
    ws1.write(3, c, lbl, fmt({"bold":True,"font_size":8,"font_color":WHITE,
        "bg_color":color,"align":"center","border":1,"border_color":color}))

ws1.set_row(4, 14)

# ── Journey map ───────────────────────────────────────────────────────────────
steps = [
    # (fila, col_inicio, ancho, texto, tipo)
    # FILA 1: Inicio
    (5,  0, 0, "1. INGRESO AL SISTEMA\nEstudiante se autentica\n(Google OAuth)", "box"),
    (5,  2, 0, "2. VE ORIENTADORES\nDISPONIBLES\nCalendario en tiempo real", "box"),
    (5,  4, 0, "3. AGENDA SESIÓN\nHorario + orientador\n(30 min — Google Meet)", "box"),
    (5,  6, 0, "4. RECORDATORIO\nAutomático vía email\n(Google Workspace)", "box"),
    (5,  8, 0, "5. SESIÓN EN VIVO\nVideo llamada Meet\nOrientador + Estudiante", "box"),
    # FILA 2: Post-sesión IA
    (8,  0, 0, "6. GRABACIÓN\nAUTOMÁTICA\nDrive (7 días)", "data"),
    (8,  2, 0, "7. TRANSCRIPCIÓN\nAUTOMÁTICA\nGoogle Meet → Drive", "data"),
    (8,  4, 0, "8. RESUMEN IA\nClaude 3.5 Sonnet\nInsights + emociones", "ai"),
    (8,  6, 0, "9. CUESTIONARIO/JUEGO\nGenerado por IA\nPersonalizado por perfil", "ai"),
    (8,  8, 0, "10. COMPARTIDO\nOrientador + Estudiante\nrevisan juntos", "out"),
    # FILA 3: Actividad entre sesiones
    (11, 0, 0, "11. JUEGOS VOCACIONALES\nIA adapta dificultad\nHaiku API (barato)", "ai"),
    (11, 2, 0, "12. TESTS HABILIDADES\nRIASEC + nuevos tests\ndínámicos con IA", "ai"),
    (11, 4, 0, "13. PONDERACIÓN\nTodos los datos\n→ Perfil actualizado", "data"),
    (11, 6, 0, "14. ¿NUEVA SESIÓN?\nEstudiante decide:\n+ Meet o + Tests", "box"),
    (11, 8, 0, "15. CHECK-IN FELICIDAD\nBienestar medido\ncada 2 semanas", "ai"),
    # FILA 4: Reportes
    (14, 0, 0, "16. INFORME MENSUAL\nProgreso completo\nClaude genera PDF", "ai"),
    (14, 2, 0, "17. DASHBOARD\nAPODERADO\nGráficos en tiempo real", "out"),
    (14, 4, 0, "18. DASHBOARD\nADMIN COLEGIO\nVista institucional", "out"),
    (14, 6, 0, "19. DASHBOARD\nORIENTADOR\nTodos sus estudiantes", "out"),
    (14, 8, 0, "20. ALERTA TEMPRANA\nIA detecta bajo ánimo\no estancamiento", "ai"),
    # FILA 5: Resultado final
    (17, 0, 0, "21. CARRERAS IDENTIFICADAS\nTop 5 mejores calces\nRIASEC + MINEDUC", "out"),
    (17, 2, 0, "22. SIMULACIÓN 'VIDA'\nQué estudiar → dónde\n→ rol laboral → sueldo", "ai"),
    (17, 4, 0, "23. RUTAS ALTERNATIVAS\nPlan A / B / C\ncon pros y contras", "out"),
    (17, 6, 0, "24. ÍNDICE FELICIDAD\nProyección satisfacción\nlaboral futura", "out"),
    (17, 8, 0, "25. INFORME FINAL\nPDF descargable\nApoderado + Colegio", "out"),
]

type_map = {"box": F["flow_box"], "ai": F["flow_ai"],
            "data": F["flow_data"], "out": F["flow_out"]}

for row, col, _, text, tipo in steps:
    ws1.set_row(row, 50)
    ws1.set_row(row+1, 12)
    ws1.set_row(row+2, 12)
    ws1.write(row, col, text, type_map[tipo])
    if col < 8:
        ws1.write(row, col+1, "→", F["arrow"])

# Separadores de fases
fase_rows = [
    (7,  "FASE 2: PROCESAMIENTO POST-SESIÓN (Google Drive + Claude IA)"),
    (10, "FASE 3: ACTIVIDAD AUTÓNOMA ENTRE SESIONES (Juegos + Tests IA)"),
    (13, "FASE 4: REPORTES AUTOMÁTICOS A TODOS LOS ACTORES"),
    (16, "FASE 5: RESULTADO FINAL — ORIENTACIÓN VOCACIONAL COMPLETA"),
]
for fr, flbl in fase_rows:
    ws1.merge_range(fr, 0, fr, 8, f"▼  {flbl}", fmt({
        "bold":True,"font_size":9,"font_color":WHITE,"bg_color":TEAL,
        "align":"left","valign":"vcenter","left":4,"left_color":GOLD}))
    ws1.set_row(fr, 16)

# Anotaciones de costo por fase
ws1.set_row(5, 52)
ws1.set_row(8, 52)
ws1.set_row(11, 52)
ws1.set_row(14, 52)
ws1.set_row(17, 52)

cost_notes = [
    (20, "COSTO POR ACTOR", NAVY),
    (21, "Estudiante: acceso incluido en plan del colegio", DGRAY),
    (22, "Apoderado: acceso gratuito (read-only)", DGRAY),
    (23, "Orientador: cuenta Workspace incluida", DGRAY),
    (24, "Admin colegio: cuenta Workspace incluida", DGRAY),
]
ws1.set_row(20, 20)
ws1.merge_range("A20:D20", "DISTRIBUCIÓN DE COSTOS POR ACTOR", F["section"])
for r, txt, color in cost_notes:
    ws1.set_row(r, 16)
    ws1.merge_range(r, 0, r, 4, txt, fmt({"align":"left","font_size":9,
        "font_color":color,"border":1,"border_color":"#D5D8DC"}))

# ══════════════════════════════════════════════════════════════════════════════
# HOJA 2 — ECONOMÍA UNITARIA (USD + CLP)
# ══════════════════════════════════════════════════════════════════════════════
ws2 = wb.add_worksheet("📊 Economía Unitaria USD+CLP")
ws2.set_zoom(90)
ws2.set_column("A:A", 14)
ws2.set_column("B:B", 14)
ws2.set_column("C:C", 14)
ws2.set_column("D:D", 14)
ws2.set_column("E:E", 16)
ws2.set_column("F:F", 14)
ws2.set_column("G:G", 16)
ws2.set_column("H:H", 14)
ws2.set_column("I:I", 16)
ws2.set_row(0, 48)

ws2.merge_range("A1:I1", "Economía Unitaria — Costo por Estudiante en USD y CLP", F["title"])
ws2.set_row(1, 14)

# Cabecera doble (USD / CLP)
ws2.set_row(2, 18)
ws2.merge_range(2, 0, 2, 0, "Estudiantes", F["th"])
ws2.merge_range(2, 1, 2, 2, "Costo IA", F["th"])
ws2.merge_range(2, 3, 2, 4, "Costo BD", F["th"])
ws2.merge_range(2, 5, 2, 6, "Infra Fija", F["th"])
ws2.merge_range(2, 7, 2, 8, "Total Mensual", F["th"])

ws2.set_row(3, 16)
col_labels = ["", "USD", "CLP ($)", "USD", "CLP ($)", "USD", "CLP ($)", "USD", "CLP ($)"]
for c, lbl in enumerate(col_labels):
    ws2.write(3, c, lbl, F["th_blue"] if "USD" in lbl else (
        fmt({"bold":True,"font_size":8,"font_color":WHITE,"bg_color":"#1A5276",
             "align":"center","border":1,"border_color":BLUE}) if "CLP" in lbl else F["th"]))

for i, (n, a, o, ai, bd, fija, total, por_est, ingresos, margen) in enumerate(ROWS):
    r = 4 + i
    ws2.set_row(r, 18)
    alt = i % 2 == 1
    ws2.write(r, 0, n,           F["num_a"] if alt else F["num"])
    ws2.write(r, 1, ai,          F["usd_a"] if alt else F["usd"])
    ws2.write(r, 2, clp(ai),     F["clp_a"] if alt else F["clp"])
    ws2.write(r, 3, bd,          F["usd_a"] if alt else F["usd"])
    ws2.write(r, 4, clp(bd),     F["clp_a"] if alt else F["clp"])
    ws2.write(r, 5, fija,        F["usd_a"] if alt else F["usd"])
    ws2.write(r, 6, clp(fija),   F["clp_a"] if alt else F["clp"])
    ws2.write(r, 7, total,       F["total"])
    ws2.write(r, 8, clp(total),  F["total_clp"])

ws2.set_row(4 + len(ROWS), 14)

# Tabla extendida: por estudiante + ingresos + margen
r2e = 4 + len(ROWS) + 1
ws2.merge_range(r2e, 0, r2e, 8, "ANÁLISIS COMPLETO: INGRESOS vs COSTOS vs MARGEN", F["section"])
r2e += 1
ws2.set_row(r2e, 16)
ext_heads = ["Estudiantes","Costo/Est.(USD)","Costo/Est.(CLP)","Ingresos(USD)","Ingresos(CLP)",
             "Ganancia(USD)","Ganancia(CLP)","Margen %","Tipo"]
for c, h in enumerate(ext_heads):
    ws2.write(r2e, c, h, F["th"])
r2e += 1

for i, (n, a, o, ai, bd, fija, total, por_est, ingresos, margen) in enumerate(ROWS):
    r = r2e + i
    ws2.set_row(r, 18)
    alt = i % 2 == 1
    ganancia = ingresos - total
    if margen <= 0.40:
        mfmt = F["orange_pct"]
    elif margen <= 0.70:
        mfmt = F["green_pct"]
    else:
        mfmt = fmt({"bold":True,"num_format":"0%","align":"center",
                    "bg_color":TEAL,"font_color":WHITE,"border":1,"border_color":BLUE})
    tipo_txt = "MVP" if n <= 30 else ("Piloto" if n<=100 else ("Crecimiento" if n<=500 else "Escala"))
    ws2.write(r, 0, n,             F["num_a"] if alt else F["num"])
    ws2.write(r, 1, por_est,       F["usd_a"] if alt else F["usd"])
    ws2.write(r, 2, clp(por_est),  F["clp_a"] if alt else F["clp"])
    ws2.write(r, 3, ingresos,      F["usd2_a"] if alt else F["usd2"])
    ws2.write(r, 4, clp(ingresos), F["clp_a"] if alt else F["clp"])
    ws2.write(r, 5, ganancia,      F["usd2_a"] if alt else F["usd2"])
    ws2.write(r, 6, clp(ganancia), F["clp_a"] if alt else F["clp"])
    ws2.write(r, 7, margen,        mfmt)
    ws2.write(r, 8, tipo_txt,      F["txt_ca"] if alt else F["txt_c"])

# ── Gráfico 1: Costo vs Ingresos ─────────────────────────────────────────────
chart1 = wb.add_chart({"type":"column"})
chart1.set_title({"name":"Costo Total vs Ingresos Mensuales (USD)"})
chart1.set_x_axis({"name":"Número de Estudiantes"})
chart1.set_y_axis({"name":"USD / mes","num_format":"$#,##0"})
chart1.set_legend({"position":"top"})
chart1.set_style(10)
chart1.set_size({"width":560,"height":300})
chart1.add_series({"name":"Costo Total",
    "categories":["📊 Economía Unitaria USD+CLP",4,0,4+len(ROWS)-1,0],
    "values":    ["📊 Economía Unitaria USD+CLP",4,7,4+len(ROWS)-1,7],
    "fill":{"color":RED},"gap":50})
chart1.add_series({"name":"Ingresos ($20/est.)",
    "categories":["📊 Economía Unitaria USD+CLP",4,0,4+len(ROWS)-1,0],
    "values":    ["📊 Economía Unitaria USD+CLP",r2e,3,r2e+len(ROWS)-1,3],
    "fill":{"color":GREEN},"gap":50})
ws2.insert_chart(r2e + len(ROWS) + 1, 0, chart1)

# ── Gráfico 2: Costo por estudiante (curva decreciente) ──────────────────────
chart2 = wb.add_chart({"type":"line"})
chart2.set_title({"name":"Costo por Estudiante/Mes (USD) — Dilución de Costos Fijos"})
chart2.set_x_axis({"name":"Número de Estudiantes"})
chart2.set_y_axis({"name":"USD / estudiante / mes","num_format":"$#,##0.00","min":0,"max":12})
chart2.set_style(10)
chart2.set_size({"width":560,"height":300})
chart2.add_series({"name":"Costo/Estudiante (USD)",
    "categories":["📊 Economía Unitaria USD+CLP",4,0,4+len(ROWS)-1,0],
    "values":    ["📊 Economía Unitaria USD+CLP",r2e,1,r2e+len(ROWS)-1,1],
    "line":{"color":NAVY,"width":2.5},
    "marker":{"type":"circle","size":7,"fill":{"color":BLUE}},
    "data_labels":{"value":True,"num_format":"$#,##0.00","position":"above"}})
ws2.insert_chart(r2e + len(ROWS) + 1, 5, chart2)

# ── Gráfico 3: Margen bruto ───────────────────────────────────────────────────
chart3 = wb.add_chart({"type":"line"})
chart3.set_title({"name":"Margen Bruto (%) — Evolución por Escala"})
chart3.set_x_axis({"name":"Número de Estudiantes"})
chart3.set_y_axis({"name":"Margen Bruto","num_format":"0%","min":0,"max":1})
chart3.set_style(10)
chart3.set_size({"width":500,"height":280})
chart3.add_series({"name":"Margen Bruto",
    "categories":["📊 Economía Unitaria USD+CLP",4,0,4+len(ROWS)-1,0],
    "values":    ["📊 Economía Unitaria USD+CLP",r2e,7,r2e+len(ROWS)-1,7],
    "line":{"color":GREEN,"width":2.5},
    "marker":{"type":"square","size":6,"fill":{"color":GOLD}},
    "data_labels":{"value":True,"num_format":"0%","position":"above"}})
ws2.insert_chart(r2e + len(ROWS) + 18, 0, chart3)

# ══════════════════════════════════════════════════════════════════════════════
# HOJA 3 — INFRAESTRUCTURA FIJA DETALLADA
# ══════════════════════════════════════════════════════════════════════════════
ws3 = wb.add_worksheet("🏗️ Infraestructura por Etapa")
ws3.set_zoom(90)
ws3.set_column("A:A", 34)
ws3.set_column("B:B", 22)
ws3.set_column("C:C", 14)
ws3.set_column("D:D", 16)
ws3.set_column("E:E", 36)
ws3.set_row(0, 48)

ws3.merge_range("A1:E1",
    "Infraestructura Fija por Etapa — USD y CLP — Con justificación y fuentes",
    F["title"])
ws3.set_row(1, 14)

# Nota sobre Google Workspace Standard
ws3.set_row(2, 36)
ws3.merge_range("A2:E2",
    "⚠️  IMPORTANTE: Se requiere Google Workspace BUSINESS STANDARD ($12/usuario/mes) — NO Starter — "
    "para obtener: grabación automática en Drive, transcripciones de Meet, y acceso a Meet/Calendar/Drive APIs. "
    "Fuente: workspace.google.com/features/meetings",
    fmt({"bold":True,"font_size":9,"font_color":WHITE,"bg_color":ORANGE,
         "align":"left","valign":"vcenter","text_wrap":True}))

etapas = [
    {
        "nombre": "ETAPA MVP (0–100 estudiantes) — Infraestructura: US$100/mes ≈ $95.000 CLP/mes",
        "items": [
            ("Google Workspace Business Standard","3 usuarios × $12","US$36","$34.200",
             "workspace.google.com/pricing","Meet Rec. + Transcripción + Drive + Calendar API"),
            ("Supabase","Free tier","US$0","$0",
             "supabase.com/pricing","500MB BD, 1GB storage — suficiente hasta 200 est."),
            ("Netlify","Free tier","US$0","$0",
             "netlify.com/pricing","125k invocaciones/mes — suficiente hasta 1.000 est."),
            ("Herramientas dev (GitHub Copilot, etc.)","Monthly","US$20","$19.000",
             "—","Productividad equipo fundador"),
            ("ChatGPT Plus (dev/testing)","Monthly","US$20","$19.000",
             "openai.com/chatgpt/pricing","Pruebas y desarrollo del equipo"),
            ("Dominio + Cloudflare","Anual/mensual","US$4","$3.800",
             "cloudflare.com/plans","DNS + SSL + CDN básico"),
            ("TOTAL INFRAESTRUCTURA FIJA","","US$80","$76.000","",""),
            ("Contingencia / overhead (25%)","","US$20","$19.000","",""),
            ("TOTAL CON CONTINGENCIA","","US$100","$95.000","",""),
        ],
        "total_usd": 100, "total_clp": 95000,
    },
    {
        "nombre": "ETAPA PILOTO (100–500 estudiantes) — Infraestructura: US$125/mes ≈ $118.750 CLP/mes",
        "items": [
            ("Google Workspace Business Standard","3–5 usuarios × $12","US$36–60","$34.200–57.000",
             "workspace.google.com/pricing","Orientadores + admins en Workspace"),
            ("Supabase Pro","Pro tier ($25)","US$25","$23.750",
             "supabase.com/pricing","8GB BD, 100GB storage, backups, RLS performance"),
            ("Netlify","Free tier aún OK","US$0","$0",
             "netlify.com/pricing","< 125k invocaciones/mes"),
            ("Sentry (monitoreo)","Startup ($26)","US$26","$24.700",
             "sentry.io/pricing","500k eventos, performance tracking"),
            ("Dev tools + herramientas","Monthly","US$20","$19.000","—",""),
            ("Cloudflare Pro","Pro ($20)","US$20","$19.000",
             "cloudflare.com/plans","CDN mejorado, WAF básico"),
            ("TOTAL CON CONTINGENCIA","","US$125","$118.750","",""),
        ],
        "total_usd": 125, "total_clp": 118750,
    },
    {
        "nombre": "ETAPA CRECIMIENTO (500–2.000 estudiantes) — Infraestructura: US$155/mes ≈ $147.250 CLP/mes",
        "items": [
            ("Google Workspace Business Standard","5–10 usuarios × $12","US$60–120","$57.000–114.000",
             "workspace.google.com/pricing","Equipo completo: devs + orientadores + admins"),
            ("Supabase Pro (enhanced)","Pro + addons","US$35","$33.250",
             "supabase.com/pricing","Pro + storage adicional + read replica"),
            ("Netlify Pro","Pro ($19)","US$19","$18.050",
             "netlify.com/pricing","500k invocaciones, analytics, SLA"),
            ("Sentry Business","Business","US$26","$24.700",
             "sentry.io/pricing","Alertas avanzadas, replay de sesiones"),
            ("Dev tools expandidos","Monthly","US$25","$23.750","—",""),
            ("TOTAL CON CONTINGENCIA","","US$155","$147.250","",""),
        ],
        "total_usd": 155, "total_clp": 147250,
    },
    {
        "nombre": "ETAPA ESCALA (2.000–10.000 estudiantes) — Infraestructura: US$230–650/mes",
        "items": [
            ("Google Workspace Business Standard","10–20 usuarios × $12","US$120–240","$114.000–228.000",
             "workspace.google.com/pricing","Equipo grande + orientadores de todos los colegios"),
            ("Supabase Team","Team tier ($599) o Pro enhanced","US$150–599","$142.500–569.050",
             "supabase.com/pricing","Alta disponibilidad, múltiples colegios"),
            ("Netlify Business","Business ($99)","US$99","$94.050",
             "netlify.com/pricing","Unlimited BW, team features, SLA 99.99%"),
            ("Datadog / LogRocket","Business","US$150","$142.500",
             "datadoghq.com/pricing","APM, RUM, logs para escala nacional"),
            ("Cloudflare Pro + LATAM","Pro ($20)","US$20","$19.000",
             "cloudflare.com/plans","CDN optimizado para Chile y LATAM"),
            ("TOTAL (rango)","","US$230–650","$218.500–617.500","",""),
        ],
        "total_usd": 230, "total_clp": 218500,
    },
]

r3 = 3
for etapa in etapas:
    ws3.merge_range(r3, 0, r3, 4, etapa["nombre"], F["section"])
    ws3.set_row(r3, 20)
    r3 += 1
    ws3.write(r3, 0, "Componente", F["th"])
    ws3.write(r3, 1, "Plan / Detalle", F["th"])
    ws3.write(r3, 2, "Costo USD/mes", F["th"])
    ws3.write(r3, 3, "Costo CLP/mes", F["th"])
    ws3.write(r3, 4, "Fuente / Justificación", F["th"])
    ws3.set_row(r3, 16)
    r3 += 1
    for i, (comp, plan, cusd, cclp, url, desc) in enumerate(etapa["items"]):
        is_total = "TOTAL" in comp
        alt = i % 2 == 1
        bg = NAVY if is_total else (LIGHT if alt else WHITE)
        fc = WHITE if is_total else DGRAY
        gf = fmt({"align":"left","valign":"vcenter","border":1,"border_color":"#D5D8DC",
                  "bg_color":bg,"font_size":9,"font_color":fc,"bold":is_total})
        nf = fmt({"align":"right","valign":"vcenter","border":1,"border_color":"#D5D8DC",
                  "bg_color":bg,"font_size":9,"font_color":GOLD if is_total else NAVY,"bold":is_total})
        uf = fmt({"align":"left","valign":"vcenter","border":1,"border_color":"#D5D8DC",
                  "bg_color":bg,"font_size":8,"font_color":BLUE if not is_total else WHITE,
                  "underline":1 if not is_total else 0,"italic":not is_total})
        ws3.write(r3, 0, comp, gf)
        ws3.write(r3, 1, plan, gf)
        ws3.write(r3, 2, cusd, nf)
        ws3.write(r3, 3, cclp, fmt({"align":"right","valign":"vcenter","border":1,
            "border_color":"#D5D8DC","bg_color":bg,"font_size":9,
            "font_color":GOLD if is_total else "#1A5276","bold":is_total}))
        if url and url != "—" and not is_total:
            ws3.write_url(r3, 4, f"https://{url}", uf, desc[:60] if desc else url)
        else:
            ws3.write(r3, 4, desc, gf)
        ws3.set_row(r3, 16)
        r3 += 1
    r3 += 1

# ══════════════════════════════════════════════════════════════════════════════
# HOJA 4 — PLAN MENSUAL DE INVERSIÓN (24 meses)
# ══════════════════════════════════════════════════════════════════════════════
ws4 = wb.add_worksheet("📅 Plan Mensual Inversión")
ws4.set_zoom(85)
ws4.set_column("A:A", 6)
ws4.set_column("B:B", 14)
ws4.set_column("C:C", 12)
ws4.set_column("D:D", 12)
ws4.set_column("E:E", 12)
ws4.set_column("F:F", 14)
ws4.set_column("G:G", 16)
ws4.set_column("H:H", 28)
ws4.set_column("I:I", 16)
ws4.set_row(0, 48)

ws4.merge_range("A1:I1",
    "Plan de Inversión en Infraestructura — Mes a Mes (24 meses) — USD y CLP",
    F["title"])
ws4.set_row(1, 14)
ws4.set_row(2, 18)
heads4 = ["Mes","Estudiantes","Costo IA\n(USD)","Costo BD\n(USD)","Infra Fija\n(USD)",
          "Total Mensual\n(USD)","Total Mensual\n(CLP $)","Evento de Upgrade / Acción","Fuente"]
for c, h in enumerate(heads4):
    ws4.write(2, c, h, F["th"])

monthly_plan = [
    (1,   10,   None,                                         "netlify.com/pricing + supabase.com/pricing"),
    (2,   20,   None,                                         "Validación con primeros usuarios"),
    (3,   30,   None,                                         "Netlify Free + Supabase Free OK"),
    (4,   50,   None,                                         "Presentación a primer colegio piloto"),
    (5,   80,   None,                                         "Prueba piloto — Meet grabaciones activas"),
    (6,   100,  "Evaluar upgrade Supabase Pro (+US$25)",       "supabase.com/pricing — Pro tier"),
    (7,   120,  "Supabase Pro obligatorio activado",           "supabase.com/pricing — 8GB BD, backups"),
    (8,   150,  "Sentry Startup (+US$26) — monitoreo",        "sentry.io/pricing — 500k eventos"),
    (9,   200,  None,                                         "2do colegio en piloto"),
    (10,  250,  None,                                         "Facturación anual confirmada"),
    (11,  300,  "Netlify Pro recomendado (+US$19)",            "netlify.com/pricing — 500k func/mes"),
    (12,  400,  None,                                         "Cierre año 1: revisión de CAC y LTV"),
    (13,  500,  "Cloudflare Pro (+US$20)",                    "cloudflare.com/plans — CDN LATAM"),
    (14,  600,  None,                                         "Expansión a 5 colegios"),
    (15,  700,  None,                                         "Contratar orientador interno"),
    (16,  800,  None,                                         "Activar Claude Haiku para juegos"),
    (17,  900,  "Revisar storage Supabase (+US$10)",           "supabase.com/pricing — storage adicional"),
    (18,  1000, "Netlify Business evaluar (+US$80)",           "netlify.com/pricing — Business tier"),
    (19,  1500, None,                                         "Objetivo Serie A: US$18k MRR"),
    (20,  2000, "Supabase Team evaluar (US$599)",             "supabase.com/pricing — Team tier"),
    (21,  2500, None,                                         "Expansión LATAM: Colombia / Perú"),
    (22,  3000, "Datadog/LogRocket Business (+US$150)",        "datadoghq.com/pricing"),
    (23,  4000, "Negociar precio enterprise Anthropic",        "anthropic.com/api — descuento volumen"),
    (24,  5000, "Supabase Team o BD dedicada — US$599+",       "supabase.com/pricing — Team $599/mes"),
]

for i, (mes, n, evento, fuente) in enumerate(monthly_plan):
    r = 3 + i
    ws4.set_row(r, 18)
    alt = i % 2 == 1

    ai_cost = n * AI_POR_ESTUDIANTE
    bd_cost = n * BD_POR_ESTUDIANTE
    fija    = infra_fija(n)
    total   = ai_cost + bd_cost + fija

    nf  = F["num_a"] if alt else F["num"]
    u2  = F["usd2_a"] if alt else F["usd2"]
    tot = F["total"]
    tclp= F["total_clp"]

    ws4.write(r, 0, mes,        nf)
    ws4.write(r, 1, n,          nf)
    ws4.write(r, 2, ai_cost,    u2)
    ws4.write(r, 3, bd_cost,    u2)
    ws4.write(r, 4, fija,       u2)
    ws4.write(r, 5, total,      tot)
    ws4.write(r, 6, clp(total), tclp)
    ws4.write(r, 7, evento or "—", F["upgrade"] if evento else (F["txt_a"] if alt else F["txt"]))
    ws4.write(r, 8, fuente,     F["txt_a"] if alt else F["txt"])

# Datos para gráficos
DATA_ROW = 30
ws4.write(DATA_ROW,  9, "Mes",            F["th_blue"])
ws4.write(DATA_ROW, 10, "Total USD",      F["th_blue"])
ws4.write(DATA_ROW, 11, "Ingresos USD",   F["th_blue"])
ws4.write(DATA_ROW, 12, "Estudiantes",    F["th_blue"])
ws4.write(DATA_ROW, 13, "Total CLP",      F["th_blue"])
ws4.write(DATA_ROW, 14, "Ingresos CLP",   F["th_blue"])

for i, (mes, n, _, __) in enumerate(monthly_plan):
    ai_cost = n * AI_POR_ESTUDIANTE
    bd_cost = n * BD_POR_ESTUDIANTE
    fija    = infra_fija(n)
    total   = ai_cost + bd_cost + fija
    ing     = n * PRECIO_ESTUDIANTE
    ws4.write(DATA_ROW + 1 + i, 9,  mes,       F["num"])
    ws4.write(DATA_ROW + 1 + i, 10, total,     F["usd2"])
    ws4.write(DATA_ROW + 1 + i, 11, ing,       F["usd2"])
    ws4.write(DATA_ROW + 1 + i, 12, n,         F["num"])
    ws4.write(DATA_ROW + 1 + i, 13, clp(total),F["clp"])
    ws4.write(DATA_ROW + 1 + i, 14, clp(ing),  F["clp"])

# Gráfico 4: Area — costos e ingresos 24 meses (USD)
ch4 = wb.add_chart({"type":"area"})
ch4.set_title({"name":"Evolución de Costos e Ingresos — 24 Meses (USD)"})
ch4.set_x_axis({"name":"Mes"})
ch4.set_y_axis({"name":"USD/mes","num_format":"$#,##0"})
ch4.set_legend({"position":"top"})
ch4.set_style(10)
ch4.set_size({"width":700,"height":340})
ch4.add_series({"name":"Costo Total (USD)",
    "categories":["📅 Plan Mensual Inversión",DATA_ROW+1,9,DATA_ROW+len(monthly_plan),9],
    "values":    ["📅 Plan Mensual Inversión",DATA_ROW+1,10,DATA_ROW+len(monthly_plan),10],
    "fill":{"color":RED,"transparency":30},"line":{"color":RED}})
ch4.add_series({"name":"Ingresos Proyectados (USD)",
    "categories":["📅 Plan Mensual Inversión",DATA_ROW+1,9,DATA_ROW+len(monthly_plan),9],
    "values":    ["📅 Plan Mensual Inversión",DATA_ROW+1,11,DATA_ROW+len(monthly_plan),11],
    "fill":{"color":GREEN,"transparency":30},"line":{"color":GREEN}})
ws4.insert_chart("A29", ch4)

# Gráfico 5: Area — costos e ingresos 24 meses (CLP)
ch5 = wb.add_chart({"type":"area"})
ch5.set_title({"name":"Evolución de Costos e Ingresos — 24 Meses (CLP $)"})
ch5.set_x_axis({"name":"Mes"})
ch5.set_y_axis({"name":"CLP/mes","num_format":"$#,##0"})
ch5.set_legend({"position":"top"})
ch5.set_style(10)
ch5.set_size({"width":700,"height":340})
ch5.add_series({"name":"Costo Total (CLP)",
    "categories":["📅 Plan Mensual Inversión",DATA_ROW+1,9,DATA_ROW+len(monthly_plan),9],
    "values":    ["📅 Plan Mensual Inversión",DATA_ROW+1,13,DATA_ROW+len(monthly_plan),13],
    "fill":{"color":RED,"transparency":30},"line":{"color":RED}})
ch5.add_series({"name":"Ingresos Proyectados (CLP)",
    "categories":["📅 Plan Mensual Inversión",DATA_ROW+1,9,DATA_ROW+len(monthly_plan),9],
    "values":    ["📅 Plan Mensual Inversión",DATA_ROW+1,14,DATA_ROW+len(monthly_plan),14],
    "fill":{"color":GREEN,"transparency":30},"line":{"color":GREEN}})
ws4.insert_chart("K29", ch5)

# Gráfico 6: Estudiantes por mes
ch6 = wb.add_chart({"type":"line"})
ch6.set_title({"name":"Crecimiento de Estudiantes — 24 Meses"})
ch6.set_x_axis({"name":"Mes"})
ch6.set_y_axis({"name":"Estudiantes activos","num_format":"#,##0"})
ch6.set_style(10)
ch6.set_size({"width":560,"height":280})
ch6.add_series({"name":"Estudiantes",
    "categories":["📅 Plan Mensual Inversión",DATA_ROW+1,9,DATA_ROW+len(monthly_plan),9],
    "values":    ["📅 Plan Mensual Inversión",DATA_ROW+1,12,DATA_ROW+len(monthly_plan),12],
    "line":{"color":NAVY,"width":2.5},
    "marker":{"type":"circle","size":4,"fill":{"color":BLUE}},
    "fill":{"color":BLUE,"transparency":70}})
ws4.insert_chart("A47", ch6)

# ══════════════════════════════════════════════════════════════════════════════
# HOJA 5 — MODELO B2B COLEGIOS
# ══════════════════════════════════════════════════════════════════════════════
ws5 = wb.add_worksheet("🏫 Modelo B2B Colegios")
ws5.set_zoom(90)
ws5.set_column("A:A", 26)
ws5.set_column("B:B", 16)
ws5.set_column("C:C", 16)
ws5.set_column("D:D", 16)
ws5.set_column("E:E", 16)
ws5.set_column("F:F", 16)
ws5.set_column("G:G", 16)
ws5.set_row(0, 48)

ws5.merge_range("A1:G1",
    "Modelo B2B — Contratos por Colegio — USD y CLP",
    F["title"])
ws5.set_row(1, 14)

# Pricing tiers
ws5.set_row(2, 20)
ws5.merge_range("A2:G2", "PLANES DE PRECIO POR COLEGIO", F["section"])
ws5.set_row(3, 18)
pt_heads = ["Plan", "Precio/Est./Mes (USD)", "Precio/Est./Mes (CLP)",
            "Costo Mínimo Est.", "Que incluye", "Contrato Anual (100 est.)",
            "Contrato Anual CLP (100 est.)"]
for c, h in enumerate(pt_heads):
    ws5.write(3, c, h, F["th"])

planes = [
    ("Básico",    15, "Orientación RIASEC + recomendaciones de carrera",           20),
    ("Estándar",  20, "RIASEC + Sesiones Meet + IA resúmenes + Dashboard apoderados", 30),
    ("Premium",   25, "Todo + Juegos IA + Simulación vida futura + Informes PDF",  40),
]
for i, (plan, precio, descripcion, min_est) in enumerate(planes):
    r = 4 + i
    contrato_anual_usd = precio * 100 * 12 * 0.85  # 15% descuento anual
    ws5.set_row(r, 22)
    alt = i % 2 == 1
    bf = fmt({"bold":True,"align":"left","valign":"vcenter","border":1,"border_color":"#D5D8DC",
              "bg_color":LIGHT if alt else WHITE,"font_size":9})
    nf = fmt({"bold":True,"align":"center","valign":"vcenter","border":1,"border_color":"#D5D8DC",
              "bg_color":LIGHT if alt else WHITE,"font_size":10,"font_color":NAVY})
    cf = fmt({"bold":True,"align":"center","valign":"vcenter","border":1,"border_color":"#D5D8DC",
              "bg_color":LIGHT if alt else WHITE,"font_size":10,"font_color":"#1A5276"})
    ws5.write(r, 0, plan,                  bf)
    ws5.write(r, 1, f"US${precio}",        nf)
    ws5.write(r, 2, f"${clp(precio):,.0f}",cf)
    ws5.write(r, 3, f"Min. {min_est} est.", bf)
    ws5.write(r, 4, descripcion,           fmt({"align":"left","valign":"vcenter","border":1,
        "border_color":"#D5D8DC","bg_color":LIGHT if alt else WHITE,"font_size":8,"text_wrap":True}))
    ws5.write(r, 5, f"US${contrato_anual_usd:,.0f}/año (-15%)", nf)
    ws5.write(r, 6, f"${clp(contrato_anual_usd):,.0f}/año",     cf)

ws5.set_row(7, 14)

# Tabla multi-colegio
ws5.set_row(8, 20)
ws5.merge_range("A8:G8", "ESCALAMIENTO MULTI-COLEGIO — INGRESOS vs COSTOS", F["section"])
ws5.set_row(9, 18)
mc_heads = ["Colegios","Est./Colegio","Total Est.","Costo Total (USD)","Costo Total (CLP)",
            "MRR USD ($20/est.)","MRR CLP"]
for c, h in enumerate(mc_heads):
    ws5.write(9, c, h, F["th"])

multi = [
    (1,   100),
    (3,   100),
    (5,   100),
    (10,  100),
    (15,  150),
    (20,  150),
    (30,  200),
    (50,  100),
]
for i, (colegios, est_por_col) in enumerate(multi):
    r = 10 + i
    ws5.set_row(r, 18)
    total_est = colegios * est_por_col
    ai   = total_est * AI_POR_ESTUDIANTE
    bd   = total_est * BD_POR_ESTUDIANTE
    fija = infra_fija(total_est)
    total = ai + bd + fija
    mrr   = total_est * PRECIO_ESTUDIANTE
    margen = (mrr - total) / mrr
    alt = i % 2 == 1

    if margen >= 0.85:
        mfmt = fmt({"bold":True,"num_format":"0%","align":"center",
                    "bg_color":TEAL,"font_color":WHITE,"border":1,"border_color":BLUE})
    elif margen >= 0.70:
        mfmt = F["green_pct"]
    else:
        mfmt = F["orange_pct"]

    ws5.write(r, 0, colegios,      F["num_a"] if alt else F["num"])
    ws5.write(r, 1, est_por_col,   F["num_a"] if alt else F["num"])
    ws5.write(r, 2, total_est,     F["num_a"] if alt else F["num"])
    ws5.write(r, 3, total,         F["total"])
    ws5.write(r, 4, clp(total),    F["total_clp"])
    ws5.write(r, 5, mrr,           fmt({"bold":True,"num_format":"US$#,##0","align":"right",
        "bg_color":GREEN,"font_color":WHITE,"border":1,"border_color":BLUE}))
    ws5.write(r, 6, clp(mrr),      fmt({"bold":True,"num_format":"$#,##0","align":"right",
        "bg_color":DGRAY,"font_color":GOLD,"border":1,"border_color":BLUE}))

# Gráfico 7: MRR vs Costo multi-colegio
ws5.write(28, 0, "Colegios", F["th_blue"])
ws5.write(28, 1, "MRR USD",  F["th_blue"])
ws5.write(28, 2, "Costo USD",F["th_blue"])
ws5.write(28, 3, "MRR CLP",  F["th_blue"])
for i, (colegios, est_por_col) in enumerate(multi):
    total_est = colegios * est_por_col
    ai   = total_est * AI_POR_ESTUDIANTE
    bd   = total_est * BD_POR_ESTUDIANTE
    fija = infra_fija(total_est)
    total = ai + bd + fija
    mrr  = total_est * PRECIO_ESTUDIANTE
    ws5.write(29+i, 0, colegios,  F["num"])
    ws5.write(29+i, 1, mrr,       F["usd2"])
    ws5.write(29+i, 2, total,     F["usd2"])
    ws5.write(29+i, 3, clp(mrr),  F["clp"])

ch7 = wb.add_chart({"type":"column"})
ch7.set_title({"name":"MRR vs Costo Total — Escalamiento Multi-Colegio (USD)"})
ch7.set_x_axis({"name":"Número de Colegios"})
ch7.set_y_axis({"name":"USD/mes","num_format":"$#,##0"})
ch7.set_legend({"position":"top"})
ch7.set_style(10)
ch7.set_size({"width":600,"height":320})
ch7.add_series({"name":"MRR (Ingresos)",
    "categories":["🏫 Modelo B2B Colegios",29,0,29+len(multi)-1,0],
    "values":    ["🏫 Modelo B2B Colegios",29,1,29+len(multi)-1,1],
    "fill":{"color":GREEN},"data_labels":{"value":True,"num_format":"$#,##0"},"gap":50})
ch7.add_series({"name":"Costo Total",
    "categories":["🏫 Modelo B2B Colegios",29,0,29+len(multi)-1,0],
    "values":    ["🏫 Modelo B2B Colegios",29,2,29+len(multi)-1,2],
    "fill":{"color":RED},"data_labels":{"value":True,"num_format":"$#,##0"},"gap":50})
ws5.insert_chart("A20", ch7)

# ══════════════════════════════════════════════════════════════════════════════
# HOJA 6 — RESUMEN EJECUTIVO INVERSORES
# ══════════════════════════════════════════════════════════════════════════════
ws6 = wb.add_worksheet("💼 Resumen Inversores")
ws6.set_zoom(90)
ws6.set_column("A:A", 30)
ws6.set_column("B:B", 18)
ws6.set_column("C:C", 18)
ws6.set_column("D:D", 18)
ws6.set_column("E:E", 18)
ws6.set_row(0, 52)

ws6.merge_range("A1:E1",
    "Vocari / OrientaIA — Resumen Financiero para Inversores",
    fmt({"bold":True,"font_size":20,"font_color":WHITE,"bg_color":NAVY,
         "align":"center","valign":"vcenter"}))
ws6.merge_range("A2:E2",
    "Márgenes brutos 85%+ | Break-even 6 estudiantes | Costo IA: US$0.80/est./mes | TAM Chile: 900k estudiantes",
    fmt({"font_size":10,"font_color":GOLD,"bg_color":NAVY,"align":"center","italic":True}))
ws6.set_row(2, 14)

# KPIs
kpis6 = [
    ("85–92%",    "Margen Bruto\n(escala 100–1k est.)"),
    ("US$0.80",   "Costo IA\npor est./mes"),
    ("6 est.",    "Break-even\npunto equilibrio"),
    ("US$1.10",   "Costo variable\ntotal/est./mes"),
    ("US$18k",    "MRR Objetivo\n(1.000 est.)"),
]
ws6.set_row(3, 64)
ws6.set_row(4, 24)
for col, (val, lbl) in enumerate(kpis6):
    ws6.write(3, col, val, fmt({"bold":True,"font_size":22,"font_color":GOLD,
        "bg_color":DGRAY,"align":"center","valign":"vcenter","top":4,"top_color":TEAL}))
    ws6.write(4, col, lbl, fmt({"font_size":8,"font_color":MGRAY,
        "bg_color":LGRAY,"align":"center","valign":"vcenter","text_wrap":True,
        "bottom":4,"bottom_color":TEAL}))

ws6.set_row(5, 14)

# Tabla hitos
ws6.set_row(6, 20)
ws6.merge_range("A6:E6", "HITOS DE INGRESOS Y MÁRGENES (en USD y CLP)", F["section"])
ws6.set_row(7, 18)
h6 = ["Hito / Etapa","Est.","MRR (USD)","MRR (CLP)","Margen Bruto"]
for c, h in enumerate(h6):
    ws6.write(7, c, h, F["th"])

milestones6 = [
    ("Validación seed",  100),
    ("Cierre pre-seed",  300),
    ("Cierre seed",      1000),
    ("Objetivo Serie A", 5000),
    ("Objetivo Serie B", 20000),
]
hito_names = ["Validación seed","Cierre pre-seed","Cierre seed","Objetivo Serie A","Objetivo Serie B"]
for i, (hito, n) in enumerate(milestones6):
    r = 8 + i
    ws6.set_row(r, 18)
    ai   = n * AI_POR_ESTUDIANTE
    bd   = n * BD_POR_ESTUDIANTE
    fija = infra_fija(n)
    total = ai + bd + fija
    mrr  = n * PRECIO_ESTUDIANTE
    margen = (mrr - total) / mrr
    alt = i % 2 == 1

    if margen >= 0.85:
        mfmt = fmt({"bold":True,"num_format":"0%","align":"center",
                    "bg_color":TEAL,"font_color":WHITE,"border":1,"border_color":BLUE})
    elif margen >= 0.70:
        mfmt = F["green_pct"]
    else:
        mfmt = F["orange_pct"]

    ws6.write(r, 0, hito,      F["txt_a"] if alt else F["txt"])
    ws6.write(r, 1, n,         F["num_a"] if alt else F["num"])
    ws6.write(r, 2, mrr,       F["usd2_a"] if alt else F["usd2"])
    ws6.write(r, 3, clp(mrr),  F["clp_a"] if alt else F["clp"])
    ws6.write(r, 4, margen,    mfmt)

ws6.set_row(8 + len(milestones6), 14)

# Comparación antes vs después (modelo antiguo vs nuevo)
rv = 8 + len(milestones6) + 1
ws6.merge_range(rv, 0, rv, 4,
    "IMPACTO DEL NUEVO MODELO (Google Meet Transcripción vs modelo anterior)",
    F["section"])
rv += 1
ws6.set_row(rv, 16)
for c, h in enumerate(["Métrica","Modelo Anterior","Modelo Nuevo","Diferencia","Impacto"]):
    ws6.write(rv, c, h, F["th"])
rv += 1

comparaciones = [
    ("Costo transcripción/sesión", "US$2.00", "US$0.00", "-US$2.00", "Incluido en Google Workspace Standard"),
    ("Costo IA por est./mes",      "US$8.00", "US$0.80", "-US$7.20", "Claude solo para análisis/resúmenes"),
    ("Costo BD por est./mes",      "US$0.50", "US$0.30", "-US$0.20", "Schema optimizado"),
    ("Costo variable total/est.",  "US$8.50", "US$1.10", "-US$7.40", "87% de reducción"),
    ("Margen bruto (100 est.)",    "52%",     "91%",     "+39pp",     "Modelo financiero radicalmente mejor"),
    ("Break-even (estudiantes)",   "~13 est.","~6 est.", "-7 est.",   "Rentable en escala mínima"),
]
for i, (metrica, anterior, nuevo, diff, impacto) in enumerate(comparaciones):
    r = rv + i
    alt = i % 2 == 1
    bg = LIGHT if alt else WHITE
    ws6.write(r, 0, metrica,  fmt({"align":"left","border":1,"border_color":"#D5D8DC","bg_color":bg,"font_size":9}))
    ws6.write(r, 1, anterior, fmt({"align":"center","border":1,"border_color":"#D5D8DC","bg_color":"#FDEDEC","font_size":9,"font_color":RED}))
    ws6.write(r, 2, nuevo,    fmt({"align":"center","border":1,"border_color":"#D5D8DC","bg_color":"#EAFAF1","font_size":9,"font_color":GREEN,"bold":True}))
    ws6.write(r, 3, diff,     fmt({"align":"center","border":1,"border_color":"#D5D8DC","bg_color":"#EAFAF1","font_size":9,"font_color":TEAL,"bold":True}))
    ws6.write(r, 4, impacto,  fmt({"align":"left","border":1,"border_color":"#D5D8DC","bg_color":bg,"font_size":8,"italic":True}))
    ws6.set_row(r, 16)

rv += len(comparaciones) + 1

# Gráfico comparativo márgenes
ws6.write(rv, 0, "Escala",         F["th_blue"])
ws6.write(rv, 1, "Margen Antiguo", F["th_blue"])
ws6.write(rv, 2, "Margen Nuevo",   F["th_blue"])
escala_comp = [
    ("10 est.",    0.00, (10*PRECIO_ESTUDIANTE - (10*8.50+115))/(10*PRECIO_ESTUDIANTE)),
    ("100 est.",   0.52, (100*PRECIO_ESTUDIANTE - (100*1.10+100))/(100*PRECIO_ESTUDIANTE)),
    ("500 est.",   0.51, (500*PRECIO_ESTUDIANTE - (500*1.10+125))/(500*PRECIO_ESTUDIANTE)),
    ("1.000 est.", 0.52, (1000*PRECIO_ESTUDIANTE - (1000*1.10+155))/(1000*PRECIO_ESTUDIANTE)),
    ("5.000 est.", 0.52, (5000*PRECIO_ESTUDIANTE - (5000*1.10+230))/(5000*PRECIO_ESTUDIANTE)),
]
for i, (esc, m_ant, m_nue) in enumerate(escala_comp):
    ws6.write(rv+1+i, 0, esc,   F["txt_c"])
    ws6.write(rv+1+i, 1, m_ant, F["pct"])
    ws6.write(rv+1+i, 2, m_nue, F["pct"])

ch_margin = wb.add_chart({"type":"column"})
ch_margin.set_title({"name":"Comparación de Márgenes: Modelo Anterior vs Nuevo"})
ch_margin.set_x_axis({"name":"Escala de Estudiantes"})
ch_margin.set_y_axis({"name":"Margen Bruto","num_format":"0%","min":0,"max":1})
ch_margin.set_legend({"position":"top"})
ch_margin.set_style(10)
ch_margin.set_size({"width":580,"height":300})
ch_margin.add_series({"name":"Margen Antiguo (con transcripción $2/sesión)",
    "categories":["💼 Resumen Inversores",rv+1,0,rv+len(escala_comp),0],
    "values":    ["💼 Resumen Inversores",rv+1,1,rv+len(escala_comp),1],
    "fill":{"color":RED},"data_labels":{"value":True,"num_format":"0%"},"gap":40})
ch_margin.add_series({"name":"Margen Nuevo (Google Meet Transcripción incluida)",
    "categories":["💼 Resumen Inversores",rv+1,0,rv+len(escala_comp),0],
    "values":    ["💼 Resumen Inversores",rv+1,2,rv+len(escala_comp),2],
    "fill":{"color":TEAL},"data_labels":{"value":True,"num_format":"0%"},"gap":40})
ws6.insert_chart(rv + len(escala_comp) + 2, 0, ch_margin)

# Nota al pie
last_r = rv + len(escala_comp) + 20
ws6.merge_range(last_r, 0, last_r, 4,
    f"Tipo de cambio utilizado: 1 USD = {USD_TO_CLP} CLP (referencial Marzo 2026). "
    "Actualizar celda USD_TO_CLP según mercado.",
    F["note"])
ws6.merge_range(last_r+1, 0, last_r+1, 4,
    "Fuentes: anthropic.com/api | supabase.com/pricing | netlify.com/pricing | "
    "workspace.google.com/pricing | developers.google.com/meet/api",
    F["note"])

wb.close()

print(f"✅ Excel generado: {OUTPUT_PATH}")
print(f"   Hojas: 7")
print(f"   - ⚙️  Supuestos y Tipo Cambio (USD ↔ CLP = {USD_TO_CLP})")
print(f"   - 🎓  Flujo del Estudiante (Journey Map completo)")
print(f"   - 📊  Economía Unitaria USD+CLP")
print(f"   - 🏗️  Infraestructura por Etapa (con fuentes)")
print(f"   - 📅  Plan Mensual Inversión 24 meses")
print(f"   - 🏫  Modelo B2B Colegios (contratos + escalamiento)")
print(f"   - 💼  Resumen Inversores (antes vs después)")
print(f"   Gráficos: 9")
print()
print(f"💡 CAMBIO CLAVE vs modelo anterior:")
print(f"   Costo IA anterior: US$8.00/estudiante/mes (transcripción $2/sesión × 4)")
print(f"   Costo IA nuevo:    US${AI_POR_ESTUDIANTE}/estudiante/mes (Meet transcribe gratis)")
print(f"   Margen bruto:      52% → 85-92% (con Google Workspace Business Standard)")
