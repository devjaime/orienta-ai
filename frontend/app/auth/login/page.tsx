import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-vocari-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-vocari-primary mb-2">
            Vocari
          </h1>
          <p className="text-vocari-text-muted">
            Inicia sesion para continuar
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <GoogleSignInButton />
          <p className="mt-4 text-xs text-center text-vocari-text-muted">
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
