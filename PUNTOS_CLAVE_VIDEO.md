# PUNTOS CLAVE PARA MENCIONAR - CHEAT SHEET

## 1. INTRODUCCIÓN (Primeros 30 segundos)
✅ "OrientaIA - plataforma de orientación vocacional con IA"
✅ "React + Supabase + Claude AI"
✅ "Test RIASEC + análisis personalizado"

## 2. STACK TÉCNICO (Mencionar rápido)
```
Frontend:  React 19 + Vite + Tailwind CSS
Backend:   Netlify Functions (serverless)
Database:  Supabase PostgreSQL
Auth:      Supabase OAuth (Google)
IA:        Claude API (Sonnet 3.5)
Deploy:    Netlify
```

## 3. AUTENTICACIÓN (Punto importante)
⭐ **OAuth 2.0 con Google vía Supabase**
⭐ **Callback handler en `/auth/callback`**
⭐ **SPA fallback en Netlify** (fix reciente para el error)

**Código clave:**
- `src/lib/supabase.js:23-41` - signInWithGoogle()
- `src/pages/AuthCallback.jsx` - handler
- `netlify.toml:10-13` - SPA fallback redirect

## 4. BASE DE DATOS (3 tablas principales)
📊 **user_profiles** - datos + roles (user/orientador/admin)
📊 **test_results** - RIASEC + puntajes + IA
📊 **scheduled_sessions** - agendamiento

🔒 **Row Level Security (RLS)** - seguridad a nivel DB

## 5. TEST RIASEC (⭐ CORAZÓN DEL PROYECTO)
📝 **36 preguntas** (6 por dimensión)
📝 **Escala Likert 1-5**

**6 Dimensiones Holland:**
- **R** - Realista (práctico, técnico)
- **I** - Investigador (analítico, científico)
- **A** - Artístico (creativo, expresivo)
- **S** - Social (empático, colaborativo)
- **E** - Emprendedor (líder, persuasivo)
- **C** - Convencional (organizado, detallista)

**Algoritmo (punto fuerte):**
1. Suma puntajes por dimensión (6-30)
2. Ordena de mayor a menor
3. **Sistema de desempate inteligente:**
   - Compara respuestas intensas (4-5)
   - Compara rechazo (1-2)
4. Top 3 = código Holland (ej: "ISA")
5. Calcula certeza: Alta / Media / Exploratoria

**Archivo:** `src/lib/riasecScoring.js`

## 6. INTEGRACIÓN CLAUDE AI (⭐ PUNTO FUERTE)
🤖 **Función serverless:** `netlify/functions/generate-explanation.js`

**Flujo:**
```
Frontend → Netlify Function → Claude API → Respuesta IA → Frontend
```

**Dos tipos de prompts:**
- **explicacion**: Análisis inicial (250-300 palabras)
- **conversacion**: Chat interactivo

**Prompt configura a Claude como:**
- Orientador vocacional experto
- Tono cercano, motivador
- Para jóvenes 16-24 años

**Modelo usado:** `claude-3-5-sonnet-20241022`

## 7. MOTOR DE RECOMENDACIÓN
🎯 **30 carreras chilenas** en base de datos

**Algoritmo de compatibilidad (0-100):**
- Posición 1 exacta: +40 puntos
- Posición 2 exacta: +25 puntos
- Posición 3 exacta: +15 puntos
- Bonus por aparecer: +10 puntos

**Archivo:** `src/lib/recomendacionCarreras.js`

**Cada carrera incluye:**
- Código Holland
- Descripción completa
- Universidades destacadas
- Salario promedio CLP
- Empleabilidad
- Campos laborales
- Duración + nivel matemáticas

## 8. DASHBOARDS
👨‍🏫 **Orientador Dashboard:**
- Ver todos los usuarios
- Historial de tests
- Gestionar sesiones

👑 **Admin Dashboard:**
- Control total
- Cambio de roles
- Estadísticas del sistema

## 9. FEATURES ADICIONALES
💬 Chat IA flotante
📊 Widget embebible (iframe)
📅 Agendamiento con Google Calendar
✨ Animaciones con Framer Motion
📱 Responsive (mobile a 4K)

## 10. NÚMEROS IMPORTANTES
📈 **Líneas de código:** ~3,000+
📈 **Componentes React:** 17
📈 **Páginas:** 7
📈 **Funciones serverless:** 2
📈 **Preguntas RIASEC:** 36
📈 **Carreras en BD:** 30
📈 **Tablas Supabase:** 3

## 11. DESAFÍOS TÉCNICOS RESUELTOS
✅ Sistema de desempate robusto para RIASEC
✅ SPA fallback en Netlify (fix reciente)
✅ Prompts efectivos para Claude
✅ Row Level Security en Supabase
✅ OAuth callback handling

## 12. PRÓXIMOS PASOS (Mencionar al final)
🔜 Migrar a TypeScript
🔜 Tests unitarios (Jest)
🔜 Analytics (Mixpanel)
🔜 Machine Learning para mejores recomendaciones

---

## ARCHIVOS CLAVE PARA MOSTRAR EN PANTALLA

### 1. Arquitectura
- `package.json` - dependencias
- `netlify.toml` - configuración
- Estructura de carpetas

### 2. Autenticación
- `src/lib/supabase.js:23-41`
- `src/pages/AuthCallback.jsx`
- `netlify.toml:10-13`

### 3. Test RIASEC
- `src/data/riasecQuestions.js`
- `src/lib/riasecScoring.js:45-70`
- `src/pages/TestRIASEC.jsx`

### 4. IA
- `netlify/functions/generate-explanation.js`
- Respuesta de Claude en `/resultados`

### 5. Recomendación
- `src/data/carreras.json`
- `src/lib/recomendacionCarreras.js`
- `src/components/CarrerasRecomendadas.jsx`

### 6. Dashboards
- `src/pages/OrientadorDashboard.jsx`
- `src/pages/AdminDashboard.jsx`

---

## FRASES IMPACTANTES PARA USAR

💡 "El corazón de la aplicación es el algoritmo RIASEC con sistema de desempate inteligente"

💡 "Row Level Security directamente en PostgreSQL, no en el código - mucho más seguro"

💡 "Claude AI genera análisis personalizados en menos de 2 segundos"

💡 "30 carreras chilenas con compatibilidad calculada algorítmicamente"

💡 "OAuth 2.0 seamless con Google vía Supabase Auth"

💡 "Serverless en Netlify Functions - escala automáticamente"

💡 "React 19 con hooks para código limpio y mantenible"

---

## DEMO EN VIVO - CHECKLIST

✅ Landing page → Comenzar test
✅ Login con Google → mostrar callback
✅ Completar 3-4 preguntas → progress bar
✅ Resultados → código Holland + IA
✅ Expandir carrera → detalles completos
✅ Dashboard orientador → búsqueda y filtros

---

## ERRORES COMUNES A EVITAR

❌ No leer código línea por línea
❌ No explicar acronimos sin contexto (RIASEC, RLS, OAuth)
❌ No mostrar errores en la demo
❌ No hablar muy rápido
❌ No olvidar mencionar tecnologías clave
❌ No saltarse la demo en vivo

---

## TIEMPO ESTIMADO POR SECCIÓN

| Sección | Tiempo |
|---------|--------|
| Intro | 0:30 |
| Stack | 1:00 |
| Auth | 1:00 |
| Base de datos | 1:00 |
| RIASEC | 1:30 |
| Claude AI | 1:30 |
| Recomendación | 1:00 |
| Dashboards | 0:45 |
| Features | 0:30 |
| Aprendizajes | 1:00 |
| Demo | 1:00 |
| Cierre | 0:30 |
| **TOTAL** | **~11:45** |

**Recomendación:** Apunta a 5-7 minutos para LinkedIn (mejor engagement)

---

## SETUP ANTES DE GRABAR

🎥 **Pantalla:**
- Cerrar pestañas innecesarias
- Modo oscuro en VS Code
- Fuente 14-16pt
- Terminal limpio
- Ocultar información sensible (.env)

🎙️ **Audio:**
- Micrófono externo
- Grabar en habitación silenciosa
- Cerrar notificaciones

💻 **Software:**
- OBS Studio configurado (1920x1080)
- Browser con demo preparado
- VS Code con archivos abiertos
- Terminal con comandos listos

📱 **Cuenta:**
- Login preparado (Google OAuth)
- Demo account con datos de prueba
- Dashboard con datos poblados

---

**¡Graba con confianza! Tienes un proyecto increíble para mostrar. 🚀**
