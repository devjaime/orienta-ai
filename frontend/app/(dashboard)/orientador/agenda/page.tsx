"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { Card, CardHeader, CardTitle, CardContent, Badge, Skeleton } from "@/components/ui";
import { Clock, Plus, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DIAS_KEY = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

interface AvailabilityBlock {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

interface AvailabilityResponse {
  blocks: AvailabilityBlock[];
}

export default function OrientadorAgendaPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["availability", "me"],
    queryFn: () => api.get<AvailabilityResponse>("/api/v1/sessions/availability/me"),
  });

  const deleteMutation = useMutation({
    mutationFn: (blockId: string) =>
      api.delete(`/api/v1/sessions/availability/${blockId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["availability"] }),
  });

  const blocks = data?.blocks ?? [];

  const byDay = DIAS_KEY.reduce<Record<string, AvailabilityBlock[]>>((acc, day) => {
    acc[day] = blocks.filter((b) => b.day_of_week === day);
    return acc;
  }, {});

  return (
    <RoleGuard allowedRoles={["orientador", "admin_colegio"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-vocari-text">Mi Agenda de Disponibilidad</h1>
        </div>

        <p className="text-sm text-vocari-text-muted">
          Define los bloques horarios en que los estudiantes pueden agendarte sesiones.
        </p>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} variant="rect" height={80} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DIAS.map((dia, idx) => {
              const dayKey = DIAS_KEY[idx];
              const dayBlocks = byDay[dayKey] ?? [];

              return (
                <Card key={dayKey}>
                  <CardHeader>
                    <CardTitle className="text-sm">{dia}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {dayBlocks.length === 0 ? (
                      <p className="text-xs text-vocari-text-muted py-2">Sin bloques</p>
                    ) : (
                      dayBlocks.map((b) => (
                        <div
                          key={b.id}
                          className="flex items-center justify-between p-2 bg-vocari-primary/5 rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-vocari-primary" />
                            <span className="text-xs font-medium">
                              {b.start_time} – {b.end_time}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteMutation.mutate(b.id)}
                            className="p-1 hover:text-red-500 text-gray-400"
                            aria-label="Eliminar bloque"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {blocks.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-vocari-text-muted">
              No has configurado tu disponibilidad aún.
            </p>
            <p className="text-sm text-vocari-text-muted mt-1">
              Contacta al administrador para configurar tus horarios.
            </p>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
