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

export default function OrientadorStudentProfilePage() {
  const params = useParams<{ id: string }>();
  const studentId = params?.id;
  const queryClient = useQueryClient();

  const [noteText, setNoteText] = useState("");
  const [taskTitle, setTaskTitle] = useState("");

  const detailQueryKey = useMemo(() => ["orientador", "student-detail", studentId], [studentId]);

  const { data, isLoading } = useQuery({
    queryKey: detailQueryKey,
    enabled: Boolean(studentId),
    queryFn: () => api.get<StudentDetailResponse>(`/api/v1/orientador/students/${studentId}`),
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

  const { student, notes, tasks } = data;

  return (
    <RoleGuard allowedRoles={["orientador", "admin_colegio"]}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/orientador/estudiantes" className="text-vocari-primary hover:underline text-sm inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>
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
    </RoleGuard>
  );
}

