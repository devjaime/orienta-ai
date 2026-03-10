"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Settings, Building2, Users, Bell } from "lucide-react";
import { useAuthStore, type AuthState } from "@/lib/stores/auth-store";

export default function AdminConfiguracionPage() {
  const user = useAuthStore((s: AuthState) => s.user);

  return (
    <RoleGuard allowedRoles={["admin_colegio"]}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-vocari-text">Configuración</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-vocari-primary" />
                Institución
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-vocari-text-muted">Administrador</p>
                <p className="text-sm font-medium text-vocari-text">{user?.full_name ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-vocari-text-muted">Correo</p>
                <p className="text-sm font-medium text-vocari-text">{user?.email ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-vocari-text-muted">ID Institución</p>
                <p className="text-sm font-mono text-vocari-text-muted">
                  {user?.institution_id ?? "Sin institución"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-vocari-primary" />
                Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-vocari-text-muted">
                La configuración de notificaciones estará disponible próximamente.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-vocari-primary" />
                Acceso de estudiantes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-vocari-text-muted">
                Gestiona el acceso y los permisos de los estudiantes de tu institución.
              </p>
              <a
                href="/admin/estudiantes"
                className="inline-flex items-center text-sm text-vocari-primary hover:underline"
              >
                Ver estudiantes →
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-vocari-primary" />
                Configuración avanzada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-vocari-text-muted">
                Para cambios avanzados en la configuración de tu institución,
                contacta al equipo de soporte de Vocari.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}
