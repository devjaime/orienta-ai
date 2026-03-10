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
  ClipboardList,
  GraduationCap,
  TrendingUp,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatSessionDate } from "@/lib/utils/dates";
import type { Session } from "@/lib/types/session";
import type { PaginatedResponse } from "@/lib/types/api";

function UpcomingSessions() {
  const { data, isLoading } = useQuery({
    queryKey: ["sessions", "upcoming"],
    queryFn: () =>
      api.get<PaginatedResponse<Session>>(
        "/api/v1/sessions?status=scheduled&status=confirmed&per_page=3",
      ),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton variant="rect" height={60} />
        <Skeleton variant="rect" height={60} />
      </div>
    );
  }

  const sessions = data?.items ?? [];

  if (sessions.length === 0) {
    return (
      <p className="text-vocari-text-muted text-sm py-4">
        No tienes sesiones programadas.{" "}
        <a href="/estudiante/sesiones/agendar" className="text-vocari-accent underline">
          Agendar una sesion
        </a>
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {sessions.map((s) => (
        <li key={s.id}>
          <a
            href={`/estudiante/sesiones/${s.id}`}
            className="flex items-center justify-between p-3 rounded-md border border-gray-100 hover:border-vocari-accent transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-vocari-text">
                {formatSessionDate(s.scheduled_at)}
              </p>
              <p className="text-xs text-vocari-text-muted">
                {s.duration_minutes} min
              </p>
            </div>
            <Badge
              variant={s.status === "confirmed" ? "success" : "info"}
              dot
            >
              {s.status === "confirmed" ? "Confirmada" : "Programada"}
            </Badge>
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function StudentDashboard() {
  return (
    <RoleGuard allowedRoles={["estudiante"]}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-vocari-text">
          Mi Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stat cards */}
          <Card>
            <CardContent className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-md">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-vocari-text">0</p>
                <p className="text-xs text-vocari-text-muted">
                  Sesiones este mes
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-md">
                <ClipboardList className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-vocari-text">1</p>
                <p className="text-xs text-vocari-text-muted">
                  Tests pendientes
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-md">
                <GraduationCap className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-vocari-text">5</p>
                <p className="text-xs text-vocari-text-muted">
                  Carreras recomendadas
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-md">
                <TrendingUp className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-vocari-text">--</p>
                <p className="text-xs text-vocari-text-muted">
                  Score perfil
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Proximas sesiones */}
          <Card>
            <CardHeader>
              <CardTitle>Proximas sesiones</CardTitle>
            </CardHeader>
            <CardContent>
              <UpcomingSessions />
            </CardContent>
          </Card>

          {/* Tests pendientes */}
          <Card>
            <CardHeader>
              <CardTitle>Tests disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href="/estudiante/tests/riasec"
                className="flex items-center gap-3 p-3 rounded-md border border-gray-100 hover:border-vocari-accent transition-colors"
              >
                <div className="p-2 bg-vocari-accent/10 rounded-md">
                  <ClipboardList className="h-5 w-5 text-vocari-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-vocari-text">
                    Test RIASEC
                  </p>
                  <p className="text-xs text-vocari-text-muted">
                    36 preguntas - Descubre tus intereses vocacionales
                  </p>
                </div>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}
