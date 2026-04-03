"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useAuthStore, type AuthState } from "@/lib/stores/auth-store";
import { api, ApiError } from "@/lib/api";
import { ROLE_HOME_ROUTES } from "@/lib/utils/constants";
import type { UserRole } from "@/lib/types/user";

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    institution_id: string | null;
    is_active: boolean;
    last_login: string | null;
  };
}

const PERFILES: Array<{
  value: "orientador" | "admin_colegio";
  label: string;
}> = [
  { value: "orientador", label: "Orientador" },
  { value: "admin_colegio", label: "Administrador colegio" },
];

export default function LoginPage() {
  const router = useRouter();
  const handleAuthCallback = useAuthStore(
    (s: AuthState) => s.handleAuthCallback,
  );
  const [username, setUsername] = useState("devjaime");
  const [password, setPassword] = useState("CasaPropia08..");
  const [role, setRole] = useState<"orientador" | "admin_colegio">(
    "admin_colegio",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleMvpLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post<LoginResponse>("/api/v1/auth/mvp-login", {
        username,
        password,
        role,
      });

      await handleAuthCallback(response.access_token, response.refresh_token);
      router.replace(ROLE_HOME_ROUTES[role] || "/");
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else if (requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError("No pudimos iniciar sesion con el acceso MVP.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-vocari-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-vocari-primary mb-2">
            Vocari
          </h1>
          <p className="text-vocari-text-muted">Inicia sesion para continuar</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-sm font-semibold text-blue-950">
              Acceso interno MVP
            </p>
            <p className="mt-1 text-sm text-blue-900/80">
              Usa el mismo usuario y clave para entrar como orientador o como
              administrador del colegio.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleMvpLogin}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Usuario
              </span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-vocari-primary"
                placeholder="devjaime"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Clave
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-vocari-primary"
                placeholder="CasaPropia08.."
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Perfil
              </span>
              <select
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as "orientador" | "admin_colegio")
                }
                className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-vocari-primary"
              >
                {PERFILES.map((perfil) => (
                  <option key={perfil.value} value={perfil.value}>
                    {perfil.label}
                  </option>
                ))}
              </select>
            </label>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-vocari-primary px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Ingresando..." : "Entrar con acceso MVP"}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-vocari-text-muted">o</span>
            </div>
          </div>

          <GoogleSignInButton />

          <p className="text-xs text-center text-vocari-text-muted">
            Al iniciar sesion, aceptas nuestros{" "}
            <a href="/terminos" className="underline">
              terminos de servicio
            </a>{" "}
            y{" "}
            <a href="/privacidad" className="underline">
              politica de privacidad
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
