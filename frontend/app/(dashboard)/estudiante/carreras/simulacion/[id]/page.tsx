"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Skeleton,
} from "@/components/ui";
import {
  GraduationCap,
  TrendingUp,
  Calendar,
  ArrowLeft,
  DollarSign,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import type { CareerSimulation } from "@/lib/types";

function SalaryChart({ data }: { data: Array<{ year: number; salary: number }> }) {
  const maxSalary = Math.max(...data.map((d) => d.salary));
  const minSalary = Math.min(...data.map((d) => d.salary));

  return (
    <div className="space-y-3">
      {data.slice(0, 10).map((item) => {
        const width = ((item.salary - minSalary) / (maxSalary - minSalary)) * 100;
        return (
          <div key={item.year} className="flex items-center gap-3">
            <span className="text-sm text-vocari-text-muted w-12">{item.year}</span>
            <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${width}%` }}
              />
            </div>
            <span className="text-sm font-medium text-vocari-text w-24 text-right">
              ${item.salary.toLocaleString("es-CL")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function MilestonesTimeline({
  milestones,
}: {
  milestones: Array<{ year: number; title: string; description: string }>;
}) {
  return (
    <div className="space-y-4">
      {milestones.map((milestone, index) => (
        <div key={milestone.year} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-vocari-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-vocari-primary">
                {index + 1}
              </span>
            </div>
            {index < milestones.length - 1 && (
              <div className="w-0.5 h-16 bg-gray-200" />
            )}
          </div>
          <div className="flex-1 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-vocari-primary">
                {milestone.year}
              </span>
              <h4 className="font-medium text-vocari-text">{milestone.title}</h4>
            </div>
            <p className="text-sm text-vocari-text-muted">{milestone.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SimulationContent() {
  const params = useParams();
  const careerId = params.id as string;

  const { data: simulation, isLoading } = useQuery({
    queryKey: ["career-simulation", careerId],
    queryFn: async () => {
      const response = await api.post<CareerSimulation>("/api/v1/careers/simulate", {
        career_id: careerId,
      });
      return response;
    },
    staleTime: 300_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="rect" height={200} />
        <Skeleton variant="rect" height={300} />
      </div>
    );
  }

  if (!simulation) {
    return (
      <div className="text-center py-12">
        <p className="text-vocari-text-muted">
          No se pudo generar la simulacion
        </p>
      </div>
    );
  }

  const { simulation_data, ai_narrative } = simulation;
  const { salary_projection, milestones, employability, saturation_index } = simulation_data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/estudiante/carreras"
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5 text-vocari-text-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-vocari-text">
            {simulation_data.career_name}
          </h1>
          <p className="text-vocari-text-muted">
            Simulacion de carrera vocacional
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2 bg-green-100 rounded-md">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-vocari-text">
                {Math.round(employability * 100)}%
              </p>
              <p className="text-xs text-vocari-text-muted">Empleabilidad</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2 bg-yellow-100 rounded-md">
              <Target className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-vocari-text">
                {Math.round(saturation_index * 100)}%
              </p>
              <p className="text-xs text-vocari-text-muted">Saturacion</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2 bg-blue-100 rounded-md">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-vocari-text">
                ${salary_projection[0]?.salary.toLocaleString("es-CL") || "N/A"}
              </p>
              <p className="text-xs text-vocari-text-muted">Salario inicial</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Proyeccion Salarial
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SalaryChart data={salary_projection} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Linea de Tiempo Profesional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MilestonesTimeline milestones={milestones} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Analisis Narrativo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            {ai_narrative.split("\n").map((paragraph, index) => (
              <p key={index} className="mb-2 text-vocari-text">
                {paragraph}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CareerSimulationPage() {
  return (
    <RoleGuard allowedRoles={["estudiante"]}>
      <SimulationContent />
    </RoleGuard>
  );
}
