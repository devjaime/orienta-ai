# Guía de Pruebas - Sistema de Orientador

## Estado del Sistema
✅ Servidor corriendo en: http://localhost:5173/
✅ Base de datos configurada en Supabase
✅ Rutas configuradas en React Router
✅ Componentes creados y listos

## Rutas Disponibles del Sistema Orientador

### 1. Dashboard Principal
**URL:** http://localhost:5173/orientador/dashboard

**Qué verás:**
- Estadísticas principales (estudiantes, sesiones, horas trabajadas)
- Alertas de estudiantes que requieren atención
- Lista de estudiantes asignados
- Accesos rápidos a otras secciones

**Para probar:**
- Verifica que cargue sin errores
- Chequea que las estadísticas se muestren correctamente
- Intenta hacer clic en "Actualizar" para refrescar los datos

---

### 2. Configurar Disponibilidad
**URL:** http://localhost:5173/orientador/disponibilidad

**Qué verás:**
- Formulario para agregar horarios semanales
- Lista de horarios configurados
- Opciones de duración de slots (15, 30, 45, 60 min)

**Para probar:**
1. Haz clic en "Agregar Horario"
2. Selecciona un día de la semana (ej: Lunes)
3. Define horario (ej: 09:00 - 13:00)
4. Selecciona duración de slot (ej: 30 min)
5. Haz clic en "Guardar"
6. Verifica que se guarde en la base de datos

---

### 3. Perfil de Estudiante
**URL:** http://localhost:5173/orientador/estudiante/[UUID_DEL_ESTUDIANTE]

**Qué verás:**
- Información del estudiante
- Estadísticas (sesiones, tests)
- Tabs: Resumen, Timeline, Sesiones
- Alertas si tiene inactividad

**Para probar:**
1. Desde el dashboard, haz clic en "Ver Perfil" de un estudiante
2. Navega por los diferentes tabs
3. Verifica que el timeline muestre eventos
4. Revisa las sesiones programadas

---

### 4. Editor de Notas de Sesión
**URL:** http://localhost:5173/orientador/notas/[UUID_DE_SESION]

**Qué verás:**
- Área de texto para apuntes
- Sistema de tags
- Botón "Generar Resumen IA"
- Configuración de seguimiento

**Para probar:**
1. Escribe algunas notas de prueba (mínimo 50 caracteres)
2. Agrega tags como: "vocación", "familia", "indecisión"
3. Haz clic en "Generar Resumen IA"
4. Verifica que se genere el análisis con puntos clave, recomendaciones, etc.
5. Marca "Requiere seguimiento" y define una fecha
6. Haz clic en "Guardar"

---

## Cómo Acceder al Sistema

### Opción 1: Acceso Directo por URL
1. Abre tu navegador
2. Ve a: http://localhost:5173/orientador/dashboard
3. Si no estás autenticado, te redirigirá al login

### Opción 2: Login como Orientador
1. Ve a: http://localhost:5173/
2. Inicia sesión con una cuenta que tenga rol "orientador"
3. Navega a /orientador/dashboard

---

## Funcionalidades a Probar

### 1. Disponibilidad
- [ ] Agregar horarios
- [ ] Editar horarios existentes
- [ ] Eliminar horarios
- [ ] Guardar cambios

### 2. Dashboard
- [ ] Ver estadísticas en tiempo real
- [ ] Ver alertas de estudiantes
- [ ] Navegar a perfil de estudiante
- [ ] Refrescar estadísticas

### 3. Perfil de Estudiante
- [ ] Ver información básica
- [ ] Ver último test completado
- [ ] Navegar por tabs (Resumen, Timeline, Sesiones)
- [ ] Ver timeline de actividad
- [ ] Filtrar eventos en timeline

### 4. Notas de Sesión
- [ ] Escribir apuntes
- [ ] Agregar tags
- [ ] Generar resumen IA
- [ ] Ver análisis estructurado (puntos clave, recomendaciones)
- [ ] Configurar seguimiento
- [ ] Guardar notas

---

## Datos de Prueba Necesarios

Para probar completamente el sistema, necesitas:

1. **Usuario con rol "orientador"**
   - Crea un usuario en Supabase
   - Asigna rol "orientador" en la tabla `user_profiles`

2. **Estudiantes de prueba**
   - Crea algunos usuarios con rol "estudiante"
   - Asígnalos al orientador en `student_orientador_assignments`

3. **Tests completados**
   - Algunos estudiantes deben tener tests completados en `test_results`

4. **Sesiones programadas**
   - Crea sesiones en `scheduled_sessions`
   - Asigna `orientador_id` al UUID del orientador

---

## Troubleshooting

### Error: "No tienes permisos para acceder"
**Solución:** Verifica que el usuario tenga rol "orientador" en `user_profiles`

### Error: "No hay orientadores disponibles"
**Solución:** Configura disponibilidad en /orientador/disponibilidad

### El resumen IA no se genera
**Solución:** Verifica que `CLAUDE_API_KEY` esté configurada en las variables de entorno de Netlify

### No se muestran estudiantes
**Solución:** Asigna estudiantes al orientador en la tabla `student_orientador_assignments`

---

## Próximos Pasos

Una vez probado localmente:

1. ✅ Hacer commit de los cambios
2. ✅ Push a GitHub
3. ✅ Netlify desplegará automáticamente
4. ✅ Verificar que funcione en producción

---

## Archivos Creados

```
netlify/functions/
├── generate-session-summary.js       # Función IA para resúmenes

src/components/orientador/
├── OrientadorDashboard.jsx           # Dashboard principal
├── AvailabilityManager.jsx           # Gestión de disponibilidad
├── SessionNotesEditor.jsx            # Editor de apuntes con IA
├── StudentTimeline.jsx               # Timeline de progreso
└── OrientadorStudentProfile.jsx      # Perfil completo de estudiante

src/pages/
├── OrientadorDashboardPage.jsx       # Página wrapper del dashboard
├── AvailabilityPage.jsx              # Página de disponibilidad
├── SessionNotesPage.jsx              # Página de notas
└── OrientadorStudentProfilePage.jsx  # Página de perfil

src/lib/
└── orientadorService.js              # Servicios completos

scripts/
└── create-orientador-system.sql      # Script SQL completo
```

---

¡Buenas pruebas! 🚀
