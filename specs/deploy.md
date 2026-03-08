# Vocari - Especificacion de Despliegue a Produccion

> Version: 1.0 | Fecha: Marzo 2026
> Stack: Vercel (frontend) + Fly.io (backend) + Supabase (PostgreSQL) + Upstash (Redis)
> Dominio: vocari.cl
> Costo estimado: $0 USD/mes (free tiers)

---

## 1. Arquitectura de Despliegue

```
                        Internet
                           |
                  +--------v--------+
                  |   Cloudflare    |
                  |   DNS + SSL     |
                  +---+--------+----+
                      |        |
            +---------+        +----------+
            |                             |
   +--------v--------+          +--------v--------+
   |     Vercel       |          |     Fly.io      |
   |  vocari.cl       |          |  api.vocari.cl  |
   |  Next.js 16      |          |  FastAPI        |
   |  (frontend)      |          |  (backend)      |
   +------------------+          +---+--------+----+
                                     |        |
                              +------v---+ +--v--------+
                              | Supabase | | Upstash   |
                              | Postgres | | Redis     |
                              | (free)   | | (free)    |
                              +----------+ +-----------+

   External:
   +------------------+  +------------------+
   | Google OAuth     |  | OpenRouter API   |
   +------------------+  +------------------+
```

### Limites de los Free Tiers

| Servicio | Free Tier | Suficiente para |
|----------|-----------|-----------------|
| Vercel | 100GB bandwidth, serverless functions | 500+ usuarios |
| Fly.io | 3 shared-cpu-1x VMs, 256MB RAM cada una | 100+ usuarios concurrentes |
| Supabase | 500MB DB, 1GB transfer, 50K auth MAU | 200+ estudiantes |
| Upstash | 10,000 comandos/dia, 256MB | Cache + cola de jobs |
| Cloudflare | DNS + SSL + CDN ilimitado | Sin limite |

---

## 2. Requisitos Previos

### 2.1 Cuentas necesarias (todas gratuitas)

| Servicio | URL de registro | Que se necesita |
|----------|----------------|-----------------|
| Vercel | https://vercel.com/signup | Cuenta con GitHub |
| Fly.io | https://fly.io/app/sign-up | Email + tarjeta (no cobra) |
| Supabase | https://supabase.com/dashboard | Cuenta con GitHub |
| Upstash | https://console.upstash.com | Email |
| Cloudflare | https://dash.cloudflare.com/sign-up | Email |
| Google Cloud Console | https://console.cloud.google.com | Para OAuth credentials |

### 2.2 Herramientas CLI

```bash
# Fly.io CLI
curl -L https://fly.io/install.sh | sh
fly auth login

# Vercel CLI
npm i -g vercel
vercel login

# Supabase CLI (opcional, para migraciones)
brew install supabase/tap/supabase
```

### 2.3 Accesos necesarios

- [ ] Dominio vocari.cl registrado con acceso al panel DNS
- [ ] Repositorio GitHub con acceso de admin (para deploy hooks)
- [ ] Google Cloud Console con OAuth credentials creadas

---

## 3. Paso a Paso: Configurar Supabase (PostgreSQL)

### Paso 3.1: Crear proyecto

1. Ir a https://supabase.com/dashboard
2. Click **New Project**
3. Configurar:
   - **Organization**: Crear o seleccionar
   - **Name**: `vocari-prod`
   - **Database Password**: Generar una segura y guardarla
   - **Region**: `South America (Sao Paulo)` (mas cercano a Chile)
   - **Plan**: Free
4. Esperar ~2 minutos a que se provisione

### Paso 3.2: Obtener credenciales

1. Ir a **Settings > Database**
2. En **Connection string > URI**, copiar la URL. Se ve asi:
   ```
   postgresql://postgres.[ref]:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
   ```
3. Para asyncpg (nuestro driver), necesitamos el formato **Session mode (port 5432)**:
   ```
   postgresql://postgres.[ref]:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
   ```
4. Convertir a formato asyncpg:
   ```
   postgresql+asyncpg://postgres.[ref]:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
   ```

> **IMPORTANTE**: Guardar esta URL como `DATABASE_URL`. No commitear a git.

### Paso 3.3: Aplicar migraciones

Desde tu maquina local, apuntando a Supabase:

```bash
cd backend

# Temporalmente setear la DATABASE_URL al Supabase remoto
export DATABASE_URL="postgresql+asyncpg://postgres.[ref]:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"

# Aplicar migraciones
alembic upgrade head

# Verificar que las tablas existen
# Ir a Supabase Dashboard > Table Editor y confirmar 18+ tablas
```

### Paso 3.4: Deshabilitar Auth de Supabase (usamos nuestro propio auth)

1. Ir a **Settings > Authentication**
2. En **General**:
   - Deshabilitar "Enable email confirmations" (no lo usamos)
   - No importa, porque no usamos Supabase Auth — solo la base de datos

---

## 4. Paso a Paso: Configurar Upstash (Redis)

### Paso 4.1: Crear database

1. Ir a https://console.upstash.com
2. Click **Create Database**
3. Configurar:
   - **Name**: `vocari-prod`
   - **Region**: `South America (Sao Paulo)` (sa-east-1)
   - **TLS**: Enabled
   - **Eviction**: Enabled (para cache)
4. Click **Create**

### Paso 4.2: Obtener credenciales

1. En el dashboard de la database, copiar:
   - **Endpoint**: `sa-east-1-xxxx.upstash.io`
   - **Port**: `6379`
   - **Password**: `AXxxxx...`

2. Construir la URL de conexion:
   ```
   rediss://default:[PASSWORD]@[ENDPOINT]:6379
   ```
   > Nota: `rediss://` (con doble s) indica TLS. Requerido por Upstash.

### Paso 4.3: Compatibilidad con nuestro backend

Nuestro backend usa `redis-py` standard. Upstash es compatible con redis-py via TLS:

```python
# La URL rediss://default:PASSWORD@HOST:6379 funciona directamente
# con redis.from_url() que ya usamos
```

> **IMPORTANTE**: Guardar esta URL como `REDIS_URL`. No commitear a git.

---

## 5. Paso a Paso: Desplegar Backend en Fly.io

### Paso 5.1: Crear la app

```bash
cd backend

# Crear la app en Fly.io (sin desplegar aun)
fly apps create vocari-api --org personal

# Verificar
fly apps list
```

### Paso 5.2: Configurar secrets (variables sensibles)

```bash
# Base de datos (Supabase)
fly secrets set DATABASE_URL="postgresql+asyncpg://postgres.[ref]:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres" -a vocari-api

# Redis (Upstash)
fly secrets set REDIS_URL="rediss://default:[PASSWORD]@[ENDPOINT]:6379" -a vocari-api

# Seguridad
fly secrets set SECRET_KEY="$(openssl rand -hex 32)" -a vocari-api
fly secrets set JWT_SECRET_KEY="$(openssl rand -hex 32)" -a vocari-api

# Google OAuth
fly secrets set GOOGLE_CLIENT_ID="tu-client-id.apps.googleusercontent.com" -a vocari-api
fly secrets set GOOGLE_CLIENT_SECRET="tu-client-secret" -a vocari-api

# OpenRouter (opcional, para IA)
fly secrets set OPENROUTER_API_KEY="tu-key" -a vocari-api

# Verificar que todos estan seteados
fly secrets list -a vocari-api
```

### Paso 5.3: Desplegar

```bash
cd backend

# Deploy (usa el Dockerfile existente + fly.toml)
fly deploy -a vocari-api
```

### Paso 5.4: Verificar

```bash
# Health check
curl https://vocari-api.fly.dev/health

# Ver logs
fly logs -a vocari-api

# Ver estado
fly status -a vocari-api
```

### Paso 5.5: Ejecutar migraciones en Fly.io

```bash
# Conectar via SSH y ejecutar migraciones
fly ssh console -a vocari-api -C "alembic upgrade head"
```

---

## 6. Paso a Paso: Desplegar Frontend en Vercel

### Paso 6.1: Conectar repositorio

1. Ir a https://vercel.com/dashboard
2. Click **Add New > Project**
3. Importar el repositorio de GitHub
4. Configurar:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend` (IMPORTANTE: no es la raiz del repo)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm ci` (default)

### Paso 6.2: Configurar variables de entorno

En **Settings > Environment Variables**:

| Variable | Valor | Environments |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://vocari-api.fly.dev` | Production, Preview |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `tu-client-id.apps.googleusercontent.com` | Production, Preview |
| `NEXT_PUBLIC_AI_ENABLED` | `true` | Production, Preview |

### Paso 6.3: Desplegar

El deploy se hace automaticamente al pushear a `main`. O manualmente:

```bash
cd frontend
vercel --prod
```

### Paso 6.4: Verificar

1. Abrir la URL que Vercel asigna (ej: `vocari-xxxx.vercel.app`)
2. Verificar que la landing page carga
3. Verificar que el proxy API funciona:
   ```bash
   curl https://vocari-xxxx.vercel.app/api/health
   ```

---

## 7. Paso a Paso: Configurar Dominio vocari.cl

### Paso 7.1: Configurar en Cloudflare

1. Ir a Cloudflare Dashboard > vocari.cl > DNS
2. Agregar registros:

**Para el frontend (vocari.cl):**

| Tipo | Nombre | Contenido | Proxy |
|------|--------|-----------|-------|
| CNAME | `@` | `cname.vercel-dns.com` | DNS only (gris) |
| CNAME | `www` | `cname.vercel-dns.com` | DNS only (gris) |

> **IMPORTANTE**: Cloudflare proxy debe estar **DESACTIVADO** (icono gris) para Vercel. Vercel maneja su propio SSL y CDN. Si activas el proxy de Cloudflare, habra conflicto de SSL.

**Para el backend API (api.vocari.cl):**

| Tipo | Nombre | Contenido | Proxy |
|------|--------|-----------|-------|
| CNAME | `api` | `vocari-api.fly.dev` | DNS only (gris) |

> **IMPORTANTE**: Tambien desactivar proxy de Cloudflare para api.vocari.cl. Fly.io maneja su propio SSL.

### Paso 7.2: Configurar dominio en Vercel

```bash
# Agregar dominio al proyecto de Vercel
vercel domains add vocari.cl

# Si pide verificacion, seguir instrucciones (agregar TXT record)
```

O desde Vercel Dashboard: **Project > Settings > Domains > Add**:
- Agregar `vocari.cl`
- Agregar `www.vocari.cl` (redirect a vocari.cl)

### Paso 7.3: Configurar dominio en Fly.io

```bash
# Agregar certificado SSL para api.vocari.cl
fly certs add api.vocari.cl -a vocari-api

# Verificar estado del certificado
fly certs show api.vocari.cl -a vocari-api
```

### Paso 7.4: Actualizar variables de entorno

Ahora que tenemos dominios reales, actualizar:

**En Fly.io secrets:**
```bash
fly secrets set FRONTEND_URL="https://vocari.cl" -a vocari-api
fly secrets set ALLOWED_ORIGINS="https://vocari.cl,https://www.vocari.cl" -a vocari-api
fly secrets set GOOGLE_REDIRECT_URI="https://api.vocari.cl/api/v1/auth/callback" -a vocari-api
```

**En Vercel env vars:**
| Variable | Nuevo valor |
|----------|------------|
| `NEXT_PUBLIC_API_URL` | `https://api.vocari.cl` |

**En Google Cloud Console:**
1. Ir a APIs & Services > Credentials > Tu OAuth Client
2. Agregar a **Authorized JavaScript origins**: `https://vocari.cl`
3. Agregar a **Authorized redirect URIs**: `https://api.vocari.cl/api/v1/auth/callback`

### Paso 7.5: Verificar todo

```bash
# Frontend
curl -I https://vocari.cl
# Esperar: HTTP 200

# Backend API
curl https://api.vocari.cl/health
# Esperar: {"status": "ok"}

# Proxy de API desde frontend
curl https://vocari.cl/api/health
# Esperar: {"status": "ok"}

# Google OAuth
# Abrir https://vocari.cl/auth/login en el navegador
# Click "Iniciar sesion con Google"
# Debe redirigir a Google y volver a vocari.cl
```

---

## 8. Paso a Paso: Configurar SSL

### Vercel
- SSL automatico. Vercel provisiona certificado Let's Encrypt al agregar el dominio.
- No hay que hacer nada.

### Fly.io
- SSL automatico al ejecutar `fly certs add api.vocari.cl`.
- El certificado se provisiona en ~30 segundos.
- Verificar con: `fly certs show api.vocari.cl -a vocari-api`

### Cloudflare
- Si el proxy esta **desactivado** (como recomendamos), Cloudflare no interviene en SSL.
- Si decides activar el proxy, configurar SSL mode en **Full (strict)**.

---

## 9. CI/CD con GitHub Actions

### Flujo de deployment automatizado

```
Push a main
    |
    v
GitHub Actions
    |
    +---> [lint + test] (paralelo backend + frontend)
    |
    +---> Si pasan:
    |       +---> fly deploy (backend)
    |       +---> vercel deploy (frontend, automatico via Vercel Git Integration)
    |
    +---> Si fallan: BLOQUEAR deploy
```

### Configurar secrets en GitHub

Ir a **Repository > Settings > Secrets and variables > Actions**:

| Secret | Valor | Para que |
|--------|-------|----------|
| `FLY_API_TOKEN` | Token de `fly tokens create deploy -a vocari-api` | Deploy del backend |

> **Nota**: Vercel se despliega automaticamente via su integracion con GitHub. No necesita token en GitHub Actions si ya conectaste el repo en Vercel Dashboard.

---

## 10. Actualizacion de Google OAuth para Produccion

### Paso 10.1: Pantalla de consentimiento

1. Ir a Google Cloud Console > APIs & Services > OAuth consent screen
2. Configurar para produccion:
   - **App name**: Vocari
   - **User support email**: soporte@vocari.cl (o tu email)
   - **App logo**: Subir logo de Vocari
   - **Application home page**: `https://vocari.cl`
   - **Privacy policy**: `https://vocari.cl/privacidad` (crear esta pagina)
   - **Terms of service**: `https://vocari.cl/terminos` (crear esta pagina)
3. **Scopes**: `email`, `profile`, `openid`
4. **Test users**: Agregar emails para pruebas mientras la app no este verificada

### Paso 10.2: Publicar la app (opcional, para usuarios externos)

Si solo usas cuentas de tu organizacion Google Workspace, no necesitas publicar.
Si quieres que cualquier cuenta Google pueda entrar, debes:
1. Click "Publish App"
2. Google puede pedir verificacion (toma 2-6 semanas)
3. Mientras tanto, solo los test users pueden acceder

---

## 11. Checklist de Verificacion Post-Deploy

### Infraestructura

- [ ] `https://vocari.cl` carga la landing page
- [ ] `https://api.vocari.cl/health` responde `{"status": "ok"}`
- [ ] `https://vocari.cl/api/health` responde OK (proxy funciona)
- [ ] SSL valido en vocari.cl (candado verde)
- [ ] SSL valido en api.vocari.cl (candado verde)

### Autenticacion

- [ ] Login con Google OAuth funciona desde vocari.cl
- [ ] Token se guarda en localStorage del navegador
- [ ] `/api/v1/auth/me` retorna el usuario correcto
- [ ] Token refresh funciona (`/api/v1/auth/refresh`)
- [ ] Logout limpia tokens

### Funcionalidad Estudiante

- [ ] Dashboard estudiante carga en `/estudiante`
- [ ] Test RIASEC funciona (36 preguntas + resultados)
- [ ] Resultados RIASEC se guardan en backend (POST /tests/riasec)
- [ ] Pagina de perfil carga en `/estudiante/perfil`
- [ ] Pagina de carreras carga en `/estudiante/carreras`

### Base de Datos

- [ ] 18+ tablas existen en Supabase
- [ ] Migraciones aplicadas (verificar en Supabase Table Editor)
- [ ] Datos se persisten entre deploys

### Performance

- [ ] Landing page carga en < 3 segundos
- [ ] API health check responde en < 500ms
- [ ] No hay errores en la consola del navegador

---

## 12. Rollback

### Backend (Fly.io)

```bash
# Listar versiones anteriores
fly releases -a vocari-api

# Rollback a version anterior
fly deploy --image registry.fly.io/vocari-api:deployment-XXXXX -a vocari-api
```

### Frontend (Vercel)

1. Ir a Vercel Dashboard > Deployments
2. Encontrar el deployment anterior funcionando
3. Click en los 3 puntos > "Promote to Production"

### Base de Datos

```bash
# Supabase no tiene rollback automatico en free tier
# Opcion: restaurar desde backup manual
# Siempre hacer backup antes de migraciones:
pg_dump "postgresql://..." > backup-YYYY-MM-DD.sql
```

---

## 13. Costos Futuros (cuando escalar)

| Cuando | Que hacer | Costo nuevo |
|--------|-----------|-------------|
| >100 usuarios concurrentes | Fly.io scale up (shared-cpu-2x, 512MB) | ~$7/mes |
| >500MB datos | Supabase Pro | $25/mes |
| >10K comandos Redis/dia | Upstash Pro | $10/mes |
| >100GB bandwidth frontend | Vercel Pro | $20/mes |
| Necesitas workers de IA | Fly.io maquina adicional | ~$5/mes |
| **Total escala intermedia** | | **~$67/mes** |

Esto sigue siendo mas barato que los $87-105 de GCP Cloud Run y soporta 500+ estudiantes.

---

## 14. Diferencias con Desarrollo Local

| Aspecto | Local | Produccion |
|---------|-------|-----------|
| Frontend URL | `http://localhost:3000` | `https://vocari.cl` |
| Backend URL | `http://localhost:8000` | `https://api.vocari.cl` |
| PostgreSQL | Docker localhost:5433 | Supabase (sa-east-1) |
| Redis | Docker localhost:6379 | Upstash (sa-east-1) |
| OAuth redirect | `localhost:8000/api/v1/auth/callback` | `api.vocari.cl/api/v1/auth/callback` |
| SSL | No | Si (automatico) |
| Auto-deploy | No | Si (push a main) |
