import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  TrendingUp,
  Calendar,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle,
  Mail,
  Phone
} from 'lucide-react';
import StudentTimeline from './StudentTimeline';
import { getStudentAdvancedStats } from '../../lib/orientadorService';
import { supabase } from '../../lib/supabase';

function OrientadorStudentProfile() {
  const { studentId } = useParams();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'timeline', 'sessions'
  const [student, setStudent] = useState(null);
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    loadStudentData();
  }, [studentId]);

  const loadStudentData = async () => {
    setLoading(true);
    try {
      // Cargar estadísticas del estudiante
      const studentStats = await getStudentAdvancedStats(studentId);
      setStudent(studentStats.profile);
      setStats(studentStats);

      // Cargar sesiones
      const { data: sessionsData } = await supabase
        .from('scheduled_sessions')
        .select(`
          *,
          orientador_profile:user_profiles!scheduled_sessions_orientador_id_fkey(nombre)
        `)
        .eq('user_id', studentId)
        .order('scheduled_date', { ascending: false })
        .limit(10);

      setSessions(sessionsData || []);
    } catch (error) {
      console.error('Error loading student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-500/20 text-green-300',
      pending: 'bg-yellow-500/20 text-yellow-300',
      confirmed: 'bg-blue-500/20 text-blue-300',
      cancelled: 'bg-red-500/20 text-red-300'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300';
  };

  const getStatusLabel = (status) => {
    const labels = {
      completed: 'Completada',
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      cancelled: 'Cancelada'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-lg">Cargando perfil...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-lg">Estudiante no encontrado</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header con botón de regreso */}
      <div className="mb-8">
        <Link
          to="/orientador/dashboard"
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4"
        >
          <ArrowLeft size={20} />
          Volver al Dashboard
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-500/20 rounded-full">
              <User className="text-blue-400" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                {student.nombre || 'Estudiante'}
              </h1>
              <div className="flex items-center gap-4 text-white/60">
                {student.email && (
                  <span className="flex items-center gap-1">
                    <Mail size={16} />
                    {student.email}
                  </span>
                )}
                {student.telefono && (
                  <span className="flex items-center gap-1">
                    <Phone size={16} />
                    {student.telefono}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Alertas */}
          {stats.days_since_last_activity !== null && stats.days_since_last_activity > 30 && (
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="text-yellow-400" size={20} />
              <span className="text-yellow-300 text-sm">
                Sin actividad en {stats.days_since_last_activity} días
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/20 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="text-green-400" size={24} />
            <p className="text-white/60 text-sm">Sesiones Completadas</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats.completed_sessions || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 border border-white/20 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <Clock className="text-yellow-400" size={24} />
            <p className="text-white/60 text-sm">Sesiones Pendientes</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats.pending_sessions || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 border border-white/20 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <FileText className="text-blue-400" size={24} />
            <p className="text-white/60 text-sm">Tests Completados</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats.total_tests || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 border border-white/20 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-purple-400" size={24} />
            <p className="text-white/60 text-sm">Sesiones Totales</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats.total_sessions || 0}</p>
        </motion.div>
      </div>

      {/* Último test */}
      {stats.last_test && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="text-green-400" size={24} />
            <h3 className="text-xl font-bold text-white">Último Test Completado</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/60 text-sm mb-1">Código Holland</p>
              <p className="text-2xl font-bold text-white font-mono">
                {stats.last_test.codigo_holland}
              </p>
            </div>
            <div>
              <p className="text-white/60 text-sm mb-1">Certeza</p>
              <p className="text-xl font-semibold text-white">
                {stats.last_test.certeza}
              </p>
            </div>
          </div>
          {stats.last_test.completed_at && (
            <p className="text-white/40 text-sm mt-3">
              Completado el {formatDate(stats.last_test.completed_at)}
            </p>
          )}
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/20">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'overview'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Resumen
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'timeline'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Timeline
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'sessions'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Sesiones
        </button>
      </div>

      {/* Contenido por tab */}
      <div>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Información del perfil */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/20 rounded-xl p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4">Información del Estudiante</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-white/60 text-sm mb-1">Nombre</p>
                  <p className="text-white">{student.nombre || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm mb-1">Email</p>
                  <p className="text-white">{student.email || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm mb-1">Teléfono</p>
                  <p className="text-white">{student.telefono || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm mb-1">Edad</p>
                  <p className="text-white">{student.edad || 'No especificada'}</p>
                </div>
              </div>
            </motion.div>

            {/* Próxima sesión */}
            {sessions.length > 0 && sessions[0].status === 'pending' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6"
              >
                <h3 className="text-xl font-bold text-white mb-4">Próxima Sesión</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold mb-1">
                      {formatDate(sessions[0].scheduled_date)}
                    </p>
                    <p className="text-white/60 text-sm">
                      Duración: {sessions[0].duration_minutes} minutos
                    </p>
                  </div>
                  <Link
                    to={`/orientador/sesion/${sessions[0].id}`}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Ver Detalles
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <StudentTimeline studentId={studentId} />
        )}

        {activeTab === 'sessions' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/20 rounded-xl p-6"
          >
            <h3 className="text-xl font-bold text-white mb-4">Historial de Sesiones</h3>

            {sessions.length === 0 ? (
              <div className="text-center py-12 text-white/60">
                <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                <p>No hay sesiones registradas aún</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-white/5 border border-white/20 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-white font-semibold">
                            {formatDate(session.scheduled_date)}
                          </h4>
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(session.status)}`}>
                            {getStatusLabel(session.status)}
                          </span>
                        </div>
                        <p className="text-white/60 text-sm">
                          Duración: {session.duration_minutes} minutos
                        </p>
                        {session.orientador_profile && (
                          <p className="text-white/60 text-sm">
                            Orientador: {session.orientador_profile.nombre}
                          </p>
                        )}
                      </div>
                      {session.status === 'completed' && (
                        <Link
                          to={`/orientador/notas/${session.id}`}
                          className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                        >
                          Ver Notas
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default OrientadorStudentProfile;
