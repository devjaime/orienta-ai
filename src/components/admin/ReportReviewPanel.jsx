import { useState, useEffect } from 'react';
import { FileText, Check, X, Eye, Filter, Clock, Search } from 'lucide-react';
import { getAllReports, approveReport, rejectReport } from '../../lib/reportService';
import ReportStatusBadge from '../informes/ReportStatusBadge';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'review', label: 'Pendientes de revisión' },
  { value: 'approved', label: 'Aprobados' },
  { value: 'rejected', label: 'Rechazados' },
  { value: 'generating', label: 'Generando' },
  { value: 'paid', label: 'Pagados' }
];

function ReportReviewPanel() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('review');
  const [selectedReport, setSelectedReport] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadReports();
  }, [statusFilter]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await getAllReports(statusFilter || undefined);
      setReports(data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reportId) => {
    setProcessing(true);
    try {
      await approveReport(reportId, reviewNotes);
      alert('Informe aprobado exitosamente');
      setSelectedReport(null);
      setReviewNotes('');
      await loadReports();
    } catch (error) {
      console.error('Error approving report:', error);
      alert('Error al aprobar el informe');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (reportId) => {
    if (!reviewNotes.trim()) {
      alert('Debes incluir notas al rechazar un informe');
      return;
    }

    setProcessing(true);
    try {
      await rejectReport(reportId, reviewNotes);
      alert('Informe rechazado');
      setSelectedReport(null);
      setReviewNotes('');
      await loadReports();
    } catch (error) {
      console.error('Error rejecting report:', error);
      alert('Error al rechazar el informe');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">Revisión de Informes</h3>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-white/40" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orienta-blue"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-orienta-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-white/40 text-sm">Cargando informes...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-8">
          <FileText size={48} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/60">No hay informes {statusFilter === 'review' ? 'pendientes de revisión' : 'con este filtro'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white/5 border border-white/10 rounded-lg p-4"
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-white font-semibold">
                      {report.user_nombre || 'Usuario'}
                    </h4>
                    <ReportStatusBadge status={report.status} />
                    <span className="text-white/40 text-xs bg-white/5 px-2 py-0.5 rounded">
                      {report.plan_display_name}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-white/40">
                    <span>{report.user_email}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(report.created_at).toLocaleDateString('es-CL')}
                    </span>
                    {report.reviewer_nombre && (
                      <span>Revisado por: {report.reviewer_nombre}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedReport(selectedReport?.id === report.id ? null : report);
                      setReviewNotes('');
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm"
                  >
                    <Eye size={14} />
                    {selectedReport?.id === report.id ? 'Cerrar' : 'Ver'}
                  </button>

                  {report.status === 'review' && (
                    <>
                      <button
                        onClick={() => handleApprove(report.id)}
                        disabled={processing}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm disabled:opacity-50"
                      >
                        <Check size={14} />
                        Aprobar
                      </button>
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setReviewNotes('');
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                      >
                        <X size={14} />
                        Rechazar
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Expanded Detail */}
              {selectedReport?.id === report.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-4 border-t border-white/10"
                >
                  {/* Report Content Preview */}
                  {report.status === 'review' && (
                    <div className="mb-4">
                      <label className="block text-white/60 text-sm mb-2">
                        Notas de revisión:
                      </label>
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Agrega notas sobre la revisión..."
                        rows={3}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-orienta-blue resize-none"
                      />
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleApprove(report.id)}
                          disabled={processing}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                        >
                          <Check size={16} />
                          {processing ? 'Procesando...' : 'Aprobar informe'}
                        </button>
                        <button
                          onClick={() => handleReject(report.id)}
                          disabled={processing || !reviewNotes.trim()}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          <X size={16} />
                          {processing ? 'Procesando...' : 'Rechazar informe'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="text-white/40 text-xs">
                    ID: {report.id}
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReportReviewPanel;
