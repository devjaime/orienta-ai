import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface PublicLeadReport {
  success: boolean;
  id: string;
  share_token: string;
  nombre: string;
  email: string;
  source: string;
  interes: string;
  holland_code: string | null;
  test_answers: Record<string, number>;
  survey_response: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string | null;
  updated_at: string | null;
}

async function getLeadReport(token: string): Promise<PublicLeadReport | null> {
  try {
    const response = await fetch(
      `https://vocari-api.fly.dev/api/v1/leads/public/${token}`,
      { next: { revalidate: 120 } },
    );

    if (!response.ok) return null;
    const data = (await response.json()) as PublicLeadReport;
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
  const report = await getLeadReport(token);

  if (!report) {
    return { title: "Informe no encontrado — Vocari" };
  }

  return {
    title: `Informe de Datos de ${report.nombre} — Vocari`,
    description: "Vista pública de los datos almacenados del test y encuesta vocacional.",
  };
}

function formatDate(value: string | null): string {
  if (!value) return "No disponible";
  return new Date(value).toLocaleString("es-CL");
}

export default async function PublicLeadReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const report = await getLeadReport(token);

  if (!report) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-br from-vocari-bg via-white to-vocari-bg-warm">
      <main className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-vocari-text-muted mb-2">
            URL pública de datos
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-vocari-text mb-2">
            Informe de almacenamiento del test
          </h1>
          <p className="text-sm text-vocari-text-muted">
            Esta vista muestra los datos guardados para auditoría y validación del flujo.
          </p>
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-vocari-text mb-3">Datos de contacto</h2>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <p><strong>Nombre:</strong> {report.nombre}</p>
            <p><strong>Email:</strong> {report.email}</p>
            <p><strong>Origen:</strong> {report.source}</p>
            <p><strong>Interés:</strong> {report.interes}</p>
            <p><strong>Código Holland:</strong> {report.holland_code || "No disponible"}</p>
            <p><strong>Creado:</strong> {formatDate(report.created_at)}</p>
            <p><strong>Actualizado:</strong> {formatDate(report.updated_at)}</p>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-vocari-text mb-3">Respuestas del test</h2>
          <pre className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-auto">
            {JSON.stringify(report.test_answers || {}, null, 2)}
          </pre>
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-vocari-text mb-3">Encuesta final</h2>
          <pre className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-auto">
            {JSON.stringify(report.survey_response || {}, null, 2)}
          </pre>
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-vocari-text mb-3">Metadata</h2>
          <pre className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-auto">
            {JSON.stringify(report.metadata || {}, null, 2)}
          </pre>
        </section>
      </main>
    </div>
  );
}
