import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { formatDateCL } from "@/lib/utils/dates";

interface RIASECData {
  result_code: string;
  certainty: number;
  scores: Record<string, number>;
  date: string;
}

interface CareerRec {
  name: string;
  area: string;
  holland_codes: string[];
  description: string;
  salary_range: { min: number; max: number; median: number; currency: string };
  employability: number;
  saturation_index: number;
  match_score: number;
}

interface GameResult {
  game_name: string;
  skills_evaluated: string[];
  skills_scores: Record<string, number>;
  duration_seconds: number;
  date: string;
}

interface ReportData {
  student_name: string;
  student_email: string;
  institution_name: string;
  generated_at: string;
  riasec: RIASECData | null;
  holland_code: string | null;
  riasec_descriptions: Record<string, string>;
  career_recommendations: CareerRec[];
  game_results: GameResult[];
  skills_summary: Record<string, number>;
  ai_insights?: string;
}

interface PublicReport {
  id: string;
  report_type: string;
  report_data: ReportData;
  status: string;
  created_at: string;
}

async function getReport(token: string): Promise<PublicReport | null> {
  try {
    const res = await fetch(
      `https://vocari-api.fly.dev/api/v1/reports/public/${token}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const report = await getReport(token);
  if (!report) return { title: "Informe no encontrado — Vocari" };
  const name = report.report_data.student_name;
  return {
    title: `Informe Vocacional de ${name} — Vocari`,
    description: `Perfil vocacional completo de ${name} con código Holland ${report.report_data.holland_code ?? ""}, carreras recomendadas y habilidades evaluadas.`,
  };
}

const RIASEC_COLORS: Record<string, string> = {
  R: "bg-riasec-R/10 text-riasec-R border-riasec-R/20",
  I: "bg-riasec-I/10 text-riasec-I border-riasec-I/20",
  A: "bg-riasec-A/10 text-riasec-A border-riasec-A/20",
  S: "bg-riasec-S/10 text-riasec-S border-riasec-S/20",
  E: "bg-riasec-E/10 text-riasec-E border-riasec-E/20",
  C: "bg-riasec-C/10 text-riasec-C border-riasec-C/20",
};

const RIASEC_LABELS: Record<string, string> = {
  R: "Realista",
  I: "Investigador",
  A: "Artístico",
  S: "Social",
  E: "Emprendedor",
  C: "Convencional",
};

function formatCLP(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}

function RIASECBar({ letter, score }: { letter: string; score: number }) {
  const pct = Math.round((score / 30) * 100);
  const colorClass =
    letter === "R"
      ? "bg-riasec-R"
      : letter === "I"
        ? "bg-riasec-I"
        : letter === "A"
          ? "bg-riasec-A"
          : letter === "S"
            ? "bg-riasec-S"
            : letter === "E"
              ? "bg-riasec-E"
              : "bg-riasec-C";

  return (
    <div className="flex items-center gap-3">
      <span className="w-6 font-bold text-sm text-aura-ink">{letter}</span>
      <div className="flex-1 bg-aura-surface-low rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-sm font-semibold text-aura-ink">
        {score}
      </span>
    </div>
  );
}

export default async function InformePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const report = await getReport(token);

  if (!report) notFound();

  const d = report.report_data;
  const generatedDate = new Date(d.generated_at).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Santiago",
  });

  return (
    <div className="min-h-screen bg-aura-surface">
      {/* Header */}
      <header className="bg-white border-b border-aura-primary/10 sticky top-0 z-10 print:static">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-aura-primary to-aura-violet rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="font-bold text-aura-ink">Vocari</span>
          </div>
          <span className="text-sm text-aura-muted">Informe Vocacional</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero card */}
        <div className="bg-gradient-to-r from-aura-primary to-aura-violet rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-white/70 text-sm font-medium uppercase tracking-wider mb-1">
                Informe Vocacional
              </p>
              <h1 className="text-3xl font-bold mb-1">{d.student_name}</h1>
              <p className="text-white/70">{d.institution_name}</p>
              <p className="text-white/50 text-sm mt-2">Generado el {generatedDate}</p>
            </div>
            {d.holland_code && (
              <div className="text-center">
                <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center border border-white/30">
                  <span className="text-4xl font-black">{d.holland_code}</span>
                </div>
                <p className="text-white/70 text-xs mt-2 font-medium">Código Holland</p>
              </div>
            )}
          </div>
        </div>

        {/* RIASEC Profile */}
        {d.riasec && (
          <div className="aura-glass p-6">
            <h2 className="text-xl font-bold text-aura-ink mb-1">
              Perfil RIASEC
            </h2>
            <p className="text-aura-muted text-sm mb-5">
              Test de Intereses Vocacionales de Holland
            </p>

            {/* Holland code badges */}
            {d.holland_code && (
              <div className="flex flex-wrap gap-2 mb-6">
                {d.holland_code.split("").map((letter) => (
                  <span
                    key={letter}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${RIASEC_COLORS[letter] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}
                  >
                    <span className="font-bold">{letter}</span>
                    <span>{RIASEC_LABELS[letter] ?? letter}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Score bars */}
            <div className="space-y-3">
              {Object.entries(d.riasec.scores ?? {})
                .sort(([, a], [, b]) => b - a)
                .map(([letter, score]) => (
                  <RIASECBar key={letter} letter={letter} score={score as number} />
                ))}
            </div>

            {/* Descriptions for top 3 */}
            {d.holland_code && (
              <div className="mt-5 pt-5 border-t border-aura-primary/10">
                <p className="text-sm font-medium text-aura-ink mb-3">
                  Tus dimensiones principales:
                </p>
                <div className="grid gap-2">
                  {d.holland_code.split("").slice(0, 3).map((letter) => (
                    <div
                      key={letter}
                      className={`flex items-start gap-2 px-3 py-2 rounded-lg text-sm ${RIASEC_COLORS[letter] ?? ""}`}
                    >
                      <span className="font-bold w-4 flex-shrink-0">{letter}</span>
                      <span>{d.riasec_descriptions?.[letter] ?? letter}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Insights */}
        {d.ai_insights && (
          <div className="aura-glass p-6">
            <h2 className="text-xl font-bold text-aura-ink mb-1 flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              Análisis Personalizado con IA
            </h2>
            <p className="text-aura-muted text-sm mb-5">
              Interpretación generada por inteligencia artificial de tu perfil vocacional
            </p>
            <div className="prose prose-sm max-w-none text-aura-ink whitespace-pre-wrap leading-relaxed">
              {d.ai_insights}
            </div>
          </div>
        )}

        {/* Career Recommendations */}
        {d.career_recommendations.length > 0 && (
          <div className="aura-glass p-6">
            <h2 className="text-xl font-bold text-aura-ink mb-1">
              Carreras Recomendadas
            </h2>
            <p className="text-aura-muted text-sm mb-5">
              Basado en tu perfil vocacional y datos de empleabilidad MINEDUC
            </p>

            <div className="grid gap-4">
              {d.career_recommendations.map((career, idx) => (
                <div
                  key={idx}
                  className="border border-aura-primary/10 rounded-xl p-4 hover:border-aura-primary/30 hover:bg-aura-surface-low/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-aura-ink">{career.name}</h3>
                        {career.match_score > 0 && (
                          <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">
                            {career.match_score}% compatibilidad
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-aura-muted mb-1">{career.area}</p>
                      <p className="text-sm text-aura-ink/80">{career.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-aura-muted mb-0.5">Sueldo promedio</p>
                      <p className="font-bold text-aura-ink text-sm">
                        {formatCLP(career.salary_range?.median ?? 0)}
                      </p>
                      <p className="text-xs text-aura-muted">
                        {career.salary_range?.min && career.salary_range?.max
                          ? `${formatCLP(career.salary_range.min)} – ${formatCLP(career.salary_range.max)}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-aura-primary/10">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-success" />
                      <span className="text-xs text-aura-muted">
                        {Math.round((career.employability ?? 0) * 100)}% empleabilidad
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          (career.saturation_index ?? 0) < 0.4
                            ? "bg-success"
                            : (career.saturation_index ?? 0) < 0.6
                              ? "bg-warning"
                              : "bg-error"
                        }`}
                      />
                      <span className="text-xs text-aura-muted">
                        Saturación{" "}
                        {(career.saturation_index ?? 0) < 0.4
                          ? "baja"
                          : (career.saturation_index ?? 0) < 0.6
                            ? "media"
                            : "alta"}
                      </span>
                    </div>
                    <div className="flex gap-1 ml-auto">
                      {(career.holland_codes ?? []).map((code) => (
                        <span
                          key={code}
                          className={`text-xs px-1.5 py-0.5 rounded font-bold border ${RIASEC_COLORS[code] ?? "bg-aura-surface-high text-aura-muted border-aura-primary/20"}`}
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-aura-muted mt-4">
              * Datos de empleabilidad y sueldos basados en estadísticas del Ministerio de Educación de Chile (MINEDUC)
            </p>
          </div>
        )}

        {/* Skills from games */}
        {Object.keys(d.skills_summary).length > 0 && (
          <div className="aura-glass p-6">
            <h2 className="text-xl font-bold text-aura-ink mb-1">
              Habilidades Evaluadas
            </h2>
            <p className="text-aura-muted text-sm mb-5">
              Resultado de actividades y juegos vocacionales
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Object.entries(d.skills_summary)
                .sort(([, a], [, b]) => b - a)
                .map(([skill, score]) => (
                  <div
                    key={skill}
                    className="bg-aura-surface-low rounded-xl p-3 text-center border border-aura-primary/10"
                  >
                    <div className="text-2xl font-black text-aura-primary">
                      {Math.round(score * 100)}
                    </div>
                    <div className="text-xs text-aura-muted mt-1 capitalize">
                      {skill.replace(/_/g, " ")}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Games history */}
        {d.game_results.length > 0 && (
          <div className="aura-glass p-6">
            <h2 className="text-xl font-bold text-aura-ink mb-5">
              Actividades Realizadas
            </h2>
            <div className="space-y-3">
              {d.game_results.map((game, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-3 bg-aura-surface-low rounded-xl border border-aura-primary/10"
                >
                  <div className="w-10 h-10 bg-aura-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-aura-primary font-bold text-sm">{idx + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-aura-ink text-sm">{game.game_name}</p>
                    <p className="text-xs text-aura-muted">
                      {game.skills_evaluated.join(", ")}
                    </p>
                  </div>
                  <div className="text-right text-xs text-aura-muted">
                    {Math.round((game.duration_seconds ?? 0) / 60)} min
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA footer */}
        <div className="bg-gradient-to-r from-aura-primary to-aura-violet rounded-2xl p-6 text-white text-center">
          <h3 className="text-lg font-bold mb-2">
            ¿Quieres orientación personalizada?
          </h3>
          <p className="text-white/70 text-sm mb-4">
            Accede a la plataforma Vocari para sesiones con orientadores, más tests y seguimiento continuo de tu desarrollo vocacional.
          </p>
          <a
            href="https://app.vocari.cl"
            className="inline-block bg-white text-aura-primary font-semibold px-6 py-2.5 rounded-xl hover:bg-aura-surface transition-colors text-sm"
          >
            Acceder a Vocari →
          </a>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-aura-muted pb-4">
          <p>Informe generado por Vocari — Plataforma de Orientación Vocacional</p>
          <p className="mt-1">
            vocari.cl · app.vocari.cl
          </p>
        </div>
      </main>
    </div>
  );
}
