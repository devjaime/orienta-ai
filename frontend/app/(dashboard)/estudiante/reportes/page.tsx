"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  Card,
  CardContent,
  Button,
  Skeleton,
} from "@/components/ui";
import { FileText, Share2, Plus, ExternalLink, Copy } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

interface Report {
  id: string;
  student_id: string;
  report_type: string;
  share_token: string;
  status: string;
  created_at: string;
  share_url: string;
}

function ReportCard({ report }: { report: Report }) {
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : "https://app.vocari.cl"}/informe/${report.share_token}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast("success", "Link copiado al portapapeles");
  };

  return (
    <Card className="hover:border-vocari-accent transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-vocari-text">
              Informe Vocacional Completo
            </h3>
            <p className="text-sm text-vocari-text-muted">
              {new Date(report.created_at).toLocaleDateString("es-CL", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="text-xs text-vocari-text-muted mt-1 truncate">
              {shareUrl}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={copyLink}
            >
              <Copy className="h-3 w-3 mr-1" />
              Copiar Link
            </Button>
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReportList() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: () => api.get<Report[]>("/api/v1/reports/my"),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} variant="rect" height={90} />
        ))}
      </div>
    );
  }

  const reports = data ?? [];

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-vocari-text-muted">No tienes informes generados</p>
        <p className="text-sm text-vocari-text-muted mt-1">
          Genera tu primer informe vocacional con un link compartible
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <ReportCard key={report.id} report={report} />
      ))}
    </div>
  );
}

export default function ReportesPage() {
  const queryClient = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: () =>
      api.post<{ share_token: string; share_url: string }>("/api/v1/reports/generate", {
        report_type: "comprehensive",
        include_riasec: true,
        include_profile: true,
        include_careers: true,
        include_games: true,
        include_sessions: true,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      const shareUrl = `${window.location.origin}/informe/${data.share_token}`;
      toast("success", "Informe generado — link listo para compartir");
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    },
    onError: () => {
      toast("error", "Error al generar el informe");
    },
  });

  return (
    <RoleGuard allowedRoles={["estudiante"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-vocari-text">Mis Informes</h1>
            <p className="text-vocari-text-muted">
              Genera y comparte tu informe vocacional completo
            </p>
          </div>
          <Button
            onClick={() => generateMutation.mutate()}
            loading={generateMutation.isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            Generar Informe
          </Button>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5">
          <div className="flex items-start gap-3">
            <Share2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-blue-800 mb-1">
                Informe compartible por link
              </h2>
              <p className="text-sm text-blue-700 mb-2">
                Genera un informe completo de tu perfil vocacional y comparte el link con tu familia, orientador o postulaciones universitarias.
              </p>
              <ul className="text-sm text-blue-700 space-y-0.5">
                <li>✦ Código Holland y perfil RIASEC</li>
                <li>✦ Carreras recomendadas con sueldos reales (MINEDUC)</li>
                <li>✦ Habilidades evaluadas en juegos</li>
                <li>✦ Diseño profesional listo para compartir</li>
              </ul>
            </div>
          </div>
        </div>

        <ReportList />
      </div>
    </RoleGuard>
  );
}
