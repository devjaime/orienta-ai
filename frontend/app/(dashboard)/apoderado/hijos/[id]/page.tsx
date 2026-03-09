"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Skeleton,
  ProgressBar,
} from "@/components/ui";
import {
  Heart,
  Calendar,
  ClipboardList,
  TrendingUp,
  User,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { ChildDashboardInfo, ParentDashboardResponse, SessionSummary, TestResultSummary } from "@/lib/types";
import { formatSessionDate } from "@/lib/utils/dates";

const RIASEC_LABELS: Record<string, string> = {
  R: "Realista",
  I: "Investigativo",
  A: "Artistico",
  S: "Social",
  E: "Emprendedor",
  C: "Convencional",
};

const STATUS_MAP: Record<string, { label: string; variant: "success" | "warning" | "info" | "error" | "neutral" }> = {
  scheduled: { label: "Programada", variant: "info" },
  confirmed: { label: "Confirmada", variant: "success" },
  in_progress: { label: "En curso", variant: "warning" },
  completed: { label: "Completada", variant: "neutral" },
  cancelled: { label: "Cancelada", variant: "error" },
  no_show: { label: "No asistio", variant: "error" },
};

const TEST_TYPE_LABELS: Record<string, string> = {
  riasec: "Test RIASEC",
  holland: "Test de Holland",
  skills: "Evaluacion de habilidades",
  interests: "Inventario de intereses",
};

function RIASECChart({ scores }: { scores: Record<string, number> }) {
  const sortedEntries = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <div className="space-y-3">
      {sortedEntries.map(([type, score]) => (
        <div key={type}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-vocari-text">
              {RIASEC_LABELS[type] || type}
            </span>
            <span className="text-vocari-text-muted">{score}%</span>
          </div>
          <ProgressBar
            value={score}
            color={`bg-riasec-${type}`}
          />
        </div>
      ))}
    </div>
  );
}

function SessionsList({ sessions }: { sessions: SessionSummary[] }) {
  if (sessions.length === 0) {
    return (
      <p className="text-vocari-text-muted text-sm py-2">
        No hay sesiones registradas
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {sessions.slice(0, 5).map((s) => {
        const status = STATUS_MAP[s.status] || STATUS_MAP.scheduled;
        return (
          <li key={s.id} className="flex items-center justify-between p-2 rounded bg-gray-50">
            <div>
              <p className="text-sm font-medium text-vocari-text">
                {formatSessionDate(s.scheduled_at)}
              </p>
              <p className="text-xs text-vocari-text-muted">
                {s.duration_minutes} minutos
              </p>
            </div>
            <Badge variant={status.variant} dot>
              {status.label}
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}

function TestsList({ tests }: { tests: TestResultSummary[] }) {
  if (tests.length === 0) {
    return (
      <p className="text-vocari-text-muted text-sm py-2">
        No hay tests completados
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {tests.slice(0, 5).map((t) => (
        <li key={t.id} className="flex items-center justify-between p-2 rounded bg-gray-50">
          <div>
            <p className="text-sm font-medium text-vocari-text">
              {TEST_TYPE_LABELS[t.test_type] || t.test_type}
            </p>
            <p className="text-xs text-vocari-text-muted">
              {new Date(t.created_at).toLocaleDateString("es-CL")}
            </p>
          </div>
          {t.result_code && (
            <Badge variant="success">{t.result_code}</Badge>
          )}
        </li>
      ))}
    </ul>
  );
}

function ChildDetail({ child }: { child: ChildDashboardInfo }) {
  const riasecScores = child.profile_summary?.riasec_history?.[0]?.scores || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-pink-100 rounded-full">
          <Heart className="h-8 w-8 text-pink-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-vocari-text">
            {child.student_name}
          </h1>
          <p className="text-vocari-text-muted">{child.student_email}</p>
        </div>
        {child.happiness_indicator !== null && child.happiness_indicator !== undefined && (
          <Badge variant="success" className="ml-auto">
            {child.happiness_indicator}% Bienestar
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Perfil RIASEC
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(riasecScores).length > 0 ? (
              <RIASECChart scores={riasecScores} />
            ) : (
              <p className="text-vocari-text-muted text-sm">
                El perfil RIASEC aun no ha sido calculado. El estudiante debe
                completar el test.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Sesiones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SessionsList sessions={child.recent_sessions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Tests Realizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TestsList tests={child.recent_tests} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Proximas Sesiones
            </CardTitle>
          </CardHeader>
          <CardContent>
            {child.upcoming_sessions.length > 0 ? (
              <SessionsList sessions={child.upcoming_sessions} />
            ) : (
              <p className="text-vocari-text-muted text-sm">
                No hay sesiones programadas
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton variant="circle" width={56} height={56} />
        <div>
          <Skeleton variant="text" width={200} height={28} />
          <Skeleton variant="text" width={150} height={20} />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton variant="rect" height={200} />
        <Skeleton variant="rect" height={200} />
        <Skeleton variant="rect" height={200} />
        <Skeleton variant="rect" height={200} />
      </div>
    </div>
  );
}

export default function ChildDetailPage() {
  const params = useParams();
  const childId = params.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "parent", childId],
    queryFn: () =>
      api.get<ParentDashboardResponse>("/api/v1/dashboards/apoderado"),
    staleTime: 60_000,
  });

  const child = data?.children.find((c) => c.student_id === childId);

  if (isLoading) {
    return (
      <RoleGuard allowedRoles={["apoderado"]}>
        <LoadingState />
      </RoleGuard>
    );
  }

  if (!child) {
    return (
      <RoleGuard allowedRoles={["apoderado"]}>
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-vocari-text-muted">
            No se encontro informacion de este estudiante
          </p>
          <a
            href="/apoderado"
            className="text-vocari-accent hover:underline mt-2 inline-block"
          >
            Volver al dashboard
          </a>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["apoderado"]}>
      <ChildDetail child={child} />
    </RoleGuard>
  );
}
