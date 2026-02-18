/**
 * StudentImporter - Importación masiva de estudiantes
 * Para admin_colegio y super_admin
 */

import { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Copy,
  Printer,
  RefreshCw
} from 'lucide-react';
import {
  batchInviteStudents,
  parseStudentsCSV,
  generateActivationReport,
  inviteStudent
} from '../../lib/institutionService';

function StudentImporter({ institutionId, institutionName, onImportComplete }) {
  const [mode, setMode] = useState('upload'); // 'upload', 'manual', 'results'
  const [csvContent, setCsvContent] = useState('');
  const [parsedStudents, setParsedStudents] = useState([]);
  const [parseErrors, setParseErrors] = useState([]);
  const [importResults, setImportResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [manualForm, setManualForm] = useState({
    email: '',
    nombre: '',
    curso: '4 Medio',
    student_code: ''
  });

  const fileInputRef = useRef(null);

  // Manejar carga de archivo CSV
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setCsvContent(content);
      const { students, errors } = parseStudentsCSV(content);
      setParsedStudents(students);
      setParseErrors(errors);
    };
    reader.readAsText(file);
  };

  // Importar estudiantes
  const handleImport = async () => {
    if (parsedStudents.length === 0) return;

    setLoading(true);
    try {
      const results = await batchInviteStudents(institutionId, parsedStudents);
      setImportResults(results);
      setMode('results');
      if (onImportComplete) onImportComplete();
    } catch (error) {
      console.error('Error importing students:', error);
      alert('Error al importar estudiantes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Agregar estudiante manual
  const handleAddManual = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await inviteStudent(institutionId, manualForm);
      setImportResults([{
        email: manualForm.email,
        nombre: manualForm.nombre,
        activation_code: result.activation_code,
        status: 'success'
      }]);
      setMode('results');
      setManualForm({ email: '', nombre: '', curso: '4 Medio', student_code: '' });
      if (onImportComplete) onImportComplete();
    } catch (error) {
      console.error('Error adding student:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Copiar códigos al portapapeles
  const handleCopyCodes = () => {
    const report = generateActivationReport(importResults);
    navigator.clipboard.writeText(report);
    alert('Códigos copiados al portapapeles');
  };

  // Imprimir códigos
  const handlePrint = () => {
    const report = generateActivationReport(importResults);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Códigos de Activación - ${institutionName}</title>
          <style>
            body { font-family: monospace; padding: 20px; }
            h1 { font-size: 18px; }
            .student { margin: 20px 0; padding: 10px; border: 1px dashed #ccc; }
            .code { font-size: 24px; font-weight: bold; letter-spacing: 2px; }
          </style>
        </head>
        <body>
          <h1>Códigos de Activación - ${institutionName}</h1>
          <p>Generado: ${new Date().toLocaleString('es-CL')}</p>
          <hr/>
          ${importResults.filter(r => r.status === 'success').map(r => `
            <div class="student">
              <p><strong>${r.nombre}</strong></p>
              <p>Email: ${r.email}</p>
              <p class="code">${r.activation_code}</p>
            </div>
          `).join('')}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Descargar CSV de resultados
  const handleDownloadResults = () => {
    const csv = 'nombre,email,codigo_activacion,estado,error\n' +
      importResults.map(r =>
        `"${r.nombre}","${r.email}","${r.activation_code || ''}","${r.status}","${r.error || ''}"`
      ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activaciones_${institutionName}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Reset
  const handleReset = () => {
    setMode('upload');
    setCsvContent('');
    setParsedStudents([]);
    setParseErrors([]);
    setImportResults([]);
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      {mode !== 'results' && (
        <div className="flex gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setMode('upload')}
            className={`px-4 py-2 rounded-t-lg transition-colors ${mode === 'upload'
              ? 'bg-vocari-primary text-white'
              : 'text-white/60 hover:text-white'
              }`}
          >
            <Upload size={16} className="inline mr-2" />
            Importar CSV
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`px-4 py-2 rounded-t-lg transition-colors ${mode === 'manual'
              ? 'bg-vocari-primary text-white'
              : 'text-white/60 hover:text-white'
              }`}
          >
            <Users size={16} className="inline mr-2" />
            Agregar Manual
          </button>
        </div>
      )}

      {/* Modo Upload CSV */}
      {mode === 'upload' && (
        <div className="space-y-4">
          {/* Zona de drop */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-vocari-primary/50 transition-colors"
          >
            <FileSpreadsheet size={48} className="mx-auto mb-4 text-white/40" />
            <p className="text-white/70 mb-2">
              Arrastra un archivo CSV aquí o haz clic para seleccionar
            </p>
            <p className="text-white/40 text-sm">
              Formato: email, nombre, curso, codigo_estudiante (opcional)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Template de ejemplo */}
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-sm text-white/70 mb-2">Ejemplo de formato CSV:</p>
            <pre className="text-xs text-white/50 font-mono bg-black/30 p-3 rounded overflow-x-auto">
              {`email,nombre,curso,codigo_estudiante
juan.perez@colegio.cl,Juan Pérez,4 Medio,2024001
maria.garcia@colegio.cl,María García,3 Medio,2024002
pedro.silva@colegio.cl,Pedro Silva,4 Medio,2024003`}
            </pre>
            <button
              onClick={() => {
                const template = 'email,nombre,curso,codigo_estudiante\n';
                const blob = new Blob([template], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'plantilla_estudiantes.csv';
                a.click();
              }}
              className="mt-3 text-sm text-vocari-light hover:text-vocari-light flex items-center gap-1"
            >
              <Download size={14} />
              Descargar plantilla
            </button>
          </div>

          {/* Preview de estudiantes parseados */}
          {parsedStudents.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium">
                  {parsedStudents.length} estudiantes listos para importar
                </h3>
                {parseErrors.length > 0 && (
                  <span className="text-yellow-400 text-sm flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {parseErrors.length} errores
                  </span>
                )}
              </div>

              {/* Tabla preview */}
              <div className="max-h-60 overflow-y-auto rounded-lg border border-white/10">
                <table className="w-full text-sm">
                  <thead className="bg-white/5 sticky top-0">
                    <tr>
                      <th className="text-left p-2 text-white/70">Nombre</th>
                      <th className="text-left p-2 text-white/70">Email</th>
                      <th className="text-left p-2 text-white/70">Curso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedStudents.slice(0, 10).map((student, i) => (
                      <tr key={i} className="border-t border-white/5">
                        <td className="p-2 text-white">{student.nombre}</td>
                        <td className="p-2 text-white/70">{student.email}</td>
                        <td className="p-2 text-white/70">{student.curso}</td>
                      </tr>
                    ))}
                    {parsedStudents.length > 10 && (
                      <tr className="border-t border-white/5">
                        <td colSpan={3} className="p-2 text-center text-white/50">
                          ... y {parsedStudents.length - 10} más
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Errores de parsing */}
              {parseErrors.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <p className="text-yellow-400 text-sm font-medium mb-2">Errores encontrados:</p>
                  <ul className="text-yellow-300 text-xs space-y-1">
                    {parseErrors.slice(0, 5).map((err, i) => (
                      <li key={i}>Línea {err.line}: {err.error}</li>
                    ))}
                    {parseErrors.length > 5 && (
                      <li>... y {parseErrors.length - 5} más</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Botón importar */}
              <button
                onClick={handleImport}
                disabled={loading}
                className="w-full py-3 bg-vocari-primary text-white rounded-lg hover:bg-vocari-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Importar {parsedStudents.length} Estudiantes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modo Manual */}
      {mode === 'manual' && (
        <form onSubmit={handleAddManual} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">Nombre Completo *</label>
              <input
                type="text"
                required
                value={manualForm.nombre}
                onChange={(e) => setManualForm({ ...manualForm, nombre: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-vocari-primary"
                placeholder="Ej: Juan Pérez González"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Email *</label>
              <input
                type="email"
                required
                value={manualForm.email}
                onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-vocari-primary"
                placeholder="estudiante@colegio.cl"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">Curso *</label>
              <select
                value={manualForm.curso}
                onChange={(e) => setManualForm({ ...manualForm, curso: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-vocari-primary"
              >
                <option value="3 Medio">3° Medio</option>
                <option value="4 Medio">4° Medio</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Código Estudiante (opcional)</label>
              <input
                type="text"
                value={manualForm.student_code}
                onChange={(e) => setManualForm({ ...manualForm, student_code: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-vocari-primary"
                placeholder="Ej: 2024001"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-vocari-primary text-white rounded-lg hover:bg-vocari-light transition-colors disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear Estudiante'}
          </button>
        </form>
      )}

      {/* Resultados de importación */}
      {mode === 'results' && (
        <div className="space-y-4">
          {/* Resumen */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
              <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
              <p className="text-2xl font-bold text-green-400">
                {importResults.filter(r => r.status === 'success').length}
              </p>
              <p className="text-green-300 text-sm">Creados exitosamente</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
              <XCircle size={32} className="mx-auto mb-2 text-red-400" />
              <p className="text-2xl font-bold text-red-400">
                {importResults.filter(r => r.status === 'error').length}
              </p>
              <p className="text-red-300 text-sm">Con errores</p>
            </div>
          </div>

          {/* Lista de códigos */}
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-white font-medium mb-3">Códigos de Activación</h3>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {importResults.filter(r => r.status === 'success').map((result, i) => (
                <div key={i} className="flex items-center justify-between bg-black/30 rounded-lg p-3">
                  <div>
                    <p className="text-white font-medium">{result.nombre}</p>
                    <p className="text-white/50 text-sm">{result.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg font-bold text-vocari-light tracking-wider">
                      {result.activation_code}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Errores */}
          {importResults.filter(r => r.status === 'error').length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <h3 className="text-red-400 font-medium mb-2">Errores</h3>
              <ul className="text-red-300 text-sm space-y-1">
                {importResults.filter(r => r.status === 'error').map((result, i) => (
                  <li key={i}>{result.email}: {result.error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleCopyCodes}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              <Copy size={16} />
              Copiar Códigos
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              <Printer size={16} />
              Imprimir
            </button>
            <button
              onClick={handleDownloadResults}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              <Download size={16} />
              Descargar CSV
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-vocari-primary hover:bg-vocari-light rounded-lg text-white transition-colors"
            >
              <RefreshCw size={16} />
              Nueva Importación
            </button>
          </div>

          {/* Instrucciones */}
          <div className="bg-vocari-primary/10 border border-vocari-primary/30 rounded-lg p-4">
            <h4 className="text-vocari-light font-medium mb-2">Próximos pasos:</h4>
            <ol className="text-vocari-primary/60 text-sm space-y-1 list-decimal list-inside">
              <li>Entrega el código de activación a cada estudiante (impreso o por email)</li>
              <li>El estudiante ingresa a vocari.cl y hace clic en "Activar con código"</li>
              <li>Ingresa el código y se vincula automáticamente a tu colegio</li>
              <li>Ya puede iniciar con Google y hacer el test vocacional</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentImporter;
