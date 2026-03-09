"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Download,
  RefreshCw,
} from "lucide-react";
import { useState, useRef } from "react";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/api";

interface PreviewRow {
  row_number: number;
  email: string;
  full_name: string;
  grade: string | null;
  section: string | null;
  enrollment_year: number | null;
  valid: boolean;
  errors: string[];
}

interface PreviewResponse {
  valid_rows: number;
  invalid_rows: number;
  rows: PreviewRow[];
}

interface ImportResult {
  imported: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

function CsvImport() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreview(null);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const data = await api.post<PreviewResponse>(
        "/api/v1/students/import/preview",
        formData,
      );
      setPreview(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Error al procesar el archivo");
      }
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const data = await api.post<ImportResult>(
        "/api/v1/students/import",
        formData,
      );
      setResult(data);
      setPreview(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Error al importar estudiantes");
      }
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Estudiantes desde CSV
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
            <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-vocari-text mb-2">
              Selecciona un archivo CSV con los datos de los estudiantes
            </p>
            <p className="text-sm text-vocari-text-muted mb-4">
              Formato requerido: email, full_name, grade, section, enrollment_year
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-file"
            />
            <label htmlFor="csv-file">
              <Button as="span" variant="outline" className="cursor-pointer">
                Seleccionar archivo
              </Button>
            </label>
          </div>

          {file && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                <span className="font-medium text-vocari-text">{file.name}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {preview && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant="success">
                  {preview.valid_rows} filas validas
                </Badge>
                {preview.invalid_rows > 0 && (
                  <Badge variant="error">
                    {preview.invalid_rows} filas con errores
                  </Badge>
                )}
              </div>

              {preview.invalid_rows > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 font-medium mb-2">
                    Algunas filas tienen errores que deben corregirse:
                  </p>
                  <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                    {preview.rows
                      .filter((r) => !r.valid)
                      .slice(0, 5)
                      .map((r) => (
                        <li key={r.row_number}>
                          Fila {r.row_number}: {r.errors.join(", ")}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Seccion</TableHead>
                      <TableHead>Ano</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.rows.slice(0, 10).map((row) => (
                      <TableRow key={row.row_number}>
                        <TableCell>{row.row_number}</TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>{row.full_name}</TableCell>
                        <TableCell>{row.grade || "-"}</TableCell>
                        <TableCell>{row.section || "-"}</TableCell>
                        <TableCell>{row.enrollment_year || "-"}</TableCell>
                        <TableCell>
                          {row.valid ? (
                            <Badge variant="success" dot>
                              Valido
                            </Badge>
                          ) : (
                            <Badge variant="error" dot>
                              {row.errors[0]}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {preview.rows.length > 10 && (
                <p className="text-sm text-vocari-text-muted text-center">
                  Mostrando 10 de {preview.rows.length} filas
                </p>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleReset}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={preview.valid_rows === 0 || importing}
                  loading={importing}
                >
                  {importing ? "Importando..." : `Importar ${preview.valid_rows} estudiantes`}
                </Button>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-700">
                  Se importaron {result.imported} estudiantes correctamente
                </span>
              </div>

              {result.failed > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700 font-medium mb-2">
                    {result.failed} estudiantes no pudieron ser importados:
                  </p>
                  <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                    {result.errors.slice(0, 5).map((e) => (
                      <li key={e.row}>
                        Fila {e.row}: {e.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button variant="outline" onClick={handleReset}>
                Importar mas estudiantes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Formato del archivo CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-vocari-text-muted mb-4">
            El archivo debe contener las siguientes columnas:
          </p>
          <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
            <p>email,full_name,grade,section,enrollment_year</p>
            <p className="mt-2 text-vocari-text-muted">
              estudiante1@colegio.cl,Juan Perez,4,A,2024
            </p>
            <p className="text-vocari-text-muted">
              estudiante2@colegio.cl,Maria Garcia,3,B,2024
            </p>
          </div>
          <Button variant="outline" className="mt-4">
            <Download className="h-4 w-4 mr-2" />
            Descargar plantilla
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ImportarPage() {
  return (
    <RoleGuard allowedRoles={["admin_colegio"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-vocari-text">
            Importar Estudiantes
          </h1>
          <p className="text-vocari-text-muted">
            Carga masiva de estudiantes desde un archivo CSV
          </p>
        </div>

        <CsvImport />
      </div>
    </RoleGuard>
  );
}
