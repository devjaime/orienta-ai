"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Skeleton,
  Tabs,
  ProgressBar,
} from "@/components/ui";
import {
  User,
  Brain,
  Heart,
  TrendingUp,
  Calendar,
  BookOpen,
  Target,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { STALE_TIMES, RIASEC_COLORS } from "@/lib/utils/constants";
import { RIASEC_LABELS } from "@/lib/types/career";
import { RIASECRadar } from "@/components/charts/RIASECRadar";
import type { RIASECScores, RIASECDimension } from "@/lib/types/career";

/* ---------- Types ---------- */

interface ProfileData {
  id: string;
  student_id: string;
  institution_id: string;
  skills: {
    analiticas?: number;
    creativas?: number;
    sociales?: number;
    practicas?: number;
    liderazgo?: number;
    organizacion?: number;
  };
  interests: Record<string, unknown>;
  learning_patterns: Record<string, unknown>;
  happiness_indicators: {
    nivel_general?: number;
    motivacion_academica?: number;
    claridad_vocacional?: number;
    satisfaccion_orientacion?: number;
  };
  career_recommendations: unknown[];
  riasec_history: RIASECHistoryEntry[];
  data_sources: unknown[];
  last_updated: string;
  created_at: string;
}

interface RIASECHistoryEntry {
  scores: RIASECScores;
  code: string;
  date: string;
  certainty?: number;
}

interface TestResultItem {
  id: string;
  user_id: string;
  institution_id: string;
  test_type: string;
  scores: RIASECScores;
  result_code: string | null;
  certainty: number | null;
  test_metadata: Record<string, unknown>;
  created_at: string;
}

interface TestResultListResponse {
  items: TestResultItem[];
  total: number;
  page: number;
  per_page: number;
}

/* ---------- Sub-components ---------- */

function SkillsPanel({ skills }: { skills: ProfileData["skills"] }) {
  const skillEntries = [
    { label: "Analiticas", value: skills.analiticas ?? 0, color: "bg-blue-500" },
    { label: "Creativas", value: skills.creativas ?? 0, color: "bg-purple-500" },
    { label: "Sociales", value: skills.sociales ?? 0, color: "bg-green-500" },
    { label: "Practicas", value: skills.practicas ?? 0, color: "bg-orange-500" },
    { label: "Liderazgo", value: skills.liderazgo ?? 0, color: "bg-red-500" },
    { label: "Organizacion", value: skills.organizacion ?? 0, color: "bg-gray-500" },
  ];

  const hasData = skillEntries.some((s) => s.value > 0);

  if (!hasData) {
    return (
      <p className="text-vocari-text-muted text-sm py-4">
        Aun no hay datos de habilidades. Completa tests y sesiones para
        que tu perfil se enriquezca.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {skillEntries.map((skill) => (
        <div key={skill.label}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-vocari-text font-medium">{skill.label}</span>
            <span className="text-vocari-text-muted">
              {skill.value.toFixed(1)}/10
            </span>
          </div>
          <ProgressBar
            value={skill.value * 10}
            color={skill.color}
          />
        </div>
      ))}
    </div>
  );
}

function HappinessPanel({
  indicators,
}: {
  indicators: ProfileData["happiness_indicators"];
}) {
  const items = [
    { label: "Nivel general", value: indicators.nivel_general ?? 0 },
    { label: "Motivacion academica", value: indicators.motivacion_academica ?? 0 },
    { label: "Claridad vocacional", value: indicators.claridad_vocacional ?? 0 },
    { label: "Satisfaccion orientacion", value: indicators.satisfaccion_orientacion ?? 0 },
  ];

  const hasData = items.some((i) => i.value > 0);

  if (!hasData) {
    return (
      <p className="text-vocari-text-muted text-sm py-4">
        Los indicadores de bienestar se actualizan a medida que participas en
        sesiones de orientacion.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="text-center p-3 rounded-lg bg-vocari-bg"
        >
          <p className="text-2xl font-bold text-vocari-text">
            {item.value.toFixed(1)}
          </p>
          <p className="text-xs text-vocari-text-muted">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

function RIASECHistoryPanel({
  history,
  latestTest,
}: {
  history: RIASECHistoryEntry[];
  latestTest: TestResultItem | null;
}) {
  // Use latestTest if no history entries
  const entries =
    history.length > 0
      ? history
      : latestTest
        ? [
            {
              scores: latestTest.scores,
              code: latestTest.result_code ?? "---",
              date: latestTest.created_at,
              certainty: latestTest.certainty ?? undefined,
            },
          ]
        : [];

  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <Target className="h-10 w-10 text-vocari-text-muted mx-auto mb-3" />
        <p className="text-vocari-text-muted text-sm mb-3">
          Aun no has completado un test RIASEC.
        </p>
        <a
          href="/estudiante/tests/riasec"
          className="inline-flex px-4 py-2 bg-vocari-accent text-white text-sm rounded-md hover:opacity-90"
        >
          Realizar test RIASEC
        </a>
      </div>
    );
  }

  const latest = entries[entries.length - 1];

  return (
    <div className="space-y-6">
      {/* Radar del ultimo resultado */}
      <RIASECRadar scores={latest.scores} height={280} />

      {/* Codigo Holland */}
      <div className="text-center">
        <p className="text-sm text-vocari-text-muted mb-1">Tu codigo Holland</p>
        <div className="flex items-center justify-center gap-1">
          {latest.code.split("").map((letter, i) => (
            <span
              key={i}
              className="text-2xl font-bold px-2 py-1 rounded"
              style={{
                color: RIASEC_COLORS[letter] ?? "#4a5568",
              }}
            >
              {letter}
            </span>
          ))}
        </div>
        {latest.certainty !== undefined && (
          <Badge
            variant={
              latest.certainty >= 0.7
                ? "success"
                : latest.certainty >= 0.4
                  ? "warning"
                  : "info"
            }
            className="mt-2"
          >
            Certeza:{" "}
            {latest.certainty >= 0.7
              ? "Alta"
              : latest.certainty >= 0.4
                ? "Media"
                : "Exploratoria"}
          </Badge>
        )}
      </div>

      {/* Dimensiones desglosadas */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {(Object.keys(latest.scores) as RIASECDimension[]).map((dim) => (
          <div
            key={dim}
            className="flex items-center gap-2 p-2 rounded-md bg-vocari-bg"
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: RIASEC_COLORS[dim] }}
            />
            <div>
              <p className="text-xs text-vocari-text-muted">
                {RIASEC_LABELS[dim]}
              </p>
              <p className="text-sm font-bold text-vocari-text">
                {latest.scores[dim]}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Historial si hay mas de un test */}
      {entries.length > 1 && (
        <div>
          <p className="text-sm font-medium text-vocari-text mb-2">
            Historial de tests ({entries.length})
          </p>
          <ul className="space-y-2">
            {entries
              .slice()
              .reverse()
              .map((entry, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between p-2 rounded-md border border-gray-100"
                >
                  <div>
                    <span className="text-sm font-medium text-vocari-text">
                      {entry.code}
                    </span>
                    <p className="text-xs text-vocari-text-muted">
                      {new Date(entry.date).toLocaleDateString("es-CL")}
                    </p>
                  </div>
                  {entry.certainty !== undefined && (
                    <Badge variant="info">
                      {(entry.certainty * 100).toFixed(0)}%
                    </Badge>
                  )}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------- Main Page ---------- */

export default function PerfilPage() {
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => api.get<ProfileData>("/api/v1/profiles/me"),
    staleTime: STALE_TIMES.profile,
  });

  const { data: testResults } = useQuery({
    queryKey: ["tests", "me"],
    queryFn: () =>
      api.get<TestResultListResponse>(
        "/api/v1/tests/me?test_type=riasec&per_page=10",
      ),
    staleTime: STALE_TIMES.profile,
  });

  const latestTest =
    testResults?.items && testResults.items.length > 0
      ? testResults.items[0]
      : null;

  return (
    <RoleGuard allowedRoles={["estudiante"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-vocari-text">Mi Perfil</h1>
            <p className="text-sm text-vocari-text-muted">
              Tu perfil longitudinal se actualiza con cada test, sesion y juego.
            </p>
          </div>
          {profile?.last_updated && (
            <div className="flex items-center gap-1 text-xs text-vocari-text-muted">
              <Calendar className="h-3 w-3" />
              Actualizado:{" "}
              {new Date(profile.last_updated).toLocaleDateString("es-CL")}
            </div>
          )}
        </div>

        {profileLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton variant="rect" height={400} />
            <Skeleton variant="rect" height={400} />
            <Skeleton variant="rect" height={300} />
            <Skeleton variant="rect" height={300} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* RIASEC */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-vocari-accent" />
                  Intereses Vocacionales (RIASEC)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RIASECHistoryPanel
                  history={profile?.riasec_history ?? []}
                  latestTest={latestTest}
                />
              </CardContent>
            </Card>

            {/* Habilidades */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Habilidades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SkillsPanel skills={profile?.skills ?? {}} />
              </CardContent>
            </Card>

            {/* Bienestar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Indicadores de Bienestar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <HappinessPanel
                  indicators={profile?.happiness_indicators ?? {}}
                />
              </CardContent>
            </Card>

            {/* Fuentes de datos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  Fuentes de Datos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile?.data_sources &&
                Array.isArray(profile.data_sources) &&
                profile.data_sources.length > 0 ? (
                  <ul className="space-y-2">
                    {profile.data_sources.map((source, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-sm text-vocari-text"
                      >
                        <span className="w-2 h-2 rounded-full bg-vocari-accent" />
                        {String(source)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-vocari-text-muted text-sm">
                      Tu perfil se alimenta de:
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 mt-3">
                      <Badge variant="info">Tests RIASEC</Badge>
                      <Badge variant="info">Sesiones</Badge>
                      <Badge variant="info">Juegos</Badge>
                      <Badge variant="info">Analisis IA</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
