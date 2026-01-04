# 🔧 Configuración de Supabase para OrientaIA

## Paso 1: Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Click "New Project"
4. Configura:
   - **Name:** orienta-ia
   - **Database Password:** (guarda esto de forma segura)
   - **Region:** South America (São Paulo) - más cercano a Chile
5. Espera ~2 minutos mientras se crea el proyecto

---

## Paso 2: Habilitar Google OAuth

1. En tu proyecto Supabase, ve a **Authentication** → **Providers**
2. Encuentra "Google" y haz click en **Enable**
3. Necesitarás configurar OAuth en Google Cloud Console:

### Configurar Google Cloud Console:

1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configura la pantalla de consentimiento si es necesario:
   - User Type: **External**
   - App name: **OrientaIA**
   - User support email: tu email
   - Developer contact: tu email
6. Crea las credenciales OAuth:
   - Application type: **Web application**
   - Name: **OrientaIA - Supabase**
   - Authorized JavaScript origins: (déjalo vacío)
   - Authorized redirect URIs:
     ```
     https://[TU-PROJECT-REF].supabase.co/auth/v1/callback
     ```
     (Supabase te da esta URL exacta en el panel de Google config)
7. Copia el **Client ID** y **Client Secret**

### Volver a Supabase:

8. Pega el **Client ID** y **Client Secret** en el formulario de Google
9. Click **Save**

---

## Paso 3: Crear Tabla `test_results`

1. Ve a **Database** → **SQL Editor** en Supabase
2. Ejecuta este script SQL:

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

  -- Índices
  CONSTRAINT positive_duration CHECK (duracion_minutos > 0)
);

-- Índices para performance
CREATE INDEX idx_test_results_user_email ON test_results(user_email);
CREATE INDEX idx_test_results_user_id ON test_results(user_id);
CREATE INDEX idx_test_results_created ON test_results(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo ven sus propios resultados
CREATE POLICY "Usuarios ven solo sus tests"
  ON test_results
  FOR ALL
  USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden insertar sus propios tests
CREATE POLICY "Usuarios crean solo sus tests"
  ON test_results
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

3. Click **Run** para ejecutar el script

---

## Paso 4: Obtener Credenciales

1. Ve a **Project Settings** → **API** en Supabase
2. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

---

## Paso 5: Configurar Variables de Entorno

1. Crea un archivo `.env` en la raíz del proyecto (copia de `.env.example`):

```env
VITE_SUPABASE_URL=https://[tu-project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[tu-anon-key]
VITE_CLAUDE_API_KEY=[tu-claude-api-key]
```

2. **IMPORTANTE:** Asegúrate de que `.env` esté en `.gitignore` (ya debería estar)

---

## Paso 6: Instalar Dependencias

```bash
npm install @supabase/supabase-js
```

---

## Paso 7: Verificar Configuración

1. Inicia el proyecto: `npm run dev`
2. Abre la consola del navegador
3. No deberías ver el warning "Supabase no configurado"
4. Prueba el botón "Continuar con Google"
5. Deberías ser redirigido a Google OAuth

---

## 🔒 Configuración de Seguridad (Producción)

### Configurar dominios permitidos:

1. Ve a **Authentication** → **URL Configuration** en Supabase
2. Agrega a **Redirect URLs**:
   ```
   http://localhost:5173/auth/callback
   https://orienta-ia.netlify.app/auth/callback
   ```
3. Agrega a **Site URL**: `https://orienta-ia.netlify.app`

---

## 🧪 Testing

Para verificar que todo funciona:

```javascript
// En la consola del navegador:
import { supabase } from './src/lib/supabase.js'

// Test conexión
const { data, error } = await supabase.from('test_results').select('count')
console.log('Conexión exitosa:', data)

// Test auth
const user = await supabase.auth.getUser()
console.log('Usuario actual:', user)
```

---

## ⚠️ Troubleshooting

### Error: "Invalid API key"
- Verifica que copiaste bien el `anon key`
- Asegúrate de usar `VITE_` como prefijo (Vite requirement)
- Reinicia el servidor de desarrollo

### Error: "Auth session missing"
- Verifica que Google OAuth esté habilitado
- Revisa las Redirect URLs en Google Cloud Console
- Limpia cookies y prueba de nuevo

### Error: "Permission denied"
- Verifica que RLS esté configurado correctamente
- Revisa las policies en Supabase Dashboard

---

## 📚 Recursos

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth con Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Vite Env Variables](https://vitejs.dev/guide/env-and-mode.html)
