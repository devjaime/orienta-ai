# Sistema de Límites y Control de Costos

## Resumen

Sistema implementado para controlar el uso de la IA de Claude y prevenir costos excesivos en la demo pública de OrientaIA.

## Características Implementadas

### 1. Rate Limiting por IP (Backend)
**Ubicación:** `netlify/functions/generate-explanation.js`

- **Límite:** 3 tests por IP cada 24 horas
- **Tecnología:** Almacenamiento en memoria (Map)
- **Respuesta al límite:** Error 429 con mensaje informativo
- **Header usado:** `x-nf-client-connection-ip` (provisto por Netlify)

```javascript
// Ejemplo de respuesta cuando se alcanza el límite:
{
  "ok": false,
  "error": "Límite de uso alcanzado",
  "message": "Has alcanzado el límite de 3 tests en 24 horas. Intenta nuevamente en X hora(s).",
  "resetIn": 12
}
```

### 2. Límites de Consultas por Usuario (Frontend)
**Ubicación:** `src/lib/usageLimits.js`

- **Test con IA:** 1 gratis por navegador
- **Mensajes de chat:** 5 gratis por navegador
- **Almacenamiento:** localStorage del navegador
- **Email de contacto:** hernandez.hs@gmail.com

#### Funciones principales:
```javascript
// Verificar si puede usar IA para test
canUseTestAI()  // returns boolean

// Registrar uso de test
recordTestAIUsage()

// Verificar si puede usar chat
canUseChatAI()  // returns boolean

// Registrar uso de mensaje de chat
recordChatAIUsage()

// Obtener mensajes de límite
getLimitMessages()  // returns {testLimit, chatLimit}

// Verificar si IA está habilitada
isAIEnabled()  // lee VITE_AI_ENABLED

// Resetear límites (solo para desarrollo)
resetUsageLimits()
```

### 3. Variable de Entorno para Desactivar IA
**Archivo:** `.env`

```env
# Control de costos de IA
# Poner en "false" para desactivar completamente las funcionalidades de IA
VITE_AI_ENABLED=true
```

**Uso:**
- `true` o no definida: IA habilitada (con límites)
- `false`: IA completamente desactivada, muestra mensaje de demo limitado

### 4. UI/UX Actualizada

#### Landing Page (`src/components/Hero.jsx`)
- Banner amarillo discreto indicando "Modo Demo"
- Email de contacto visible: hernandez.hs@gmail.com
- Aparece debajo del título principal

#### Página de Resultados (`src/pages/Resultados.jsx`)
- Verifica límites antes de llamar a la IA
- Muestra mensajes diferentes según el estado:
  - **IA desactivada:** Mensaje con icono 🔒
  - **Límite alcanzado:** Mensaje de límite con email de contacto
  - **Error 429:** Mensaje específico de rate limit por IP
  - **IA disponible:** Explicación normal con Claude

#### Chat AI (`src/components/AIChat.jsx`)
- **Header:**
  - Contador de mensajes restantes (ej: "3 mensajes gratis")
  - Indicador de estado (verde = activo, rojo = límite alcanzado)
- **Input:**
  - Se deshabilita cuando se alcanza el límite
  - Banner amarillo con mensaje de contacto
- **Mensajes:**
  - Verifica límite antes de enviar cada mensaje
  - Muestra mensajes de advertencia automáticamente

## Configuración en Netlify

### Variables de Entorno Necesarias

```bash
# En Netlify Dashboard > Site Settings > Environment Variables
CLAUDE_API_KEY=sk-ant-api03-...
VITE_AI_ENABLED=true  # opcional, true por defecto
```

## Testing

### 1. Probar Rate Limiting por IP

```bash
# Hacer 4 requests consecutivos al endpoint
for i in {1..4}; do
  curl -X POST https://tu-sitio.netlify.app/.netlify/functions/generate-explanation \
    -H "Content-Type: application/json" \
    -d '{"codigo_holland":"ISA","puntajes":{"I":25,"S":20,"A":18,"R":10,"E":8,"C":5}}'
  echo "\n---\n"
done

# El 4to request debería retornar 429
```

### 2. Probar Límites de Usuario

1. Abre DevTools > Application > Local Storage
2. Busca la key: `orienta_ai_usage`
3. Observa cómo se actualiza al usar la app
4. Para resetear: `localStorage.removeItem('orienta_ai_usage')`

### 3. Probar Desactivación de IA

1. Edita `.env`:
   ```
   VITE_AI_ENABLED=false
   ```
2. Reinicia el servidor de desarrollo: `npm run dev`
3. Verifica que aparezcan los mensajes de "demo limitado"

## Estructura de Datos en localStorage

```json
{
  "testsUsed": 1,
  "chatMessagesUsed": 3,
  "firstUsedAt": "2025-01-04T10:30:00.000Z"
}
```

## Estimación de Costos

Con este sistema implementado:

| Escenario | Uso | Costo Estimado |
|-----------|-----|----------------|
| Por usuario (límite) | 1 test + 5 chats | $0.15 - $0.35 USD |
| Por IP (24h) | 3 tests | $0.30 - $0.90 USD |
| 100 usuarios nuevos/mes | 100 tests + 500 chats | $15 - $35 USD |
| Abuso bloqueado | ∞ tests intentados | $0 (bloqueados por límites) |

**Modelo usado:** Claude 3.5 Sonnet (1024 max tokens)

## Mantenimiento

### Limpiar Rate Limits en Producción

Como los rate limits están en memoria de la función serverless:
- Se resetean automáticamente cuando Netlify recicla la función
- Típicamente cada 10-15 minutos de inactividad
- No requiere mantenimiento manual

### Monitoreo de Uso

1. **Netlify Functions Logs:**
   ```
   netlify functions:log
   ```
   Busca mensajes: `⚠️ Rate limit excedido para IP: ...`

2. **Claude API Usage:**
   - Dashboard de Anthropic: https://console.anthropic.com
   - Sección "Usage"

## Próximas Mejoras (Opcional)

1. **Rate Limiting Persistente:**
   - Usar Redis/Upstash para límites que persistan entre invocaciones
   - Implementar ventanas deslizantes más precisas

2. **Analytics:**
   - Tracking de cuántos usuarios alcanzan límites
   - Métricas de conversión a usuarios pagos

3. **Autenticación Obligatoria:**
   - Forzar login antes de usar IA
   - Límites por cuenta en vez de por localStorage

4. **Tiered Limits:**
   - Usuarios gratuitos: 1 test, 5 chats
   - Usuarios registrados: 3 tests, 20 chats
   - Usuarios premium: ilimitado

## Soporte

Para cualquier duda o para solicitar más tests/chats:
**Email:** hernandez.hs@gmail.com

---

**Implementado:** 4 de enero de 2025
**Versión:** 1.0.0
