import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { WellbeingIncomeChart } from "@/components/charts/WellbeingIncomeChart";
import { formatCLP } from "@/lib/utils/currency";
import { formatDateTimeCL } from "@/lib/utils/dates";

interface ProfileSnapshot {
  profesion_actual: string;
  fortalezas_transferibles: string[];
  factores_que_drenan: string[];
}

interface RouteRecommendation {
  nombre_ruta: string;
  tipo: string;
  porque_encaja: string;
  felicidad_estimada: number;
  ingreso_estimado: number;
  friccion_cambio: number;
  necesita_relocalizacion: boolean;
  relocalizacion_detalle: string;
  necesita_ingles: boolean;
  ingles_detalle: string;
  tiempo_reconversion_meses: number;
  aprendizajes_sugeridos: string[];
}

interface GraphPoint {
  ruta: string;
  felicidad: number;
  dinero: number;
}

interface ReportPayload {
  resumen_personalizado: string;
  perfil_actual: ProfileSnapshot;
  rutas_recomendadas: RouteRecommendation[];
  grafico_bienestar_ingreso: GraphPoint[];
  plan_30_dias: string[];
  plan_90_dias: string[];
  alertas: string[];
}

interface SessionResponse {
  id: string;
  share_token: string;
  nombre: string;
  email: string;
  profesion_actual: string;
  edad: number;
  current_phase: number;
  status: string;
  summary_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface PublicReconversionReport {
  success: boolean;
  share_token: string;
  generated_at: string | null;
  model_name: string;
  prompt_version: string;
  session: SessionResponse;
  report: ReportPayload;
}

async function getPublicReport(
  token: string,
): Promise<PublicReconversionReport | null> {
  try {
    const apiBaseUrl =
      process.env.BACKEND_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "https://vocari-api.fly.dev";
    const response = await fetch(
      `${apiBaseUrl}/api/v1/reconversion/public/${token}`,
      { next: { revalidate: 900 } },
    );

    if (!response.ok) return null;
    const data = (await response.json()) as PublicReconversionReport;
    if (!data.success) return null;
    return data;
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
  const report = await getPublicReport(token);

  if (!report) {
    return { title: "Informe de reconversión no encontrado — Vocari" };
  }

  return {
    title: `Informe de reconversión de ${report.session.nombre} — Vocari`,
    description:
      "Informe público de reconversión vocacional con rutas sugeridas, bienestar estimado e ingreso proyectado.",
  };
}

function formatDate(value: string | null): string {
  const formatted = formatDateTimeCL(value);
  return formatted === "N/D" ? "No disponible" : formatted;
}

function getTypeLabel(value: string): string {
  const labels: Record<string, string> = {
    empleo: "Empleo",
    freelance: "Freelance",
    emprendimiento: "Emprendimiento",
    reestudio: "Reestudio",
  };
  return labels[value] ?? value;
}

export default async function InformeReconversionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getPublicReport(token);

  if (!data) notFound();

  const { session, report } = data;

  return (
    <div className="min-h-screen bg-aura-surface">
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <section className="overflow-hidden rounded-[2rem] aura-glass">
          <div className="bg-gradient-to-br from-aura-ink via-aura-primary to-aura-teal px-6 py-8 text-white md:px-10 md:py-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs uppercase tracking-[0.22em] text-white/70">
                  Vocari Reconversion
                </p>
                <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
                  Informe de futuro laboral para {session.nombre}
                </h1>
                <p className="mt-4 text-base leading-7 text-white/50 md:text-lg">
                  Este informe sintetiza contexto actual, energía laboral,
                  confirmación vocacional y decisiones de cambio para proponer
                  rutas fuera de tu profesión actual con mejor ajuste potencial.
                </p>
              </div>

              <div className="grid gap-3 rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur md:min-w-[280px]">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/70">
                    Perfil base
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {session.profesion_actual}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-white/50">
                  <div>
                    <p className="text-white/70">Edad</p>
                    <p className="font-semibold">{session.edad} años</p>
                  </div>
                  <div>
                    <p className="text-white/70">Generado</p>
                    <p className="font-semibold">
                      {formatDate(data.generated_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="aura-glass p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-aura-primary">
              Resumen personalizado
            </p>
            <p className="mt-4 text-lg leading-8 text-aura-ink">
              {report.resumen_personalizado}
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-aura-primary/15 bg-aura-surface-low p-5">
                <p className="text-sm font-semibold text-aura-ink">
                  Fortalezas transferibles
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {report.perfil_actual.fortalezas_transferibles.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-white px-3 py-1 text-sm text-aura-primary shadow-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-error/15 bg-error/5 p-5">
                <p className="text-sm font-semibold text-aura-ink">
                  Factores que te drenan
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {report.perfil_actual.factores_que_drenan.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-white px-3 py-1 text-sm text-error shadow-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <aside className="aura-glass p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-aura-muted">
              Gráfico central
            </p>
            <h2 className="mt-2 text-2xl font-bold text-aura-ink">
              Bienestar vs ingreso
            </h2>
            <p className="mt-2 text-sm leading-6 text-aura-muted">
              No muestra una verdad absoluta: es una estimación útil para
              comparar rutas posibles de reconversión.
            </p>
            <div className="mt-6 rounded-[1.5rem] border border-aura-primary/10 bg-aura-surface-low p-4">
              <WellbeingIncomeChart data={report.grafico_bienestar_ingreso} />
            </div>
          </aside>
        </section>

        <section className="mt-8">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-aura-muted">
              Rutas recomendadas
            </p>
            <h2 className="mt-2 text-3xl font-bold text-aura-ink">
              Tus mejores escenarios de cambio hoy
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {report.rutas_recomendadas.map((route, index) => (
              <article
                key={route.nombre_ruta}
                className="aura-glass p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-aura-primary">
                      Ruta {index + 1}
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-aura-ink">
                      {route.nombre_ruta}
                    </h3>
                    <p className="mt-1 text-sm text-aura-muted">
                      {getTypeLabel(route.tipo)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-aura-surface-low px-3 py-2 text-right">
                    <p className="text-xs text-aura-muted">Bienestar</p>
                    <p className="text-lg font-bold text-aura-ink">
                      {route.felicidad_estimada}/100
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-aura-muted">
                  {route.porque_encaja}
                </p>

                <div className="mt-5 grid gap-3 rounded-3xl bg-aura-surface-low p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-aura-muted">Ingreso estimado</span>
                    <span className="font-semibold text-aura-ink">
                      {formatCLP(route.ingreso_estimado)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-aura-muted">Fricción de cambio</span>
                    <span className="font-semibold text-aura-ink">
                      {route.friccion_cambio}/100
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-aura-muted">Tiempo estimado</span>
                    <span className="font-semibold text-aura-ink">
                      {route.tiempo_reconversion_meses} meses
                    </span>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl border border-aura-primary/10 p-4">
                    <p className="text-sm font-semibold text-aura-ink">
                      Relocalización
                    </p>
                    <p className="mt-1 text-sm text-aura-muted">
                      {route.relocalizacion_detalle}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-aura-primary/10 p-4">
                    <p className="text-sm font-semibold text-aura-ink">
                      Idioma
                    </p>
                    <p className="mt-1 text-sm text-aura-muted">
                      {route.ingles_detalle}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-sm font-semibold text-aura-ink">
                    Aprendizajes sugeridos
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {route.aprendizajes_sugeridos.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-aura-primary/10 px-3 py-1 text-sm text-aura-primary"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="aura-glass p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-aura-muted">
              Alertas
            </p>
            <h2 className="mt-2 text-2xl font-bold text-aura-ink">
              Lo que conviene cuidar
            </h2>
            <div className="mt-5 space-y-3">
              {report.alertas.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-warning/15 bg-warning/5 p-4 text-sm leading-6 text-aura-ink"
                >
                  {item}
                </div>
              ))}
            </div>
          </article>

          <article className="aura-glass p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-aura-muted">
              Hoja de ruta
            </p>
            <h2 className="mt-2 text-2xl font-bold text-aura-ink">
              Plan sugerido para salir del punto actual
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-3xl border border-aura-primary/10 bg-aura-surface-low p-5">
                <p className="text-sm font-semibold text-aura-ink">
                  Próximos 30 días
                </p>
                <ol className="mt-3 space-y-3 text-sm leading-6 text-aura-muted">
                  {report.plan_30_dias.map((item, index) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-aura-primary text-xs font-semibold text-white">
                        {index + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-3xl border border-aura-primary/10 bg-aura-surface-low p-5">
                <p className="text-sm font-semibold text-aura-ink">
                  Próximos 90 días
                </p>
                <ol className="mt-3 space-y-3 text-sm leading-6 text-aura-muted">
                  {report.plan_90_dias.map((item, index) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-aura-violet text-xs font-semibold text-white">
                        {index + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
