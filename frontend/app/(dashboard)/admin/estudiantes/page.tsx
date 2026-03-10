"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { Card, CardHeader, CardTitle, CardContent, Badge, Skeleton } from "@/components/ui";
import { Users, Upload } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface StudentItem {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  last_login?: string;
}

interface StudentsResponse {
  items: StudentItem[];
  total: number;
}

export default function AdminEstudiantesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "estudiantes"],
    queryFn: () =>
      api.get<StudentsResponse>("/api/v1/profiles/students?per_page=50"),
  });

  const estudiantes = data?.items ?? [];

  return (
    <RoleGuard allowedRoles={["admin_colegio"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-vocari-text">Estudiantes</h1>
          <Link
            href="/admin/importar"
            className="inline-flex items-center gap-2 px-4 py-2 bg-vocari-primary text-white rounded-md hover:opacity-90 text-sm font-medium"
          >
            <Upload className="h-4 w-4" />
            Importar CSV
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              Estudiantes del colegio {data ? `(${data.total})` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} variant="rect" height={56} />
                ))}
              </div>
            ) : estudiantes.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-vocari-text-muted mb-4">
                  No hay estudiantes registrados.
                </p>
                <Link
                  href="/admin/importar"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-vocari-primary text-white rounded-md hover:opacity-90 text-sm"
                >
                  <Upload className="h-4 w-4" />
                  Importar estudiantes
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {estudiantes.map((e) => (
                  <li key={e.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-vocari-text">{e.name}</p>
                      <p className="text-xs text-vocari-text-muted">{e.email}</p>
                    </div>
                    <Badge variant={e.is_active ? "success" : "error"}>
                      {e.is_active ? "Activo" : "Inactivo"}
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
