# Vocari Operations Runbook

> Guia de operaciones para administradores de Vocari.

## Arquitectura

```
                    ┌─────────────────┐
                    │   Cloudflare    │
                    │   (DNS/CDN/WAF) │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
    ┌────────────┐    ┌────────────┐    ┌────────────┐
    │  Frontend  │    │   Backend  │    │   Workers  │
    │ (Cloud Run)│    │ (Cloud Run)│    │ (Cloud Run)│
    └─────┬──────┘    └─────┬──────┘    └─────┬──────┘
          │                  │                  │
          └─────────────────┼──────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
     ┌──────────┐    ┌──────────┐    ┌──────────┐
     │ Cloud SQL │    │  Upstash │    │   GCS    │
     │  (Postgres)│    │  (Redis) │    │ (Storage)│
     └──────────┘    └──────────┘    └──────────┘
```

## Comandos de Deployment

### Deployment Manual (producion)

```bash
# Backend
gcloud run deploy vocari-backend \
  --image=ghcr.io/vocari/platform-backend:latest \
  --region=us-central1 \
  --platform=managed \
  --min-instances=1 \
  --max-instances=10 \
  --cpu=2 \
  --memory=2Gi

# Frontend
gcloud run deploy vocari-frontend \
  --image=ghcr.io/vocari/platform-frontend:latest \
  --region=us-central1 \
  --platform=managed
```

### Variables de Entorno Requeridas

```bash
# Base de datos
DATABASE_URL=postgresql+asyncpg://user:pass@/vocari

# Redis
REDIS_URL=redis://upstash-url

# Autenticacion
JWT_SECRET_KEY=<secure-random-key>
SECRET_KEY=<secure-random-key>

# Google OAuth
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=https://api.vocari.cl/api/v1/auth/callback

# Google Workspace
GOOGLE_SERVICE_ACCOUNT_FILE=/secrets/service-account.json
GOOGLE_DELEGATED_USER=admin@colegio.cl

# IA
OPENROUTER_API_KEY=sk-or-xxx
```

## Rollback

### Rollback rapido (usar imagen anterior)

```bash
# Listar revisions recientes
gcloud run revisions list --service vocari-backend

# Redirect trafico a revision anterior
gcloud run services update-traffic vocari-backend \
  --to-revisions=vocari-backend-00001=100
```

### Rollback desde Git

```bash
# Volver al commit anterior
git revert HEAD
git push origin main

# El CI/CD hara deployment automaticamente
```

## Monitoreo

### Health Checks

```bash
# Health basico
curl https://api.vocari.cl/health

# Health con DB
curl https://api.vocari.cl/health/db

# Health con Redis
curl https://api.vocari.cl/health/redis
```

### Dashboards

- **Sentry**: https://sentry.io/organizations/vocari
- **Cloud Monitoring**: https://console.cloud.google.com/monitoring

### Alertas Configuradas

| Alerta | Condicion | Severidad |
|--------|-----------|-----------|
| High Error Rate | > 5% errors en 5 min | Critical |
| High Latency | p95 > 2s | Warning |
| Database Connections | > 80% pool | Warning |
| CPU Usage | > 90% | Warning |

## Base de Datos

### Conexion Manual

```bash
# Conectar a Cloud SQL
gcloud sql connect vocari-prod --user=vocari

# Con psql directamente
psql -h /cloudsql/PROJECT:REGION:INSTANCE -U vocari -d vocari
```

### Backup

- Cloud SQL hace backups automaticos diarios
- Retencion: 30 dias
- Punto de recuperacion: ultimos 7 dias

### Restaurar Backup

```bash
gcloud sql instances restore-backup vocari-prod \
  --backup-id=BACKUP_ID \
  --backup-instance=vocari-prod
```

## Incidentes

### Error 502 Bad Gateway

1. Verificar si el backend esta respondiendo:
   ```bash
   curl https://api.vocari.cl/health
   ```

2. Ver logs en Cloud Logging:
   ```bash
   gcloud logging read "resource.type=cloud_run_revision" --limit=50
   ```

3. Si el servicio esta caido, hacer rollback o redeploy

### Error 500 Internal Server Error

1. Revisar Sentry para errores
2. Verificar conexion a BD y Redis
3. Revisar logs detallados

### Base de datos no responde

1. Verificar estado de Cloud SQL:
   ```bash
   gcloud sql instances describe vocari-prod
   ```

2. Si esta inactiva, reiniciar:
   ```bash
   gcloud sql instances restart vocari-prod
   ```

## Escalamiento

### Escalamiento Manual

```bash
# Aumentar instancias
gcloud run services update vocari-backend \
  --min-instances=2 \
  --max-instances=20
```

### Auto-scaling

El auto-scaling ya esta configurado:
- Min instances: 1
- Max instances: 10
- Scaling metric: CPU usage > 60%

## Logs

### Ver Logs en Tiempo Real

```bash
# Backend logs
gcloud logs read "resource.type=cloud_run_revision AND resource.service_name=vocari-backend" --tail=100

# Todos los servicios
gcloud logging read "resource.type=cloud_run_revision" --tail=50
```

### Buscar Errores Especificos

```bash
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" --limit=100
```

## Contactos

| Rol | Contacto |
|-----|----------|
| DevOps Lead | devops@vocari.cl |
| Backend Lead | backend@vocari.cl |
| Frontend Lead | frontend@vocari.cl |
| Escalamiento | on-call@vocari.cl |
