# Skill 07: IA - Explicación de Resultados

## Propósito

Generar explicaciones personalizadas de resultados del test vocacional usando Claude API, traduciendo el código Holland RIASEC en narrativa comprensible y motivadora.

---

## Responsabilidades

- [x] Recibir código Holland + puntajes del usuario
- [x] Generar explicación personalizada con Claude API
- [x] Explicar qué significa cada letra del código
- [x] Relacionar perfil con carreras recomendadas
- [x] Incluir fortalezas identificadas
- [x] Sugerir áreas de exploración
- [x] Tono empático, motivador y claro
- [x] Longitud: 200-300 palabras

---

## Entradas

```typescript
{
  codigo_holland: string,        // Ej: "ISA"
  puntajes: object,               // { R: 18, I: 28, A: 22, S: 25, E: 15, C: 12 }
  certeza: string,                // "Alta" | "Media" | "Exploratoria"
  top_carreras: string[],         // ["Ing. Informática", "Psicología", ...]
  edad: number,
  nombre: string
}
```

---

## Salidas

```typescript
{
  explicacion: string,            // Texto generado por IA
  puntos_clave: string[],         // 3-5 bullet points
  fortalezas: string[],          // Basadas en dimensiones altas
  areas_explorar: string[],      // Sugerencias concretas
  tokens_usados: number,
  costo_usd: number
}
```

---

## Prompt Template para Claude

```markdown
Eres un orientador vocacional experto. Debes generar una explicación personalizada y motivadora para un estudiante que completó el test Holland RIASEC.

DATOS DEL ESTUDIANTE:
- Nombre: {{nombre}}
- Edad: {{edad}}
- Código Holland: {{codigo_holland}}
- Nivel de certeza: {{certeza}}
- Puntajes RIASEC: {{puntajes}}
- Top 3 carreras recomendadas: {{top_carreras}}

DIMENSIONES HOLLAND:
- R (Realista): Trabajo práctico, técnico, manual
- I (Investigador): Análisis, ciencia, resolución de problemas
- A (Artístico): Creatividad, expresión, diseño
- S (Social): Ayudar personas, enseñar, colaborar
- E (Emprendedor): Liderar, persuadir, negocios
- C (Convencional): Organización, datos, administración

INSTRUCCIONES:
1. Explica qué significa su código {{codigo_holland}} de forma clara
2. Destaca sus 2-3 fortalezas principales (dimensiones con puntaje alto)
3. Relaciona su perfil con las carreras recomendadas
4. Usa un tono empático, motivador y cercano
5. Evita tecnicismos excesivos
6. Longitud: 200-300 palabras
7. Escribe en español de Chile

FORMATO DE SALIDA (JSON):
{
  "explicacion": "texto completo...",
  "puntos_clave": ["punto 1", "punto 2", "punto 3"],
  "fortalezas": ["fortaleza 1", "fortaleza 2"],
  "areas_explorar": ["sugerencia 1", "sugerencia 2"]
}
```

---

## Implementación

```javascript
// netlify/functions/ia-explicacion.js
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

export async function handler(event) {
  const { codigo_holland, puntajes, certeza, top_carreras, edad, nombre } = JSON.parse(event.body)

  const prompt = generarPrompt({ codigo_holland, puntajes, certeza, top_carreras, edad, nombre })

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: prompt
    }]
  })

  const respuesta = JSON.parse(message.content[0].text)

  return {
    statusCode: 200,
    body: JSON.stringify({
      ...respuesta,
      tokens_usados: message.usage.total_tokens,
      costo_usd: calcularCosto(message.usage.total_tokens)
    })
  }
}

function calcularCosto(tokens) {
  // Claude Sonnet 3.5: $3/M input, $15/M output
  const input_tokens = tokens * 0.7  // Estimado
  const output_tokens = tokens * 0.3
  return ((input_tokens / 1000000) * 3) + ((output_tokens / 1000000) * 15)
}
```

---

## Costos Estimados

- **Costo por explicación:** ~$0.10 - $0.20 USD
- **Costo mensual (100 usuarios):** ~$10 - $20 USD
- **Modelo:** Claude 3.5 Sonnet (balance calidad/precio)

---

## Restricciones

- **No usar IA para scoring** (solo explicación)
- **Tono apropiado para 15-18 años**
- **Evitar promesas absolutas** ("Esta ES tu carrera ideal")
- **Enfatizar exploración** sobre certeza absoluta

---

**Estado:** 🟡 Pendiente
**Prioridad:** 🟠 Media (nice-to-have en MVP)
**Tiempo estimado:** 2 días
**Dependencias:** Skill 02 (Test RIASEC), Skill 03 (Motor Recomendación)
