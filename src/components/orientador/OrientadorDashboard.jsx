import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Calendar,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  FileText,
  Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getOrientadorWorkloadStats,
  getOrientadorStudents,
  getStudentsWithAlerts,
  refreshWorkloadStats
} from '../../lib/orientadorService';
import { getCurrentUser } from '../../lib/supabase';

function OrientadorDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentsWithAlerts, setStudentsWithAlerts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        // Cargar datos en paralelo
        const [workloadStats, studentsList, alertsList] = await Promise.all([
          getOrientadorWorkloadStats(currentUser.id),
          getOrientadorStudents(currentUser.id),
          getStudentsWithAlerts(currentUser.id)
        ]);

        setStats(workloadStats);
        setStudents(studentsList);
        setStudentsWithAlerts(alertsList);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStats = async () => {
    setRefreshing(true);
    try {
      await refreshWorkloadStats();
      await loadDashboardData();
    } catch (error) {
      console.error('Error refreshing stats:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-lg">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          Dashboard de Orientador
        </h1>
        <p className="text-white/60">
          Bienvenido, {user?.user_metadata?.nombre || 'Orientador'}
        </p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total de estudiantes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/20 rounded-xl p-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Users className="text-blue-400" size={28} />
            </div>
            <div>
              <p className="text-white/60 text-sm">Estudiantes Asignados</p>
              <p className="text-3xl font-bold text-white">
                {stats?.total_students || 0}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Sesiones pendientes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 border border-white/20 rounded-xl p-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <Clock className="text-yellow-400" size={28} />
            </div>
            <div>
              <p className="text-white/60 text-sm">Sesiones Pendientes</p>
              <p className="text-3xl font-bold text-white">
                {stats?.pending_sessions || 0}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Sesiones completadas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 border border-white/20 rounded-xl p-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <CheckCircle className="text-green-400" size={28} />
            </div>
            <div>
              <p className="text-white/60 text-sm">Sesiones Completadas</p>
              <p className="text-3xl font-bold text-white">
                {stats?.completed_sessions || 0}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Horas totales (últimos 30 días) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 border border-white/20 rounded-xl p-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <TrendingUp className="text-purple-400" size={28} />
            </div>
            <div>
              <p className="text-white/60 text-sm">Horas (últimos 30d)</p>
              <p className="text-3xl font-bold text-white">
                {stats?.hours_last_30_days?.toFixed(1) || '0.0'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Alertas de estudiantes */}
      {studentsWithAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="text-yellow-400" size={24} />
            <h2 className="text-xl font-bold text-white">
              Estudiantes que Requieren Atención ({studentsWithAlerts.length})
            </h2>
          </div>

          <div className="space-y-3">
            {studentsWithAlerts.map((student) => (
              <div
                key={student.id}
                className="bg-white/5 border border-white/20 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-2">
                      {student.student_profile?.nombre || 'Estudiante'}
                    </h3>
                    <div className="space-y-1">
                      {student.alerts.map((alert, idx) => (
                        <div
                          key={idx}
                          className={`text-sm px-3 py-1 rounded inline-block mr-2 ${
                            alert.severity === 'warning'
                              ? 'bg-yellow-500/20 text-yellow-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {alert.message}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Link
                    to={`/orientador/estudiante/${student.student_id}`}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    Ver Perfil
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Lista de estudiantes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Estudiantes asignados */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/20 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users size={24} />
              Mis Estudiantes
            </h2>
            <button
              onClick={handleRefreshStats}
              disabled={refreshing}
              className="px-3 py-1 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm disabled:opacity-50"
            >
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-12 text-white/60">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>No tienes estudiantes asignados aún</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {students.map((student) => (
                <Link
                  key={student.id}
                  to={`/orientador/estudiante/${student.student_id}`}
                  className="block bg-white/5 border border-white/20 rounded-lg p-4 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1">
                        {student.student_profile?.nombre || 'Estudiante'}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-white/60">
                        <span>{student.total_sessions || 0} sesiones</span>
                        <span>
                          {student.completed_sessions || 0} completadas
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs px-2 py-1 rounded ${
                        student.assignment_type === 'auto'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-purple-500/20 text-purple-300'
                      }`}>
                        {student.assignment_type === 'auto' ? 'Auto' : 'Manual'}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Accesos rápidos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/20 rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Settings size={24} />
            Accesos Rápidos
          </h2>

          <div className="space-y-3">
            <Link
              to="/orientador/disponibilidad"
              className="flex items-center gap-4 bg-white/5 border border-white/20 rounded-lg p-4 hover:bg-white/10 transition-all"
            >
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Calendar className="text-blue-400" size={24} />
              </div>
              <div>
                <h3 className="text-white font-semibold">Mi Disponibilidad</h3>
                <p className="text-white/60 text-sm">
                  Configurar horarios semanales
                </p>
              </div>
            </Link>

            <Link
              to="/orientador/sesiones"
              className="flex items-center gap-4 bg-white/5 border border-white/20 rounded-lg p-4 hover:bg-white/10 transition-all"
            >
              <div className="p-3 bg-green-500/20 rounded-lg">
                <FileText className="text-green-400" size={24} />
              </div>
              <div>
                <h3 className="text-white font-semibold">Mis Sesiones</h3>
                <p className="text-white/60 text-sm">
                  Ver y gestionar apuntes
                </p>
              </div>
            </Link>

            <Link
              to="/orientador/calendario"
              className="flex items-center gap-4 bg-white/5 border border-white/20 rounded-lg p-4 hover:bg-white/10 transition-all"
            >
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Clock className="text-purple-400" size={24} />
              </div>
              <div>
                <h3 className="text-white font-semibold">Calendario</h3>
                <p className="text-white/60 text-sm">
                  Ver próximas sesiones
                </p>
              </div>
            </Link>
          </div>

          {/* Indicador de carga */}
          <div className="mt-6 p-4 bg-white/5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-sm">Carga de Trabajo</span>
              <span className="text-white font-semibold">
                {stats?.workload_score?.toFixed(0) || 0} pts
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(((stats?.workload_score || 0) / 100) * 100, 100)}%`
                }}
              />
            </div>
            <p className="text-white/40 text-xs mt-2">
              Basado en estudiantes asignados y sesiones pendientes
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default OrientadorDashboard;
