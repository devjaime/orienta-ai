# Guía de Pruebas - Vocari.cl

## 🎯 Cómo probar cada rol

### 1. ESTUDIANTE (Usuario regular)
**Flujo:** Test → Resultados → Agendar sesión

1. Ve a **vocari.cl/test**
2. Completa el test RIASEC (30 preguntas)
3. Ve los resultados en **/resultados**
4. Click en "Agendar Sesión" 
5. Selecciona un horario disponible

**Sin login requerido** ✅

---

### 2. ORIENTADOR (Profesional)
**Flujo:** Configurar disponibilidad → Ver estudiantes

1. Ve a **vocari.cl**
2. Click "Iniciar Sesión" → Google
3. Completa tu perfil como **orientador**
4. Ve a **/orientador/disponibilidad**
5. Configura tus horarios (ej: Lunes 9:00-13:00)
6. Guarda
7. Ve a **/orientador/dashboard** para ver estudiantes

**Nota:** Necesitas que un admin te asigne el rol `orientador` en Supabase

---

### 3. ADMIN (Gestión)
**Flujo:** Panel de control total

1. Inicia sesión con Google
2. Ve a **/admin**
3. Gestiona:
   - Usuarios
   - Colegios (B2B)
   - Reportes
   - Estadísticas

**Nota:** Necesitas rol `admin` en Supabase

---

### 4. ADMIN COLEGIO (B2B)
**Flujo:** Gestionar estudiantes del colegio

1. Inicia sesión
2. Ve a **/admin**
3. Tu colegio aparece en la lista
4. Importa estudiantes con CSV
5. Genera códigos de activación

---

## 🔧 Configuración en Supabase

### Tablas necesarias:
- `user_profiles` - Perfiles con roles
- `orientador_availability` - Horarios de orientadores
- `scheduled_sessions` - Sesiones agendadas
- `test_results` - Resultados de tests

### Para asignar roles (SQL):
```sql
-- Hacer a alguien orientador
UPDATE user_profiles 
SET role = 'orientador' 
WHERE user_email = 'tu-email@ejemplo.com';

-- Hacer a alguien admin
UPDATE user_profiles 
SET role = 'admin' 
WHERE user_email = 'tu-email@ejemplo.com';
```

---

## 📱 Google Meet (Videollamadas)

**Estado:** Preparado pero requiere Edge Function

El servicio `googleMeetService.js` está listo pero necesita:
1. Configurar Google Calendar API en GCP
2. Desplegar Edge Function en Supabase

**Por ahora:** Las sesiones se agendarán sin link de Meet. El orientador puede enviar el link manualmente por email.

---

## 🐛 Problemas comunes

| Error | Solución |
|-------|----------|
| "Debes iniciar sesión" | Ve a /test sin login (ahora funciona) |
| "No hay horarios disponibles" | Un orientador debe configurar disponibilidad |
| "API no disponible" | Configura VITE_OPENROUTER_API_KEY en Netlify |
| MIME type error | Purga caché en Netlify |

---

## ✅ Checklist de funcionamiento

- [x] Test público sin login
- [x] Resultados sin login  
- [ ] Orientador puede configurar disponibilidad
- [ ] Estudiante puede agendar sesión
- [ ] Admin puede gestionar usuarios
- [ ] Chat IA responde (necesita API Key en Netlify)
- [ ] Google Meet (pendiente Edge Function)

---

*Actualizado: 2026-02-27*
