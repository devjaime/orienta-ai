# OrientaIA - Decisiones Confirmadas para MVP

**Fecha:** 2025-12-31
**Estado:** ✅ Ambigüedades resueltas - Listo para desarrollo

---

## ✅ DECISIONES CRÍTICAS CONFIRMADAS

### 1️⃣ MODELO DEL TEST: HÍBRIDO (Opción C)

**Decisión:** Test Holland RIASEC con 30-36 preguntas seleccionadas + IA para explicación

```
Estructura final:
├── R - Realista: 6 preguntas (las más discriminantes)
├── I - Investigador: 6 preguntas
├── A - Artístico: 6 preguntas
├── S - Social: 6 preguntas
├── E - Emprendedor: 6 preguntas
└── C - Convencional: 6 preguntas

Total: 36 preguntas
Duración estimada: 8-10 minutos
Scoring: DETERMINÍSTICO (suma de puntajes 1-5)
IA: Solo para EXPLICAR resultados (no para scoring)
```

**Justificación:**
- ✅ Mantiene validez científica del modelo Holland
- ✅ UX aceptable (8-10 min vs 15-20 min del test completo)
- ✅ Implementación en 2 fases (primero scoring, luego IA)
- ✅ Escalable a 60 preguntas si se necesita más precisión

---

### 2️⃣ PREGUNTAS ANCLA: NO EXISTEN (Usar algoritmo simplificado)

**Hallazgos:**
- ❌ No se encontraron en "Opciones de preguntas.docx" (es una encuesta de validación)
- ❌ No se encontraron en "Triangulo Vocacional.docx" (es otro modelo alternativo)
- ✅ Usar algoritmo de desempate simplificado

**Algoritmo de desempate confirmado:**

```javascript
function calcularCodigoRIASEC(respuestas) {
  // 1. Calcular puntaje por dimensión (suma de respuestas 1-5)
  const puntajes = {
    R: sumarRespuestas(respuestas, 'R'),
    I: sumarRespuestas(respuestas, 'I'),
    A: sumarRespuestas(respuestas, 'A'),
    S: sumarRespuestas(respuestas, 'S'),
    E: sumarRespuestas(respuestas, 'E'),
    C: sumarRespuestas(respuestas, 'C')
  }

  // 2. Ordenar por puntaje total (mayor a menor)
  let ranking = Object.entries(puntajes)
    .sort((a, b) => b[1] - a[1])

  // 3. Desempate nivel 1: Intensidad alta (contar respuestas 4-5)
  if (hayEmpate(ranking)) {
    ranking = desempatarPorIntensidad(respuestas, ranking)
  }

  // 4. Desempate nivel 2: Bajo rechazo (contar respuestas 1-2, menos es mejor)
  if (hayEmpate(ranking)) {
    ranking = desempatarPorRechazo(respuestas, ranking)
  }

  // 5. Desempate nivel 3: Orden alfabético (determinístico)
  if (hayEmpate(ranking)) {
    ranking = ranking.sort((a, b) => a[0].localeCompare(b[0]))
  }

  // 6. Calcular nivel de certeza
  const nivelCerteza = calcularNivelCerteza(ranking)

  // 7. Retornar código de 3 letras + certeza
  return {
    codigo: ranking.slice(0, 3).map(r => r[0]).join(''),
    certeza: nivelCerteza, // 'Exploratoria' | 'Media' | 'Alta'
    puntajes: puntajes
  }
}

function calcularNivelCerteza(ranking) {
  const diff1a2 = ranking[0][1] - ranking[1][1]
  const diff2a3 = ranking[1][1] - ranking[2][1]
  const diff3a4 = ranking[2][1] - ranking[3][1]

  const diferencia Promedio = (diff1a2 + diff2a3 + diff3a4) / 3

  if (diferenciaPromedio >= 5) return 'Alta'      // Clara diferenciación
  if (diferenciaPromedio >= 3) return 'Media'     // Moderada diferenciación
  return 'Exploratoria'                            // Poca diferenciación (test inconclusivo)
}
```

---

### 3️⃣ BASE DE DATOS DE CARRERAS: APIs Públicas de Chile

**Fuentes de datos confirmadas:**

#### **Opción A: Portal Datos Abiertos MINEDUC (RECOMENDADA)**

```
Fuente: Ministerio de Educación de Chile
URL Portal: https://centroestudios.mineduc.cl/datos-abiertos/
URL API: http://api.datos.mineduc.cl/api/v2/

Datasets disponibles:
- Matrícula en Educación Superior (CSV/JSON)
- Titulados de Educación Superior (CSV/JSON)
- Información de instituciones y carreras

Contacto: estadisticas@mineduc.cl
```

#### **Opción B: Portal Mifuturo.cl (Datos descargables)**

```
Fuente: Servicio de Información de Educación Superior (SIES)
URL: https://datos.gob.cl/dataset/1107
Formato: XLS (convertir a JSON)

Datos incluidos:
- 250+ carreras genéricas
- Empleabilidad (1er y 2do año de egreso)
- Ingresos promedio (1er a 5to año)
- Universidades que ofrecen cada carrera
```

#### **Opción C: Repositorio GitHub Chile Data**

```
Fuente: Comunidad open source
URL: https://github.com/palamago/chile-data
Archivos útiles:
- universidades.csv
- regiones.csv
- comunas.csv
```

**Decisión para MVP:**
1. Descargar dataset de Mifuturo.cl desde datos.gob.cl
2. Convertir XLS → JSON
3. Almacenar en `/backend/data/carreras.json`
4. Enriquecer manualmente con códigos Holland RIASEC (30 carreras iniciales)
5. Post-MVP: Integrar API en tiempo real de MINEDUC

**Estructura de datos propuesta:**

```json
{
  "carreras": [
    {
      "id": 1,
      "nombre": "Ingeniería en Informática",
      "codigo_holland": "IRC",
      "compatibilidad": {
        "I": 90,
        "R": 70,
        "C": 60,
        "A": 30,
        "S": 20,
        "E": 40
      },
      "duracion_años": 5,
      "empleabilidad_1er_año": 95,
      "empleabilidad_2do_año": 97,
      "sueldo_promedio_1er_año_clp": 800000,
      "sueldo_promedio_4to_año_clp": 1200000,
      "descripcion": "Profesional que diseña, desarrolla y mantiene sistemas informáticos...",
      "universidades_principales": [
        "Universidad de Chile",
        "Pontificia Universidad Católica de Chile",
        "Universidad Técnica Federico Santa María"
      ],
      "fuente_datos": "mifuturo.cl",
      "ultima_actualizacion": "2024-12-31"
    }
  ]
}
```

---

### 4️⃣ VIDEOLLAMADAS: SÍ, CON GOOGLE MEET (Semi-manual)

**Decisión:** Incluir videollamadas en MVP con integración semi-manual de Google Meet

**Implementación MVP:**

```
Flujo de agendamiento:
1. Usuario (estudiante/apoderado) solicita sesión desde dashboard
2. Selecciona orientador disponible (lista hardcodeada inicialmente)
3. Elige fecha/hora de slots disponibles
4. Sistema envía notificación a orientador (email/WhatsApp)
5. Orientador confirma manualmente
6. Sistema genera link de Google Meet y lo envía por email a ambos
7. Sesión se realiza en Google Meet (fuera de la plataforma)
8. Post-sesión: Orientador ingresa resumen manualmente en dashboard

Características MVP:
- ✅ Calendario simple (react-calendar o similar)
- ✅ Lista de orientadores hardcodeada
- ✅ Notificaciones por email (SendGrid o similar)
- ✅ Link de Google Meet generado automáticamente
- ❌ NO transcripción automática (Fase 2)
- ❌ NO videollamada integrada en plataforma (Fase 2)
```

**Tecnología:**
- Frontend: `react-calendar` para selección de fecha/hora
- Backend: Google Calendar API para crear eventos
- Notificaciones: SendGrid o Resend para emails
- Videollamada: Google Meet (link generado vía Google Calendar API)

**Fase 2 (Post-MVP):**
- Integrar Daily.co o similar para videollamadas en plataforma
- Transcripción automática con AssemblyAI
- Resumen automático con Claude API

---

### 5️⃣ IDIOMA: ESPAÑOL EN MVP, INGLÉS FUTURO

**Decisión:** Solo Español en MVP

```
MVP:
- ✅ Todo en español (interfaz, test, resultados, emails)
- ✅ Enfoque: Chile + LATAM hispanohablante
- ✅ Base de datos: Carreras de Chile

Post-MVP (Fase 3):
- 🔄 Implementar i18n con react-i18next
- 🔄 Traducir interfaz al inglés
- 🔄 Expandir base de datos: Carreras de USA hispano
- 🔄 Adaptar cálculos ROI a USD
```

---

## 🔍 HALLAZGO ADICIONAL: TRIÁNGULO VOCACIONAL

**Descubrimiento:** El proyecto tiene DOS modelos vocacionales

### Modelo 1: Test Holland RIASEC (Cuantitativo)
- 36 preguntas con escala 1-5
- Scoring determinístico
- Resultado: Código de 3 letras (ej: ISA)

### Modelo 2: Triángulo Vocacional (Cualitativo)
- **Vértice 1:** Lo que me gusta (Pasión) - texto libre
- **Vértice 2:** Lo que hago bien (Profesión) - texto libre
- **Vértice 3:** Lo que beneficia a otros y a mí (Misión) - texto libre

**Procesamiento:**
1. Usuario escribe 5-15 frases por vértice
2. NLP extrae keywords
3. Keywords mapean a tags normalizados
4. Tags matchean con carreras
5. Scoring: 40% Gustos + 35% Habilidades + 25% Impacto

**Decisión para MVP:**
- ✅ **Fase 1:** Implementar solo Test Holland RIASEC (más rápido, validado)
- 🔄 **Fase 2:** Agregar Triángulo Vocacional como complemento opcional
- 🔄 **Fase 3:** Combinar ambos modelos para recomendación híbrida

---

## 📋 PREGUNTAS TIPO PARA TEST HOLLAND (36 preguntas)

**Nota:** Estas son preguntas TIPO basadas en la teoría de Holland. Deben ser revisadas y aprobadas por Natalia (experta en contenido).

### R - Realista (6 preguntas)

1. Me gusta trabajar con herramientas y maquinaria
2. Disfruto realizar actividades al aire libre
3. Me siento cómodo/a resolviendo problemas prácticos con mis manos
4. Prefiero trabajos que requieran habilidades técnicas concretas
5. Me interesa saber cómo funcionan las cosas (mecánica, electricidad, construcción)
6. Me gusta construir o reparar objetos físicos

### I - Investigador (6 preguntas)

1. Me gusta analizar datos y encontrar patrones
2. Disfruto resolver problemas complejos que requieren pensamiento lógico
3. Me interesa investigar y descubrir cómo funcionan las cosas a nivel profundo
4. Prefiero trabajar con ideas y teorías abstractas
5. Me gusta experimentar y probar hipótesis
6. Disfruto aprender sobre ciencia, matemáticas o tecnología

### A - Artístico (6 preguntas)

1. Me gusta expresarme creativamente (arte, música, escritura, diseño)
2. Disfruto imaginar nuevas ideas y conceptos originales
3. Me siento cómodo/a en ambientes poco estructurados y flexibles
4. Prefiero trabajos que me permitan usar mi creatividad
5. Me interesa la estética y el diseño visual
6. Disfruto creando cosas únicas y originales

### S - Social (6 preguntas)

1. Me gusta ayudar a otras personas con sus problemas
2. Disfruto enseñar o explicar cosas a otros
3. Me siento cómodo/a trabajando en equipo y colaborando
4. Prefiero trabajos que impliquen interacción directa con personas
5. Me interesa el bienestar y desarrollo de los demás
6. Disfruto escuchar y apoyar emocionalmente a otros

### E - Emprendedor (6 preguntas)

1. Me gusta liderar proyectos y tomar decisiones
2. Disfruto persuadir y convencer a otros
3. Me siento cómodo/a asumiendo riesgos calculados
4. Prefiero trabajos que me permitan tener autonomía e influencia
5. Me interesa el mundo de los negocios y las oportunidades comerciales
6. Disfruto organizar eventos y dirigir equipos

### C - Convencional (6 preguntas)

1. Me gusta trabajar con datos, números y registros organizados
2. Disfruto seguir procedimientos y protocolos establecidos
3. Me siento cómodo/a en ambientes estructurados y predecibles
4. Prefiero trabajos que requieran precisión y atención al detalle
5. Me interesa la administración y la organización de información
6. Disfruto realizar tareas sistemáticas y ordenadas

**Escala de respuestas:**
- 1 = Totalmente en desacuerdo
- 2 = En desacuerdo
- 3 = Neutral
- 4 = De acuerdo
- 5 = Totalmente de acuerdo

---

## 🎯 ALCANCE FINAL DEL MVP

### ✅ INCLUIDO EN MVP (Semanas 1-4)

1. **Autenticación**
   - Registro email + contraseña
   - Login
   - Roles: Estudiante / Apoderado
   - Supabase Auth

2. **Test Holland RIASEC**
   - 36 preguntas (6 por dimensión)
   - Escala 1-5
   - Scoring determinístico
   - Resultado: Código 3 letras + nivel certeza

3. **Motor de Recomendación**
   - Matching código Holland → Top 6 carreras
   - Base de datos: 30 carreras iniciales de Chile
   - Datos de empleabilidad y sueldos (mifuturo.cl)

4. **Calculadora ROI**
   - Costo total carrera (5 años)
   - Sueldo promedio
   - Tiempo de recuperación inversión
   - Comparación entre carreras
   - Exportar PDF

5. **Dashboards**
   - Dashboard Estudiante (resultados, progreso, carreras favoritas)
   - Dashboard Apoderado (progreso hijo/a, análisis económico)

6. **IA - Explicación de Resultados**
   - Claude API para generar explicación personalizada
   - Basada en código Holland + puntajes + carreras recomendadas
   - Solo explicación (NO scoring)

7. **Videollamadas Semi-manual**
   - Calendario de agendamiento
   - Google Meet integration
   - Notificaciones por email

8. **PDF Generation**
   - Reporte completo con resultados
   - Gráficos de perfil RIASEC
   - Top 6 carreras con datos económicos

### ❌ NO INCLUIDO EN MVP (Fase 2+)

1. ~~Chat con profesionales en plataforma~~
2. ~~Videollamadas integradas en plataforma~~
3. ~~Transcripción automática~~
4. ~~Resumen IA post-sesión~~
5. ~~Triángulo Vocacional (modelo cualitativo)~~
6. ~~Sistema de suscripciones y pagos~~
7. ~~Bilingüe (inglés)~~
8. ~~Explorador 360° completo~~
9. ~~Red de mentores~~
10. ~~Apps mobile~~

---

## 📊 FUENTES Y REFERENCIAS

### Documentación del Proyecto
- `/app_vocacional_docs/OrientaIA_Resumen_Proyecto.pdf`
- `/app_vocacional_docs/Triangulo Vocacional.docx`
- `/app_vocacional_docs/Opciones de preguntas.docx` (encuesta de validación)
- Imágenes de maquetas y flujos

### Datos Abiertos de Chile
- [Centro de Estudios - Datos Abiertos MINEDUC](https://centroestudios.mineduc.cl/datos-abiertos/)
- [Portal Datos Abiertos - Educación Superior](https://datos.gob.cl/dataset?tags=educaci%C3%B3n+superior)
- [Mifuturo.cl - Bases de Datos](https://datos.gob.cl/dataset/1107)
- [SIES - Servicio de Información de Educación Superior](https://www.mineduc.cl/servicios/informacion-sobre-educacion/servicio-de-informacion-de-educacion-superior_sies/)

### APIs Útiles
- API MINEDUC: `http://api.datos.mineduc.cl/api/v2/`
- GitHub Chile Data: https://github.com/palamago/chile-data
- Awesome Data Chile: https://github.com/imfd/awesome-data-chile

### Teoría Holland RIASEC
- Test de Holland (John Holland's RIASEC Model)
- Código de 3 letras para clasificación vocacional
- Validado científicamente desde 1970s

---

## ✅ PRÓXIMOS PASOS

1. ✅ **Documentación completada**
2. 🔄 **Crear Skills detalladas** (7 Skills principales)
3. 🔄 **Definir esquemas de base de datos** (Supabase)
4. 🔄 **Descargar y procesar dataset de carreras**
5. 🔄 **Setup inicial del proyecto** (env vars, estructura)
6. 🔄 **Desarrollo Iteración 1** (Autenticación + Test)

---

**Última actualización:** 2025-12-31
**Responsable técnico:** Jaime
**Responsable contenido:** Natalia Soto Vega

**Estado:** ✅ **LISTO PARA DESARROLLO**
