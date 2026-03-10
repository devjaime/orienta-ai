"use client";

import { type ReactNode } from "react";
import { useAuthStore, type AuthState } from "@/lib/stores/auth-store";
import type { UserRole } from "@/lib/types/user";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Muestra el contenido solo si el usuario tiene uno de los roles permitidos.
 * super_admin y admin siempre tienen acceso.
 */
export function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const user = useAuthStore((s: AuthState) => s.user);

  if (!user) return null;

  // super_admin and admin always have access
  const hasAccess =
    user.role === "super_admin" ||
    user.role === "admin" ||
    allowedRoles.includes(user.role);

  if (!hasAccess) {
    return (
      fallback ?? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h2 className="text-xl font-semibold text-vocari-text mb-2">
            Acceso denegado
          </h2>
          <p className="text-vocari-text-muted">
            No tienes permisos para acceder a esta seccion.
          </p>
        </div>
      )
    );
  }

  return <>{children}</>;
}
