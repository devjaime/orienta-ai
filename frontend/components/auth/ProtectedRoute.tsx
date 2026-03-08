"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Spinner } from "@/components/ui/Spinner";

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Wrapper que redirige a login si el usuario no esta autenticado.
 * Se usa dentro del dashboard layout.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
