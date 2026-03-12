"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Circle, PlusCircle } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { api } from "@/lib/api";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton, Textarea } from "@/components/ui";

interface Student {
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

interface NoteItem {
  id: string;
  note: string;
  created_at: string;
}

interface TaskItem {
  id: string;
  title: string;
  status: "pendiente" | "en_progreso" | "completada" | "cancelada";
  due_date?: string | null;
}

interface StudentDetailResponse {
  student: Student;
  notes: NoteItem[];
  tasks: TaskItem[];
  ai_reports: AIReportItem[];
}

interface FollowupItem {
  id: string;
  journey_step: "D0" | "D7" | "D21" | string;
  channel: "email" | "in_app";
  status: "scheduled" | "sent" | "failed" | "canceled";
  scheduled_at: string;
  sent_at?: string | null;
  retry_count: number;
  last_error?: string | null;
}

interface FollowupListResponse {
  items: FollowupItem[];
  total: number;
}

interface AIReportItem {
  id: string;
  report_text: string;
  report_json: {
    resumen_personalizado?: string;
    top_careers?: Array<{
      nombre?: string;
      datos_mercado?: {
        empleabilidad?: string | number | null;
        ingreso?: string | number | null;
        saturacion?: string | number | null;
      };
    }>;
  };
  holland_code?: string | null;
  clarity_score?: number | null;
  model_name: string;
  prompt_version: string;
  created_at: string;
}

const riskClass = {
  alto: "bg-red-100 text-red-700",
  medio: "bg-amber-100 text-amber-700",
  bajo: "bg-green-100 text-green-700",
};

const taskStatusLabel: Record<TaskItem["status"], string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completada: "Completada",
  cancelada: "Cancelada",
};

const followupStatusLabel: Record<FollowupItem["status"], string> = {
  scheduled: "Programado",
  sent: "Enviado",
  failed: "Fallido",
  canceled: "Cancelado",
};

const followupStatusClass: Record<FollowupItem["status"], string> = {
  scheduled: "bg-sky-100 text-sky-700",
  sent: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
  canceled: "bg-gray-100 text-gray-700",
};

export default function OrientadorStudentProfilePage() {
  const params = useParams<{ id: string }>();
  const studentId = params?.id;
  const queryClient = useQueryClient();

  const [noteText, setNoteText] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [printing, setPrinting] = useState(false);

  const detailQueryKey = useMemo(() => ["orientador", "student-detail", studentId], [studentId]);

  const { data, isLoading } = useQuery({
    queryKey: detailQueryKey,
    enabled: Boolean(studentId),
    queryFn: () => api.get<StudentDetailResponse>(`/api/v1/orientador/students/${studentId}`),
  });

  const followupsQueryKey = useMemo(() => ["followups", "student", studentId], [studentId]);

  const { data: followupsData, isLoading: followupsLoading } = useQuery({
    queryKey: followupsQueryKey,
    enabled: Boolean(studentId),
    queryFn: () => api.get<FollowupListResponse>(`/api/v1/followups/${studentId}`),
  });

  const createNoteMutation = useMutation({
    mutationFn: async () =>
      api.post(`/api/v1/orientador/students/${studentId}/notes`, { note: noteText.trim() }),
    onSuccess: async () => {
      setNoteText("");
      await queryClient.invalidateQueries({ queryKey: detailQueryKey });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async () =>
      api.post(`/api/v1/orientador/students/${studentId}/tasks`, { title: taskTitle.trim() }),
    onSuccess: async () => {
      setTaskTitle("");
      await queryClient.invalidateQueries({ queryKey: detailQueryKey });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskItem["status"] }) =>
      api.patch(`/api/v1/orientador/tasks/${taskId}`, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: detailQueryKey });
    },
  });

  const scheduleFollowupsMutation = useMutation({
    mutationFn: async () =>
      api.post("/api/v1/followups/schedule", {
        student_id: studentId,
        force_reschedule: true,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: followupsQueryKey });
    },
  });

  const retryFollowupMutation = useMutation({
    mutationFn: async (followupId: string) =>
      api.post(`/api/v1/followups/${followupId}/retry`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: followupsQueryKey });
    },
  });

  const cancelFollowupMutation = useMutation({
    mutationFn: async (followupId: string) =>
      api.post(`/api/v1/followups/${followupId}/cancel`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: followupsQueryKey });
    },
  });

  if (isLoading || !data) {
    return (
      <RoleGuard allowedRoles={["orientador", "admin_colegio"]}>
        <div className="space-y-4">
          <Skeleton variant="rect" height={96} />
          <Skeleton variant="rect" height={220} />
          <Skeleton variant="rect" height={220} />
        </div>
      </RoleGuard>
    );
  }

  const { student, notes, tasks, ai_reports } = data;
  const followups = followupsData?.items || [];

  return (
    <RoleGuard allowedRoles={["orientador", "admin_colegio"]}>
      <div className="space-y-6" id="student-report-print">
        <div className="flex items-center gap-3">
          <Link href="/orientador/estudiantes" className="text-vocari-primary hover:underline text-sm inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>
          <Button
            size="sm"
            variant="secondary"
            className="ml-auto print:hidden"
            onClick={() => {
              setPrinting(true);
              window.setTimeout(() => {
                window.print();
                setPrinting(false);
              }, 80);
            }}
          >
            Exportar PDF
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{student.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <p><strong>Email:</strong> {student.email}</p>
              <p><strong>Curso:</strong> {student.curso || "N/D"}</p>
              <p><strong>Estado test:</strong> {student.test_status}</p>
              <p><strong>Código Holland:</strong> {student.holland_code || "N/D"}</p>
              <p><strong>Claridad:</strong> {typeof student.clarity_score === "number" ? student.clarity_score.toFixed(1) : "N/D"}</p>
              <p><strong>Sesiones:</strong> {student.sessions_count}</p>
            </div>
            <div className="mt-3">
              <Badge className={riskClass[student.risk_level]}>
                Riesgo {student.risk_level}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Timeline de seguimiento automático</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => scheduleFollowupsMutation.mutate()}
                  loading={scheduleFollowupsMutation.isPending}
                >
                  Reprogramar D0/D7/D21
                </Button>
              </div>

              {followupsLoading ? (
                <Skeleton variant="rect" height={140} />
              ) : followups.length === 0 ? (
                <p className="text-sm text-vocari-text-muted">No hay seguimientos programados para este estudiante.</p>
              ) : (
                <div className="space-y-2">
                  {followups.map((item) => (
                    <div key={item.id} className="rounded-md border border-gray-200 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-indigo-100 text-indigo-700">{item.journey_step}</Badge>
                        <Badge className={followupStatusClass[item.status]}>
                          {followupStatusLabel[item.status]}
                        </Badge>
                        <span className="text-xs text-vocari-text-muted">
                          Programado: {new Date(item.scheduled_at).toLocaleString("es-CL")}
                        </span>
                        {item.sent_at && (
                          <span className="text-xs text-vocari-text-muted">
                            Enviado: {new Date(item.sent_at).toLocaleString("es-CL")}
                          </span>
                        )}
                      </div>
                      {item.last_error && (
                        <p className="text-xs text-rose-700 mt-2">{item.last_error}</p>
                      )}
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => retryFollowupMutation.mutate(item.id)}
                          loading={retryFollowupMutation.isPending}
                        >
                          Reintentar
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => cancelFollowupMutation.mutate(item.id)}
                          loading={cancelFollowupMutation.isPending}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Informes IA históricos</CardTitle>
            </CardHeader>
            <CardContent>
              {ai_reports.length === 0 ? (
                <p className="text-sm text-vocari-text-muted">Aún no hay informes IA para este estudiante.</p>
              ) : (
                <div className="space-y-3">
                  {ai_reports.map((report) => (
                    <details key={report.id} className="rounded-md border border-gray-200 bg-white p-3">
                      <summary className="cursor-pointer text-sm font-medium text-vocari-text">
                        {new Date(report.created_at).toLocaleString("es-CL")} · {report.model_name}
                      </summary>
                      <div className="mt-3 space-y-3 text-sm">
                        {report.report_json?.resumen_personalizado && (
                          <div className="rounded-md bg-sky-50 p-3 text-slate-800">
                            <p className="font-medium mb-1">Resumen personalizado</p>
                            <p>{report.report_json.resumen_personalizado}</p>
                          </div>
                        )}
                        {(report.report_json?.top_careers?.length ?? 0) > 0 && (
                          <div className="rounded-md bg-emerald-50 p-3 text-slate-800">
                            <p className="font-medium mb-2">Carreras recomendadas</p>
                            <ul className="list-disc pl-5 space-y-1">
                              {report.report_json.top_careers?.map((career, index) => (
                                <li key={`${report.id}-career-${index}`}>
                                  <strong>{career.nombre || "Carrera sugerida"}</strong>
                                  {career.datos_mercado?.empleabilidad ? ` · Empleabilidad: ${career.datos_mercado.empleabilidad}` : ""}
                                  {career.datos_mercado?.ingreso ? ` · Ingreso: ${career.datos_mercado.ingreso}` : ""}
                                  {career.datos_mercado?.saturacion ? ` · Saturación: ${career.datos_mercado.saturacion}` : ""}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="rounded-md bg-amber-50 p-3 text-slate-800">
                          <p className="font-medium mb-1">Texto completo</p>
                          <p className="whitespace-pre-wrap">{report.report_text}</p>
                        </div>
                        <p className="text-xs text-vocari-text-muted">
                          Prompt: {report.prompt_version}
                        </p>
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notas del orientador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  rows={4}
                  placeholder="Escribe una observación de seguimiento..."
                  value={noteText}
                  onChange={(event) => setNoteText(event.target.value)}
                />
                <Button
                  size="sm"
                  onClick={() => createNoteMutation.mutate()}
                  disabled={!noteText.trim()}
                  loading={createNoteMutation.isPending}
                >
                  <PlusCircle className="w-4 h-4" />
                  Guardar nota
                </Button>
              </div>

              <div className="space-y-2 max-h-72 overflow-auto pr-1">
                {notes.length === 0 ? (
                  <p className="text-sm text-vocari-text-muted">Aún no hay notas registradas.</p>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} className="rounded-md border border-gray-200 p-3">
                      <p className="text-sm text-vocari-text whitespace-pre-wrap">{note.note}</p>
                      <p className="text-xs text-vocari-text-muted mt-2">
                        {new Date(note.created_at).toLocaleString("es-CL")}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tareas de seguimiento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <input
                  value={taskTitle}
                  onChange={(event) => setTaskTitle(event.target.value)}
                  placeholder="Ej: Agendar reunión con apoderado"
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <Button
                  size="sm"
                  onClick={() => createTaskMutation.mutate()}
                  disabled={!taskTitle.trim()}
                  loading={createTaskMutation.isPending}
                >
                  Crear
                </Button>
              </div>

              <div className="space-y-2 max-h-72 overflow-auto pr-1">
                {tasks.length === 0 ? (
                  <p className="text-sm text-vocari-text-muted">Aún no hay tareas creadas.</p>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className="rounded-md border border-gray-200 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-vocari-text">{task.title}</p>
                          <p className="text-xs text-vocari-text-muted mt-1">
                            Estado: {taskStatusLabel[task.status]}
                          </p>
                        </div>
                        {task.status === "completada" ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <Circle className="w-4 h-4 text-vocari-text-muted" />
                        )}
                      </div>
                      <div className="mt-2 flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: "en_progreso" })}
                          disabled={task.status === "en_progreso"}
                        >
                          En progreso
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: "completada" })}
                          disabled={task.status === "completada"}
                        >
                          Completar
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #student-report-print,
          #student-report-print * {
            visibility: visible !important;
          }
          #student-report-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            padding: 16px;
          }
        }
      `}</style>

      {printing && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 print:hidden">
          <div className="bg-white rounded-lg px-4 py-3 text-sm text-vocari-text shadow">
            Preparando informe para PDF...
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
