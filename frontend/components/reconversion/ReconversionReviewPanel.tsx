"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, RefreshCw, Search } from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Spinner,
} from "@/components/ui";
import { api } from "@/lib/api";
import { formatDateTimeCL } from "@/lib/utils/dates";

interface ReconversionReviewItem {
  session_id: string;
  share_token: string;
  public_url: string;
  nombre: string;
  email: string;
  profesion_actual: string;
  edad: number;
  pais: string | null;
  ciudad: string | null;
  situacion_actual: string | null;
  current_phase: number;
  status: string;
  resumen_personalizado: string;
  top_routes: string[];
  report_excerpt: string;
  model_name: string;
  prompt_version: string;
  generated_at: string | null;
  updated_at: string;
}

interface ReconversionReviewResponse {
  items: ReconversionReviewItem[];
  total: number;
}

interface ReconversionReviewPanelProps {
  title: string;
  description: string;
}

const STATUS_LABELS: Record<string, string> = {
  in_progress: "En progreso",
  ready_for_report: "Listo para informe",
  report_ready: "Informe listo",
};

export function ReconversionReviewPanel({
  title,
  description,
}: ReconversionReviewPanelProps) {
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");

  const queryKey = useMemo(() => ["reconversion-review", search], [search]);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      api.get<ReconversionReviewResponse>(
        `/api/v1/reconversion/review/reports${
          search ? `?search=${encodeURIComponent(search)}` : ""
        }`,
      ),
    staleTime: 60_000,
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <CardTitle>{title}</CardTitle>
            <p className="text-sm text-vocari-text-muted">{description}</p>
          </div>

          <div className="flex w-full flex-col gap-3 md:w-auto md:min-w-[420px]">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-vocari-text-muted" />
                <Input
                  value={searchDraft}
                  onChange={(event) => setSearchDraft(event.target.value)}
                  placeholder="Buscar por nombre, correo o profesion"
                  className="pl-10"
                />
              </div>
              <Button
                variant="secondary"
                onClick={() => setSearch(searchDraft.trim())}
              >
                Buscar
              </Button>
              <Button variant="ghost" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-vocari-text-muted">
              {isFetching
                ? "Actualizando listado..."
                : `Total informes: ${data?.total ?? 0}`}
            </p>
          </div>
        </CardHeader>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 text-sm text-vocari-text-muted">
              <Spinner size="sm" />
              Cargando informes de reconversion...
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-10 text-sm text-red-700">
            No pudimos cargar los informes de reconversion.
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-sm text-vocari-text-muted">
            No hay informes generados para esta busqueda todavia.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.session_id} className="border border-slate-200">
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-vocari-text">
                        {item.nombre}
                      </h2>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {STATUS_LABELS[item.status] ?? item.status}
                      </span>
                      <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800">
                        Fase {item.current_phase}
                      </span>
                    </div>
                    <p className="text-sm text-vocari-text-muted">
                      {item.email} · {item.profesion_actual} · {item.edad} anos
                    </p>
                    <p className="text-sm text-vocari-text-muted">
                      {[item.ciudad, item.pais].filter(Boolean).join(", ") ||
                        "Ubicacion no informada"}
                      {item.situacion_actual
                        ? ` · ${item.situacion_actual}`
                        : ""}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-2 text-sm text-vocari-text-muted lg:items-end">
                    <p>Generado: {formatDateTimeCL(item.generated_at)}</p>
                    <p>Actualizado: {formatDateTimeCL(item.updated_at)}</p>
                    <p className="text-xs">
                      {item.model_name} · {item.prompt_version}
                    </p>
                    <Link
                      href={item.public_url}
                      className="inline-flex"
                      target="_blank"
                    >
                      <Button size="sm">
                        Abrir informe
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Resumen
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {item.resumen_personalizado || item.report_excerpt}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-800">
                        Rutas sugeridas
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.top_routes.length > 0 ? (
                          item.top_routes.map((route) => (
                            <span
                              key={route}
                              className="rounded-full bg-white px-3 py-1 text-xs font-medium text-cyan-900"
                            >
                              {route}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-cyan-900">
                            Sin rutas detectadas.
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Extracto del informe
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {item.report_excerpt}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
