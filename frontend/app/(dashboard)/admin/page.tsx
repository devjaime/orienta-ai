"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Skeleton,
  ProgressBar,
} from "@/components/ui";
import {
  Users,
  Calendar,
  ClipboardCheck,
  TrendingUp,
  BarChart3,
  GraduationCap,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AdminDashboardResponse } from "@/lib/types";

const AREA_LABELS: Record<string, string> = {
  tecnologia: "Tecnologia",
  salud: "Salud",
  negocios: "Negocios",
  ingenieria: "Ingenieria",
  artes: "Artes",
  educacion: "Educacion",
  ciencias: "Ciencias",
  derecho: "Derecho",
};

function StatsCards({ stats }: { stats: AdminDashboardResponse["institution_stats"] }) {
  const cards = [
    {
      icon: Users,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      value: stats.active_students,
      label: `Estudiantes activos (de ${stats.total_students})`,
    },
    {
      icon: Calendar,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
      value: stats.sessions_this_month,
      label: "Sesiones este mes",
    },
    {
      icon: ClipboardCheck,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
      value: stats.tests_completed_this_month,
      label: "Tests completados",
    },
    {
      icon: TrendingUp,
      bgColor: "bg-yellow-100",
      iconColor: "text-yellow-600",
      value: `${Math.round(stats.average_engagement)}%`,
      label: "Engagement promedio",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="flex items-center gap-3">
            <div className={`p-2 ${card.bgColor} rounded-md`}>
              <card.icon className={`h-5 w-5 ${card.iconColor}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-vocari-text">
                {card.value}
              </p>
              <p className="text-xs text-vocari-text-muted">{card.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function OrientadorWorkload({
  stats,
}: {
  stats: AdminDashboardResponse["orientador_stats"];
}) {
  if (stats.length === 0) {
    return (
      <p className="text-vocari-text-muted text-sm py-4">
        No hay orientadores en la institucion
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {stats.map((o) => (
        <div
          key={o.orientador_id}
          className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-vocari-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-vocari-primary">
                {o.orientador_name.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-medium text-vocari-text">{o.orientador_name}</p>
              <p className="text-xs text-vocari-text-muted">
                {o.students_assigned} estudiantes | {o.sessions_completed} sesiones
              </p>
            </div>
          </div>
          <div className="text-right">
            <p
              className={`text-sm font-medium ${
                o.workload_percentage > 90
                  ? "text-error"
                  : o.workload_percentage > 70
                    ? "text-warning"
                      : "text-success"
              }`}
            >
              {Math.round(o.workload_percentage)}%
            </p>
            <p className="text-xs text-vocari-text-muted">carga</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function EngagementChart({
  trend,
}: {
  trend: AdminDashboardResponse["engagement_trend"];
}) {
  if (trend.length === 0) {
    return (
      <p className="text-vocari-text-muted text-sm py-4">
        No hay datos de engagement disponibles
      </p>
    );
  }

  const maxValue = Math.max(...trend.map((t) => t.active_students), 1);

  return (
    <div className="space-y-2">
      {trend.map((item) => (
        <div key={item.week} className="flex items-center gap-3">
          <span className="text-xs text-vocari-text-muted w-16">{item.week}</span>
          <div className="flex-1">
            <ProgressBar
              value={(item.active_students / maxValue) * 100}
              color="bg-vocari-primary"
            />
          </div>
          <span className="text-xs text-vocari-text-muted w-8 text-right">
            {item.active_students}
          </span>
        </div>
      ))}
    </div>
  );
}

function TopCareers({
  careers,
}: {
  careers: AdminDashboardResponse["top_careers"];
}) {
  if (careers.length === 0) {
    return (
      <p className="text-vocari-text-muted text-sm py-4">
        No hay carreras recomendadas
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {careers.slice(0, 5).map((career) => (
        <div
          key={career.id}
          className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <GraduationCap className="h-5 w-5 text-vocari-accent" />
            <div>
              <p className="font-medium text-vocari-text">{career.name}</p>
              <p className="text-xs text-vocari-text-muted">
                {AREA_LABELS[career.area] || career.area}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-vocari-text">
              {Math.round(career.employability * 100)}% empleabilidad
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-3">
              <Skeleton variant="circle" width={40} height={40} />
              <div className="flex-1">
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="80%" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton variant="rect" height={300} />
        <Skeleton variant="rect" height={300} />
      </div>
    </div>
  );
}

function DashboardContent() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "admin"],
    queryFn: () =>
      api.get<AdminDashboardResponse>("/api/v1/dashboards/admin-colegio"),
    staleTime: 60_000,
  });

  if (isLoading) {
    return <LoadingState />;
  }

  const stats = data?.institution_stats;
  const orientadorStats = data?.orientador_stats ?? [];
  const engagementTrend = data?.engagement_trend ?? [];
  const topCareers = data?.top_careers ?? [];

  if (!stats) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Carga de Orientadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OrientadorWorkload stats={orientadorStats} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tendencia de Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EngagementChart trend={engagementTrend} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Carreras Mas Solicitadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TopCareers careers={topCareers} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <RoleGuard allowedRoles={["admin_colegio"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-vocari-text">
            Dashboard Administrador
          </h1>
          <p className="text-vocari-text-muted">
            Estadisticas y gestion de la institucion
          </p>
        </div>

        <DashboardContent />
      </div>
    </RoleGuard>
  );
}
