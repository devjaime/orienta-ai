"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Calendar,
  ClipboardList,
  Users,
  Gamepad2,
  GraduationCap,
  UserCircle,
  FileText,
  Settings,
  BarChart3,
  Upload,
  Building2,
  Shield,
  Activity,
  Heart,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/validation";
import { useAuthStore, type AuthState } from "@/lib/stores/auth-store";
import { useUIStore } from "@/lib/stores/ui-store";
import type { UserRole } from "@/lib/types/user";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Navegacion por rol */
const NAV_BY_ROLE: Record<string, NavItem[]> = {
  estudiante: [
    { label: "Inicio", href: "/estudiante", icon: Home },
    { label: "Sesiones", href: "/estudiante/sesiones", icon: Calendar },
    { label: "Tests", href: "/estudiante/tests", icon: ClipboardList },
    { label: "Juegos", href: "/estudiante/juegos", icon: Gamepad2 },
    { label: "Carreras", href: "/estudiante/carreras", icon: GraduationCap },
    { label: "Mi Perfil", href: "/estudiante/perfil", icon: UserCircle },
    { label: "Reportes", href: "/estudiante/reportes", icon: FileText },
  ],
  orientador: [
    { label: "Inicio", href: "/orientador", icon: Home },
    { label: "Agenda", href: "/orientador/agenda", icon: Calendar },
    { label: "Sesiones", href: "/orientador/sesiones", icon: ClipboardList },
    { label: "Estudiantes", href: "/orientador/estudiantes", icon: Users },
  ],
  apoderado: [
    { label: "Inicio", href: "/apoderado", icon: Home },
    { label: "Mis Hijos", href: "/apoderado/hijos", icon: Heart },
    { label: "Consentimiento", href: "/apoderado/consentimiento", icon: Shield },
  ],
  admin_colegio: [
    { label: "Inicio", href: "/admin", icon: Home },
    { label: "Estudiantes", href: "/admin/estudiantes", icon: Users },
    { label: "Orientadores", href: "/admin/orientadores", icon: UserCircle },
    { label: "Metricas", href: "/admin/metricas", icon: BarChart3 },
    { label: "Importar", href: "/admin/importar", icon: Upload },
    { label: "Configuracion", href: "/admin/configuracion", icon: Settings },
  ],
  super_admin: [
    { label: "Inicio", href: "/super-admin", icon: Home },
    { label: "Instituciones", href: "/super-admin/instituciones", icon: Building2 },
    { label: "Usuarios", href: "/super-admin/usuarios", icon: Users },
    { label: "Monitoreo", href: "/super-admin/monitoreo", icon: Activity },
  ],
};

function getNavItems(role: UserRole | undefined): NavItem[] {
  if (!role) return [];
  if (role === "admin") return NAV_BY_ROLE.super_admin;
  return NAV_BY_ROLE[role] || [];
}

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s: AuthState) => s.user);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);

  const navItems = getNavItems(user?.role);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-64 bg-white border-r border-gray-200 transition-transform duration-200",
          "lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <nav className="flex flex-col gap-1 p-3">
          {user && (
            <div className="px-3 py-2 mb-2">
              <p className="text-xs uppercase tracking-wider text-vocari-text-muted font-semibold">
                {user.role === "admin_colegio"
                  ? "Admin Colegio"
                  : user.role === "super_admin"
                    ? "Super Admin"
                    : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </p>
            </div>
          )}

          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(item.href + "/"));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-vocari-primary/10 text-vocari-primary"
                    : "text-vocari-text-muted hover:bg-gray-50 hover:text-vocari-text",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
