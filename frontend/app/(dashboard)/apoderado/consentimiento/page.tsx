"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
} from "@/components/ui";
import {
  Shield,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";

const CONSENT_ITEMS = [
  {
    id: "data_treatment",
    title: "Tratamiento de datos personales",
    description:
      "Autorizo el tratamiento de los datos personales de mi hijo/a menores de edad, de acuerdo a la Ley 19.628 de Proteccion de la Vida Privada.",
    required: true,
  },
  {
    id: "ai_analysis",
    title: "Analisis con Inteligencia Artificial",
    description:
      "Autorizo que el sistema utilize IA para generar analisis y recomendaciones vocacionales basadas en las sesiones y tests realizados.",
    required: true,
  },
  {
    id: "session_recordings",
    title: "Grabacion de sesiones",
    description:
      "Autorizo la grabacion de sesiones de orientacion vocacional con fines de revision y mejora del servicio.",
    required: false,
  },
  {
    id: "data_sharing",
    title: "Comparticion de datos con el colegio",
    description:
      "Autorizo que los resultados de tests y progreso vocacional sean compartidos con los orientadores del establecimiento.",
    required: true,
  },
];

function ConsentItem({
  item,
  granted,
  onToggle,
}: {
  item: (typeof CONSENT_ITEMS)[0];
  granted: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border border-gray-100">
      <button
        onClick={onToggle}
        className={`mt-1 flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
          granted
            ? "bg-vocari-primary border-vocari-primary"
            : "border-gray-300 hover:border-vocari-primary"
        }`}
      >
        {granted && <CheckCircle className="h-4 w-4 text-white" />}
      </button>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-vocari-text">{item.title}</h3>
          {item.required && (
            <Badge variant="error" dot>
              Obligatorio
            </Badge>
          )}
        </div>
        <p className="text-sm text-vocari-text-muted mt-1">{item.description}</p>
      </div>
    </div>
  );
}

export default function ConsentimientoPage() {
  const [consents, setConsents] = useState<Record<string, boolean>>({
    data_treatment: false,
    ai_analysis: false,
    session_recordings: false,
    data_sharing: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const requiredConsents = ["data_treatment", "ai_analysis", "data_sharing"];
  const allRequiredGranted = requiredConsents.every((id) => consents[id]);

  const handleToggle = (id: string) => {
    setConsents((prev) => ({ ...prev, [id]: !prev[id] }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!allRequiredGranted) return;

    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["apoderado"]}>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-vocari-text">
            Consentimiento Parental
          </h1>
          <p className="text-vocari-text-muted">
            Gestiona los permisos para el tratamiento de datos de tu hijo/a
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Permisos de tratamiento de datos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">
                    Informacion importante
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Segun la ley chilena 19.628, los padres o apoderados deben
                    otorgar consentimiento para el tratamiento de datos de
                    menores de edad. Los campos marcados como &quot;Obligatorio&quot;
                    son necesarios para el funcionamiento del servicio.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {CONSENT_ITEMS.map((item) => (
                <ConsentItem
                  key={item.id}
                  item={item}
                  granted={consents[item.id]}
                  onToggle={() => handleToggle(item.id)}
                />
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              {saved ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    Consentimientos guardados
                  </span>
                </div>
              ) : (
                <div />
              )}

              <Button
                onClick={handleSave}
                disabled={!allRequiredGranted || saving}
                loading={saving}
              >
                {saving ? "Guardando..." : "Guardar consentimiento"}
              </Button>
            </div>

            {!allRequiredGranted && (
              <p className="text-sm text-error text-center">
                Debes aceptar todos los consentimientos obligatorios para
                continuar
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Politica de Privacidad</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-vocari-text-muted mb-4">
              Puedes revisar nuestra politica de privacidad completa para
              entender como protegemos los datos de tus hijos.
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-2 text-sm text-vocari-accent hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Ver politica de privacidad completa
            </a>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
