"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { Card, CardHeader, CardTitle, CardContent, Badge, Skeleton } from "@/components/ui";
import { UserCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
interface OrientadorListItem {
  id: string;
  name: string;
  email?: string;
  sessions_count: number;
  is_available: boolean;
}

interface OrientadoresResponse {
  orientadores: OrientadorListItem[];
}

export default function AdminOrientadoresPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orientadores"],
    queryFn: () => api.get<OrientadoresResponse>("/api/v1/sessions/orientadores"),
  });

  const orientadores = data?.orientadores ?? [];

  return (
    <RoleGuard allowedRoles={["admin_colegio"]}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-vocari-text">Orientadores</h1>

        <Card>
          <CardHeader>
            <CardTitle>Orientadores del colegio ({orientadores.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} variant="rect" height={70} />)}
              </div>
            ) : orientadores.length === 0 ? (
              <div className="py-12 text-center">
                <UserCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-vocari-text-muted">
                  No hay orientadores registrados en tu institución.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {orientadores.map((o) => (
                  <li key={o.id} className="py-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-vocari-primary/10 flex items-center justify-center shrink-0">
                      <UserCircle className="h-5 w-5 text-vocari-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-vocari-text truncate">{o.name}</p>
                      <p className="text-xs text-vocari-text-muted">{o.sessions_count} sesiones</p>
                    </div>
                    <Badge variant={o.is_available ? "success" : "neutral"} dot>
                      {o.is_available ? "Disponible" : "Ocupado"}
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
