"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";

export default function InstitucionesPage() {
  return (
    <RoleGuard allowedRoles={["super_admin"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-vocari-text">
            Instituciones
          </h1>
          <p className="text-vocari-text-muted">
            Gestion de instituciones en la plataforma
          </p>
        </div>
        <p className="text-vocari-text-muted">
          Pagina en construccion. Aqui podras ver y gestionar todas las instituciones.
        </p>
      </div>
    </RoleGuard>
  );
}
