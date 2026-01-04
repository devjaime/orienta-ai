# Skill 05: Dashboard del Estudiante

## Propósito

Proveer un centro de control personalizado donde el estudiante puede ver su perfil vocacional, carreras recomendadas, progreso del test y acciones sugeridas.

---

## Responsabilidades

- [x] Mostrar perfil vocacional (código Holland + certeza)
- [x] Mostrar top 6 carreras recomendadas
- [x] Gráfico radar de puntajes RIASEC
- [x] Carreras guardadas como favoritas
- [x] Progreso del test (si no está completado)
- [x] Chat con profesionales (agendar videollamada)
- [x] Acciones sugeridas (próximos pasos)
- [x] Exportar reporte PDF

---

## Componentes Principales

```
Dashboard Estudiante
├── Mi Perfil Vocacional
│   ├── Código Holland (Ej: "ISA")
│   ├── Nivel de certeza
│   ├── Gráfico radar RIASEC
│   └── Botón "Retomar Test"
│
├── Mis Carreras Recomendadas (Top 6)
│   ├── Card por carrera
│   │   ├── Nombre
│   │   ├── % Compatibilidad
│   │   ├── Sueldo promedio
│   │   ├── Empleabilidad
│   │   └── Botón "Guardar" / "Ver Detalles"
│   └── Filtros (ordenar por compatibilidad/sueldo/empleabilidad)
│
├── Chat con Profesionales
│   ├── Agendar videollamada
│   └── Historial de sesiones
│
└── Acciones Sugeridas
    ├── "Explora Ing. Informática"
    ├── "Calcula ROI de tus carreras"
    └── "Invita a tu apoderado"
```

---

## Entradas

```typescript
{
  user_id: string
}
```

---

## Salidas

```typescript
{
  perfil: {
    codigo_holland: string,
    certeza: string,
    puntajes_riasec: object,
    test_completado: boolean,
    progreso_porcentaje: number
  },
  carreras_recomendadas: Array,
  carreras_favoritas: Array,
  proxima_accion: string,
  citas_programadas: Array
}
```

---

**Estado:** 🟡 Pendiente
**Prioridad:** 🔴 Alta
**Tiempo estimado:** 3 días
