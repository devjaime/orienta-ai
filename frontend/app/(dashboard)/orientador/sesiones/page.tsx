"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { Card, CardHeader, CardTitle, CardContent, Badge, Skeleton } from "@/components/ui";
import { Calendar } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatSessionDate } from "@/lib/utils/dates";
import type { Session } from "@/lib/types/session";
import type { PaginatedResponse } from "@/lib/types/api";

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Programada",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
};

export default function OrientadorSesionesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["sessions", "orientador"],
    queryFn: () => api.get<PaginatedResponse<Session>>("/api/v1/sessions?per_page=30"),
  });

  const sessions = data?.items ?? [];
  const pendientes = sessions.filter((s) => ["scheduled", "confirmed"].includes(s.status));
  const completadas = sessions.filter((s) => s.status === "completed");

  return (
    <RoleGuard allowedRoles={["orientador", "admin_colegio"]}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-vocari-text">Gestión de Sesiones</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Próximas sesiones ({pendientes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} variant="rect" height={56} />)}
                </div>
              ) : pendientes.length === 0 ? (
                <p className="text-vocari-text-muted text-sm py-4 text-center">
                  No hay sesiones pendientes.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {pendientes.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/orientador/sesiones/${s.id}`}
                        className="flex items-center justify-between py-3 hover:text-vocari-primary"
                      >
                        <div>
                          <p className="text-sm font-medium">{formatSessionDate(s.scheduled_at)}</p>
                          <p className="text-xs text-vocari-text-muted">{s.duration_minutes} min</p>
                        </div>
                        <Badge variant={s.status === "confirmed" ? "success" : "info"} dot>
                          {STATUS_LABEL[s.status]}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sesiones completadas ({completadas.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => <Skeleton key={i} variant="rect" height={56} />)}
                </div>
              ) : completadas.length === 0 ? (
                <p className="text-vocari-text-muted text-sm py-4 text-center">
                  Aún no hay sesiones completadas.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {completadas.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/orientador/sesiones/${s.id}`}
                        className="flex items-center justify-between py-3 hover:text-vocari-primary"
                      >
                        <p className="text-sm text-vocari-text-muted">
                          {formatSessionDate(s.scheduled_at)}
                        </p>
                        <Badge variant="neutral">Completada</Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}
