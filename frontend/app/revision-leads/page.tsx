"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatDateTimeCL } from "@/lib/utils/dates";

interface LeadItem {
  id: string;
  nombre: string;
  email: string;
  source: string;
  interes: string;
  holland_code: string | null;
  test_answers: Record<string, number>;
  survey_response: Record<string, unknown>;
  clarity_score: number | null;
  ai_report_text: string | null;
  ai_report_generated_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string | null;
  updated_at: string | null;
}

export default function RevisionLeadsPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [authenticated, setAuthenticated] = useState(false);

  const formatDate = (value: string | null) => formatDateTimeCL(value);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const token = btoa(`${username}:${password}`);
      const response = await fetch("/api/v1/leads/review/all", {
        headers: {
          Authorization: `Basic ${token}`,
        },
      });

      if (!response.ok) {
        setError("Credenciales inválidas.");
        setAuthenticated(false);
        setLeads([]);
        return;
      }

      const data = (await response.json()) as { items: LeadItem[] };
      setLeads(data.items || []);
      setAuthenticated(true);
    } catch (requestError) {
      console.error("Error cargando leads:", requestError);
      setError("No se pudo cargar la información.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-aura-surface">
      <main className="max-w-6xl mx-auto px-4 py-10 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Revisión de Leads (MVP)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-aura-muted">
              Ingreso con usuario y contraseña fija para revisar nombre, correo, test y encuesta final.
            </p>

            <div className="grid md:grid-cols-3 gap-3">
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Usuario"
                className="rounded-md border border-aura-primary/20 px-3 py-2 text-sm"
              />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Contraseña"
                className="rounded-md border border-aura-primary/20 px-3 py-2 text-sm"
              />
              <Button onClick={handleLogin} loading={loading}>
                Ingresar
              </Button>
            </div>

            {error && <p className="text-sm text-error">{error}</p>}
          </CardContent>
        </Card>

        {authenticated && (
          <Card>
            <CardHeader>
              <CardTitle>Total registros: {leads.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto border border-aura-primary/10 rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-aura-surface-low">
                    <tr>
                      <th className="text-left p-3">Fecha</th>
                      <th className="text-left p-3">Nombre</th>
                      <th className="text-left p-3">Email</th>
                      <th className="text-left p-3">Código</th>
                      <th className="text-left p-3">Fuente</th>
                      <th className="text-left p-3">Test (JSON)</th>
                      <th className="text-left p-3">Encuesta (JSON)</th>
                      <th className="text-left p-3">Informe IA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.id} className="border-t border-aura-primary/10 align-top">
                        <td className="p-3 whitespace-nowrap">{formatDate(lead.created_at)}</td>
                        <td className="p-3">{lead.nombre}</td>
                        <td className="p-3">{lead.email}</td>
                        <td className="p-3">{lead.holland_code || "-"}</td>
                        <td className="p-3">{lead.source}</td>
                        <td className="p-3">
                          <pre className="text-xs bg-aura-surface-low p-2 rounded border border-aura-primary/10 max-w-[260px] overflow-auto">
                            {JSON.stringify(lead.test_answers || {}, null, 2)}
                          </pre>
                        </td>
                        <td className="p-3">
                          <pre className="text-xs bg-aura-surface-low p-2 rounded border border-aura-primary/10 max-w-[260px] overflow-auto">
                            {JSON.stringify(lead.survey_response || {}, null, 2)}
                          </pre>
                        </td>
                        <td className="p-3">
                          {(lead.ai_report_text || lead.metadata?.ai_report_text) ? (
                            <div className="space-y-2 max-w-[360px]">
                              <p className="text-xs text-aura-muted">
                                Generado: {typeof (lead.ai_report_generated_at || lead.metadata?.ai_report_generated_at) === "string"
                                  ? formatDate(String(lead.ai_report_generated_at || lead.metadata?.ai_report_generated_at))
                                  : "N/D"}
                              </p>
                              <pre className="text-xs bg-aura-surface-low p-2 rounded border border-aura-primary/10 max-h-48 overflow-auto whitespace-pre-wrap">
                                {String(lead.ai_report_text || lead.metadata?.ai_report_text)}
                              </pre>
                            </div>
                          ) : (
                            <span className="text-xs text-aura-muted/50">Sin informe IA</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
