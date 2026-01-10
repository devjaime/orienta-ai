# Guía del Selector de Perfil - OrientaIA

## 🎯 Implementación Completada

Se ha agregado un **selector de perfil** prominente en el landing page que permite a los usuarios elegir su tipo de perfil (Estudiante, Orientador o Administrador) antes de iniciar sesión.

---

## 📦 Archivos Modificados/Creados

### Nuevos Archivos
- `src/components/ProfileSelector.jsx` - Componente principal del selector

### Archivos Modificados
- `src/pages/LandingPage.jsx` - Integra ProfileSelector después del Hero
- `src/components/GoogleSignIn.jsx` - Agrega props `buttonText` y `onSuccess`

---

## 🚀 Cómo Probar Localmente

### 1. Acceder al Landing Page

Abre tu navegador en: **http://localhost:5173/**

### 2. Visualizar el Selector de Perfil

Después de la sección Hero, verás **3 tarjetas grandes** con los perfiles:

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   ESTUDIANTE    │  │   ORIENTADOR    │  │ ADMINISTRADOR   │
│                 │  │                 │  │                 │
│  🎓 GraduateCap │  │  👥 Users       │  │  🛡️ Shield      │
│                 │  │                 │  │                 │
│  • Test con IA  │  │  • Dashboard    │  │  • Panel admin  │
│  • Carreras     │  │  • Disponibilidad│  │  • Gestión users│
│  • Chat IA      │  │  • Apuntes IA   │  │  • Estadísticas │
│  • Seguimiento  │  │  • Timeline     │  │  • Configuración│
│                 │  │                 │  │                 │
│  [Ingresar]     │  │  [Ingresar]     │  │  [Ingresar]     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 3. Interactuar con un Perfil

1. **Haz clic en cualquier tarjeta**
2. Se abrirá un **modal contextual** con:
   - Ícono del perfil seleccionado
   - Título: "Ingresar como [Perfil]"
   - Botón de Google Sign-In personalizado
   - Información sobre el perfil
   - Botón "Cancelar" para cerrar

### 4. Iniciar Sesión

1. En el modal, haz clic en **"Continuar como [Perfil]"**
2. Se abrirá el flujo de Google Sign-In
3. Completa la autenticación con Google
4. **Automáticamente serás redirigido** a la ruta correspondiente:
   - Estudiante → `/dashboard`
   - Orientador → `/orientador/dashboard`
   - Administrador → `/admin`

---

## 🎨 Características del Diseño

### Colores por Perfil

| Perfil | Color | Uso |
|--------|-------|-----|
| Estudiante | Azul (`blue-500`) | Bordes, íconos, botones |
| Orientador | Púrpura (`purple-500`) | Bordes, íconos, botones |
| Administrador | Rojo (`red-500`) | Bordes, íconos, botones |

### Animaciones

- **Entrada:** Fade in + slide up (stagger de 0.1s entre tarjetas)
- **Hover:**
  - Escalado del ícono
  - Aumento del gap en el botón
  - Degradado de overlay
- **Modal:**
  - Fade in del backdrop
  - Scale up del contenido

### Responsive

- **Desktop:** Grid de 3 columnas
- **Tablet:** Grid de 3 columnas (ajustado)
- **Mobile:** Grid de 1 columna (stacked)

---

## 💡 Funcionalidades Destacadas

### 1. Modal Contextual

Cada perfil muestra un modal personalizado con:
- Ícono y color del perfil
- Texto dinámico
- Botón de Google Sign-In customizado

### 2. Redirección Automática

Al completar el login, el usuario es redirigido automáticamente a la ruta correcta según el perfil seleccionado.

### 3. Cierre Fácil

El modal puede cerrarse de 3 formas:
- Click fuera del modal
- Botón "Cancelar"
- Tecla ESC (comportamiento nativo del navegador)

---

## 🔄 Flujo de Usuario

```mermaid
graph TD
    A[Landing Page] --> B[Visualiza Selector de Perfil]
    B --> C{Selecciona Perfil}

    C -->|Estudiante| D[Modal Estudiante]
    C -->|Orientador| E[Modal Orientador]
    C -->|Administrador| F[Modal Administrador]

    D --> G[Google Sign-In]
    E --> G
    F --> G

    G --> H{Login Exitoso?}

    H -->|Sí, Estudiante| I[/dashboard]
    H -->|Sí, Orientador| J[/orientador/dashboard]
    H -->|Sí, Admin| K[/admin]
    H -->|No| L[Muestra Error]

    L --> G
```

---

## 📝 Detalles por Perfil

### 👨‍🎓 Estudiante (Azul)

**Descripción:**
"Descubre tu vocación con nuestro test IA y recibe orientación personalizada"

**Funcionalidades:**
- ✓ Test vocacional con IA
- ✓ Recomendaciones de carreras
- ✓ Chat con orientador virtual
- ✓ Seguimiento de progreso

**Ruta de destino:** `/dashboard`

---

### 👨‍🏫 Orientador (Púrpura)

**Descripción:**
"Gestiona estudiantes, agenda sesiones y genera reportes con IA"

**Funcionalidades:**
- ✓ Dashboard de estudiantes
- ✓ Gestión de disponibilidad
- ✓ Apuntes con resumen IA
- ✓ Timeline de progreso

**Ruta de destino:** `/orientador/dashboard`

---

### 🛡️ Administrador (Rojo)

**Descripción:**
"Administra la plataforma, usuarios y configura el sistema"

**Funcionalidades:**
- ✓ Panel de control completo
- ✓ Gestión de usuarios
- ✓ Estadísticas globales
- ✓ Configuración del sistema

**Ruta de destino:** `/admin`

---

## 🎯 Props del ProfileSelector

El componente no recibe props. Es completamente autónomo.

---

## 🔧 Props Actualizados de GoogleSignIn

### Nuevos Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `buttonText` | `string` | `'Continuar con Google'` | Texto personalizado del botón |
| `onSuccess` | `function` | `undefined` | Callback cuando login es exitoso |

### Props Existentes

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `onAuthChange` | `function` | `undefined` | Callback cuando cambia el estado de auth |
| `showUserInfo` | `boolean` | `true` | Muestra info del usuario si está autenticado |

---

## 📊 Estado del Deploy

```
Commit:     b101e0d
Branch:     main → origin/main
Archivos:   3 modificados (+260 líneas)
Status:     Push exitoso ✅
Deploy:     Netlify procesando automáticamente
```

---

## 🌐 Verificar en Producción

Una vez que Netlify complete el deploy:

1. Ve a tu sitio: `https://[tu-dominio].netlify.app/`
2. Scroll hacia abajo después del Hero
3. Verás el selector de perfil
4. Prueba el flujo completo de autenticación

---

## 🐛 Troubleshooting

### El selector no aparece

**Solución:** Verifica que el servidor esté corriendo y no haya errores de compilación.

```bash
npm run dev
```

### Error al hacer clic en un perfil

**Solución:** Verifica la consola del navegador. Puede ser un problema con Supabase.

### La redirección no funciona

**Solución:** Verifica que las rutas existan en `App.jsx`:
- `/dashboard` ✅
- `/orientador/dashboard` ✅
- `/admin` ✅

### El modal no se cierra

**Solución:** Verifica que el `onClick` del backdrop esté funcionando correctamente.

---

## 📱 Screenshots Esperados

### Desktop View
```
┌────────────────────────────────────────────────────────┐
│                    HERO SECTION                        │
│                                                        │
└────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────┐
│           ¿Cómo quieres usar Brújula?                 │
│                                                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐    │
│  │ Estudiante │  │ Orientador │  │Administrador│    │
│  │     🎓     │  │     👥     │  │     🛡️     │    │
│  └────────────┘  └────────────┘  └────────────┘    │
└───────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│                  PROBLEM SECTION                       │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Mobile View
```
┌────────────────┐
│  HERO SECTION  │
└────────────────┘

┌────────────────┐
│  ¿Cómo quieres │
│ usar Brújula?  │
│                │
│ ┌────────────┐ │
│ │ Estudiante │ │
│ │     🎓     │ │
│ └────────────┘ │
│                │
│ ┌────────────┐ │
│ │ Orientador │ │
│ │     👥     │ │
│ └────────────┘ │
│                │
│ ┌────────────┐ │
│ │Administrador│ │
│ │     🛡️     │ │
│ └────────────┘ │
└────────────────┘
```

---

## ✅ Checklist de Verificación

- [x] ProfileSelector creado y funcional
- [x] Integrado en LandingPage
- [x] GoogleSignIn actualizado con nuevos props
- [x] Modal contextual funcionando
- [x] Redirección automática implementada
- [x] Colores distintivos por perfil
- [x] Animaciones suaves
- [x] Responsive design
- [x] Commit y push exitoso
- [ ] Deploy en Netlify verificado
- [ ] Pruebas en producción realizadas

---

¡El selector de perfil está listo! 🎉
