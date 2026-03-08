# Guia de Pruebas Paso a Paso - Vocari

> Documento para validar todas las funcionalidades implementadas (Milestones 1-4).
> Ultima actualizacion: Marzo 2026

---

## Tabla de Contenidos

1. [Requisitos Previos](#1-requisitos-previos)
2. [Levantar la Infraestructura](#2-levantar-la-infraestructura)
3. [Crear la Base de Datos](#3-crear-la-base-de-datos)
4. [Validar el Backend (API)](#4-validar-el-backend-api)
5. [Validar el Frontend (Next.js)](#5-validar-el-frontend-nextjs)
6. [Flujo Completo: Autenticacion Google OAuth](#6-flujo-completo-autenticacion-google-oauth)
7. [Flujo Orientador](#7-flujo-orientador)
8. [Flujo Estudiante](#8-flujo-estudiante)
9. [Flujo Apoderado](#9-flujo-apoderado)
10. [Flujo Admin Colegio](#10-flujo-admin-colegio)
11. [Pipeline de IA](#11-pipeline-de-ia)
12. [Ejecutar Tests Automatizados](#12-ejecutar-tests-automatizados)
13. [Analisis de GAPs](#13-analisis-de-gaps)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Requisitos Previos

### Software necesario

| Software | Version | Verificar con |
|----------|---------|---------------|
| Docker Desktop | 4.x+ | `docker --version` |
| Docker Compose | v2+ | `docker compose version` |
| Node.js | 22+ | `node --version` |
| Python | 3.12+ | `python3 --version` |
| Git | 2.x+ | `git --version` |

### Cuentas y credenciales necesarias

| Servicio | Para que | Obligatorio |
|----------|----------|-------------|
| Google Cloud Console | OAuth (login con Google) | SI - sin esto no hay login |
| OpenRouter | Analisis IA de transcripciones | NO - solo para pipeline IA |
| Google Workspace Business Starter | Grabacion de Meet | NO - solo para sesiones reales |

### Configurar Google OAuth (obligatorio)

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear un proyecto o usar uno existente
3. Ir a **APIs & Services > Credentials**
4. Crear **OAuth 2.0 Client ID** tipo "Web application"
5. Configurar:
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: `http://localhost:8000/api/v1/auth/callback`
6. Anotar el `Client ID` y `Client Secret`

---

## 2. Levantar la Infraestructura

### Paso 2.1: Clonar y preparar

```bash
cd /ruta/a/tu/workspace
git clone <url-del-repo> vocari
cd vocari
```

### Paso 2.2: Configurar variables de entorno del backend

```bash
cd backend
cp .env.example .env
```

Editar `backend/.env` con tus valores reales:

```env
# --- OBLIGATORIO: Google OAuth ---
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/callback

# --- OBLIGATORIO: Seguridad ---
SECRET_KEY=genera-una-clave-con-openssl-rand-hex-32
JWT_SECRET_KEY=genera-otra-clave-con-openssl-rand-hex-32

# --- OPCIONAL: IA (dejar vacio si no vas a probar IA) ---
OPENROUTER_API_KEY=tu-key-de-openrouter

# --- No modificar (Docker Compose los sobreescribe) ---
DATABASE_URL=postgresql+asyncpg://vocari:vocari_dev@localhost:5432/vocari
REDIS_URL=redis://localhost:6379/0
```

> **Tip**: Generar claves seguras:
> ```bash
> openssl rand -hex 32
> ```

### Paso 2.3: Configurar variables de entorno del frontend

```bash
cd ../frontend
cp .env.local.example .env.local
```

Editar `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
NEXT_PUBLIC_AI_ENABLED=true
```

### Paso 2.4: Levantar PostgreSQL + Redis + Backend API + Worker

```bash
cd ../backend
docker compose up -d
```

**Validar que todo esta corriendo:**

```bash
docker compose ps
```

Deberias ver 4 servicios `running` (o `Up`):

| Servicio | Puerto | Estado esperado |
|----------|--------|-----------------|
| postgres | 5432 | healthy |
| redis | 6379 | healthy |
| api | 8000 | healthy |
| worker | - | running |

**Validar que la API responde:**

```bash
curl http://localhost:8000/health
```

Respuesta esperada:
```json
{"status": "ok"}
```

> **Si falla**: Ver [Troubleshooting](#14-troubleshooting).

### Paso 2.5: Levantar el Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Abrir en el navegador: **http://localhost:3000**

Deberias ver la pagina de inicio de Vocari.

---

## 3. Crear la Base de Datos

> **IMPORTANTE**: Las migraciones de Alembic estan configuradas pero NO hay archivos de migracion generados aun. Hay que generarlos.

### Paso 3.1: Generar la migracion inicial

```bash
cd backend

# Opcion A: Si el backend corre en Docker
docker compose exec api alembic revision --autogenerate -m "initial schema"

# Opcion B: Si tienes Python local con las dependencias
alembic revision --autogenerate -m "initial schema"
```

Esto crea un archivo en `backend/migrations/alembic/versions/` con todas las 18 tablas.

### Paso 3.2: Aplicar la migracion

```bash
# Opcion A: Docker
docker compose exec api alembic upgrade head

# Opcion B: Local
alembic upgrade head
```

### Paso 3.3: Verificar que las tablas existen

```bash
docker compose exec postgres psql -U vocari -d vocari -c "\dt"
```

Deberias ver ~18 tablas:

```
 Schema |              Name               | Type  | Owner
--------+---------------------------------+-------+--------
 public | users                           | table | vocari
 public | user_profiles                   | table | vocari
 public | institutions                    | table | vocari
 public | institution_students            | table | vocari
 public | parent_student_links            | table | vocari
 public | sessions                        | table | vocari
 public | session_recordings              | table | vocari
 public | session_transcripts             | table | vocari
 public | session_ai_analyses             | table | vocari
 public | consent_records                 | table | vocari
 public | orientador_availability         | table | vocari
 public | test_results                    | table | vocari
 public | adaptive_questionnaires         | table | vocari
 public | games                           | table | vocari
 public | game_results                    | table | vocari
 public | careers                         | table | vocari
 public | career_simulations              | table | vocari
 public | student_longitudinal_profiles   | table | vocari
 public | ai_usage_logs                   | table | vocari
 public | audit_logs                      | table | vocari
```

---

## 4. Validar el Backend (API)

### Paso 4.1: Documentacion interactiva

Abrir en el navegador: **http://localhost:8000/docs**

Esto muestra Swagger UI con todos los endpoints disponibles.

### Paso 4.2: Verificar endpoints de salud

```bash
# Health check
curl http://localhost:8000/health

# Listar todas las rutas (en Swagger UI)
# Deberias ver 24 endpoints agrupados en:
# - Auth (5 endpoints)
# - Institutions (5 endpoints)
# - Sessions (10 endpoints)
# - Consent (3 endpoints)
# - Health (1 endpoint)
```

### Paso 4.3: Probar endpoint de instituciones (requiere auth)

Sin autenticacion, deberia devolver 401:

```bash
curl -s http://localhost:8000/api/v1/institutions | python3 -m json.tool
```

Respuesta esperada: `{"detail": "Not authenticated"}` o similar.

---

## 5. Validar el Frontend (Next.js)

### Paso 5.1: Pagina de inicio

1. Abrir **http://localhost:3000**
2. Verificar que carga la landing page de Vocari
3. Verificar que el boton "Iniciar sesion" esta visible

### Paso 5.2: Pagina de login

1. Ir a **http://localhost:3000/auth/login**
2. Verificar que se muestra el boton de Google Sign-In
3. **NO hacer click aun** -- primero vamos a verificar que el backend esta configurado

### Paso 5.3: Verificar proxy de API

El frontend tiene un rewrite configurado en `next.config.ts`:

```
/api/* -> http://localhost:8000/api/v1/*
```

Probar:

```bash
curl http://localhost:3000/api/health
```

Si responde `{"status": "ok"}`, el proxy funciona correctamente.

---

## 6. Flujo Completo: Autenticacion Google OAuth

### Paso 6.1: Iniciar login

1. Ir a **http://localhost:3000/auth/login**
2. Click en **"Iniciar sesion con Google"**
3. Se redirige a Google para seleccionar cuenta
4. Despues de autenticarse, Google redirige a `http://localhost:8000/api/v1/auth/callback`
5. El backend procesa el callback y redirige al frontend con tokens

### Paso 6.2: Verificar el callback

Despues del login, deberias ser redirigido a:
- **http://localhost:3000/auth/callback?token=xxx&refresh_token=yyy**

El frontend lee los tokens y los guarda en el store de Zustand.

### Paso 6.3: Verificar sesion activa

```bash
# Usando el token que recibiste (reemplazar TOKEN)
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/v1/auth/me
```

Respuesta esperada:
```json
{
  "id": "uuid...",
  "email": "tu@email.com",
  "full_name": "Tu Nombre",
  "role": "estudiante",
  "is_active": true,
  "institution_id": null
}
```

### Paso 6.4: Asignar rol manualmente (para pruebas)

El primer usuario se crea con rol `estudiante` por defecto. Para probar otros flujos, cambia el rol directamente en la base de datos:

```bash
# Conectar a PostgreSQL
docker compose exec postgres psql -U vocari -d vocari

# Ver usuarios creados
SELECT id, email, full_name, role FROM users;

# Cambiar a orientador
UPDATE users SET role = 'orientador' WHERE email = 'tu@email.com';

# Cambiar a admin_colegio
UPDATE users SET role = 'admin_colegio' WHERE email = 'tu@email.com';

# Cambiar a apoderado
UPDATE users SET role = 'apoderado' WHERE email = 'tu@email.com';

# Cambiar a super_admin
UPDATE users SET role = 'super_admin' WHERE email = 'tu@email.com';

# Salir de psql
\q
```

> **Tip**: Usa diferentes cuentas de Google para tener usuarios con diferentes roles simultaneamente, o cambia el rol entre pruebas.

---

## 7. Flujo Orientador

### Pre-requisito
- Tener un usuario con `role = 'orientador'` (ver Paso 6.4)
- Tener una institucion creada y el usuario asignado a ella

### Paso 7.1: Crear una institucion

```bash
# Necesitas un token de super_admin o admin para esto
# Primero cambia tu usuario a super_admin (ver 6.4)
# Luego:

TOKEN="tu-jwt-token-aqui"

curl -X POST http://localhost:8000/api/v1/institutions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Colegio Demo",
    "rut": "12345678-9",
    "type": "particular_subvencionado",
    "commune": "Santiago",
    "region": "Metropolitana",
    "admin_email": "admin@colegiodemo.cl",
    "max_students": 500
  }'
```

Anota el `id` de la institucion creada.

### Paso 7.2: Asignar orientador a la institucion

```bash
docker compose exec postgres psql -U vocari -d vocari -c \
  "UPDATE users SET role='orientador', institution_id='ID-INSTITUCION' WHERE email='tu@email.com';"
```

### Paso 7.3: Configurar disponibilidad

```bash
TOKEN="tu-jwt-token-de-orientador"

# Agregar bloque de disponibilidad (Lunes 9:00-12:00)
curl -X POST http://localhost:8000/api/v1/sessions/availability \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "day_of_week": 1,
    "start_time": "09:00",
    "end_time": "12:00"
  }'
```

### Paso 7.4: Ver disponibilidad configurada

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/sessions/availability
```

### Paso 7.5: Ver sesiones asignadas

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/sessions
```

### Paso 7.6: Dashboard del orientador en el frontend

1. Login con cuenta de orientador
2. Ir a **http://localhost:3000/orientador**
3. Verificar que carga el dashboard con:
   - Lista de sesiones programadas
   - Resumen de estadisticas
4. Click en una sesion para ver detalle en **http://localhost:3000/orientador/sesiones/{id}**

### Estado: Que funciona y que NO

| Funcionalidad | Estado | Nota |
|--------------|--------|------|
| Configurar disponibilidad | FUNCIONA | API + Frontend |
| Ver sesiones | FUNCIONA | API + Frontend |
| Detalle de sesion con analisis IA | FUNCIONA | Frontend muestra tabs |
| Crear sesion de Google Meet | FUNCIONA* | *Requiere Google Workspace Business |
| Ver transcripcion | FUNCIONA* | *Requiere grabacion real de Meet |
| Notas del orientador | NO EXISTE | Sin API ni UI |
| Historial de estudiantes | NO EXISTE | Sin API de perfiles |

---

## 8. Flujo Estudiante

### Pre-requisito
- Tener un usuario con `role = 'estudiante'`
- Tener consentimiento del apoderado (ver Paso 8.5)

### Paso 8.1: Dashboard del estudiante

1. Login con cuenta de estudiante
2. Ir a **http://localhost:3000/estudiante**
3. Verificar que carga el dashboard con tarjetas de acceso rapido

### Paso 8.2: Test RIASEC (frontend completo)

1. Ir a **http://localhost:3000/estudiante/tests/riasec**
2. Se muestra pantalla de introduccion al test
3. Click "Comenzar Test"
4. Responder las 36 preguntas (6 dimensiones x 6 preguntas)
5. Al finalizar, se muestra la pantalla de resultados con:
   - Grafico radar de las 6 dimensiones RIASEC
   - Puntajes por dimension
   - Descripcion del tipo dominante

> **GAP CRITICO**: El frontend intenta enviar los resultados a `POST /api/v1/tests/riasec`, pero **este endpoint NO existe en el backend**. Los resultados se calculan y muestran en el frontend pero NO se guardan en la base de datos.

### Paso 8.3: Verificar calculo RIASEC (solo frontend)

Los puntajes se calculan en `frontend/lib/data/riasec-scoring.ts`. Puedes verificar manualmente:

1. Completar el test
2. Abrir DevTools del navegador (F12) > Console
3. Verificar que no hay errores 404 en Network (habra uno para `/api/v1/tests/riasec`)
4. Los resultados se muestran correctamente aunque no se guarden

### Paso 8.4: Agendar sesion con orientador

1. Ir a **http://localhost:3000/estudiante/sesiones/agendar**
2. Se muestra lista de orientadores disponibles
3. Seleccionar un orientador y horario
4. Confirmar la sesion

> **Requiere**: Que exista al menos un orientador con disponibilidad configurada (Paso 7.3)

### Paso 8.5: Consentimiento parental

Antes de agendar sesiones, el estudiante necesita consentimiento. Probar via API:

```bash
# Ver estado de consentimiento del estudiante
TOKEN="tu-jwt-token-de-estudiante"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/consent/status
```

Para otorgar consentimiento (desde cuenta de apoderado):

```bash
TOKEN_APODERADO="jwt-token-del-apoderado"
curl -X POST http://localhost:8000/api/v1/consent/grant \
  -H "Authorization: Bearer $TOKEN_APODERADO" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "uuid-del-estudiante",
    "consent_type": "recording",
    "granted": true
  }'
```

### Estado: Que funciona y que NO

| Funcionalidad | Estado | Nota |
|--------------|--------|------|
| Dashboard estudiante | FUNCIONA | UI basica |
| Test RIASEC (36 preguntas) | FUNCIONA* | *Solo frontend, resultados NO se guardan |
| Grafico radar RIASEC | FUNCIONA | Recharts |
| Agendar sesion | FUNCIONA | Requiere orientador con disponibilidad |
| Ver carreras recomendadas | NO EXISTE | Sin API de carreras |
| Juegos vocacionales | NO EXISTE | Sin API de juegos |
| Perfil longitudinal | NO EXISTE | Sin API de perfiles |
| Test adaptativo | NO EXISTE | Sin API |
| Reportes/PDF | NO EXISTE | Sin worker de PDFs |

---

## 9. Flujo Apoderado

### Estado actual: MINIMO

El flujo de apoderado tiene muy poca implementacion:

| Funcionalidad | Estado | Nota |
|--------------|--------|------|
| Dashboard apoderado | NO EXISTE | Directorio `frontend/app/(dashboard)/apoderado/` esta vacio |
| Ver reporte del hijo | NO EXISTE | Sin API de reportes |
| Indicador de felicidad | NO EXISTE | Sin modelo ni API |
| Otorgar consentimiento | FUNCIONA | Solo via API (POST /consent/grant) |
| Revocar consentimiento | FUNCIONA | Solo via API (POST /consent/revoke) |
| Vincular hijo | NO EXISTE | Modelo ParentStudentLink existe pero sin API |

### Lo unico que se puede probar

```bash
# 1. Verificar estado de consentimiento
TOKEN_APODERADO="jwt-del-apoderado"
curl -H "Authorization: Bearer $TOKEN_APODERADO" \
  http://localhost:8000/api/v1/consent/status

# 2. Otorgar consentimiento
curl -X POST http://localhost:8000/api/v1/consent/grant \
  -H "Authorization: Bearer $TOKEN_APODERADO" \
  -H "Content-Type: application/json" \
  -d '{"student_id": "uuid", "consent_type": "recording", "granted": true}'

# 3. Revocar consentimiento
curl -X POST http://localhost:8000/api/v1/consent/revoke \
  -H "Authorization: Bearer $TOKEN_APODERADO" \
  -H "Content-Type: application/json" \
  -d '{"student_id": "uuid", "consent_type": "recording"}'
```

---

## 10. Flujo Admin Colegio

### Estado actual: MINIMO

| Funcionalidad | Estado | Nota |
|--------------|--------|------|
| Dashboard admin | NO EXISTE | Directorio `frontend/app/(dashboard)/admin/` esta vacio |
| Estadisticas institucionales | NO EXISTE | Sin API de dashboards |
| Importar estudiantes (CSV) | NO EXISTE | Sin API |
| Gestionar orientadores | NO EXISTE | Sin API |
| Ver sesiones de la institucion | PARCIAL | API de sesiones filtra por institution_id |

### Lo unico que se puede probar (via API)

```bash
TOKEN_ADMIN="jwt-de-admin-colegio"

# Listar sesiones de la institucion
curl -H "Authorization: Bearer $TOKEN_ADMIN" \
  http://localhost:8000/api/v1/sessions

# Ver detalle de la institucion
curl -H "Authorization: Bearer $TOKEN_ADMIN" \
  http://localhost:8000/api/v1/institutions/{id}
```

---

## 11. Pipeline de IA

### Pre-requisito
- Tener `OPENROUTER_API_KEY` configurado en `backend/.env`
- Tener Redis corriendo (parte del docker-compose)
- Tener el worker corriendo (parte del docker-compose)

### Paso 11.1: Verificar que el worker esta activo

```bash
docker compose logs worker
```

Deberias ver algo como:
```
Worker started, listening on queues: ai_analysis, default
```

### Paso 11.2: Simular el pipeline completo

El pipeline se dispara cuando se completa una sesion que tiene transcripcion:

```bash
TOKEN="jwt-de-orientador"

# 1. Crear una sesion (normalmente se crea al agendar)
# Asumir que ya existe una sesion con ID conocido

# 2. Completar la sesion (esto enqueue el job de IA)
curl -X POST http://localhost:8000/api/v1/sessions/{session_id}/complete \
  -H "Authorization: Bearer $TOKEN"
```

### Paso 11.3: Ver resultado del analisis IA

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/sessions/{session_id}/analysis
```

Respuesta esperada (si el pipeline se ejecuto):
```json
{
  "session_id": "uuid",
  "summary": "Resumen de la sesion...",
  "key_topics": ["orientacion", "intereses"],
  "emotional_state": "positivo",
  "recommendations": ["Explorar carreras STEM"],
  "riasec_indicators": {"R": 0.2, "I": 0.8, ...},
  "risk_flags": [],
  "created_at": "2026-03-08T..."
}
```

### Paso 11.4: Verificar logs de costo

```bash
docker compose exec postgres psql -U vocari -d vocari -c \
  "SELECT model, prompt_tokens, completion_tokens, cost_usd FROM ai_usage_logs ORDER BY created_at DESC LIMIT 5;"
```

### Estado del Pipeline

| Componente | Estado | Nota |
|-----------|--------|------|
| OpenRouter client | FUNCIONA | Con fallback y retry |
| 5 prompts (Sonnet + Haiku) | FUNCIONA | Definidos en prompts.py |
| Pipeline paralelo | FUNCIONA | 3 Sonnet + 2 Haiku en paralelo |
| PII scrubber (RUT, nombres) | FUNCIONA | Regex para datos chilenos |
| Redis cache | FUNCIONA | TTL variable |
| Tracking de costos | FUNCIONA | Tabla ai_usage_logs |
| Worker rq | FUNCIONA | Proceso separado |

> **Nota**: Sin Google Workspace Business Starter ($6 USD/usuario/mes), no hay transcripciones reales. Se puede probar el pipeline con datos mock insertados directamente en la tabla `session_transcripts`.

---

## 12. Ejecutar Tests Automatizados

### Paso 12.1: Tests del backend (141 tests)

```bash
cd backend

# Opcion A: Dentro de Docker (recomendado - tiene PostgreSQL y Redis)
docker compose exec api pytest -v --tb=short

# Opcion B: Local (necesita PostgreSQL y Redis corriendo)
pip install -e ".[dev]"
pytest -v --tb=short

# Con cobertura
docker compose exec api pytest --cov=app --cov-report=term-missing -v
```

Resultado esperado: **141 tests passed**

### Paso 12.2: Lint del backend

```bash
# Dentro de Docker
docker compose exec api ruff check .
docker compose exec api ruff format --check .

# O local
ruff check .
ruff format --check .
```

### Paso 12.3: Build del frontend

```bash
cd frontend
npm run lint
npx tsc --noEmit    # Type check
npm run build       # Build de produccion
```

> **No hay tests unitarios del frontend** -- no esta configurado ningun test runner.

---

## 13. Analisis de GAPs

### GAPs Criticos (bloquean flujos end-to-end)

| # | GAP | Impacto | Milestone |
|---|-----|---------|-----------|
| 1 | **API de tests vocacionales no existe** | Resultados RIASEC no se guardan | M5 |
| 2 | **API de perfiles no existe** | No hay perfil longitudinal del estudiante | M5 |
| 3 | **API de carreras no existe** | No hay recomendaciones de carreras | M5 |
| 4 | **Dashboard de apoderado no existe** | Apoderado no puede ver reportes del hijo | M6 |
| 5 | **Dashboard de admin no existe** | Admin no ve estadisticas institucionales | M6 |
| 6 | **Vinculacion padre-hijo no tiene API** | No se puede vincular apoderado con estudiante | M6 |
| 7 | **Token refresh esta roto** | `/auth/refresh` siempre lanza error (stub) | M1 (deuda) |

### GAPs Importantes (funcionalidad incompleta)

| # | GAP | Impacto | Milestone |
|---|-----|---------|-----------|
| 8 | API de juegos no existe | No hay juegos vocacionales | M7 |
| 9 | Generacion de PDFs no existe | No hay reportes descargables | M7 |
| 10 | Sistema de notificaciones no existe | No hay alertas en tiempo real | M6 |
| 11 | Importacion CSV de estudiantes no existe | Admin no puede cargar alumnos masivamente | M6 |
| 12 | Audit log no tiene API | No hay trazabilidad de acciones | M6 |
| 13 | Google Workspace no configurado | Sin grabacion/transcripcion real de Meet | M8 |

### GAPs de Infraestructura

| # | GAP | Impacto | Milestone |
|---|-----|---------|-----------|
| 14 | Migraciones de Alembic no generadas | Hay que generar manualmente | M1 (deuda) |
| 15 | No hay docker-compose raiz | Frontend se levanta por separado | M8 |
| 16 | Tests de frontend no existen | Sin cobertura de tests en UI | M4 (deuda) |
| 17 | `.env` raiz tiene secretos reales | **URGENTE**: rotar credenciales | Inmediato |

---

## 14. Troubleshooting

### El backend no arranca

```bash
# Ver logs
docker compose logs api

# Causa comun: PostgreSQL no esta listo
# Solucion: esperar a que postgres este healthy
docker compose ps  # verificar estados
```

### Error "relation does not exist"

Las migraciones no se han aplicado:

```bash
docker compose exec api alembic upgrade head
```

### Error 401 "Not authenticated"

Necesitas un JWT valido. Opciones:
1. Hacer login via Google OAuth en el frontend
2. Crear un token manualmente para testing:

```bash
# Entrar al contenedor
docker compose exec api python3 -c "
from app.auth.service import create_access_token
token = create_access_token({'sub': 'uuid-del-usuario', 'role': 'orientador'})
print(token)
"
```

### El frontend no conecta con el backend

1. Verificar que el backend corre en puerto 8000:
   ```bash
   curl http://localhost:8000/health
   ```
2. Verificar `NEXT_PUBLIC_API_URL=http://localhost:8000` en `frontend/.env.local`
3. Verificar que el rewrite en `next.config.ts` funciona:
   ```bash
   curl http://localhost:3000/api/health
   ```

### El worker no procesa jobs de IA

```bash
# Ver logs del worker
docker compose logs worker

# Verificar que Redis tiene jobs encolados
docker compose exec redis redis-cli LLEN rq:queue:ai_analysis
```

### Google OAuth redirige a error

1. Verificar que `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` son correctos
2. Verificar que `http://localhost:8000/api/v1/auth/callback` esta en los Authorized redirect URIs de Google Cloud Console
3. Verificar que `http://localhost:3000` esta en Authorized JavaScript origins

### Puerto ocupado

```bash
# Ver que proceso usa el puerto
lsof -i :8000  # o :3000, :5432, :6379

# Detener contenedores
docker compose down
```

---

## Resumen de Validacion

### Checklist rapido

- [ ] Docker Compose levanta los 4 servicios
- [ ] `curl localhost:8000/health` responde OK
- [ ] `curl localhost:3000` carga la landing page
- [ ] Migraciones aplicadas (18+ tablas en PostgreSQL)
- [ ] Login con Google OAuth funciona
- [ ] Usuario se crea en tabla `users`
- [ ] Dashboard estudiante carga
- [ ] Test RIASEC se completa (36 preguntas)
- [ ] Grafico radar muestra resultados
- [ ] Dashboard orientador carga
- [ ] Disponibilidad se puede configurar
- [ ] Sesion se puede agendar
- [ ] 141 tests del backend pasan
- [ ] Frontend compila sin errores de TypeScript
- [ ] Worker de IA arranca y escucha colas

### Flujos completos que se pueden probar hoy

1. **Auth**: Login Google -> crear usuario -> ver perfil -> logout
2. **Orientador basico**: Login -> configurar disponibilidad -> ver sesiones
3. **Estudiante basico**: Login -> test RIASEC -> ver resultados (sin guardar) -> agendar sesion
4. **Consentimiento**: Apoderado otorga/revoca consentimiento via API
5. **Instituciones**: CRUD completo via API (requiere rol admin/super_admin)
6. **IA (con mock)**: Insertar transcripcion -> completar sesion -> ver analisis

### Flujos que NO se pueden probar aun

1. Estudiante: guardar resultados RIASEC, ver carreras, jugar juegos
2. Apoderado: dashboard, ver reporte del hijo, indicador de felicidad
3. Admin: dashboard institucional, importar estudiantes, estadisticas
4. Orientador: notas, historial de estudiantes
5. Google Meet: grabacion y transcripcion real (requiere Workspace Business)
