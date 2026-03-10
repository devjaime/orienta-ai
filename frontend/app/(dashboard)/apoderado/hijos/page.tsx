"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { Card, CardHeader, CardTitle, CardContent, Skeleton } from "@/components/ui";
import { Heart, ChevronRight, User } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ParentDashboardResponse } from "@/lib/types";

export default function ApoderadoHijosPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "parent"],
    queryFn: () => api.get<ParentDashboardResponse>("/api/v1/dashboards/parent"),
  });

  const hijos = data?.children ?? [];

  return (
    <RoleGuard allowedRoles={["apoderado"]}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-vocari-text">Mis Hijos</h1>

        <Card>
          <CardHeader>
            <CardTitle>Estudiantes vinculados</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <Skeleton key={i} variant="rect" height={80} />)}
              </div>
            ) : hijos.length === 0 ? (
              <div className="py-12 text-center">
                <Heart className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-vocari-text-muted">
                  No tienes estudiantes vinculados aún.
                </p>
                <p className="text-sm text-vocari-text-muted mt-1">
                  Contacta al orientador del colegio para vincular a tu hijo/a.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {hijos.map((hijo) => (
                  <li key={hijo.student_id}>
                    <Link
                      href={`/apoderado/hijos/${hijo.student_id}`}
                      className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 hover:border-vocari-primary transition-colors group"
                    >
                      <div className="h-10 w-10 rounded-full bg-vocari-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-vocari-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-vocari-text group-hover:text-vocari-primary truncate">
                          {hijo.student_name}
                        </p>
                        {hijo.recent_tests.length > 0 && (
                          <p className="text-xs text-vocari-text-muted">
                            {hijo.recent_tests.length} test{hijo.recent_tests.length !== 1 ? "s" : ""} completado{hijo.recent_tests.length !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-vocari-primary shrink-0" />
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
