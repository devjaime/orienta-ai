import fs from "node:fs";

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  console.error("Uso: node scripts/newman-json-to-markdown.mjs <input.json> <output.md>");
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const run = report.run || {};
const stats = run.stats || {};
const timings = run.timings || {};
const failures = run.failures || [];

const now = new Date().toISOString();

const md = [
  "# Vocari Sales QA - Reporte Newman",
  "",
  `- Fecha: ${now}`,
  `- Colección: ${report.collection?.name || "N/D"}`,
  "",
  "## Resumen",
  "",
  `- Requests totales: ${stats.requests?.total ?? 0}`,
  `- Requests fallidas: ${stats.requests?.failed ?? 0}`,
  `- Tests totales: ${stats.tests?.total ?? 0}`,
  `- Tests fallidos: ${stats.tests?.failed ?? 0}`,
  `- Duración total (ms): ${timings.completed ?? 0}`,
  "",
  "## Estado",
  "",
  failures.length === 0 ? "- Resultado: OK ✅" : "- Resultado: FALLÓ ❌",
  "",
  "## Fallos",
  "",
];

if (failures.length === 0) {
  md.push("- Sin fallos.");
} else {
  failures.forEach((f, idx) => {
    const name = f.source?.name || "Request sin nombre";
    const test = f.error?.test || "Sin nombre de test";
    const message = f.error?.message || "Sin detalle";
    md.push(`${idx + 1}. Request: ${name}`);
    md.push(`   - Test: ${test}`);
    md.push(`   - Error: ${message}`);
  });
}

md.push("");
md.push("## Siguiente paso recomendado");
md.push("");
md.push(
  failures.length === 0
    ? "- Compartir este reporte como evidencia de readiness comercial."
    : "- Corregir requests fallidas y re-ejecutar la colección."
);

fs.writeFileSync(outputPath, md.join("\n"));
