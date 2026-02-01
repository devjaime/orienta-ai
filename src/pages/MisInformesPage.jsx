import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft, Eye, Download, Clock, Plus } from 'lucide-react';
import { getMyReports, formatPriceCLP } from '../lib/reportService';
import ReportStatusBadge from '../components/informes/ReportStatusBadge';
import ReportViewer from '../components/informes/ReportViewer';

function MisInformesPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await getMyReports();
      setReports(data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (selectedReport) {
    return (
      <ReportViewer
        report={selectedReport}
        onBack={() => setSelectedReport(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-orienta-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orienta-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Cargando informes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orienta-dark">
      {/* Header */}
      <div className="bg-gradient-to-r from-orienta-dark to-orienta-blue/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={18} />
            Volver al inicio
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-poppins font-bold text-white mb-2">
                Mis Informes
              </h1>
              <p className="text-white/60">
                Historial de informes vocacionales adquiridos
              </p>
            </div>
            <button
              onClick={() => navigate('/informes')}
              className="flex items-center gap-2 bg-orienta-blue text-white px-4 py-2 rounded-lg hover:bg-blue-400 transition-colors"
            >
              <Plus size={18} />
              Nuevo Informe
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {reports.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <FileText size={64} className="text-white/20 mx-auto mb-4" />
            <h3 className="text-xl text-white font-semibold mb-2">
              No tienes informes aún
            </h3>
            <p className="text-white/60 mb-6">
              Adquiere tu primer informe vocacional profesional
            </p>
            <button
              onClick={() => navigate('/informes')}
              className="bg-orienta-blue text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-400 transition-colors"
            >
              Ver planes disponibles
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {reports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 border border-white/20 rounded-xl p-6"
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-semibold text-lg">
                        {report.plan?.display_name || 'Informe Vocacional'}
                      </h3>
                      <ReportStatusBadge status={report.status} />
                    </div>
                    <div className="flex gap-4 text-sm text-white/40">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {new Date(report.created_at).toLocaleDateString('es-CL', {
                          year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </span>
                      {report.plan && (
                        <span>{formatPriceCLP(report.plan.price_clp)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {(report.status === 'approved' || report.status === 'delivered') && (
                      <>
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="flex items-center gap-2 bg-orienta-blue/20 text-orienta-blue px-4 py-2 rounded-lg hover:bg-orienta-blue/30 transition-colors"
                        >
                          <Eye size={16} />
                          Ver informe
                        </button>
                        {report.pdf_url && (
                          <a
                            href={report.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-lg hover:bg-green-500/30 transition-colors"
                          >
                            <Download size={16} />
                            PDF
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MisInformesPage;
