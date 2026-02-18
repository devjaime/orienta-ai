import { motion } from 'framer-motion';
import { useState } from 'react';
import { ArrowLeft, Download, BarChart3, Target, GraduationCap, Lightbulb } from 'lucide-react';
import ReportStatusBadge from './ReportStatusBadge';
import VisualExplanation from './VisualExplanation';

const ReportViewer = ({ report, onBack }) => {
  const [activeTab, setActiveTab] = useState('informe');
  const content = report.report_content || {};
  const isPremium = report.plan?.name === 'premium';
  const testSnapshot = report.test_result_snapshot || {};

  const sections = [
    {
      key: 'perfil',
      title: 'Tu Perfil RIASEC',
      icon: BarChart3,
      content: content.perfil_riasec
    },
    {
      key: 'analisis',
      title: 'Análisis Detallado',
      icon: Target,
      content: content.analisis_detallado
    },
    {
      key: 'carreras',
      title: 'Carreras Recomendadas',
      icon: GraduationCap,
      content: content.carreras_recomendadas
    },
    {
      key: 'siguientes',
      title: 'Siguientes Pasos',
      icon: Lightbulb,
      content: content.siguientes_pasos
    }
  ];

  return (
    <div className="min-h-screen bg-orienta-dark">
      {/* Header */}
      <div className="bg-gradient-to-r from-orienta-dark to-orienta-blue/20 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={18} />
            Volver a mis informes
          </button>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-poppins font-bold text-white">
                  {report.plan?.display_name || 'Informe Vocacional'}
                </h1>
                <ReportStatusBadge status={report.status} />
              </div>
              <p className="text-white/60 text-sm">
                Generado el {new Date(report.created_at).toLocaleDateString('es-CL', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
                {testSnapshot.codigo_holland && (
                  <span> - Código Holland: <span className="text-orienta-blue font-mono font-bold">{testSnapshot.codigo_holland}</span></span>
                )}
              </p>
            </div>
            {report.pdf_url && (
              <a
                href={report.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-lg hover:bg-green-500/30 transition-colors"
              >
                <Download size={16} />
                Descargar PDF
              </a>
            )}
          </div>

          {/* Tabs */}
          {isPremium && (
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setActiveTab('informe')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'informe'
                    ? 'bg-orienta-blue text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                Informe
              </button>
              <button
                onClick={() => setActiveTab('visual')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'visual'
                    ? 'bg-orienta-blue text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                Explicación Visual
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {activeTab === 'informe' ? (
          <div className="space-y-6">
            {/* RIASEC Scores Chart */}
            {testSnapshot.puntajes && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/20 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 size={20} className="text-orienta-blue" />
                  Puntajes RIASEC
                </h3>
                <div className="grid grid-cols-6 gap-2">
                  {Object.entries(testSnapshot.puntajes).map(([dim, score]) => {
                    const maxScore = 30;
                    const percentage = (score / maxScore) * 100;
                    const dimNames = { R: 'Realista', I: 'Investigador', A: 'Artístico', S: 'Social', E: 'Emprendedor', C: 'Convencional' };

                    return (
                      <div key={dim} className="text-center">
                        <div className="h-32 bg-white/5 rounded-lg relative mb-2 overflow-hidden">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${percentage}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="absolute bottom-0 left-0 right-0 bg-orienta-blue/60 rounded-b-lg"
                          />
                          <span className="absolute top-2 left-0 right-0 text-white font-bold text-sm">
                            {score}
                          </span>
                        </div>
                        <span className="text-white/60 text-xs">{dimNames[dim] || dim}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Report Sections */}
            {sections.map((section, index) => (
              section.content && (
                <motion.div
                  key={section.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 border border-white/20 rounded-xl p-6"
                >
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <section.icon size={20} className="text-orienta-blue" />
                    {section.title}
                  </h3>
                  <div className="text-white/80 leading-relaxed whitespace-pre-wrap">
                    {section.content}
                  </div>
                </motion.div>
              )
            ))}

            {/* No content yet */}
            {!content.perfil_riasec && !content.analisis_detallado && (
              <div className="text-center py-12">
                <p className="text-white/40">
                  El contenido del informe aún no está disponible. Estará listo cuando el informe sea aprobado.
                </p>
              </div>
            )}

            {/* Reviewer notes */}
            {report.reviewer_notes && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-purple-300 mb-2">
                  Notas del orientador
                </h3>
                <p className="text-white/80">{report.reviewer_notes}</p>
                {report.reviewed_at && (
                  <p className="text-white/40 text-sm mt-2">
                    Revisado el {new Date(report.reviewed_at).toLocaleDateString('es-CL')}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Visual Explanation Tab (Premium only) */
          <VisualExplanation
            data={report.visual_explanation}
            testSnapshot={testSnapshot}
          />
        )}
      </div>
    </div>
  );
};

export default ReportViewer;
