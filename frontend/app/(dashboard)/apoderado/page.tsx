"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Skeleton,
} from "@/components/ui";
import {
  Heart,
  Calendar,
  ClipboardList,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ParentDashboardResponse } from "@/lib/types";
import { formatSessionDate } from "@/lib/utils/dates";

function ChildCard({ child }: { child: ParentDashboardResponse["children"][0] }) {
  return (
    <Link
      href={`/apoderado/hijos/${child.student_id}`}
      className="block p-4 rounded-lg border border-gray-100 hover:border-vocari-accent transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-100 rounded-full">
            <Heart className="h-5 w-5 text-pink-600" />
          </div>
          <div>
            <h3 className="font-medium text-vocari-text">
              {child.student_name}
            </h3>
            <p className="text-xs text-vocari-text-muted">
              {child.student_email}
            </p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-vocari-text-muted" />
      </div>

      {child.happiness_indicator !== null && child.happiness_indicator !== undefined && (
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <span className="text-sm text-vocari-text">
            Indicador de bienestar: <strong>{child.happiness_indicator}%</strong>
          </span>
        </div>
      )}

      <div className="space-y-2">
        {child.upcoming_sessions.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-vocari-text-muted">
              Proxima sesion: {formatSessionDate(child.upcoming_sessions[0].scheduled_at)}
            </span>
          </div>
        )}
        {child.recent_tests.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <ClipboardList className="h-4 w-4 text-purple-600" />
            <span className="text-vocari-text-muted">
              Ultimo test: {child.recent_tests[0].test_type}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

function ChildrenList() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "parent"],
    queryFn: () =>
      api.get<ParentDashboardResponse>("/api/v1/dashboards/parent"),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton variant="rect" height={140} />
        <Skeleton variant="rect" height={140} />
      </div>
    );
  }

  const children = data?.children ?? [];

  if (children.length === 0) {
    return (
      <div className="text-center py-8">
        <Heart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-vocari-text-muted">
          No tienes hijos vinculados a tu cuenta.
        </p>
        <p className="text-sm text-vocari-text-muted mt-1">
          Contacta al orientador para obtener un codigo de vinculacion.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {children.map((child) => (
        <ChildCard key={child.student_id} child={child} />
      ))}
    </div>
  );
}

function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Link
        href="/apoderado/consentimiento"
        className="flex items-center gap-3 p-4 rounded-lg border border-gray-100 hover:border-vocari-accent transition-colors"
      >
        <div className="p-2 bg-blue-100 rounded-md">
          <ClipboardList className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <p className="font-medium text-vocari-text">Consentimientos</p>
          <p className="text-xs text-vocari-text-muted">
            Gestionar permisos de tratamiento de datos
          </p>
        </div>
      </Link>

      <Link
        href="/apoderado/hijos"
        className="flex items-center gap-3 p-4 rounded-lg border border-gray-100 hover:border-vocari-accent transition-colors"
      >
        <div className="p-2 bg-green-100 rounded-md">
          <Heart className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <p className="font-medium text-vocari-text">Ver hijos</p>
          <p className="text-xs text-vocari-text-muted">
            Explorar progreso y resultados
          </p>
        </div>
      </Link>
    </div>
  );
}

export default function ApoderadoDashboard() {
  return (
    <RoleGuard allowedRoles={["apoderado"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-vocari-text">
            Dashboard Apoderado
          </h1>
          <p className="text-vocari-text-muted">
            Seguimiento del progreso vocacional de tus hijos
          </p>
        </div>

        <QuickActions />

        <Card>
          <CardHeader>
            <CardTitle>Mis Hijos</CardTitle>
          </CardHeader>
          <CardContent>
            <ChildrenList />
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
