"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { ReconversionReviewPanel } from "@/components/reconversion/ReconversionReviewPanel";

export default function OrientadorReconversionPage() {
  return (
    <RoleGuard allowedRoles={["orientador", "admin_colegio", "super_admin"]}>
      <ReconversionReviewPanel
        title="Revision de informes de reconversion"
        description="Revisa informes adultos ya generados, detecta patrones y abre cada informe para seguimiento o asesoria posterior."
      />
    </RoleGuard>
  );
}
