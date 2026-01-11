# 🎭 Administrador - Acceso Completo a Todas las Vistas

## ✅ ¿Qué se configuró?

Se ha configurado el sistema para que **como administrador puedas acceder a TODAS las vistas** sin restricciones.

Esto es útil para:
- 🎯 Hacer demos del sistema
- 🧪 Probar funcionalidades de cada rol
- 👀 Ver cómo se ve la experiencia de cada tipo de usuario
- 🐛 Debugging y soporte

---

## 🚀 Cómo funciona

### Antes (problema):
```
Admin intenta entrar a /dashboard (vista estudiante)
❌ ERROR: "Esta página está disponible solo para estudiantes"
```

### Ahora (solución):
```
Admin intenta entrar a /dashboard (vista estudiante)
✅ ACCESO PERMITIDO - Admin puede ver todas las vistas
```

---

## 🎮 Cómo usar esta funcionalidad

### Opción 1: Desde el Panel Admin (Recomendado)

1. Ve a `/admin`
2. En el header verás un recuadro **"Vista Demo:"** con 3 botones:
   - **Estudiante** (azul) → Te lleva a `/dashboard`
   - **Apoderado** (verde) → Te lleva a `/parent`
   - **Orientador** (naranja) → Te lleva a `/orientador/dashboard`
3. Haz clic en cualquiera para ver esa vista
4. Siempre puedes volver a `/admin` desde cualquier vista

### Opción 2: Navegación Directa

También puedes escribir directamente en la barra de direcciones:

```
http://localhost:5173/dashboard          ← Vista Estudiante
http://localhost:5173/parent             ← Vista Apoderado
http://localhost:5173/orientador/dashboard   ← Vista Orientador
http://localhost:5173/admin              ← Tu Panel Admin
```

---

## 🔧 Cambios Técnicos Realizados

### 1. Modificación en ProtectedRoute.jsx

**Archivo:** `src/components/ProtectedRoute.jsx`

**Cambio:** Línea 68-69

**Antes:**
```javascript
if (allowedRoles.length > 0) {
  if (!allowedRoles.includes(profile.role)) {
    // Bloquear acceso
  }
}
```

**Ahora:**
```javascript
// EXCEPCIÓN: Admin tiene acceso a TODAS las rutas para demos y pruebas
if (allowedRoles.length > 0 && profile.role !== 'admin') {
  if (!allowedRoles.includes(profile.role)) {
    // Bloquear acceso
  }
}
```

**Explicación:** Se agregó la condición `&& profile.role !== 'admin'` para que los admins salten la verificación de roles.

### 2. Selector de Vistas en AdminDashboard.jsx

**Archivo:** `src/pages/AdminDashboard.jsx`

**Cambio:** Línea 169-193

Se agregó un nuevo componente visual en el header:

```jsx
{/* Selector de Vistas Demo */}
<div className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-400/30 rounded-lg">
  <span className="text-white/70 text-sm font-medium">Vista Demo:</span>
  <button onClick={() => navigate('/dashboard')} className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600">
    Estudiante
  </button>
  <button onClick={() => navigate('/parent')} className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600">
    Apoderado
  </button>
  <button onClick={() => navigate('/orientador/dashboard')} className="px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600">
    Orientador
  </button>
</div>
```

### 3. Actualización de adminService.js

**Archivo:** `src/lib/adminService.js`

**Cambios:** Líneas 495-621

Se agregaron nuevas funciones para gestión avanzada de usuarios:

- `adminDeactivateUser()` - Desactivar usuarios
- `adminGrantTemporaryAccess()` - Acceso temporal (10/15/30 días)
- `adminReactivateUser()` - Reactivar usuarios
- `adminDeleteUser()` - Eliminar permanentemente
- `getUsersExpiringSoon()` - Ver usuarios con acceso temporal
- `autoDeactivateExpiredUsers()` - Desactivar usuarios expirados automáticamente

---

## 📋 Matriz de Acceso

| Ruta | Estudiante | Apoderado | Orientador | Admin |
|------|-----------|-----------|-----------|-------|
| `/dashboard` | ✅ | ❌ | ❌ | ✅ |
| `/test` | ✅ | ❌ | ❌ | ✅ |
| `/parent` | ❌ | ✅ | ❌ | ✅ |
| `/orientador/*` | ❌ | ❌ | ✅ | ✅ |
| `/admin` | ❌ | ❌ | ❌ | ✅ |

---

## 🎯 Casos de Uso

### Caso 1: Demo para Cliente

1. Muestra el Panel Admin (`/admin`)
2. Crea un perfil de estudiante desde "Crear Nuevo Usuario"
3. Haz clic en botón "Estudiante" en "Vista Demo"
4. Muestra el dashboard del estudiante
5. Regresa a `/admin` y muestra las otras vistas

### Caso 2: Probar Flujo de Estudiante

1. Ve a `/dashboard` (vista estudiante)
2. Haz el test vocacional
3. Revisa los resultados
4. Programa una sesión con orientador
5. Vuelve a `/admin` para ver los datos generados

### Caso 3: Verificar Experiencia de Apoderado

1. Ve a `/parent` (vista apoderado)
2. Vincula estudiantes
3. Revisa las proyecciones
4. Compara carreras
5. Verifica que todo funcione correctamente

---

## ⚠️ Notas Importantes

1. **Solo el Admin tiene este privilegio**: Los demás roles (estudiante, apoderado, orientador) solo pueden acceder a sus propias rutas.

2. **Respeta los datos de otros usuarios**: Aunque puedas ver todas las vistas, no modifiques datos de usuarios reales sin su consentimiento.

3. **Para demos públicas**: Crea usuarios de prueba específicos para demos.

4. **Los tests siguen restringidos**: Aunque puedas ver `/dashboard`, el sistema sigue validando que solo estudiantes pueden hacer tests (según tu requisito "solo los estudiantes hagan test").

---

## ✅ Verificación

Para confirmar que todo funciona:

1. Inicia sesión como admin
2. Ve a `/admin`
3. Verifica que ves el selector "Vista Demo:"
4. Haz clic en "Estudiante" → Deberías ver el dashboard del estudiante
5. Escribe `/parent` en la URL → Deberías ver el dashboard del apoderado
6. Escribe `/orientador/dashboard` → Deberías ver el dashboard del orientador
7. Todas las vistas deberían cargarse sin error "Acceso Denegado"

---

## 🔄 Para Revertir (si es necesario)

Si en algún momento necesitas que el admin solo tenga acceso a `/admin`:

1. Edita `src/components/ProtectedRoute.jsx`
2. En la línea 69, elimina `&& profile.role !== 'admin'`
3. Quedará: `if (allowedRoles.length > 0) {`
4. Guarda y recarga la app

---

¡Ahora tienes control total del sistema como administrador! 🚀
