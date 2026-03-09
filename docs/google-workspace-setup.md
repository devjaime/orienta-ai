# Guia de Configuracion Google Workspace

> Esta guia describe los pasos para configurar Google Workspace como proveedor de identidad para Vocari.

## Requisitos Previos

- Cuenta de administrador de Google Workspace
- Acceso a la consola de Google Cloud
- Dominio propio verificado en Google Workspace

## Paso 1: Crear Proyecto en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto: `vocari-{entorno}`
3. Selecciona el proyecto creado

## Paso 2: Habilitar APIs Necesarias

En el menu de APIs y servicios, habilita:

1. **Admin SDK API** - Para obtener directorios de usuarios
2. **People API** - Para obtener informacion de contacto
3. **Gmail API** - Para enviar correos (opcional)

## Paso 3: Configurar Pantalla de Consentimiento OAuth

1. Ve a **APIs & Services > OAuth consent screen**
2. Selecciona **Internal** (solo usuarios del dominio)
3. Completa la informacion:
   - App name: `Vocari`
   - User support email: `soporte@tu-colegio.cl`
   - App logo: Sube el logo de Vocari
4. Guarda los cambios

## Paso 4: Crear Credenciales OAuth

1. Ve a **APIs & Services > Credentials**
2. Crea **OAuth client ID**:
   - Application type: **Web application**
   - Name: `Vocari Backend`
   - Authorized redirect URIs:
     ```
     http://localhost:8000/api/v1/auth/callback
     https://api.vocari.cl/api/v1/auth/callback
     ```
3. Descarga el archivo JSON de credenciales

## Paso 5: Configurar Service Account

1. Ve a **IAM & Admin > Service Accounts**
2. Crea una cuenta de servicio:
   - Name: `vocari-service`
   - ID: `vocari-service`
3. Una vez creada, ingresa a ella y crea una clave:
   - **Keys > Add Key > JSON**
4. Descarga el archivo JSON

## Paso 6: Configurar Domain-Wide Delegation

1. En la consola de Admin de Google Workspace, ve a **Security > Access and data control > API controls**
2. Selecciona **Manage Domain Wide Delegation**
3. Agrega una nueva delegacion:
   - Client ID: El ID del Service Account (del paso anterior)
   - OAuth scopes:
     ```
     https://www.googleapis.com/auth/admin.directory.user.readonly
     https://www.googleapis.com/auth/userinfo.email
     https://www.googleapis.com/auth/userinfo.profile
     ```

## Paso 7: Configurar Vocari

Agrega estas variables de entorno:

```bash
# Google OAuth (para login de usuarios)
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_REDIRECT_URI=https://api.vocari.cl/api/v1/auth/callback

# Google Workspace (para obtener estudiantes)
GOOGLE_SERVICE_ACCOUNT_FILE=/path/to/service-account.json
GOOGLE_DELEGATED_USER=admin@tu-colegio.cl
GOOGLE_WORKSPACE_DOMAIN=tu-colegio.cl
```

## Paso 8: Verificar Configuracion

1. Inicia sesion en Vocari con Google
2. Verifica que los usuarios del dominio puedan acceder
3. Como admin de colegio, verifica que puedas ver la lista de estudiantes

## Solucion de Problemas

### Error: "invalid_client"
- Verifica que el Client ID este correcto
- Confirma que la URL de callback coincida exactamente

### Error: "access_denied"
- Verifica que el usuario este en el dominio permitido
- Confirma que la pantalla de consentimiento este configurada

### Error: "invalid_grant" en Service Account
- Verifica que Domain-Wide Delegation este configurado
- Confirma que el Client ID sea correcto

## Notas de Seguridad

- **Nunca** expongas el JSON de credenciales en el codigo fuente
- Usa secrets management (Google Secret Manager o HashiCorp Vault)
- Rota las credenciales periodicamente
- Limita los scopes al minimo necesario
