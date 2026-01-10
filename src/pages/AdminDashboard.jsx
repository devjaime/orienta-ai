import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ClipboardList, Calendar, Shield, Search, LogOut, UserCog, UserPlus, X } from 'lucide-react';
import { hasRole, getAllUsers, getAllTestResults, getAllScheduledSessions, signOut, supabase } from '../lib/supabase';
import { createUserProfile } from '../lib/adminService';

function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Estado para crear nuevo usuario
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    nombre: '',
    role: 'estudiante',
    edad: 18,
    genero: 'Prefiero no decir',
    telefono: ''
  });

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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreatingUser(true);

    try {
      // Validar que el email no esté vacío
      if (!newUser.email || !newUser.nombre) {
        alert('Email y nombre son obligatorios');
        return;
      }

      // Llamar a la función de adminService
      await createUserProfile(
        newUser.email,
        newUser.nombre,
        newUser.role,
        newUser.edad,
        newUser.genero,
        newUser.telefono || null
      );

      alert(`✅ Perfil creado exitosamente para ${newUser.nombre}`);

      // Limpiar formulario
      setNewUser({
        email: '',
        nombre: '',
        role: 'estudiante',
        edad: 18,
        genero: 'Prefiero no decir',
        telefono: ''
      });

      // Cerrar modal y recargar datos
      setShowCreateModal(false);
      await loadData();

    } catch (error) {
      console.error('Error creating user:', error);
      alert(`❌ Error: ${error.message || 'No se pudo crear el perfil'}\n\nEl usuario debe registrarse primero con Google en la app.`);
    } finally {
      setCreatingUser(false);
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
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <UserPlus size={18} />
                Crear Nuevo Usuario
              </button>
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

      {/* Modal: Crear Nuevo Usuario */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-orienta-dark border border-white/20 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Crear Nuevo Usuario</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-sm">
                <strong>Importante:</strong> El usuario debe haberse registrado PRIMERO con Google en la app.
                Luego podrás crear su perfil aquí ingresando su email.
              </p>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Email del Usuario <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="usuario@gmail.com"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-orienta-blue"
                />
                <p className="text-white/40 text-xs mt-1">
                  El usuario ya debe estar registrado con Google
                </p>
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Nombre Completo <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newUser.nombre}
                  onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })}
                  placeholder="Juan Pérez"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-orienta-blue"
                />
              </div>

              {/* Rol */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Rol <span className="text-red-400">*</span>
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-orienta-blue"
                >
                  <option value="estudiante">Estudiante</option>
                  <option value="apoderado">Apoderado</option>
                  <option value="orientador">Orientador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Edad */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Edad
                  </label>
                  <input
                    type="number"
                    min="13"
                    max="120"
                    value={newUser.edad}
                    onChange={(e) => setNewUser({ ...newUser, edad: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-orienta-blue"
                  />
                </div>

                {/* Género */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Género
                  </label>
                  <select
                    value={newUser.genero}
                    onChange={(e) => setNewUser({ ...newUser, genero: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-orienta-blue"
                  >
                    <option value="Mujer">Mujer</option>
                    <option value="Hombre">Hombre</option>
                    <option value="Otro">Otro</option>
                    <option value="Prefiero no decir">Prefiero no decir</option>
                  </select>
                </div>
              </div>

              {/* Teléfono / WhatsApp */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Teléfono / WhatsApp (opcional)
                </label>
                <input
                  type="tel"
                  value={newUser.telefono}
                  onChange={(e) => setNewUser({ ...newUser, telefono: e.target.value })}
                  placeholder="+56912345678"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-orienta-blue"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingUser ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
