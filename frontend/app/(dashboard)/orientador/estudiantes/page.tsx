"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { Card, CardHeader, CardTitle, CardContent, Skeleton } from "@/components/ui";
import { Users, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface StudentItem {
  id: string;
  name: string;
  email: string;
  sessions_count: number;
  last_test?: string;
}

interface StudentsResponse {
  items: StudentItem[];
  total: number;
}

export default function OrientadorEstudiantesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["orientador", "estudiantes"],
    queryFn: () => api.get<StudentsResponse>("/api/v1/sessions/orientadores/students"),
  });

  const estudiantes = data?.items ?? [];

  return (
    <RoleGuard allowedRoles={["orientador", "admin_colegio"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-vocari-text">
            Mis Estudiantes
          </h1>
          {data && (
            <span className="text-sm text-vocari-text-muted">
              {data.total} estudiante{data.total !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Estudiantes asignados</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} variant="rect" height={64} />
                ))}
              </div>
            ) : estudiantes.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-vocari-text-muted">
                  No tienes estudiantes asignados aún.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {estudiantes.map((e) => (
                  <li key={e.id} className="py-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-vocari-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-vocari-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-vocari-text truncate">{e.name}</p>
                      <p className="text-xs text-vocari-text-muted truncate">{e.email}</p>
                    </div>
                    <span className="text-xs text-vocari-text-muted shrink-0">
                      {e.sessions_count} sesión{e.sessions_count !== 1 ? "es" : ""}
                    </span>
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
