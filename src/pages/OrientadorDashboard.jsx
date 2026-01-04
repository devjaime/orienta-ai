import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ClipboardList, Calendar, TrendingUp, Search, Filter, Eye, LogOut } from 'lucide-react';
import { hasRole, getAllUsers, getAllTestResults, getAllScheduledSessions, signOut } from '../lib/supabase';

function OrientadorDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('users'); // users, tests, sessions

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const hasOrientadorRole = await hasRole('orientador');
    if (!hasOrientadorRole) {
      alert('No tienes permisos para acceder a este panel');
      navigate('/');
      return;
    }

    await loadData();
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, testsData, sessionsData] = await Promise.all([
        getAllUsers(),
        getAllTestResults(),
        getAllScheduledSessions()
      ]);

      setUsers(usersData);
      setTestResults(testsData);
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Filtrar datos por término de búsqueda
  const filteredUsers = users.filter(user =>
    user.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTests = testResults.filter(test =>
    test.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.codigo_holland?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSessions = sessions.filter(session =>
    session.user_profile?.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Estadísticas
  const stats = {
    totalUsers: users.length,
    totalTests: testResults.length,
    pendingSessions: sessions.filter(s => s.status === 'pending').length,
    completedSessions: sessions.filter(s => s.status === 'completed').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-orienta-dark flex items-center justify-center">
        <div className="text-white">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orienta-dark">
      {/* Header */}
      <div className="bg-gradient-to-r from-orienta-dark to-orienta-blue/20 border-b border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Panel de Orientador</h1>
              <p className="text-white/60">Gestiona usuarios, tests y sesiones agendadas</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              <LogOut size={18} />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/20 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <Users size={24} className="text-orienta-blue" />
              <span className="text-3xl font-bold text-white">{stats.totalUsers}</span>
            </div>
            <p className="text-white/60 text-sm">Total Usuarios</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 border border-white/20 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <ClipboardList size={24} className="text-green-400" />
              <span className="text-3xl font-bold text-white">{stats.totalTests}</span>
            </div>
            <p className="text-white/60 text-sm">Tests Realizados</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 border border-white/20 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <Calendar size={24} className="text-yellow-400" />
              <span className="text-3xl font-bold text-white">{stats.pendingSessions}</span>
            </div>
            <p className="text-white/60 text-sm">Sesiones Pendientes</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 border border-white/20 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <TrendingUp size={24} className="text-purple-400" />
              <span className="text-3xl font-bold text-white">{stats.completedSessions}</span>
            </div>
            <p className="text-white/60 text-sm">Sesiones Completadas</p>
          </motion.div>
        </div>

        {/* Search and Tabs */}
        <div className="bg-white/5 border border-white/20 rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2 w-full md:w-96">
              <Search size={20} className="text-white/60" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-white w-full placeholder-white/40"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'users'
                    ? 'bg-orienta-blue text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                Usuarios
              </button>
              <button
                onClick={() => setActiveTab('tests')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'tests'
                    ? 'bg-orienta-blue text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                Tests
              </button>
              <button
                onClick={() => setActiveTab('sessions')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'sessions'
                    ? 'bg-orienta-blue text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                Sesiones
              </button>
            </div>
          </div>

          {/* Content */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">
                Usuarios Registrados ({filteredUsers.length})
              </h3>
              {filteredUsers.length === 0 ? (
                <p className="text-white/40">No hay usuarios registrados</p>
              ) : (
                <div className="grid gap-4">
                  {filteredUsers.map(user => (
                    <div
                      key={user.id}
                      className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-white font-semibold">{user.nombre}</h4>
                          <p className="text-white/60 text-sm">{user.user_email}</p>
                          <div className="flex gap-4 mt-2 text-xs text-white/40">
                            <span>Edad: {user.edad}</span>
                            <span>Género: {user.genero}</span>
                            <span>Rol: {user.role}</span>
                          </div>
                        </div>
                        <span className="text-xs text-white/40">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {user.motivaciones && (
                        <p className="text-white/50 text-sm mt-2 italic">
                          "{user.motivaciones.substring(0, 100)}..."
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tests' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">
                Resultados de Tests ({filteredTests.length})
              </h3>
              {filteredTests.length === 0 ? (
                <p className="text-white/40">No hay tests realizados</p>
              ) : (
                <div className="grid gap-4">
                  {filteredTests.map(test => (
                    <div
                      key={test.id}
                      className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-orienta-blue">
                              {test.codigo_holland}
                            </span>
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                              {test.certeza}
                            </span>
                          </div>
                          <p className="text-white/60 text-sm mt-1">{test.user_email}</p>
                          <p className="text-white/40 text-xs mt-1">
                            Duración: {test.duracion_minutos} min
                          </p>
                        </div>
                        <span className="text-xs text-white/40">
                          {new Date(test.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">
                Sesiones Agendadas ({filteredSessions.length})
              </h3>
              {filteredSessions.length === 0 ? (
                <p className="text-white/40">No hay sesiones agendadas</p>
              ) : (
                <div className="grid gap-4">
                  {filteredSessions.map(session => (
                    <div
                      key={session.id}
                      className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-semibold">
                            {session.user_profile?.nombre || 'Usuario'}
                          </h4>
                          <p className="text-white/60 text-sm">
                            {session.user_profile?.user_email}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-white/60">
                              📅 {new Date(session.scheduled_date).toLocaleString()}
                            </span>
                            <span className="text-xs text-white/60">
                              ⏱️ {session.duration_minutes} min
                            </span>
                            <span className={`px-2 py-1 text-xs rounded ${
                              session.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              session.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400' :
                              session.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {session.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      {session.user_notes && (
                        <p className="text-white/50 text-sm mt-2 italic">
                          Notas: "{session.user_notes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrientadorDashboard;
