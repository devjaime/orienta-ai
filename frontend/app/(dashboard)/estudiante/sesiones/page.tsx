"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { Card, CardHeader, CardTitle, CardContent, Badge, Skeleton } from "@/components/ui";
import { Calendar, Plus } from "lucide-react";
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

const STATUS_VARIANT: Record<string, "info" | "success" | "neutral" | "error"> = {
  scheduled: "info",
  confirmed: "success",
  completed: "neutral",
  cancelled: "error",
};

export default function EstudianteSesionesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["sessions", "all"],
    queryFn: () =>
      api.get<PaginatedResponse<Session>>("/api/v1/sessions?per_page=20"),
  });

  const sessions = data?.items ?? [];

  return (
    <RoleGuard allowedRoles={["estudiante"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-vocari-text">Mis Sesiones</h1>
          <Link
            href="/estudiante/sesiones/agendar"
            className="inline-flex items-center gap-2 px-4 py-2 bg-vocari-primary text-white rounded-md hover:opacity-90 text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Agendar sesión
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historial de sesiones</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} variant="rect" height={60} />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="py-12 text-center">
                <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-vocari-text-muted mb-4">
                  No tienes sesiones registradas.
                </p>
                <Link
                  href="/estudiante/sesiones/agendar"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-vocari-primary text-white rounded-md hover:opacity-90 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Agendar tu primera sesión
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {sessions.map((s) => (
                  <li key={s.id} className="py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-vocari-text">
                        {formatSessionDate(s.scheduled_at)}
                      </p>
                      <p className="text-xs text-vocari-text-muted mt-0.5">
                        {s.duration_minutes} minutos
                      </p>
                    </div>
                    <Badge variant={STATUS_VARIANT[s.status] ?? "default"} dot>
                      {STATUS_LABEL[s.status] ?? s.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
