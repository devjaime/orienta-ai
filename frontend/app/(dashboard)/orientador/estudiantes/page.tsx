"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Badge, Card, CardHeader, CardTitle, CardContent, Skeleton } from "@/components/ui";
import { Search, Users, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface StudentItem {
  id: string;
  name: string;
  email: string;
  curso?: string | null;
  test_status: "pendiente" | "completo";
  holland_code?: string | null;
  clarity_score?: number | null;
  risk_level: "alto" | "medio" | "bajo";
  sessions_count: number;
  last_test_at?: string | null;
  last_activity_at?: string | null;
}

interface StudentsResponse {
  items: StudentItem[];
  total: number;
}

export default function OrientadorEstudiantesPage() {
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("");
  const [claridad, setClaridad] = useState("");

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (estado) params.set("estado", estado);
    if (claridad) params.set("claridad", claridad);
    return params.toString();
  }, [search, estado, claridad]);

  const { data, isLoading } = useQuery({
    queryKey: ["orientador", "students-panel", queryParams],
    queryFn: () =>
      api.get<StudentsResponse>(
        `/api/v1/orientador/students${queryParams ? `?${queryParams}` : ""}`,
      ),
  });

  const estudiantes = data?.items ?? [];

  const riskBadgeClass = (riskLevel: StudentItem["risk_level"]) => {
    if (riskLevel === "alto") return "bg-red-100 text-red-700";
    if (riskLevel === "bajo") return "bg-green-100 text-green-700";
    return "bg-amber-100 text-amber-700";
  };

  return (
    <RoleGuard allowedRoles={["orientador", "admin_colegio"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
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
          <CardContent className="pt-5">
            <div className="grid gap-3 md:grid-cols-3">
              <label className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-vocari-text-muted" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nombre o correo"
                  className="w-full rounded-md border border-gray-300 pl-9 pr-3 py-2 text-sm"
                />
              </label>

              <select
                value={estado}
                onChange={(event) => setEstado(event.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Estado test: todos</option>
                <option value="completo">Completo</option>
                <option value="pendiente">Pendiente</option>
              </select>

              <select
                value={claridad}
                onChange={(event) => setClaridad(event.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Claridad: todas</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>
          </CardContent>
        </Card>

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
                  <li key={e.id} className="py-4 flex items-center gap-3 flex-wrap">
                    <div className="h-9 w-9 rounded-full bg-vocari-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-vocari-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-vocari-text truncate">{e.name}</p>
                      <p className="text-xs text-vocari-text-muted truncate">{e.email}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Badge className={riskBadgeClass(e.risk_level)}>
                          Riesgo {e.risk_level}
                        </Badge>
                        <Badge className={e.test_status === "completo" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                          Test {e.test_status}
                        </Badge>
                        {e.holland_code && (
                          <Badge className="bg-vocari-primary/10 text-vocari-primary">
                            {e.holland_code}
                          </Badge>
                        )}
                        {e.curso && (
                          <Badge className="bg-blue-100 text-blue-700">
                            {e.curso}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-xs text-vocari-text-muted shrink-0">
                      <p>{e.sessions_count} sesión{e.sessions_count !== 1 ? "es" : ""}</p>
                      <p>
                        Claridad: {typeof e.clarity_score === "number" ? e.clarity_score.toFixed(1) : "N/D"}
                      </p>
                      <Link
                        href={`/orientador/estudiantes/${e.id}`}
                        className="inline-block mt-2 text-vocari-primary hover:underline text-xs font-medium"
                      >
                        Ver ficha
                      </Link>
                    </div>
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
