"use client";

import { useMemo, useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { BarChart3, ClipboardList, Download, TrendingUp, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface AdminMetricsResponse {
  filters: {
    curso?: string | null;
    periodo?: string | null;
    period_start?: string | null;
    period_end?: string | null;
  };
  summary: {
    total_students: number;
    students_with_test: number;
    completion_rate: number;
    tests_in_period: number;
    average_clarity?: number | null;
    indecision_index?: number | null;
  };
  cursos: string[];
  riasec_distribution_by_course: Array<{
    curso: string;
    total_students: number;
    total_with_test: number;
    codes: Record<string, number>;
  }>;
  clarity_by_course: Array<{
    curso: string;
    total_students: number;
    students_with_clarity: number;
    average_clarity?: number | null;
    indecision_index?: number | null;
  }>;
  top_careers: Array<{
    career_name: string;
    count: number;
  }>;
}

function buildCsv(metrics: AdminMetricsResponse): string {
  const lines: string[] = [];
  lines.push("seccion,clave,valor");
  lines.push(`resumen,total_estudiantes,${metrics.summary.total_students}`);
  lines.push(`resumen,estudiantes_con_test,${metrics.summary.students_with_test}`);
  lines.push(`resumen,tasa_completitud,${metrics.summary.completion_rate}`);
  lines.push(`resumen,tests_periodo,${metrics.summary.tests_in_period}`);
  lines.push(`resumen,promedio_claridad,${metrics.summary.average_clarity ?? ""}`);
  lines.push(`resumen,indice_indecision,${metrics.summary.indecision_index ?? ""}`);

  metrics.top_careers.forEach((item) => {
    lines.push(`top_carrera,${item.career_name.replaceAll(",", " ")},${item.count}`);
  });

  metrics.riasec_distribution_by_course.forEach((row) => {
    lines.push(`riasec,${row.curso},${row.total_with_test}`);
    Object.entries(row.codes).forEach(([code, count]) => {
      lines.push(`riasec_codigo,${row.curso}-${code},${count}`);
    });
  });

  return lines.join("\n");
}

export default function AdminMetricasPage() {
  const [curso, setCurso] = useState("");
  const [periodo, setPeriodo] = useState("");

  const queryPath = useMemo(() => {
    const params = new URLSearchParams();
    if (curso) params.set("curso", curso);
    if (periodo) params.set("periodo", periodo);
    const query = params.toString();
    return `/api/v1/admin/metrics${query ? `?${query}` : ""}`;
  }, [curso, periodo]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "metrics", curso, periodo],
    queryFn: () => api.get<AdminMetricsResponse>(queryPath),
  });

  const stats = [
    { label: "Estudiantes totales", value: data?.summary.total_students, icon: Users, color: "blue" },
    { label: "Con test completado", value: data?.summary.students_with_test, icon: ClipboardList, color: "green" },
    { label: "Completitud", value: data ? `${data.summary.completion_rate}%` : undefined, icon: TrendingUp, color: "purple" },
    {
      label: "Índice indecisión",
      value: typeof data?.summary.indecision_index === "number" ? `${data.summary.indecision_index}%` : "N/D",
      icon: BarChart3,
      color: "yellow",
    },
  ];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    yellow: "bg-yellow-100 text-yellow-600",
  };

  const handleExportCsv = () => {
    if (!data) return;
    const csv = buildCsv(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dateLabel = new Date().toISOString().slice(0, 10);
    link.download = `vocari-metricas-${dateLabel}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <RoleGuard allowedRoles={["admin_colegio", "super_admin"]}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-vocari-text">Métricas del Colegio</h1>
          <Button
            variant="secondary"
            size="sm"
            className="ml-auto"
            onClick={handleExportCsv}
            disabled={!data}
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Select
                label="Curso"
                value={curso}
                onChange={(event) => setCurso(event.target.value)}
                options={[
                  { value: "", label: "Todos los cursos" },
                  ...(data?.cursos || []).map((course) => ({ value: course, label: course })),
                ]}
              />
              <div className="w-full">
                <label htmlFor="periodo" className="block text-sm font-medium text-vocari-text mb-1">
                  Período
                </label>
                <input
                  id="periodo"
                  type="month"
                  value={periodo}
                  onChange={(event) => setPeriodo(event.target.value)}
                  className="w-full rounded-sm border border-gray-300 px-3 py-2 text-vocari-text"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setCurso("");
                    setPeriodo("");
                  }}
                >
                  Limpiar filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-3 pt-6">
                <div className={`p-2 rounded-md ${colorMap[stat.color]}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton variant="rect" height={28} width={60} />
                  ) : (
                    <p className="text-2xl font-bold text-vocari-text">
                      {stat.value ?? "N/D"}
                    </p>
                  )}
                  <p className="text-xs text-vocari-text-muted">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Claridad por curso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <Skeleton variant="rect" height={80} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Curso</TableHead>
                      <TableHead>Promedio claridad</TableHead>
                      <TableHead>Índice indecisión</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.clarity_by_course || []).map((row) => (
                      <TableRow key={row.curso}>
                        <TableCell>{row.curso}</TableCell>
                        <TableCell>{typeof row.average_clarity === "number" ? row.average_clarity.toFixed(2) : "N/D"}</TableCell>
                        <TableCell>{typeof row.indecision_index === "number" ? `${row.indecision_index}%` : "N/D"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top carreras de interés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                <Skeleton variant="rect" height={120} />
              ) : data?.top_careers.length ? (
                data.top_careers.map((career) => (
                  <div
                    key={career.career_name}
                    className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm"
                  >
                    <span className="text-vocari-text">{career.career_name}</span>
                    <span className="font-semibold text-vocari-text">{career.count}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-vocari-text-muted">Aún no hay datos de carreras para este filtro.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Distribución RIASEC por curso</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton variant="rect" height={180} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Curso</TableHead>
                    <TableHead>Estudiantes</TableHead>
                    <TableHead>Con test</TableHead>
                    <TableHead>Códigos detectados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.riasec_distribution_by_course || []).map((row) => (
                    <TableRow key={row.curso}>
                      <TableCell>{row.curso}</TableCell>
                      <TableCell>{row.total_students}</TableCell>
                      <TableCell>{row.total_with_test}</TableCell>
                      <TableCell>
                        {Object.entries(row.codes)
                          .map(([code, count]) => `${code} (${count})`)
                          .join(", ") || "N/D"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
