import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ClipboardList, Calendar, Shield, Search, LogOut, UserCog } from 'lucide-react';
import { hasRole, getAllUsers, getAllTestResults, getAllScheduledSessions, signOut, supabase } from '../lib/supabase';

function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const hasAdminRole = await hasRole('admin');
    if (!hasAdminRole) {
      alert('No tienes permisos de administrador para acceder a este panel');
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
      console.error('Error loading admin dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      alert(`Rol actualizado a: ${newRole}`);
      await loadData(); // Recargar datos
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Error al actualizar el rol');
    }
  };

  // Estadísticas
  const stats = {
    totalUsers: users.length,
    totalTests: testResults.length,
    totalSessions: sessions.length,
    orientadores: users.filter(u => u.role === 'orientador').length,
    admins: users.filter(u => u.role === 'admin').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-orienta-dark flex items-center justify-center">
        <div className="text-white">Cargando panel de administración...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orienta-dark">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/50 to-orienta-blue/20 border-b border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield size={32} className="text-purple-400" />
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">Panel de Administración</h1>
                <p className="text-white/60">Control total del sistema OrientaIA</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/orientador')}
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Vista Orientador
              </button>
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
      </div>

      {/* Stats */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
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
              <span className="text-3xl font-bold text-white">{stats.totalSessions}</span>
            </div>
            <p className="text-white/60 text-sm">Sesiones Total</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 border border-white/20 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <UserCog size={24} className="text-blue-400" />
              <span className="text-3xl font-bold text-white">{stats.orientadores}</span>
            </div>
            <p className="text-white/60 text-sm">Orientadores</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 border border-white/20 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <Shield size={24} className="text-purple-400" />
              <span className="text-3xl font-bold text-white">{stats.admins}</span>
            </div>
            <p className="text-white/60 text-sm">Administradores</p>
          </motion.div>
        </div>

        {/* Users Management */}
        <div className="bg-white/5 border border-white/20 rounded-xl p-6">
          <h3 className="text-2xl font-bold text-white mb-6">Gestión de Usuarios</h3>

          <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2 mb-6 max-w-md">
            <Search size={20} className="text-white/60" />
            <input
              type="text"
              placeholder="Buscar usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-white w-full placeholder-white/40"
            />
          </div>

          <div className="space-y-4">
            {users
              .filter(user =>
                user.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(user => (
                <div
                  key={user.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="text-white font-semibold">{user.nombre}</h4>
                        <span className={`px-2 py-1 text-xs rounded ${
                          user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                          user.role === 'orientador' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                      <p className="text-white/60 text-sm">{user.user_email}</p>
                      <div className="flex gap-4 mt-2 text-xs text-white/40">
                        <span>Edad: {user.edad}</span>
                        <span>Género: {user.genero}</span>
                        <span>Registro: {new Date(user.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Role Management */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleChangeRole(user.user_id, 'user')}
                        disabled={user.role === 'user'}
                        className="px-3 py-1 text-xs bg-gray-500/20 text-gray-400 rounded hover:bg-gray-500/30 disabled:opacity-50 transition-colors"
                      >
                        User
                      </button>
                      <button
                        onClick={() => handleChangeRole(user.user_id, 'orientador')}
                        disabled={user.role === 'orientador'}
                        className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 disabled:opacity-50 transition-colors"
                      >
                        Orientador
                      </button>
                      <button
                        onClick={() => handleChangeRole(user.user_id, 'admin')}
                        disabled={user.role === 'admin'}
                        className="px-3 py-1 text-xs bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 disabled:opacity-50 transition-colors"
                      >
                        Admin
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
