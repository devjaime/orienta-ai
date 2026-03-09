"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";

export default function MonitoreoPage() {
  return (
    <RoleGuard allowedRoles={["super_admin"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-vocari-text">
            Monitoreo
          </h1>
          <p className="text-vocari-text-muted">
            Monitoreo y salud del sistema
          </p>
        </div>
        <p className="text-vocari-text-muted">
          Pagina en construccion. Aqui podras ver metricas de salud del sistema.
        </p>
      </div>
    </RoleGuard>
  );
}
