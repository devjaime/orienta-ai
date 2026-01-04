# 🚀 Instalación Completa - OrientaIA MVP

**Última actualización:** 2026-01-04
**Estado del proyecto:** ✅ MVP Completado (~95%)

---

## 📋 PREREQUISITOS

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** 18+ ([descargar](https://nodejs.org/))
- **npm** o **yarn**
- **Git**
- **Cuenta Supabase** (gratuita)
- **Claude API Key** de Anthropic
- **Cuenta Netlify** (opcional, para deploy)

---

## 🔧 PASO 1: Clonar e Instalar Dependencias

```bash
# Si ya estás en el proyecto, salta este paso
cd /Users/devjaime/Documents/orienta-ai

# Instalar dependencias
npm install
```

**Dependencias instaladas:**
- `@supabase/supabase-js` - Cliente de Supabase
- `react-router-dom` - Routing
- `framer-motion` - Animaciones
- `lucide-react` - Íconos
- Y todas las existentes...

---

## 🗄️ PASO 2: Configurar Supabase

### 2.1 Crear Proyecto

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta / Inicia sesión
3. Click **"New Project"**
4. Configuración:
   - **Name:** orienta-ia
   - **Database Password:** (anótala en un lugar seguro)
   - **Region:** South America (São Paulo)
5. Espera ~2 minutos mientras se crea

### 2.2 Habilitar Google OAuth

1. En tu proyecto, ve a **Authentication** → **Providers**
2. Encuentra **"Google"** y haz click en **Enable**
3. Sigue la [guía completa en SUPABASE_SETUP.md](./SUPABASE_SETUP.md#paso-2-habilitar-google-oauth) para configurar Google Cloud Console
4. Copia el **Client ID** y **Client Secret** en Supabase

### 2.3 Crear Tablas en Supabase

**Importante:** Debes ejecutar DOS scripts SQL para crear las tablas necesarias.

#### 2.3.1 Crear Tabla `test_results`

1. Ve a **Database** → **SQL Editor**
2. Copia y ejecuta este script SQL:

```sql
-- Tabla de resultados de tests
CREATE TABLE test_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,

  -- Resultados del test RIASEC
  codigo_holland VARCHAR(3) NOT NULL,
  certeza VARCHAR(20) CHECK (certeza IN ('Exploratoria', 'Media', 'Alta')),
  puntajes JSONB NOT NULL,
  respuestas JSONB NOT NULL,

  -- IA y recomendaciones
  explicacion_ia TEXT,
  carreras_recomendadas JSONB,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duracion_minutos INTEGER,

  CONSTRAINT positive_duration CHECK (duracion_minutos > 0)
);

-- Índices
CREATE INDEX idx_test_results_user_email ON test_results(user_email);
CREATE INDEX idx_test_results_user_id ON test_results(user_id);
CREATE INDEX idx_test_results_created ON test_results(created_at DESC);

-- Row Level Security
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven solo sus tests"
  ON test_results FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios crean solo sus tests"
  ON test_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

#### 2.3.2 Crear Tabla `user_profiles`

1. En el mismo **SQL Editor**, crea una nueva query
2. Copia y ejecuta el script completo de `SUPABASE_USER_PROFILES.sql`:

```sql
-- Tabla user_profiles: Datos adicionales del usuario
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  user_email TEXT NOT NULL,

  -- Datos básicos
  nombre TEXT NOT NULL,
  avatar_url TEXT,

  -- Datos vocacionales
  edad INTEGER NOT NULL CHECK (edad >= 13 AND edad <= 120),
  genero TEXT NOT NULL CHECK (genero IN ('Mujer', 'Hombre', 'Otro', 'Prefiero no decir')),
  motivaciones TEXT NOT NULL CHECK (char_length(motivaciones) >= 10),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(user_email);
CREATE INDEX idx_user_profiles_edad ON user_profiles(edad);
CREATE INDEX idx_user_profiles_genero ON user_profiles(genero);

-- Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven solo su perfil"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios crean solo su perfil"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios actualizan solo su perfil"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**¿Para qué sirve esta tabla?**
- Almacena datos adicionales del usuario después del login con Google
- Campos: edad (13-120, sin límite superior), género, motivaciones de vida
- Se usa para personalizar análisis vocacional
- El usuario completa estos datos una sola vez después de login
- **Nota:** Abierto a todas las edades - personas reinventándose profesionalmente son bienvenidas

### 2.4 Obtener Credenciales

1. Ve a **Project Settings** → **API**
2. Copia:
   - **Project URL** → usarás esto como `VITE_SUPABASE_URL`
   - **anon/public key** → usarás esto como `VITE_SUPABASE_ANON_KEY`

---

## 🔑 PASO 3: Configurar Variables de Entorno

1. Crea un archivo `.env` en la raíz del proyecto:

```bash
# Copia el archivo de ejemplo
cp .env.example .env

# Edita el archivo .env
```

2. Completa las variables:

```env
# Supabase (REQUERIDO)
VITE_SUPABASE_URL=https://[tu-project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[tu-anon-key-aquí]

# Claude API (REQUERIDO)
VITE_CLAUDE_API_KEY=[tu-claude-api-key-aquí]
CLAUDE_API_KEY=[la-misma-key] # Para Netlify Functions

# Airtable (OPCIONAL - ya configurado)
AIRTABLE_TOKEN=tu-token-si-quieres
AIRTABLE_BASE=tu-base-id
AIRTABLE_TABLE=tu-tabla
```

**IMPORTANTE:**
- Las variables con `VITE_` son accesibles desde el frontend
- Las sin `VITE_` solo están en Netlify Functions (backend)
- **NUNCA** subas el `.env` a GitHub (ya está en `.gitignore`)

---

## ⚙️ PASO 4: Obtener Claude API Key

1. Ve a [console.anthropic.com](https://console.anthropic.com)
2. Crea una cuenta / Inicia sesión
3. Ve a **API Keys**
4. Click **"Create Key"**
5. Copia la key y pégala en `.env` como `VITE_CLAUDE_API_KEY` y `CLAUDE_API_KEY`

**Costo estimado:**
- Test completo con explicación IA: ~$0.10 - $0.30 USD
- Conversación follow-up: ~$0.05 USD por mensaje

---

## 🧪 PASO 5: Probar en Local

```bash
# Iniciar servidor de desarrollo
npm run dev
```

Debería abrir en: `http://localhost:5173`

### Verificar que funciona:

1. ✅ La landing page carga correctamente
2. ✅ Click en "Hacer Test Vocacional"
3. ✅ Te pide login con Google
4. ✅ Login con Google funciona (redirect)
5. ✅ Se muestra formulario de registro adicional (edad, género, motivaciones)
6. ✅ Al completar perfil, redirige al test
7. ✅ El test de 36 preguntas carga
8. ✅ Al completar, ves resultados con:
   - Código Holland (ej: "ISA")
   - Nivel de certeza
   - Explicación personalizada IA
   - 6 carreras recomendadas
   - Botón para agendar sesión con orientador
9. ✅ Resultado se guarda en Supabase
10. ✅ Botón de agendamiento abre Google Calendar

### Troubleshooting común:

**Error: "Supabase no configurado"**
- Verifica que `.env` existe y tiene `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
- Reinicia el servidor (`Ctrl+C` y `npm run dev` de nuevo)

**Error: Google OAuth no funciona**
- Verifica que configuraste las Redirect URLs en Google Cloud Console
- Agrega `http://localhost:5173/auth/callback` en las URLs permitidas
- Verifica que Google OAuth esté **habilitado** en Supabase

**Error: "API Key no configurada" (Claude)**
- Verifica que `.env` tiene `VITE_CLAUDE_API_KEY` y `CLAUDE_API_KEY`
- Verifica que la key es válida en console.anthropic.com

**Error: "Permission denied" en Supabase**
- Verifica que ejecutaste el script SQL completo (con las policies)
- Verifica que RLS está habilitado
- Revisa en Supabase Dashboard → Authentication que hay un usuario logueado

---

## 🌐 PASO 6: Deploy a Netlify (OPCIONAL)

### 6.1 Preparar para Deploy

```bash
# Build de producción
npm run build

# Verifica que se creó la carpeta dist/
ls -la dist/
```

### 6.2 Deploy en Netlify

**Opción A: Desde la UI de Netlify**

1. Ve a [netlify.com](https://netlify.com)
2. Login / Crea cuenta
3. Click **"Add new site"** → **"Import an existing project"**
4. Conecta tu repositorio de GitHub
5. Configuración:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`
6. Click **"Deploy site"**

**Opción B: Netlify CLI**

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

### 6.3 Configurar Variables de Entorno en Netlify

1. En Netlify, ve a **Site settings** → **Environment variables**
2. Agrega **TODAS** las variables de tu `.env`:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_CLAUDE_API_KEY
CLAUDE_API_KEY
```

3. Click **Save**
4. **Re-deploy** el sitio para que tome las nuevas variables

### 6.4 Configurar Dominios Permitidos en Supabase

1. Ve a tu proyecto Supabase → **Authentication** → **URL Configuration**
2. Agrega a **Redirect URLs**:
   ```
   https://[tu-sitio].netlify.app/auth/callback
   ```
3. Agrega a **Site URL**: `https://[tu-sitio].netlify.app`

---

## ✅ VERIFICACIÓN FINAL

Checklist de funcionalidades:

- [ ] Landing page se ve correctamente
- [ ] Botón "Hacer Test" lleva a `/test`
- [ ] Login con Google funciona
- [ ] Después de login, muestra formulario de perfil
- [ ] Formulario valida edad (13-120), género, motivaciones (min 10 chars)
- [ ] Perfil se guarda en tabla `user_profiles`
- [ ] Después de completar perfil, redirige al test
- [ ] Test de 36 preguntas funciona
- [ ] Al terminar, calcula código Holland correcto
- [ ] Genera explicación IA personalizada
- [ ] Muestra 6 carreras recomendadas
- [ ] Carreras tienen score de compatibilidad
- [ ] Se puede expandir detalle de cada carrera
- [ ] Botón "Agendar Sesión" abre Google Calendar
- [ ] Google Calendar pre-llena evento de 30 minutos
- [ ] Resultado se guarda en Supabase
- [ ] Botón "Descargar PDF" funciona
- [ ] Responsive en móvil

---

## 📁 ESTRUCTURA FINAL DEL PROYECTO

```
orienta-ai/
├── src/
│   ├── components/
│   │   ├── GoogleSignIn.jsx ✅
│   │   ├── CarrerasRecomendadas.jsx ✅
│   │   ├── ScheduleButton.jsx ✅ (NUEVO)
│   │   ├── Header.jsx ✅
│   │   ├── Hero.jsx
│   │   ├── CTASection.jsx ✅
│   │   ├── AIChat.jsx
│   │   └── ... (otros componentes landing)
│   ├── pages/
│   │   ├── LandingPage.jsx ✅
│   │   ├── CompleteProfile.jsx ✅ (NUEVO)
│   │   ├── TestRIASEC.jsx ✅
│   │   ├── Resultados.jsx ✅
│   │   └── AuthCallback.jsx ✅
│   ├── lib/
│   │   ├── supabase.js ✅
│   │   ├── riasecScoring.js ✅
│   │   ├── recomendacionCarreras.js ✅
│   │   └── claudeAPI.js ✅
│   ├── data/
│   │   ├── carreras.json ✅ (30 carreras)
│   │   └── riasecQuestions.js ✅ (36 preguntas)
│   ├── App.jsx ✅ (Router)
│   └── main.jsx
├── netlify/
│   └── functions/
│       ├── riasec.js (existente)
│       └── generate-explanation.js ✅
├── .env (TU CREAS ESTO)
├── .env.example ✅
├── SUPABASE_SETUP.md ✅
├── SUPABASE_USER_PROFILES.sql ✅ (NUEVO)
├── PROGRESO_MVP.md ✅
├── INSTALACION_COMPLETA.md ✅ (este archivo)
├── package.json ✅
└── README.md

Total de archivos nuevos creados: 22+
```

---

## 🎯 PRÓXIMOS PASOS (POST-MVP)

Una vez que el MVP funciona, puedes:

1. **Mejorar UX:**
   - Agregar más animaciones
   - Mejorar diseño de resultados
   - Agregar gráficos (Chart.js)

2. **Features adicionales:**
   - Dashboard de usuario (historial de tests)
   - Dashboard para padres
   - Sistema de chat con orientadores reales
   - Videollamadas (Daily.co)
   - Generación de PDF mejorada

3. **Monetización:**
   - Integrar Stripe para pagos
   - Planes Premium/VIP
   - Licencias institucionales

4. **Escalar:**
   - Apps móviles (React Native)
   - Soporte multi-idioma completo
   - Más carreras (50-100)

---

## 🆘 SOPORTE

Si algo no funciona:

1. Revisa la consola del navegador (F12) para errores
2. Revisa los logs de Netlify Functions
3. Verifica que todas las variables de entorno estén configuradas
4. Lee `SUPABASE_SETUP.md` para detalles de configuración

---

## 📊 RESUMEN DEL MVP

**Implementado:**
- ✅ Sistema completo de autenticación con Google OAuth
- ✅ Registro extendido (edad, género, motivaciones de vida)
- ✅ Test RIASEC de 36 preguntas
- ✅ Algoritmo de scoring sofisticado
- ✅ Nivel de certeza
- ✅ Motor de recomendación de 30 carreras
- ✅ Integración con Claude API
- ✅ Explicación personalizada IA
- ✅ Guardado en base de datos (2 tablas)
- ✅ Botón de agendamiento con orientador profesional
- ✅ Integración con Google Calendar
- ✅ Flujo completo end-to-end

**Costos estimados (100 usuarios/mes):**
- Supabase: **GRATIS** (plan gratuito)
- Claude API: ~$10-30 USD
- Netlify: **GRATIS** (plan gratuito)
- **Total: $10-30 USD/mes**

---

¡Listo! Tu MVP de OrientaIA está completamente funcional 🎉

**Desarrollado por:** Claude Sonnet 4.5
**Fecha:** 2026-01-04
