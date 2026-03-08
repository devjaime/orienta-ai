"use client";

import { useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Skeleton,
  Input,
  Select,
} from "@/components/ui";
import {
  GraduationCap,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Briefcase,
  DollarSign,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Target,
  Star,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { STALE_TIMES, RIASEC_COLORS } from "@/lib/utils/constants";
import type { RIASECDimension } from "@/lib/types/career";

/* ---------- Types ---------- */

interface CareerItem {
  id: string;
  name: string;
  area: string;
  holland_codes: string[];
  description: string;
  salary_range: {
    min?: number;
    max?: number;
    currency?: string;
  };
  employability: number;
  saturation_index: number;
  mineduc_data: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CareerRecommendation {
  career: CareerItem;
  match_score: number;
  match_reasons: string[];
}

interface RecommendationsResponse {
  holland_code: string;
  recommendations: CareerRecommendation[];
  total_careers_analyzed: number;
}

/* ---------- Sub-components ---------- */

function MatchScoreBadge({ score }: { score: number }) {
  const variant =
    score >= 80 ? "success" : score >= 50 ? "warning" : "info";
  return (
    <Badge variant={variant} className="text-sm font-bold">
      {score.toFixed(0)}% match
    </Badge>
  );
}

function SaturationIndicator({ index }: { index: number }) {
  if (index >= 0.7) {
    return (
      <div className="flex items-center gap-1 text-red-600">
        <TrendingUp className="h-4 w-4" />
        <span className="text-xs">Alta saturacion</span>
      </div>
    );
  }
  if (index >= 0.4) {
    return (
      <div className="flex items-center gap-1 text-yellow-600">
        <Minus className="h-4 w-4" />
        <span className="text-xs">Saturacion media</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-green-600">
      <TrendingDown className="h-4 w-4" />
      <span className="text-xs">Baja saturacion</span>
    </div>
  );
}

function formatSalary(range: CareerItem["salary_range"]): string {
  if (!range.min && !range.max) return "Sin datos";
  const fmt = (n: number) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(n);
  if (range.min && range.max) return `${fmt(range.min)} - ${fmt(range.max)}`;
  if (range.min) return `Desde ${fmt(range.min)}`;
  if (range.max) return `Hasta ${fmt(range.max)}`;
  return "Sin datos";
}

function CareerCard({
  recommendation,
  rank,
}: {
  recommendation: CareerRecommendation;
  rank: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const { career, match_score, match_reasons } = recommendation;

  return (
    <Card className="border-l-4" style={{ borderLeftColor: rank <= 3 ? "#38a169" : "#e2e8f0" }}>
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-vocari-text-muted">
                #{rank}
              </span>
              <h3 className="text-base font-semibold text-vocari-text">
                {career.name}
              </h3>
              {rank <= 3 && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
            </div>
            <p className="text-xs text-vocari-text-muted mb-2">
              {career.area}
            </p>

            {/* Holland codes */}
            <div className="flex gap-1 mb-3">
              {career.holland_codes.map((code) => (
                <span
                  key={code}
                  className="text-xs font-bold px-1.5 py-0.5 rounded"
                  style={{
                    color: RIASEC_COLORS[code as RIASECDimension] ?? "#4a5568",
                    backgroundColor:
                      (RIASEC_COLORS[code as RIASECDimension] ?? "#4a5568") + "15",
                  }}
                >
                  {code}
                </span>
              ))}
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-1 text-vocari-text-muted">
                <DollarSign className="h-3.5 w-3.5" />
                {formatSalary(career.salary_range)}
              </div>
              <div className="flex items-center gap-1 text-vocari-text-muted">
                <Briefcase className="h-3.5 w-3.5" />
                {(career.employability * 100).toFixed(0)}% empleabilidad
              </div>
              <SaturationIndicator index={career.saturation_index} />
            </div>
          </div>

          <div className="text-right flex flex-col items-end gap-2">
            <MatchScoreBadge score={match_score} />
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-vocari-accent text-xs flex items-center gap-1 hover:underline"
            >
              {expanded ? "Menos" : "Mas"}
              {expanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
            <p className="text-sm text-vocari-text">{career.description}</p>

            {match_reasons.length > 0 && (
              <div>
                <p className="text-xs font-medium text-vocari-text mb-1">
                  Por que es compatible:
                </p>
                <ul className="space-y-1">
                  {match_reasons.map((reason, i) => (
                    <li
                      key={i}
                      className="text-xs text-vocari-text-muted flex items-start gap-1"
                    >
                      <span className="text-vocari-accent mt-0.5">&#x2022;</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <a
              href={`/estudiante/carreras/${career.id}`}
              className="inline-flex items-center gap-1 text-xs text-vocari-accent hover:underline"
            >
              Ver detalle completo
              <ChevronDown className="h-3 w-3 -rotate-90" />
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NoRecommendations() {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="text-center">
          <Target className="h-12 w-12 text-vocari-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-vocari-text mb-2">
            Sin recomendaciones todavia
          </h3>
          <p className="text-sm text-vocari-text-muted mb-4 max-w-md mx-auto">
            Necesitas completar al menos un test RIASEC para que podamos
            recomendarte carreras compatibles con tu perfil.
          </p>
          <a
            href="/estudiante/tests/riasec"
            className="inline-flex px-4 py-2 bg-vocari-accent text-white text-sm rounded-md hover:opacity-90"
          >
            Realizar test RIASEC
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Main Page ---------- */

export default function CarrerasPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [areaFilter, setAreaFilter] = useState("todas");

  const {
    data: recommendations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["careers", "recommendations"],
    queryFn: () =>
      api.get<RecommendationsResponse>("/api/v1/careers/recommendations"),
    staleTime: STALE_TIMES.careers,
  });

  // Filter recommendations
  const filtered = (recommendations?.recommendations ?? []).filter((rec) => {
    const matchesSearch =
      searchTerm === "" ||
      rec.career.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.career.area.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea =
      areaFilter === "todas" || rec.career.area === areaFilter;
    return matchesSearch && matchesArea;
  });

  // Extract unique areas for filter
  const areas = [
    ...new Set(
      (recommendations?.recommendations ?? []).map((r) => r.career.area),
    ),
  ].sort();

  return (
    <RoleGuard allowedRoles={["estudiante"]}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-vocari-text flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-vocari-accent" />
            Carreras Recomendadas
          </h1>
          <p className="text-sm text-vocari-text-muted mt-1">
            Basado en tus intereses vocacionales y perfil longitudinal.
          </p>
        </div>

        {/* Summary card */}
        {recommendations && recommendations.recommendations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="flex items-center gap-3">
                <div className="p-2 bg-vocari-accent/10 rounded-md">
                  <BarChart3 className="h-5 w-5 text-vocari-accent" />
                </div>
                <div>
                  <p className="text-sm text-vocari-text-muted">
                    Tu codigo Holland
                  </p>
                  <p className="text-lg font-bold text-vocari-text">
                    {recommendations.holland_code}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-md">
                  <GraduationCap className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-vocari-text-muted">
                    Carreras compatibles
                  </p>
                  <p className="text-lg font-bold text-vocari-text">
                    {recommendations.recommendations.length}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-md">
                  <Search className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-vocari-text-muted">
                    Carreras analizadas
                  </p>
                  <p className="text-lg font-bold text-vocari-text">
                    {recommendations.total_careers_analyzed}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search & Filters */}
        {recommendations && recommendations.recommendations.length > 0 && (
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-vocari-text-muted" />
              <Input
                placeholder="Buscar carrera por nombre o area..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              options={[
                { value: "todas", label: "Todas las areas" },
                ...areas.map((a) => ({ value: a, label: a })),
              ]}
            />
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton variant="rect" height={120} />
            <Skeleton variant="rect" height={120} />
            <Skeleton variant="rect" height={120} />
            <Skeleton variant="rect" height={120} />
          </div>
        ) : error ? (
          <NoRecommendations />
        ) : recommendations &&
          recommendations.recommendations.length === 0 ? (
          <NoRecommendations />
        ) : (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <p className="text-center text-vocari-text-muted py-8">
                No se encontraron carreras con esos filtros.
              </p>
            ) : (
              filtered.map((rec, i) => (
                <CareerCard key={rec.career.id} recommendation={rec} rank={i + 1} />
              ))
            )}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
