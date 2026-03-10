"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { Card, CardHeader, CardTitle, CardContent, Skeleton } from "@/components/ui";
import { BarChart3, Users, Calendar, ClipboardList, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface AdminDashboard {
  total_students: number;
  active_sessions: number;
  completed_tests: number;
  average_engagement: number;
  sessions_this_week: number;
  tests_this_week: number;
}

export default function AdminMetricasPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "admin"],
    queryFn: () => api.get<AdminDashboard>("/api/v1/dashboards/admin"),
  });

  const stats = [
    { label: "Estudiantes activos", value: data?.total_students, icon: Users, color: "blue" },
    { label: "Sesiones activas", value: data?.active_sessions, icon: Calendar, color: "green" },
    { label: "Tests completados", value: data?.completed_tests, icon: ClipboardList, color: "purple" },
    { label: "Engagement promedio", value: data?.average_engagement ? `${data.average_engagement}%` : undefined, icon: TrendingUp, color: "yellow" },
  ];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    yellow: "bg-yellow-100 text-yellow-600",
  };

  return (
    <RoleGuard allowedRoles={["admin_colegio"]}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-vocari-text">Métricas del Colegio</h1>

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
                      {stat.value ?? "—"}
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
              <CardTitle>Esta semana</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <Skeleton variant="rect" height={80} />
              ) : (
                <>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-vocari-text-muted">Sesiones realizadas</span>
                    <span className="text-sm font-semibold">{data?.sessions_this_week ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-vocari-text-muted">Tests completados</span>
                    <span className="text-sm font-semibold">{data?.tests_this_week ?? 0}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acciones rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a
                href="/admin/estudiantes"
                className="flex items-center gap-2 p-3 rounded-md hover:bg-gray-50 text-sm text-vocari-text"
              >
                <Users className="h-4 w-4 text-vocari-primary" />
                Ver todos los estudiantes
              </a>
              <a
                href="/admin/orientadores"
                className="flex items-center gap-2 p-3 rounded-md hover:bg-gray-50 text-sm text-vocari-text"
              >
                <BarChart3 className="h-4 w-4 text-vocari-primary" />
                Ver orientadores
              </a>
              <a
                href="/admin/importar"
                className="flex items-center gap-2 p-3 rounded-md hover:bg-gray-50 text-sm text-vocari-text"
              >
                <ClipboardList className="h-4 w-4 text-vocari-primary" />
                Importar estudiantes
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}
