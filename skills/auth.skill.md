# Skill: Autenticación de Usuarios

## Propósito

Gestionar el registro, inicio de sesión, recuperación de contraseña y persistencia de sesión de usuarios en OrientaIA usando Supabase Auth.

---

## Responsabilidades

- [ ] Registro de nuevos usuarios (email + contraseña)
- [ ] Login de usuarios existentes
- [ ] Logout (cierre de sesión)
- [ ] Recuperación de contraseña (forgot password)
- [ ] Validación de sesiones activas
- [ ] Protección de rutas privadas
- [ ] Gestión de tokens JWT
- [ ] Manejo de errores de autenticación

---

## Entradas

### Registro
```typescript
{
  email: string,           // Email válido
  password: string,        // Mínimo 8 caracteres
  metadata?: {            // Opcional
    nombre?: string,
    edad?: number,
    region?: string
  }
}
```

### Login
```typescript
{
  email: string,
  password: string
}
```

### Forgot Password
```typescript
{
  email: string
}
```

---

## Salidas

### Registro Exitoso
```typescript
{
  ok: true,
  user: {
    id: string,
    email: string,
    created_at: string
  },
  session: {
    access_token: string,
    refresh_token: string,
    expires_at: number
  }
}
```

### Login Exitoso
```typescript
{
  ok: true,
  user: { id, email, ... },
  session: { access_token, ... }
}
```

### Error
```typescript
{
  ok: false,
  error: string,           // "Email already exists" | "Invalid credentials" | etc.
  code?: string           // Error code para debugging
}
```

---

## Restricciones

1. **Seguridad:**
   - Contraseñas: mínimo 8 caracteres, al menos 1 número
   - Validación de email en formato correcto
   - Rate limiting: máximo 5 intentos de login por IP en 15 minutos
   - Tokens JWT con expiración (1 hora access, 30 días refresh)

2. **Negocio:**
   - Un email = una cuenta
   - No permitir registro con emails desechables (opcional, fase 2)
   - Confirmación de email obligatoria (fase 2)

3. **UX:**
   - Mensajes de error claros y en español
   - No revelar si un email existe (seguridad)
   - Feedback inmediato en validación de formularios

---

## Dependencias

### Externas
- **Supabase Auth:** Servicio de autenticación
- **Supabase Database:** Tabla `users` con metadata

### Internas
- **Frontend:**
  - `src/lib/auth/AuthContext.jsx` - Context API para estado global
  - `src/lib/auth/useAuth.js` - Hook personalizado
  - `src/lib/api/authClient.js` - Cliente API

- **Backend:**
  - `netlify/functions/auth-register.js` (opcional, puede usar Supabase directo)
  - `netlify/functions/auth-login.js` (opcional)

---

## Estados / Flujo

### Flujo de Registro

```
[Usuario] → [Formulario Registro]
    ↓
[Validación Frontend] (email válido, password fuerte)
    ↓
[POST /auth/register] o [Supabase.auth.signUp()]
    ↓
[Supabase crea usuario + envía email confirmación]
    ↓
[Retorna session + user]
    ↓
[AuthContext actualiza estado]
    ↓
[Redirección a /dashboard]
```

### Flujo de Login

```
[Usuario] → [Formulario Login]
    ↓
[POST /auth/login] o [Supabase.auth.signInWithPassword()]
    ↓
[Supabase valida credenciales]
    ↓
    ├─ ✅ Válido → [Retorna session + user] → [Guardar en AuthContext] → [Redirect /dashboard]
    └─ ❌ Inválido → [Error "Credenciales inválidas"] → [Mostrar mensaje]
```

### Flujo de Sesión Persistente

```
[App carga] → [AuthContext.useEffect]
    ↓
[Supabase.auth.getSession()]
    ↓
    ├─ ✅ Session válida → [Cargar user en context] → [Usuario autenticado]
    └─ ❌ No session → [Usuario no autenticado] → [Mostrar landing]
```

---

## Casos de Uso

### 1. Usuario Nuevo - Registro
- **Actor:** Visitante sin cuenta
- **Objetivo:** Crear cuenta para acceder a test vocacional
- **Pasos:**
  1. Visitante hace clic en "Crear cuenta"
  2. Completa formulario (email, contraseña)
  3. Submit → Validación frontend
  4. Backend registra en Supabase
  5. Redirección a dashboard con sesión activa

### 2. Usuario Existente - Login
- **Actor:** Usuario registrado
- **Objetivo:** Acceder a su cuenta
- **Pasos:**
  1. Usuario hace clic en "Iniciar sesión"
  2. Ingresa credenciales
  3. Submit → Backend valida
  4. Sesión creada → Redirección a dashboard

### 3. Usuario Olvidó Contraseña
- **Actor:** Usuario registrado que olvidó password
- **Objetivo:** Recuperar acceso a cuenta
- **Pasos:**
  1. Hace clic en "Olvidé mi contraseña"
  2. Ingresa email
  3. Recibe email con link de reset
  4. Crea nueva contraseña

### 4. Protección de Rutas
- **Actor:** Visitante no autenticado
- **Objetivo:** Evitar acceso a rutas privadas
- **Pasos:**
  1. Usuario intenta acceder a `/dashboard`
  2. AuthContext detecta que no hay sesión
  3. Redirección automática a `/login`

---

## Notas de Implementación

### Opción 1: Supabase Auth Directo (Recomendado - MVP)

**Ventajas:**
- Menos código backend
- Auth manejado por Supabase (seguro y escalable)
- RLS (Row Level Security) nativo

**Frontend (React):**
```javascript
// src/lib/auth/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// src/lib/auth/AuthContext.jsx
const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password, metadata) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    })
    return { data, error }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

### Opción 2: Netlify Functions + Supabase (Fase 2)

**Cuándo usar:**
- Si necesitas lógica custom en registro (validaciones complejas)
- Si quieres ocultar Supabase del frontend
- Si necesitas logging/analytics en backend

**Backend:**
```javascript
// netlify/functions/auth-register.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Admin key
)

exports.handler = async (event) => {
  const { email, password, metadata } = JSON.parse(event.body)

  // Custom validation
  if (!email.includes('@')) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Email inválido' }) }
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: metadata
  })

  if (error) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: error.message }) }
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true, user: data.user }) }
}
```

---

## Decisiones Pendientes

- [ ] ¿Confirmar email obligatorio desde el inicio? (Recomendado: NO en MVP, SÍ en producción)
- [ ] ¿Permitir OAuth (Google) en Fase 1? (Recomendado: NO, solo email/password)
- [ ] ¿Rate limiting en frontend o backend? (Recomendado: Backend con Netlify Edge Functions)
- [ ] ¿Guardar metadata de usuario en tabla separada o en `auth.users`? (Recomendado: user_metadata en Supabase)

---

## Checklist de Implementación

### Frontend
- [ ] Instalar `@supabase/supabase-js`
- [ ] Crear `src/lib/auth/supabaseClient.js`
- [ ] Crear `src/lib/auth/AuthContext.jsx`
- [ ] Crear `src/lib/auth/useAuth.js` hook
- [ ] Crear `src/pages/Auth/Login.jsx`
- [ ] Crear `src/pages/Auth/Register.jsx`
- [ ] Crear `src/pages/Auth/ForgotPassword.jsx`
- [ ] Crear componente `<ProtectedRoute>`
- [ ] Configurar rutas en `App.jsx`

### Backend
- [ ] Configurar variables de entorno en Netlify
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- [ ] Configurar Supabase:
  - Habilitar Email Auth
  - Configurar templates de emails
  - Configurar RLS en tabla `users`

### Testing
- [ ] Probar registro con email válido
- [ ] Probar registro con email duplicado (error esperado)
- [ ] Probar login con credenciales correctas
- [ ] Probar login con credenciales incorrectas
- [ ] Probar persistencia de sesión (reload página)
- [ ] Probar logout
- [ ] Probar protección de rutas (`/dashboard` sin auth)

---

**Estado:** 🟡 Pendiente de implementación
**Prioridad:** 🔴 Alta (bloqueante para otras features)
**Estimación:** 2-3 días de desarrollo

**Última actualización:** 2025-12-31
