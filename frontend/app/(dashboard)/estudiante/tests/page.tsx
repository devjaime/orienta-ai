"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { Card, CardHeader, CardTitle, CardContent, Badge, Skeleton } from "@/components/ui";
import { ClipboardList, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface RiasecResult {
  id: string;
  created_at: string;
  holland_code: string;
  scores: Record<string, number>;
}

interface TestsResponse {
  items: RiasecResult[];
  total: number;
}

export default function EstudianteTestsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["tests", "me"],
    queryFn: () => api.get<TestsResponse>("/api/v1/tests/me"),
  });

  const resultados = data?.items ?? [];
  const ultimoRiasec = resultados[0];

  return (
    <RoleGuard allowedRoles={["estudiante"]}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-vocari-text">Tests Vocacionales</h1>

        {/* Test RIASEC disponible */}
        <Card>
          <CardHeader>
            <CardTitle>Tests disponibles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/estudiante/tests/riasec"
              className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-vocari-primary transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-vocari-primary/10 rounded-md">
                  <ClipboardList className="h-5 w-5 text-vocari-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-vocari-text group-hover:text-vocari-primary">
                    Test RIASEC
                  </p>
                  <p className="text-xs text-vocari-text-muted">
                    36 preguntas · ~15 min · Descubre tus intereses vocacionales
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {ultimoRiasec ? (
                  <Badge variant="success" dot>Completado</Badge>
                ) : (
                  <Badge variant="info" dot>Pendiente</Badge>
                )}
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Historial */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de resultados</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <Skeleton key={i} variant="rect" height={56} />)}
              </div>
            ) : resultados.length === 0 ? (
              <div className="py-10 text-center">
                <ClipboardList className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-vocari-text-muted mb-4">
                  Aún no has completado ningún test.
                </p>
                <Link
                  href="/estudiante/tests/riasec"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-vocari-primary text-white rounded-md hover:opacity-90 text-sm"
                >
                  Hacer el Test RIASEC
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {resultados.map((r) => (
                  <li key={r.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-vocari-text">
                          Test RIASEC
                        </p>
                        <p className="text-xs text-vocari-text-muted">
                          Código: <span className="font-semibold">{r.holland_code}</span>
                          {" · "}
                          {new Date(r.created_at).toLocaleDateString("es-CL")}
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/estudiante/carreras"
                      className="text-xs text-vocari-primary hover:underline"
                    >
                      Ver carreras
                    </Link>
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
