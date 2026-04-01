"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { ReconversionReviewPanel } from "@/components/reconversion/ReconversionReviewPanel";

export default function AdminReconversionPage() {
  return (
    <RoleGuard allowedRoles={["admin_colegio", "super_admin"]}>
      <ReconversionReviewPanel
        title="Revision interna de reconversion"
        description="Consulta informes generados desde el flujo adulto de reconversion y abre cada informe publico para validacion comercial o academica."
      />
    </RoleGuard>
  );
}
