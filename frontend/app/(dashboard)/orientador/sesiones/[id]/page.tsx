"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Skeleton,
  Tabs,
} from "@/components/ui";
import { api } from "@/lib/api";
import { formatDateLong, formatTime } from "@/lib/utils/dates";
import type {
  Session,
  TranscriptFull,
  AnalysisFull,
  InterestDetected,
  SkillDetected,
} from "@/lib/types/session";

/* ---------- Helpers ---------- */

const SENTIMENT_COLORS: Record<string, string> = {
  positivo: "text-green-600",
  neutro: "text-gray-600",
  negativo: "text-red-600",
  mixto: "text-yellow-600",
};

const PRIORITY_COLORS: Record<string, "error" | "warning" | "info"> = {
  alta: "error",
  media: "warning",
  baja: "info",
};

/* ---------- Transcript Viewer ---------- */

function TranscriptViewer({ sessionId }: { sessionId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["session-transcript", sessionId],
    queryFn: () =>
      api.get<TranscriptFull>(`/api/v1/sessions/${sessionId}/transcript`),
  });

  if (isLoading) return <Skeleton variant="rect" height={200} />;
  if (!data) {
    return (
      <p className="text-vocari-text-muted text-sm py-4">
        La transcripcion aun no esta disponible.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Meta info */}
      <div className="flex gap-4 text-xs text-vocari-text-muted">
        <span>Idioma: {data.language}</span>
        <span>{data.word_count.toLocaleString()} palabras</span>
        <span>Fuente: {data.source.replace(/_/g, " ")}</span>
      </div>

      {/* Segmentos */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {data.segments.length > 0 ? (
          data.segments.map((seg, i) => (
            <div key={i} className="flex gap-3">
              <div className="shrink-0 w-28">
                <span className="text-xs font-semibold text-vocari-accent block">
                  {seg.speaker}
                </span>
                <span className="text-[10px] text-vocari-text-muted">
                  {seg.timestamp}
                </span>
              </div>
              <p className="text-sm text-vocari-text">{seg.text}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-vocari-text whitespace-pre-wrap">
            {data.full_text}
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------- AI Analysis Panel ---------- */

function AIAnalysisPanel({ sessionId }: { sessionId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["session-analysis", sessionId],
    queryFn: () =>
      api.get<AnalysisFull>(`/api/v1/sessions/${sessionId}/analysis`),
  });

  if (isLoading) return <Skeleton variant="rect" height={200} />;
  if (!data) {
    return (
      <p className="text-vocari-text-muted text-sm py-4">
        El analisis IA aun no esta disponible.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {/* Meta */}
      <div className="flex gap-4 text-xs text-vocari-text-muted">
        <span>Modelo: {data.model_used}</span>
        <span>{data.tokens_used.toLocaleString()} tokens</span>
        <span>{data.processing_time_seconds.toFixed(1)}s</span>
        {data.reviewed_by_orientador && (
          <Badge variant="success">Revisado</Badge>
        )}
      </div>

      {/* Resumen */}
      <div>
        <h4 className="text-sm font-semibold text-vocari-text mb-1">
          Resumen
        </h4>
        <p className="text-sm text-vocari-text">{data.summary}</p>
      </div>

      {/* Intereses detectados */}
      {data.interests_detected.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-vocari-text mb-2">
            Intereses detectados ({data.interests_detected.length})
          </h4>
          <div className="space-y-2">
            {data.interests_detected.map((item: InterestDetected, i: number) => (
              <div
                key={i}
                className="flex items-start gap-2 p-2 rounded-md bg-blue-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-vocari-text">
                      {item.interest}
                    </span>
                    <span className="text-[10px] text-vocari-text-muted">
                      {Math.round(item.confidence * 100)}%
                    </span>
                    {item.holland_category && (
                      <Badge variant="info">{item.holland_category}</Badge>
                    )}
                    {item.is_new && (
                      <Badge variant="success">Nuevo</Badge>
                    )}
                  </div>
                  <p className="text-xs text-vocari-text-muted mt-0.5">
                    {item.evidence}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Habilidades detectadas */}
      {data.skills_detected.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-vocari-text mb-2">
            Habilidades detectadas ({data.skills_detected.length})
          </h4>
          <div className="space-y-2">
            {data.skills_detected.map((item: SkillDetected, i: number) => (
              <div
                key={i}
                className="flex items-start gap-2 p-2 rounded-md bg-green-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-vocari-text">
                      {item.skill}
                    </span>
                    <span className="text-[10px] text-vocari-text-muted">
                      {Math.round(item.confidence * 100)}%
                    </span>
                    <Badge variant={item.skill_type === "hard" ? "info" : "warning"}>
                      {item.skill_type}
                    </Badge>
                    <span className="text-[10px] text-vocari-text-muted capitalize">
                      {item.level}
                    </span>
                  </div>
                  <p className="text-xs text-vocari-text-muted mt-0.5">
                    {item.evidence}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sentimiento emocional */}
      <div>
        <h4 className="text-sm font-semibold text-vocari-text mb-2">
          Sentimiento emocional
        </h4>
        <div className="p-3 rounded-md bg-gray-50 space-y-2">
          <div className="flex items-center gap-3">
            <span
              className={`text-sm font-medium capitalize ${SENTIMENT_COLORS[data.emotional_sentiment.overall] || ""}`}
            >
              {data.emotional_sentiment.overall}
            </span>
            <span className="text-xs text-vocari-text-muted">
              Score: {data.emotional_sentiment.score.toFixed(2)}
            </span>
          </div>
          <div className="flex gap-4 text-xs text-vocari-text-muted">
            <span>Engagement: {data.emotional_sentiment.engagement}</span>
            <span>Motivacion: {data.emotional_sentiment.motivation}</span>
          </div>
          {data.emotional_sentiment.anxiety_indicators.length > 0 && (
            <div>
              <span className="text-xs font-medium text-red-600">
                Indicadores de ansiedad:
              </span>
              <ul className="list-disc list-inside text-xs text-vocari-text-muted">
                {data.emotional_sentiment.anxiety_indicators.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {data.emotional_sentiment.key_moments.length > 0 && (
            <div>
              <span className="text-xs font-medium text-vocari-text">
                Momentos clave:
              </span>
              <ul className="list-disc list-inside text-xs text-vocari-text-muted">
                {data.emotional_sentiment.key_moments.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Tests sugeridos */}
      {data.suggested_tests.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-vocari-text mb-2">
            Tests sugeridos
          </h4>
          <div className="space-y-1">
            {data.suggested_tests.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Badge variant={PRIORITY_COLORS[t.priority] || "info"}>
                  {t.priority}
                </Badge>
                <span className="font-medium text-vocari-text">
                  {t.test_name}
                </span>
                <span className="text-xs text-vocari-text-muted">
                  — {t.reason}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Juegos sugeridos */}
      {data.suggested_games.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-vocari-text mb-2">
            Juegos sugeridos
          </h4>
          <div className="space-y-1">
            {data.suggested_games.map((g, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Badge variant={PRIORITY_COLORS[g.priority] || "info"}>
                  {g.priority}
                </Badge>
                <span className="font-medium text-vocari-text">
                  {g.game_name}
                </span>
                <span className="text-xs text-vocari-text-muted">
                  — {g.reason}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Main Page ---------- */

export default function OrientadorSessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: session, isLoading } = useQuery({
    queryKey: ["session", id],
    queryFn: () => api.get<Session>(`/api/v1/sessions/${id}`),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton variant="text" width="50%" />
        <Skeleton variant="rect" height={300} />
      </div>
    );
  }

  if (!session) {
    return <p className="text-vocari-text-muted">Sesion no encontrada.</p>;
  }

  const statusLabels: Record<string, string> = {
    scheduled: "Programada",
    confirmed: "Confirmada",
    in_progress: "En curso",
    completed: "Completada",
    cancelled: "Cancelada",
    no_show: "No asistio",
  };

  return (
    <RoleGuard allowedRoles={["orientador"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-vocari-text">
              Detalle de sesion
            </h1>
            <p className="text-vocari-text-muted">
              {formatDateLong(session.scheduled_at)} a las{" "}
              {formatTime(session.scheduled_at)}
            </p>
          </div>
          <Badge
            variant={
              session.status === "completed"
                ? "success"
                : session.status === "cancelled"
                  ? "error"
                  : "info"
            }
          >
            {statusLabels[session.status] || session.status}
          </Badge>
        </div>

        {/* Session info */}
        <Card>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-vocari-text-muted">Estudiante</dt>
                <dd className="font-medium text-vocari-text">
                  {session.student_name || session.student_id}
                </dd>
              </div>
              <div>
                <dt className="text-vocari-text-muted">Duracion</dt>
                <dd className="font-medium text-vocari-text">
                  {session.duration_minutes} minutos
                </dd>
              </div>
              {session.notes_by_student && (
                <div className="sm:col-span-2">
                  <dt className="text-vocari-text-muted">Notas del estudiante</dt>
                  <dd className="text-vocari-text">{session.notes_by_student}</dd>
                </div>
              )}
              {session.google_meet_link && (
                <div className="sm:col-span-2">
                  <dt className="text-vocari-text-muted">Google Meet</dt>
                  <dd>
                    <a
                      href={session.google_meet_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-vocari-accent underline"
                    >
                      {session.google_meet_link}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Transcript + Analysis tabs */}
        {session.status === "completed" && (
          <Card>
            <CardHeader>
              <CardTitle>Analisis de sesion</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                tabs={[
                  {
                    id: "transcript",
                    label: "Transcripcion",
                    content: <TranscriptViewer sessionId={id} />,
                  },
                  {
                    id: "analysis",
                    label: "Analisis IA",
                    content: <AIAnalysisPanel sessionId={id} />,
                  },
                ]}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </RoleGuard>
  );
}
