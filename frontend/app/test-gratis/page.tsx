"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";

/**
 * Temporary lightweight page while the full test-gratis flow is restored.
 * Primary CTA to paid report checkout remains available.
 */
export default function TestGratisPage() {
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get("email")?.trim() || "");
    setNombre(params.get("nombre")?.trim() || "");
  }, []);

  const goToInformes = () => {
    const params = new URLSearchParams();
    if (email.trim()) params.set("email", email.trim());
    if (nombre.trim()) params.set("nombre", nombre.trim());
    const qs = params.toString();
    window.location.href = `https://vocari.cl/informes${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-aura-primary/5 to-aura-violet/5">
      <div className="max-w-lg w-full text-center space-y-6 rounded-2xl border border-aura-primary/20 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-aura-ink">Test vocacional</h1>
        <p className="text-aura-muted text-sm">
          Estamos restaurando el flujo completo del test. Mientras tanto puedes obtener el
          informe profesional revisado por orientadores.
        </p>
        <div className="grid gap-3 text-left">
          <label className="block text-sm">
            <span className="text-aura-muted text-xs">Nombre</span>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Tu nombre"
            />
          </label>
          <label className="block text-sm">
            <span className="text-aura-muted text-xs">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="tu@email.com"
            />
          </label>
        </div>
        <Button variant="primary" className="w-full" onClick={goToInformes}>
          Obtener informe profesional
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
        <p className="text-xs text-aura-muted">
          El test RIASEC completo vuelve en el siguiente deploy. Pago seguro con Flow.cl en{" "}
          vocari.cl/informes.
        </p>
      </div>
    </div>
  );
}
