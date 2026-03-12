"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BarChart3, Lightbulb, TrendingUp } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import {
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
import { api } from "@/lib/api";

interface AdminInsightsResponse {
  filters: {
    curso?: string | null;
    periodo?: string | null;
  };
  summary: {
    total_students: number;
    students_with_clarity: number;
    students_with_high_indecision: number;
    high_indecision_rate: number;
  };
  courses: string[];
  career_interest_by_course: Array<{
    curso: string;
    careers: Array<{ career_name: string; count: number }>;
  }>;
  clarity_trend: Array<{
    month: string;
    students_with_clarity: number;
    average_clarity?: number | null;
    indecision_index?: number | null;
  }>;
  indecision_alerts: Array<{
    student_id: string;
    student_name: string;
    student_email: string;
    curso: string;
    clarity_score: number;
    holland_code?: string | null;
    last_activity_at?: string | null;
    recommended_action: string;
  }>;
}

export default function AdminInsightsPage() {
  const [curso, setCurso] = useState("");
  const [periodo, setPeriodo] = useState("");

  const queryPath = useMemo(() => {
    const params = new URLSearchParams();
    if (curso) params.set("curso", curso);
    if (periodo) params.set("periodo", periodo);
    const query = params.toString();
    return `/api/v1/admin/insights${query ? `?${query}` : ""}`;
  }, [curso, periodo]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "insights", curso, periodo],
    queryFn: () => api.get<AdminInsightsResponse>(queryPath),
  });

  const cards = [
    {
      label: "Estudiantes en análisis",
      value: data?.summary.total_students ?? 0,
      icon: BarChart3,
      color: "bg-sky-100 text-sky-700",
    },
    {
      label: "Con claridad registrada",
      value: data?.summary.students_with_clarity ?? 0,
      icon: Lightbulb,
      color: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Alta indecisión",
      value: data?.summary.students_with_high_indecision ?? 0,
      icon: AlertTriangle,
      color: "bg-amber-100 text-amber-700",
    },
    {
      label: "Tasa indecisión",
      value: `${data?.summary.high_indecision_rate ?? 0}%`,
      icon: TrendingUp,
      color: "bg-rose-100 text-rose-700",
    },
  ];

  return (
    <RoleGuard allowedRoles={["admin_colegio", "super_admin"]}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-vocari-text">Insights Institucionales</h1>

        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Select
                label="Curso"
                value={curso}
                onChange={(event) => setCurso(event.target.value)}
                options={[
                  { value: "", label: "Todos los cursos" },
                  ...(data?.courses || []).map((course) => ({ value: course, label: course })),
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
                <button
                  onClick={() => {
                    setCurso("");
                    setPeriodo("");
                  }}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm text-vocari-text hover:bg-gray-50"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <Card key={card.label}>
              <CardContent className="flex items-center gap-3 pt-6">
                <div className={`p-2 rounded-md ${card.color}`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton variant="rect" height={28} width={60} />
                  ) : (
                    <p className="text-2xl font-bold text-vocari-text">{card.value}</p>
                  )}
                  <p className="text-xs text-vocari-text-muted">{card.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de claridad</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton variant="rect" height={180} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mes</TableHead>
                      <TableHead>Promedio claridad</TableHead>
                      <TableHead>Índice indecisión</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.clarity_trend || []).map((item) => (
                      <TableRow key={item.month}>
                        <TableCell>{item.month}</TableCell>
                        <TableCell>{typeof item.average_clarity === "number" ? item.average_clarity.toFixed(2) : "N/D"}</TableCell>
                        <TableCell>{typeof item.indecision_index === "number" ? `${item.indecision_index}%` : "N/D"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interés de carreras por cohorte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <Skeleton variant="rect" height={180} />
              ) : (
                (data?.career_interest_by_course || []).map((cohort) => (
                  <div key={cohort.curso} className="rounded-md border border-gray-200 p-3">
                    <p className="text-sm font-semibold text-vocari-text mb-2">{cohort.curso}</p>
                    {cohort.careers.length ? (
                      <ul className="space-y-1 text-sm text-vocari-text-muted">
                        {cohort.careers.slice(0, 5).map((career) => (
                          <li key={`${cohort.curso}-${career.career_name}`} className="flex justify-between">
                            <span>{career.career_name}</span>
                            <span className="font-medium text-vocari-text">{career.count}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-vocari-text-muted">Sin datos de carreras para este curso.</p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Alertas de indecisión prioritaria</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton variant="rect" height={220} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Claridad</TableHead>
                    <TableHead>Holland</TableHead>
                    <TableHead>Acción recomendada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.indecision_alerts || []).map((alert) => (
                    <TableRow key={alert.student_id}>
                      <TableCell>
                        <p className="font-medium text-vocari-text">{alert.student_name}</p>
                        <p className="text-xs text-vocari-text-muted">{alert.student_email}</p>
                      </TableCell>
                      <TableCell>{alert.curso}</TableCell>
                      <TableCell>{alert.clarity_score.toFixed(1)}</TableCell>
                      <TableCell>{alert.holland_code || "N/D"}</TableCell>
                      <TableCell className="text-sm">{alert.recommended_action}</TableCell>
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

