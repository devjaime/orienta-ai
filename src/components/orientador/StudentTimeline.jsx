import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  ClipboardList,
  Calendar,
  Activity,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { getStudentTimeline } from '../../lib/orientadorService';

const ICON_MAP = {
  test: ClipboardList,
  session: Calendar,
  activity: Activity
};

const COLOR_MAP = {
  green: {
    bg: 'bg-green-500/20',
    border: 'border-green-500/50',
    text: 'text-green-400',
    icon: 'text-green-400'
  },
  blue: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/50',
    text: 'text-blue-400',
    icon: 'text-blue-400'
  },
  yellow: {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/50',
    text: 'text-yellow-400',
    icon: 'text-yellow-400'
  },
  purple: {
    bg: 'bg-purple-500/20',
    border: 'border-purple-500/50',
    text: 'text-purple-400',
    icon: 'text-purple-400'
  }
};

function StudentTimeline({ studentId }) {
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'tests', 'sessions', 'activities'

  useEffect(() => {
    loadTimeline();
  }, [studentId]);

  const loadTimeline = async () => {
    setLoading(true);
    try {
      const data = await getStudentTimeline(studentId);
      setTimeline(data);
    } catch (error) {
      console.error('Error loading timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTimeline = timeline.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'tests') return item.type === 'test';
    if (filter === 'sessions') return item.type === 'session';
    if (filter === 'activities') return item.type === 'activity';
    return true;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const renderTimelineItem = (item, index) => {
    const Icon = ICON_MAP[item.type] || Activity;
    const colors = COLOR_MAP[item.color] || COLOR_MAP.blue;

    return (
      <motion.div
        key={`${item.type}-${item.date}-${index}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className="relative pl-8 pb-8 last:pb-0"
      >
        {/* Línea vertical */}
        <div className="absolute left-3 top-6 bottom-0 w-px bg-white/20" />

        {/* Icono */}
        <div className={`absolute left-0 top-0 p-2 rounded-full ${colors.bg} border ${colors.border}`}>
          <Icon size={16} className={colors.icon} />
        </div>

        {/* Contenido */}
        <div className={`bg-white/5 border ${colors.border} rounded-lg p-4`}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="text-white font-semibold">
                {item.type === 'test' && 'Test Completado'}
                {item.type === 'session' && 'Sesión'}
                {item.type === 'activity' && 'Actividad'}
              </h4>
              <p className="text-white/60 text-sm">{formatDate(item.date)}</p>
            </div>
            {renderStatusBadge(item)}
          </div>

          {/* Detalles específicos por tipo */}
          {item.type === 'test' && renderTestDetails(item.data)}
          {item.type === 'session' && renderSessionDetails(item.data)}
          {item.type === 'activity' && renderActivityDetails(item.data)}
        </div>
      </motion.div>
    );
  };

  const renderStatusBadge = (item) => {
    if (item.type === 'session') {
      const statusConfig = {
        completed: { text: 'Completada', color: 'bg-green-500/20 text-green-300', icon: CheckCircle },
        pending: { text: 'Pendiente', color: 'bg-yellow-500/20 text-yellow-300', icon: Clock },
        cancelled: { text: 'Cancelada', color: 'bg-red-500/20 text-red-300', icon: AlertCircle }
      };

      const config = statusConfig[item.data.status] || statusConfig.pending;
      const StatusIcon = config.icon;

      return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${config.color}`}>
          <StatusIcon size={14} />
          {config.text}
        </span>
      );
    }

    if (item.type === 'test') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-500/20 text-green-300">
          <CheckCircle size={14} />
          Completado
        </span>
      );
    }

    return null;
  };

  const renderTestDetails = (test) => {
    return (
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-white/70">Código Holland:</span>
          <span className="text-white font-mono font-bold">{test.codigo_holland}</span>
        </div>
        {test.certeza && (
          <div className="flex items-center justify-between">
            <span className="text-white/70">Certeza:</span>
            <span className="text-white">{test.certeza}</span>
          </div>
        )}
      </div>
    );
  };

  const renderSessionDetails = (session) => {
    return (
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-white/70">Fecha programada:</span>
          <span className="text-white">
            {new Date(session.scheduled_date).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
        {session.duration_minutes && (
          <div className="flex items-center justify-between">
            <span className="text-white/70">Duración:</span>
            <span className="text-white">{session.duration_minutes} minutos</span>
          </div>
        )}
        {session.orientador_profile?.nombre && (
          <div className="flex items-center justify-between">
            <span className="text-white/70">Orientador:</span>
            <span className="text-white">{session.orientador_profile.nombre}</span>
          </div>
        )}
        {session.notes && (
          <div className="mt-3 p-3 bg-white/5 rounded-lg">
            <p className="text-white/70 text-sm">{session.notes}</p>
          </div>
        )}
      </div>
    );
  };

  const renderActivityDetails = (activity) => {
    const actionLabels = {
      test_completed: 'Completó un test',
      session_scheduled: 'Agendó una sesión',
      profile_updated: 'Actualizó su perfil'
    };

    return (
      <div className="mt-2">
        <p className="text-white/70 text-sm">
          {actionLabels[activity.action_type] || activity.action_type}
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white">Cargando timeline...</div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/20 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="text-blue-400" size={28} />
          <div>
            <h2 className="text-2xl font-bold text-white">Timeline de Progreso</h2>
            <p className="text-white/60 text-sm">Historial completo de actividad</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('tests')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filter === 'tests'
                ? 'bg-green-500 text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            Tests
          </button>
          <button
            onClick={() => setFilter('sessions')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filter === 'sessions'
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            Sesiones
          </button>
          <button
            onClick={() => setFilter('activities')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filter === 'activities'
                ? 'bg-purple-500 text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            Actividades
          </button>
        </div>
      </div>

      {/* Timeline */}
      {filteredTimeline.length === 0 ? (
        <div className="text-center py-12 text-white/60">
          <Activity size={48} className="mx-auto mb-4 opacity-50" />
          <p>No hay actividad registrada aún</p>
        </div>
      ) : (
        <div className="mt-6">
          {filteredTimeline.map((item, index) => renderTimelineItem(item, index))}
        </div>
      )}

      {/* Estadísticas rápidas */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
          <p className="text-green-400 text-2xl font-bold">
            {timeline.filter(t => t.type === 'test').length}
          </p>
          <p className="text-white/60 text-sm">Tests</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
          <p className="text-blue-400 text-2xl font-bold">
            {timeline.filter(t => t.type === 'session').length}
          </p>
          <p className="text-white/60 text-sm">Sesiones</p>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 text-center">
          <p className="text-purple-400 text-2xl font-bold">
            {timeline.length}
          </p>
          <p className="text-white/60 text-sm">Total</p>
        </div>
      </div>
    </div>
  );
}

export default StudentTimeline;
