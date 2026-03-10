"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore, type AuthState } from "@/lib/stores/auth-store";
import { ROLE_HOME_ROUTES } from "@/lib/utils/constants";
import { Spinner } from "@/components/ui/Spinner";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handleAuthCallback = useAuthStore((s: AuthState) => s.handleAuthCallback);
  const user = useAuthStore((s: AuthState) => s.user);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError(errorParam);
      return;
    }

    if (!accessToken || !refreshToken) {
      setError("Faltan tokens de autenticacion");
      return;
    }

    handleAuthCallback(accessToken, refreshToken);
  }, [searchParams, handleAuthCallback]);

  // Once user is loaded, redirect to role home
  useEffect(() => {
    if (user) {
      const home = ROLE_HOME_ROUTES[user.role] || "/estudiante";
      router.replace(home);
    }
  }, [user, router]);

  if (error) {
    return (
      <main className="min-h-screen bg-vocari-bg flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-error mb-2">
            Error de autenticacion
          </h1>
          <p className="text-vocari-text-muted mb-4">{error}</p>
          <a
            href="/auth/login"
            className="inline-flex px-4 py-2 bg-vocari-primary text-white rounded-md hover:opacity-90"
          >
            Reintentar
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-vocari-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-vocari-text-muted">Autenticando...</p>
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-vocari-bg flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-vocari-text-muted">Cargando...</p>
          </div>
        </main>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
