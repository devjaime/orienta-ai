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
  Calendar,
  ClipboardCheck,
  Users,
  AlertTriangle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatSessionDate } from "@/lib/utils/dates";
import type { Session, SessionListResponse } from "@/lib/types/session";

interface OrientadorStats {
  sesiones_hoy: number;
  reviews_pendientes: number;
  estudiantes_asignados: number;
  alertas_activas: number;
}

const STATUS_MAP: Record<string, { label: string; variant: "success" | "warning" | "info" | "error" | "neutral" }> = {
  scheduled: { label: "Programada", variant: "info" },
  confirmed: { label: "Confirmada", variant: "success" },
  in_progress: { label: "En curso", variant: "warning" },
  completed: { label: "Completada", variant: "neutral" },
  cancelled: { label: "Cancelada", variant: "error" },
  no_show: { label: "No asistio", variant: "error" },
};

function TodaySessions() {
  const today = new Date().toISOString().split("T")[0];
  const { data, isLoading } = useQuery({
    queryKey: ["sessions", "today"],
    queryFn: () =>
      api.get<SessionListResponse>(
        `/api/v1/sessions?date=${today}&per_page=10`,
      ),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton variant="rect" height={60} />
        <Skeleton variant="rect" height={60} />
        <Skeleton variant="rect" height={60} />
      </div>
    );
  }

  const sessions = data?.items ?? [];

  if (sessions.length === 0) {
    return (
      <p className="text-vocari-text-muted text-sm py-4">
        No tienes sesiones para hoy.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {sessions.map((s) => {
        const status = STATUS_MAP[s.status] || STATUS_MAP.scheduled;
        return (
          <li key={s.id}>
            <a
              href={`/orientador/sesiones/${s.id}`}
              className="flex items-center justify-between p-3 rounded-md border border-gray-100 hover:border-vocari-accent transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-vocari-text">
                  {s.student_name || "Estudiante"}
                </p>
                <p className="text-xs text-vocari-text-muted">
                  {formatSessionDate(s.scheduled_at)} - {s.duration_minutes} min
                </p>
              </div>
              <Badge variant={status.variant} dot>
                {status.label}
              </Badge>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["orientador-stats"],
    queryFn: () =>
      api.get<OrientadorStats>("/api/v1/sessions/stats/orientador"),
    staleTime: 60_000, // 1 min
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-3">
              <Skeleton variant="circle" width={40} height={40} />
              <div className="flex-1">
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="text" width="70%" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      icon: Calendar,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      value: stats?.sesiones_hoy ?? 0,
      label: "Sesiones hoy",
    },
    {
      icon: ClipboardCheck,
      bgColor: "bg-yellow-100",
      iconColor: "text-yellow-600",
      value: stats?.reviews_pendientes ?? 0,
      label: "Reviews pendientes",
    },
    {
      icon: Users,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
      value: stats?.estudiantes_asignados ?? 0,
      label: "Estudiantes asignados",
    },
    {
      icon: AlertTriangle,
      bgColor: "bg-red-100",
      iconColor: "text-red-600",
      value: stats?.alertas_activas ?? 0,
      label: "Alertas activas",
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

export default function OrientadorDashboard() {
  return (
    <RoleGuard allowedRoles={["orientador"]}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-vocari-text">
          Dashboard Orientador
        </h1>

        <StatsCards />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Sesiones de hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <TodaySessions />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reviews pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-vocari-text-muted text-sm py-4">
                No hay reviews pendientes.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}
