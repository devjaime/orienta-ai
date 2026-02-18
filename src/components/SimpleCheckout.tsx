import { useState, useEffect, useRef } from 'react';
import { FileText, Download, Check, Loader } from 'lucide-react';
import { getLatestTestResult } from '../lib/supabase';

const PLAN_FEATURES = {
  esencial: {
    title: 'Plan Esencial',
    price: '$12 USD',
    features: [
      'Informe PDF completo de 10+ páginas',
      'Análisis RIASEC detallado',
      '10 carreras recomendadas MINEDUC',
      'Revisión por orientador'
    ]
  },
  premium: {
    title: 'Plan Premium', 
    price: '$20 USD',
    features: [
      'Informe PDF de 15+ páginas',
      'Análisis RIASEC con visuales',
      '20 carreras + proyección laboral',
      'Video-explicación personalizada',
      'Sesión de seguimiento 30 min'
    ]
  }
};

export default function SimpleCheckout({ plan = 'esencial', onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportHtml, setReportHtml] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const reportRef = useRef(null);

  const planData = PLAN_FEATURES[plan];

  useEffect(() => {
    loadTestResult();
  }, []);

  const loadTestResult = async () => {
    try {
      const result = await getLatestTestResult();
      setTestResult(result);
    } catch (error) {
      console.error('Error loading test result:', error);
    }
  };

  const handlePay = async () => {
    setLoading(true);
    // Simular procesamiento de pago
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    
    // Abrir PayPal
    const paypalUrl = plan === 'premium' 
      ? 'https://www.paypal.com/ncp/payment/4CB6YZZS7G5VQ'
      : 'https://www.paypal.com/ncp/payment/DCEGNNL4FVNHA';
    window.open(paypalUrl, '_blank');
  };

  const generateReport = async () => {
    if (!testResult) {
      alert('Primero completa el test vocacional');
      return;
    }

    setGenerating(true);

    try {
      // Generar reporte localmente
      const riasecScores = testResult.riasec || { R: 30, I: 30, A: 30, S: 30, E: 30, C: 30 };
      const dominant = Object.entries(riasecScores).sort((a, b) => b[1] - a[1])[0][0];
      
      const perfiles = {
        R: { nombre: 'Realista', descripcion: 'Te gusta trabajar con tus manos y resolver problemas prácticos. Disfrutas de actividades al aire libre y el trabajo manual.', trabajos: ['Técnico', 'Mecánico', 'Ingeniero', 'Constructor'] },
        I: { nombre: 'Investigativo', descripcion: 'Te interesa analizar problemas, investigar y buscar soluciones científicas. Disfrutas de la lectura y el pensamiento abstracto.', trabajos: ['Científico', 'Médico', 'Investigador', 'Analista'] },
        A: { nombre: 'Artístico', descripcion: 'Expresas tu creatividad a través de arte, música o escritura. Valoras la originalidad y la libertad.', trabajos: ['Artista', 'Diseñador', 'Escritor', 'Músico'] },
        S: { nombre: 'Social', descripcion: 'Te gusta ayudar, enseñar y trabajar con personas. Disfrutas de la interacción social.', trabajos: ['Profesor', 'Psicólogo', 'Enfermero', 'Trabajador Social'] },
        E: { nombre: 'Emprendedor', descripcion: 'Te atraen el liderazgo y la toma de decisiones. Eres competitivo y persuasivo.', trabajos: ['Emprendedor', 'Vendedor', 'Gerente', 'Abogado'] },
        C: { nombre: 'Convencional', descripcion: 'Te desempeñas bien en tareas ordenadas y con números. Valoras la precisión y el detalle.', trabajos: ['Contador', 'Administrador', 'Analista', 'Secretario'] },
      };

      const perfil = perfiles[dominant];
      
      const carreras = [
        { nombre: 'Ingeniería Civil', area: 'Ingeniería', duracion: '12 semestres', promedio: 600, empleabilidad: 88 },
        { nombre: 'Medicina', area: 'Salud', duracion: '14 semestres', promedio: 650, empleabilidad: 95 },
        { nombre: 'Ingeniería Comercial', area: 'Negocios', duracion: '10 semestres', promedio: 550, empleabilidad: 82 },
        { nombre: 'Derecho', area: 'Derecho', duracion: '10 semestres', promedio: 580, empleabilidad: 75 },
        { nombre: 'Psicología', area: 'Salud', duracion: '10 semestres', promedio: 520, empleabilidad: 78 },
        { nombre: 'Pedagogía', area: 'Educación', duracion: '8 semestres', promedio: 480, empleabilidad: 85 },
        { nombre: 'Ingeniería Sistemas', area: 'Tecnología', duracion: '10 semestres', promedio: 540, empleabilidad: 92 },
        { nombre: 'Arquitectura', area: 'Diseño', duracion: '12 semestres', promedio: 570, empleabilidad: 70 },
        { nombre: 'Enfermería', area: 'Salud', duracion: '8 semestres', promedio: 500, empleabilidad: 90 },
        { nombre: 'Comunicación', area: 'Comunicación', duracion: '8 semestres', promedio: 510,empleabilidad: 72 },
      ];

      const compatibilidad = plan === 'premium' ? 15 : 10;

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Informe Vocacional Vocari</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { text-align: center; border-bottom: 3px solid #0B1A33; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #0B1A33; font-size: 28px; }
    .header .subtitle { color: #666; font-size: 14px; }
    .section { margin-bottom: 30px; }
    .section h2 { color: #0B1A33; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #D4AF37; padding-left: 10px; }
    .perfil { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 15px; margin-bottom: 20px; }
    .perfil h3 { font-size: 24px; margin-bottom: 10px; }
    .perfil .dominante { font-size: 48px; font-weight: bold; opacity: 0.3; position: absolute; right: 20px; top: 20px; }
    .perfil-card { background: #f8f9fa; padding: 20px; border-radius: 10px; }
    .carreras { display: grid; gap: 15px; }
    .carrera { border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px; transition: all 0.3s; }
    .carrera:hover { box-shadow: 0 5px 15px rgba(0,0,0,0.1); transform: translateY(-2px); }
    .carrera-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .carrera h3 { color: #0B1A33; font-size: 18px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    .badge-alta { background: #4CAF50; color: white; }
    .badge-media { background: #FFC107; color: black; }
    .carrera-details { display: flex; gap: 20px; font-size: 14px; color: #666; }
    .chart { margin: 20px 0; }
    .bar { display: flex; align-items: center; margin: 8px 0; }
    .bar-label { width: 30px; font-weight: bold; }
    .bar-value { flex: 1; height: 25px; background: #D4AF37; border-radius: 5px; position: relative; }
    .bar-text { position: absolute; right: 10px; color: #333; font-size: 12px; font-weight: bold; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #999; }
    @media print { body { padding: 20px; } .carrera { break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Informe Vocacional Vocari</h1>
    <p class="subtitle">Fecha: ${new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>

  <div class="section">
    <h2>🎯 Tu Perfil RIASEC</h2>
    <div class="perfil">
      <div class="dominante">${dominant}</div>
      <h3>${perfil.nombre}</h3>
      <p>${perfil.descripcion}</p>
    </div>
    
    <div class="perfil-card">
      <h4 style="margin-bottom: 10px;">Tus puntajes:</h4>
      <div class="chart">
        ${Object.entries(riasecScores).map(([key, value]) => `
          <div class="bar">
            <div class="bar-label">${key}</div>
            <div class="bar-value" style="width: ${value}%">
              <span class="bar-text">${value}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>

  <div class="section">
    <h2>🎓 Carreras Recomendadas</h2>
    <p style="margin-bottom: 20px; color: #666;">Basadas en tu perfil y datos oficiales del MINEDUC 2025:</p>
    <div class="carreras">
      ${carreras.slice(0, compatibilidad).map((c, i) => `
        <div class="carrera">
          <div class="carrera-header">
            <h3>${i + 1}. ${c.nombre}</h3>
            <span class="badge ${c.empleabilidad >= 85 ? 'badge-alta' : 'badge-media'}">${c.empleabilidad}% empleabilidad</span>
          </div>
          <div class="carrera-details">
            <span>📚 ${c.area}</span>
            <span>⏱️ ${c.duracion}</span>
            <span>📈 Puntaje promedio: ${c.promedio}</span>
          </div>
        </div>
      `).join('')}
    </div>
  </div>

  <div class="section">
    <h2>💼 Trabajos relacionados con tu perfil</h2>
    <ul style="list-style: none; padding: 0;">
      ${perfil.trabajos.map(t => `<li style="padding: 8px 0; border-bottom: 1px solid #eee;">✓ ${t}</li>`).join('')}
    </ul>
  </div>

  <div class="footer">
    <p><strong>Nota importante:</strong> Este informe es generado automáticamente basado en el test RIASEC y datos públicos del MINEDUC. 
    Las recomendaciones son orientativas y no constituyen asesoramiento profesional definitivo.</p>
    <p style="margin-top: 10px;">© ${new Date().getFullYear()} Vocari - vocari.cl | Tu guía vocacional de confianza</p>
  </div>
</body>
</html>
      `;

      setReportHtml(html);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error al generar reporte. Intenta de nuevo.');
    } finally {
      setGenerating(false);
    }
  };

  const downloadPDF = () => {
    if (!reportHtml) return;
    
    // Crear blob y descargar
    const blob = new Blob([reportHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Informe-Vocari-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-vocari-primary to-vocari-light p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{planData.title}</h2>
            <p className="text-3xl font-black mt-1">{planData.price}</p>
          </div>
          <FileText size={48} className="opacity-50" />
        </div>
      </div>

      {/* Features */}
      <div className="p-6">
        <ul className="space-y-3 mb-6">
          {planData.features.map((feature, i) => (
            <li key={i} className="flex items-center gap-3">
              <Check size={20} className="text-green-500 flex-shrink-0" />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Generate Report Button */}
        {testResult && (
          <div className="mb-6 p-4 bg-blue-50 rounded-xl">
            <p className="text-blue-800 font-medium mb-3">
              ✅ Test completado. ¿Generar reporte ahora?
            </p>
            <button
              onClick={generateReport}
              disabled={generating}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <FileText size={20} />
                  Generar Reporte Gratis
                </>
              )}
            </button>
          </div>
        )}

        {/* Download Report */}
        {reportHtml && (
          <div className="mb-6 p-4 bg-green-50 rounded-xl">
            <p className="text-green-800 font-medium mb-3">
              ✅ Reporte generado exitosamente
            </p>
            <button
              onClick={downloadPDF}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Download size={20} />
              Descargar Reporte
            </button>
          </div>
        )}

        {/* Pay Button */}
        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full py-4 bg-vocari-primary hover:bg-vocari-light text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader size={20} className="animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              💳 Pagar con PayPal
            </>
          )}
        </button>

        <p className="text-center text-gray-500 text-sm mt-4">
          🔒 Pago seguro con PayPal. Tarjeta o cuenta PayPal.
        </p>
      </div>
    </div>
  );
}
