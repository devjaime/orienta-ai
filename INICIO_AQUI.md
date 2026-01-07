# 🎯 EMPIEZA AQUÍ: Integración Datos MINEDUC

¡Bienvenido! Este proyecto ahora puede enriquecerse con **datos oficiales del Ministerio de Educación de Chile**.

## 🎁 Lo que tienes ahora

✅ **Bug corregido:** Los tests RIASEC ahora guardan correctamente la explicación de IA
✅ **Estructura completa** de integración con MINEDUC
✅ **Scripts automatizados** para procesamiento de datos
✅ **Documentación detallada**

## 📚 Archivos Importantes

| Archivo | Descripción |
|---------|-------------|
| **GUIA_RAPIDA_INTEGRACION.md** | ⚡ Guía rápida (30 min) - **EMPIEZA AQUÍ** |
| **INTEGRACION_MINEDUC.md** | 📖 Documentación completa y detallada |
| `scripts/02-process-matricula.js` | Script para procesar datos de matrícula |
| `scripts/04-merge-carreras.js` | Script para fusionar con tus carreras |
| `scripts/05-upload-supabase.js` | Script para subir a Supabase |

## 🚀 Inicio Rápido (3 pasos)

### 1️⃣ Instalar dependencias

```bash
npm install
```

### 2️⃣ Descargar datos MINEDUC

1. Ve a: https://datosabiertos.mineduc.cl/matricula-en-educacion-superior/
2. Descarga el archivo más reciente (2024 o 2025)
3. Descomprime en: `data/mineduc-raw/matricula/`

### 3️⃣ Ejecutar proceso completo

```bash
# Crear tabla en Supabase primero (ver GUIA_RAPIDA_INTEGRACION.md)

# Luego ejecutar:
npm run sync-mineduc-full
```

## 📊 Datos Disponibles

Desde https://datosabiertos.mineduc.cl/:

- ✅ **Matrícula por carrera** (2007-2025) - Popularidad, tendencias
- ✅ **Titulados** (2007-2024) - Tasas de graduación
- ✅ **Pruebas de admisión** - Puntajes de corte
- ✅ **Becas y créditos** - Información financiera

## 🎯 Resultado Final

Después de la integración tendrás:

```javascript
{
  "nombre": "Ingeniería Civil en Informática",
  "codigo_holland": "IRC",
  "area": "Tecnología",

  // Datos originales
  "salario_promedio_chile_clp": 1800000,
  "empleabilidad": "Muy Alta",

  // 🆕 Datos oficiales MINEDUC
  "mineduc_data": {
    "matricula_actual": 12500,
    "instituciones_count": 45,
    "crecimiento_anual": 8.5,
    "titulados_ultimo_ano": 2100
  }
}
```

## ⚠️ Importante: Legalidad

✅ **SÍ es legal:** Usar datos de https://datosabiertos.mineduc.cl/
❌ **NO es legal:** Hacer scraping de https://www.mifuturo.cl/

Los datos abiertos del MINEDUC son públicos y están disponibles para uso educativo y comercial.

## 🔗 Enlaces Útiles

- **Datos Abiertos MINEDUC:** https://datosabiertos.mineduc.cl/
- **Contacto MINEDUC:** estadisticas@mineduc.cl
- **SIES:** https://www.sies.cl/

## 📝 Próximos Pasos

1. 📖 Lee `GUIA_RAPIDA_INTEGRACION.md`
2. 💾 Descarga datos de matrícula
3. ⚙️ Ejecuta scripts de procesamiento
4. 🚀 Integra en tu app

## 🆘 ¿Necesitas Ayuda?

- 📖 Ver `INTEGRACION_MINEDUC.md` para documentación completa
- 🐛 Sección de troubleshooting en `GUIA_RAPIDA_INTEGRACION.md`
- ✉️ Contactar a estadisticas@mineduc.cl para dudas sobre datasets

---

**¡Éxito con tu proyecto Orienta-AI! 🎓✨**
