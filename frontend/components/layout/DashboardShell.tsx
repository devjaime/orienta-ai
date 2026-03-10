"use client";

import { useEffect, type ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";
import { ToastContainer } from "@/components/ui/Toast";
import { useAuthStore, type AuthState } from "@/lib/stores/auth-store";
import { Spinner } from "@/components/ui/Spinner";

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const isLoading = useAuthStore((s: AuthState) => s.isLoading);
  const isAuthenticated = useAuthStore((s: AuthState) => s.isAuthenticated);
  const initialize = useAuthStore((s: AuthState) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-vocari-bg">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-vocari-text-muted">Cargando...</p>
        </div>
      </div>
    );
  }

  // Not authenticated — redirect handled by middleware or layout
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-vocari-bg">
        <div className="text-center">
          <p className="text-vocari-text-muted mb-4">
            Debes iniciar sesion para acceder
          </p>
          <a
            href="/auth/login"
            className="inline-flex items-center px-4 py-2 bg-vocari-primary text-white rounded-md hover:opacity-90"
          >
            Iniciar sesion
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-vocari-bg">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
      <Footer />
      <ToastContainer />
    </div>
  );
}
