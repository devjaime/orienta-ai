"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Skeleton,
} from "@/components/ui";
import {
  Building2,
  Users,
  Calendar,
  ClipboardCheck,
  TrendingUp,
  Activity,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { SuperAdminDashboardResponse } from "@/lib/types";

function StatsCards({
  stats,
}: {
  stats: SuperAdminDashboardResponse["platform_stats"];
}) {
  const cards = [
    {
      icon: Building2,
      bgColor: "bg-aura-primary/10",
      iconColor: "text-aura-primary",
      value: `${stats.active_institutions}/${stats.total_institutions}`,
      label: "Instituciones activas",
    },
    {
      icon: Users,
      bgColor: "bg-success/10",
      iconColor: "text-success",
      value: stats.total_users,
      label: "Usuarios totales",
    },
    {
      icon: Calendar,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
      value: stats.sessions_this_month,
      label: "Sesiones este mes",
    },
    {
      icon: ClipboardCheck,
      bgColor: "bg-warning/10",
      iconColor: "text-warning",
      value: stats.tests_this_month,
      label: "Tests este mes",
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
              <p className="text-2xl font-bold text-aura-ink">
                {card.value}
              </p>
              <p className="text-xs text-aura-muted">{card.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function InstitutionsList({
  institutions,
}: {
  institutions: SuperAdminDashboardResponse["active_institutions"];
}) {
  if (institutions.length === 0) {
    return (
      <p className="text-aura-muted text-sm py-4">
        No hay instituciones activas
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {institutions.map((inst) => (
        <a
          key={inst.id}
          href={`/super-admin/instituciones/${inst.id}`}
          className="flex items-center justify-between p-4 rounded-lg border border-aura-surface hover:border-aura-teal transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-aura-primary/10 rounded-md">
              <Building2 className="h-5 w-5 text-aura-primary" />
            </div>
            <div>
              <p className="font-medium text-aura-ink">{inst.name}</p>
              <p className="text-xs text-aura-muted">{inst.slug}</p>
            </div>
          </div>
          <div className="text-right">
            <Badge
              variant={inst.is_active ? "success" : "error"}
              className="mb-1"
            >
              {inst.is_active ? "Activa" : "Inactiva"}
            </Badge>
            <p className="text-xs text-aura-muted">
              {inst.total_students} estudiantes | {inst.total_sessions} sesiones
            </p>
          </div>
        </a>
      ))}
    </div>
  );
}

function QuickStats({
  recentSessions,
  recentTests,
}: {
  recentSessions: number;
  recentTests: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardContent className="flex items-center gap-3 py-4">
          <div className="p-2 bg-success/10 rounded-md">
            <TrendingUp className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold text-aura-ink">
              {recentSessions}
            </p>
            <p className="text-xs text-aura-muted">
              Sesiones ultima semana
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-3 py-4">
          <div className="p-2 bg-purple-100 rounded-md">
            <Activity className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-aura-ink">{recentTests}</p>
            <p className="text-xs text-aura-muted">
              Tests ultima semana
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardContent() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "super-admin"],
    queryFn: () =>
      api.get<SuperAdminDashboardResponse>("/api/v1/dashboards/super-admin"),
    staleTime: 60_000,
  });

  if (isLoading) {
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
        <Skeleton variant="rect" height={400} />
      </div>
    );
  }

  const stats = data?.platform_stats;
  const institutions = data?.active_institutions ?? [];

  if (!stats) {
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
        <Skeleton variant="rect" height={400} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatsCards stats={stats} />

      <QuickStats
        recentSessions={data?.recent_sessions_count ?? 0}
        recentTests={data?.recent_tests_count ?? 0}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Instituciones Activas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InstitutionsList institutions={institutions} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function SuperAdminDashboard() {
  return (
    <RoleGuard allowedRoles={["super_admin"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-aura-ink">
            Dashboard Super Admin
          </h1>
          <p className="text-aura-muted">
            Estadisticas globales de la plataforma
          </p>
        </div>

        <DashboardContent />
      </div>
    </RoleGuard>
  );
}
