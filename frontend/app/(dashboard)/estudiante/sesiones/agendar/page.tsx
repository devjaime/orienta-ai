"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Select,
  Skeleton,
} from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { DIAS_SEMANA } from "@/lib/utils/constants";
import type {
  AvailabilityBlock,
  AvailabilityListResponse,
  Orientador,
} from "@/lib/types/session";

export default function AgendarSesionPage() {
  const router = useRouter();
  const [selectedOrientador, setSelectedOrientador] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");

  // Fetch available orientadores
  const { data: orientadores, isLoading: loadingOrientadores } = useQuery({
    queryKey: ["orientadores"],
    queryFn: () => api.get<Orientador[]>("/api/v1/sessions/orientadores"),
  });

  // Fetch availability for selected orientador
  const { data: availabilityData, isLoading: loadingAvailability } = useQuery({
    queryKey: ["availability", selectedOrientador],
    queryFn: () =>
      api.get<AvailabilityListResponse>(
        `/api/v1/sessions/availability/${selectedOrientador}`,
      ),
    enabled: !!selectedOrientador,
  });
  const availability = availabilityData?.items ?? [];

  // Create session mutation
  const createSession = useMutation({
    mutationFn: (data: { orientador_id: string; preferred_datetime: string }) =>
      api.post("/api/v1/sessions", data),
    onSuccess: () => {
      toast("success", "Sesion agendada exitosamente");
      router.push("/estudiante/sesiones");
    },
    onError: (err: Error) => {
      toast("error", err.message || "Error al agendar sesion");
    },
  });

  const handleSchedule = () => {
    if (!selectedOrientador || !selectedSlot) return;
    createSession.mutate({
      orientador_id: selectedOrientador,
      preferred_datetime: selectedSlot,
    });
  };

  return (
    <RoleGuard allowedRoles={["estudiante"]}>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-vocari-text">
          Agendar sesion
        </h1>

        {/* Step 1: Select orientador */}
        <Card>
          <CardHeader>
            <CardTitle>1. Selecciona orientador</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingOrientadores ? (
              <Skeleton variant="rect" height={40} />
            ) : (
              <Select
                options={
                  orientadores?.map((o) => ({
                    value: o.id,
                    label: o.name,
                  })) ?? []
                }
                placeholder="Selecciona un orientador"
                value={selectedOrientador}
                onChange={(e) => {
                  setSelectedOrientador(e.target.value);
                  setSelectedSlot("");
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Step 2: Select time slot */}
        {selectedOrientador && (
          <Card>
            <CardHeader>
              <CardTitle>2. Selecciona horario</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAvailability ? (
                <div className="space-y-2">
                  <Skeleton variant="rect" height={40} />
                  <Skeleton variant="rect" height={40} />
                </div>
              ) : !availability || availability.length === 0 ? (
                <p className="text-vocari-text-muted text-sm py-4">
                  Este orientador no tiene horarios disponibles.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availability
                    .filter((block) => block.is_active)
                    .map((block) => {
                      const key = `${block.day_of_week}-${block.start_time}`;
                      const isSelected = selectedSlot === key;
                      return (
                        <button
                          key={block.id}
                          onClick={() => setSelectedSlot(key)}
                          className={`p-3 text-left rounded-md border transition-colors ${
                            isSelected
                              ? "border-vocari-accent bg-vocari-accent/10"
                              : "border-gray-200 hover:border-vocari-accent"
                          }`}
                        >
                          <p className="text-sm font-medium text-vocari-text">
                            {DIAS_SEMANA[block.day_of_week]}
                          </p>
                          <p className="text-xs text-vocari-text-muted">
                            {block.start_time} - {block.end_time}
                          </p>
                        </button>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Confirm */}
        {selectedSlot && (
          <div className="flex justify-end">
            <Button
              onClick={handleSchedule}
              loading={createSession.isPending}
              size="lg"
            >
              Confirmar sesion
            </Button>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
