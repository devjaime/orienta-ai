"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Skeleton,
} from "@/components/ui";
import { FileText, Download, Plus, Calendar } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

interface Report {
  id: string;
  student_id: string;
  report_type: string;
  file_url: string | null;
  status: string;
  created_at: string;
  content?: string;
}

function ReportCard({ report }: { report: Report }) {
  return (
    <Card className="hover:border-vocari-accent transition-colors">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="p-3 bg-blue-100 rounded-lg">
          <FileText className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-vocari-text">
            Reporte {report.report_type === "comprehensive" ? "Comprehensivo" : report.report_type}
          </h3>
          <p className="text-sm text-vocari-text-muted">
            {new Date(report.created_at).toLocaleDateString("es-CL", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          {report.content && (
            <Button variant="secondary" size="sm">
              Ver
            </Button>
          )}
          {report.file_url && (
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          )}
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
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} variant="rect" height={80} />
        ))}
      </div>
    );
  }

  const reports = data ?? [];

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-vocari-text-muted">
          No tienes reportes generados
        </p>
        <p className="text-sm text-vocari-text-muted mt-1">
          Genera tu primer reporte vocacional
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
  const generateMutation = useMutation({
    mutationFn: () =>
      api.post<{ content: string }>("/api/v1/reports/generate", {
        report_type: "comprehensive",
        include_riasec: true,
        include_profile: true,
        include_careers: true,
        include_games: true,
        include_sessions: true,
      }),
    onSuccess: (data) => {
      toast("success", "Reporte generado exitosamente");
    },
    onError: () => {
      toast("error", "Error al generar el reporte");
    },
  });

  return (
    <RoleGuard allowedRoles={["estudiante"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-vocari-text">
              Mis Reportes
            </h1>
            <p className="text-vocari-text-muted">
              Descarga reportes comprehensivos de tu progreso vocacional
            </p>
          </div>
          <Button
            onClick={() => generateMutation.mutate()}
            loading={generateMutation.isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            Generar Reporte
          </Button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="font-medium text-blue-800 mb-1">
            Que incluye el reporte?
          </h2>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>- Resultados de tests vocacionales</li>
            <li>- Perfil de habilidades</li>
            <li>- Recomendaciones de carreras</li>
            <li>- Resultados de juegos</li>
            <li>- Historial de sesiones</li>
          </ul>
        </div>

        <ReportList />
      </div>
    </RoleGuard>
  );
}
