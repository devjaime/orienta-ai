/**
 * InstitutionManager - Gestión de Instituciones (Colegios)
 * Solo visible para super_admin
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Plus,
  Search,
  Users,
  Calendar,
  MapPin,
  Phone,
  Mail,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Download,
  Upload
} from 'lucide-react';
import {
  getAllInstitutions,
  createInstitution,
  updateInstitution,
  updateInstitutionStatus,
  getInstitutionStats,
  getAllInstitutionStats
} from '../../lib/institutionService';

const INSTITUTION_TYPES = [
  { value: 'particular', label: 'Particular' },
  { value: 'particular_subvencionado', label: 'Particular Subvencionado' },
  { value: 'municipal', label: 'Municipal' },
  { value: 'servicio_local', label: 'Servicio Local de Educación' }
];

const STATUS_CONFIG = {
  pending: { color: 'yellow', icon: Clock, label: 'Pendiente' },
  pilot: { color: 'blue', icon: AlertTriangle, label: 'Piloto' },
  active: { color: 'green', icon: CheckCircle, label: 'Activo' },
  inactive: { color: 'gray', icon: XCircle, label: 'Inactivo' },
  suspended: { color: 'red', icon: XCircle, label: 'Suspendido' }
};

const REGIONES_CHILE = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
  'Valparaíso', 'Metropolitana', 'O\'Higgins', 'Maule', 'Ñuble',
  'Biobío', 'La Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes'
];

function InstitutionManager() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadInstitutions();
  }, []);

  const loadInstitutions = async () => {
    setLoading(true);
    try {
      const data = await getAllInstitutions();
      setInstitutions(data);

      // Cargar estadísticas
      const allStats = await getAllInstitutionStats();
      const statsMap = {};
      allStats.forEach(s => {
        statsMap[s.institution_id] = s;
      });
      setStats(statsMap);
    } catch (error) {
      console.error('Error loading institutions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInstitutions = institutions.filter(inst => {
    const matchesSearch = inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.comuna?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || inst.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (institutionId, newStatus) => {
    try {
      await updateInstitutionStatus(institutionId, newStatus);
      await loadInstitutions();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar el estado');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-vocari-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Building2 className="text-vocari-light" />
            Instituciones
          </h2>
          <p className="text-white/60 text-sm mt-1">
            {institutions.length} colegios registrados
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-vocari-primary text-white rounded-lg hover:bg-vocari-light transition-colors"
        >
          <Plus size={18} />
          Nueva Institución
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, código o comuna..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-vocari-primary"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-vocari-primary"
        >
          <option value="all">Todos los estados</option>
          {Object.entries(STATUS_CONFIG).map(([value, config]) => (
            <option key={value} value={value}>{config.label}</option>
          ))}
        </select>
      </div>

      {/* Lista de Instituciones */}
      <div className="space-y-4">
        {filteredInstitutions.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            <Building2 size={48} className="mx-auto mb-4 opacity-50" />
            <p>No se encontraron instituciones</p>
          </div>
        ) : (
          filteredInstitutions.map((institution) => (
            <InstitutionCard
              key={institution.id}
              institution={institution}
              stats={stats[institution.id]}
              isExpanded={expandedId === institution.id}
              onToggleExpand={() => setExpandedId(expandedId === institution.id ? null : institution.id)}
              onStatusChange={handleStatusChange}
              onEdit={() => setSelectedInstitution(institution)}
            />
          ))
        )}
      </div>

      {/* Modal Crear Institución */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateInstitutionModal
            onClose={() => setShowCreateModal(false)}
            onCreated={() => {
              setShowCreateModal(false);
              loadInstitutions();
            }}
          />
        )}
      </AnimatePresence>

      {/* Modal Editar Institución */}
      <AnimatePresence>
        {selectedInstitution && (
          <EditInstitutionModal
            institution={selectedInstitution}
            onClose={() => setSelectedInstitution(null)}
            onUpdated={() => {
              setSelectedInstitution(null);
              loadInstitutions();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Componente Card de Institución
function InstitutionCard({ institution, stats, isExpanded, onToggleExpand, onStatusChange, onEdit }) {
  const statusConfig = STATUS_CONFIG[institution.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  const daysRemaining = institution.pilot_end_date
    ? Math.ceil((new Date(institution.pilot_end_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <motion.div
      layout
      className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Logo/Avatar */}
            <div className="w-12 h-12 rounded-lg bg-vocari-primary/20 flex items-center justify-center">
              {institution.logo_url ? (
                <img src={institution.logo_url} alt="" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <Building2 className="text-vocari-light" size={24} />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white">{institution.name}</h3>
                <span className="px-2 py-0.5 text-xs font-mono bg-white/10 rounded text-white/60">
                  {institution.code}
                </span>
              </div>

              <div className="flex items-center gap-4 mt-1 text-sm text-white/60">
                {institution.comuna && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {institution.comuna}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users size={14} />
                  {stats?.total_students || 0} / {institution.max_students} estudiantes
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Badge */}
            <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-${statusConfig.color}-500/20 text-${statusConfig.color}-400`}>
              <StatusIcon size={12} />
              {statusConfig.label}
            </span>

            {/* Días restantes de piloto */}
            {institution.status === 'pilot' && daysRemaining !== null && (
              <span className={`text-xs px-2 py-1 rounded-full ${daysRemaining <= 7 ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                {daysRemaining > 0 ? `${daysRemaining} días` : 'Vencido'}
              </span>
            )}

            {/* Expand Icon */}
            {isExpanded ? (
              <ChevronUp className="text-white/40" size={20} />
            ) : (
              <ChevronDown className="text-white/40" size={20} />
            )}
          </div>
        </div>
      </div>

      {/* Contenido expandido */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10"
          >
            <div className="p-4 space-y-4">
              {/* Estadísticas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatBox label="Estudiantes" value={stats?.total_students || 0} icon={Users} />
                <StatBox label="Tests Completados" value={stats?.total_tests_completed || 0} icon={CheckCircle} />
                <StatBox label="Sesiones" value={stats?.total_sessions || 0} icon={Calendar} />
                <StatBox label="Sin Activar" value={stats?.not_activated || 0} icon={Clock} />
              </div>

              {/* Información de contacto */}
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                {institution.contact_name && (
                  <div className="flex items-center gap-2 text-white/70">
                    <Users size={16} className="text-white/40" />
                    {institution.contact_name}
                  </div>
                )}
                {institution.contact_email && (
                  <div className="flex items-center gap-2 text-white/70">
                    <Mail size={16} className="text-white/40" />
                    {institution.contact_email}
                  </div>
                )}
                {institution.contact_phone && (
                  <div className="flex items-center gap-2 text-white/70">
                    <Phone size={16} className="text-white/40" />
                    {institution.contact_phone}
                  </div>
                )}
                {institution.pilot_start_date && (
                  <div className="flex items-center gap-2 text-white/70">
                    <Calendar size={16} className="text-white/40" />
                    Piloto: {new Date(institution.pilot_start_date).toLocaleDateString('es-CL')} - {institution.pilot_end_date ? new Date(institution.pilot_end_date).toLocaleDateString('es-CL') : 'Sin fecha'}
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                >
                  <Edit size={14} />
                  Editar
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); window.location.href = `/admin/institutions/${institution.id}/students`; }}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                >
                  <Users size={14} />
                  Ver Estudiantes
                </button>

                {institution.status === 'pilot' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onStatusChange(institution.id, 'active'); }}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400 transition-colors"
                  >
                    <CheckCircle size={14} />
                    Activar
                  </button>
                )}

                {institution.status === 'active' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onStatusChange(institution.id, 'inactive'); }}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
                  >
                    <XCircle size={14} />
                    Desactivar
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Componente StatBox
function StatBox({ label, value, icon: Icon }) {
  return (
    <div className="bg-white/5 rounded-lg p-3">
      <div className="flex items-center gap-2 text-white/60 text-xs mb-1">
        <Icon size={14} />
        {label}
      </div>
      <div className="text-xl font-semibold text-white">{value}</div>
    </div>
  );
}

// Modal Crear Institución
function CreateInstitutionModal({ onClose, onCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'particular',
    comuna: '',
    region: 'Metropolitana',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    max_students: 100,
    pilot_start_date: new Date().toISOString().split('T')[0],
    pilot_end_date: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await createInstitution(formData);
      onCreated();
    } catch (err) {
      setError(err.message || 'Error al crear la institución');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gray-900 border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Building2 className="text-vocari-light" />
            Nueva Institución
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">Nombre del Colegio *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-vocari-primary"
                placeholder="Ej: Colegio San José"
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">Código Único *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-mono focus:outline-none focus:border-vocari-primary"
                placeholder="Ej: CSJ001"
                maxLength={10}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">Tipo de Institución</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-vocari-primary"
              >
                {INSTITUTION_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">Máx. Estudiantes</label>
              <input
                type="number"
                value={formData.max_students}
                onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) || 100 })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-vocari-primary"
                min={1}
                max={1000}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">Región</label>
              <select
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-vocari-primary"
              >
                {REGIONES_CHILE.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">Comuna</label>
              <input
                type="text"
                value={formData.comuna}
                onChange={(e) => setFormData({ ...formData, comuna: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-vocari-primary"
                placeholder="Ej: Providencia"
              />
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 mt-4">
            <h3 className="text-sm font-medium text-white mb-3">Contacto del Colegio</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <input
                type="text"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-vocari-primary"
                placeholder="Nombre contacto"
              />
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-vocari-primary"
                placeholder="Email"
              />
              <input
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-vocari-primary"
                placeholder="Teléfono"
              />
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 mt-4">
            <h3 className="text-sm font-medium text-white mb-3">Fechas del Piloto</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/50 mb-1">Inicio</label>
                <input
                  type="date"
                  value={formData.pilot_start_date}
                  onChange={(e) => setFormData({ ...formData, pilot_start_date: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-vocari-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Fin (90 días por defecto)</label>
                <input
                  type="date"
                  value={formData.pilot_end_date}
                  onChange={(e) => setFormData({ ...formData, pilot_end_date: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-vocari-primary"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">Notas</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-vocari-primary resize-none"
              rows={3}
              placeholder="Notas internas sobre el piloto..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-white/70 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-vocari-primary text-white rounded-lg hover:bg-vocari-light transition-colors disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Institución'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Modal Editar Institución
function EditInstitutionModal({ institution, onClose, onUpdated }) {
  const [formData, setFormData] = useState({
    name: institution.name || '',
    type: institution.type || 'particular',
    comuna: institution.comuna || '',
    region: institution.region || 'Metropolitana',
    contact_name: institution.contact_name || '',
    contact_email: institution.contact_email || '',
    contact_phone: institution.contact_phone || '',
    max_students: institution.max_students || 100,
    pilot_end_date: institution.pilot_end_date || '',
    notes: institution.notes || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await updateInstitution(institution.id, formData);
      onUpdated();
    } catch (err) {
      setError(err.message || 'Error al actualizar la institución');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gray-900 border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Edit className="text-vocari-light" />
            Editar: {institution.name}
          </h2>
          <p className="text-sm text-white/50 mt-1">Código: {institution.code}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">Nombre</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-vocari-primary"
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">Máx. Estudiantes</label>
              <input
                type="number"
                value={formData.max_students}
                onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) || 100 })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-vocari-primary"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <input
              type="text"
              value={formData.contact_name}
              onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-vocari-primary"
              placeholder="Nombre contacto"
            />
            <input
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-vocari-primary"
              placeholder="Email"
            />
            <input
              type="tel"
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-vocari-primary"
              placeholder="Teléfono"
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">Fecha Fin Piloto</label>
            <input
              type="date"
              value={formData.pilot_end_date}
              onChange={(e) => setFormData({ ...formData, pilot_end_date: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-vocari-primary"
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">Notas</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-vocari-primary resize-none"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-white/70 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-vocari-primary text-white rounded-lg hover:bg-vocari-light transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default InstitutionManager;
