import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Bell, Activity, Clock, TrendingUp, Calendar, FileText,
  AlertCircle, CheckCircle, XCircle, Eye, Plus, Mail
} from 'lucide-react';
import {
  getStudentsSummary,
  getParentNotifications,
  markNotificationAsRead,
  getUserActivityLog,
  linkParentToStudent
} from '../lib/auditLog';

export default function ParentDashboard() {
  const [students, setStudents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkError, setLinkError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentActivity(selectedStudent.studentInfo.id);
    }
  }, [selectedStudent]);

  async function loadData() {
    setLoading(true);
    try {
      const [studentsData, notificationsData] = await Promise.all([
        getStudentsSummary(),
        getParentNotifications(false)
      ]);

      setStudents(studentsData);
      setNotifications(notificationsData);

      if (studentsData.length > 0) {
        setSelectedStudent(studentsData[0]);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadStudentActivity(studentId) {
    try {
      const logs = await getUserActivityLog(studentId, { limit: 20 });
      setActivityLog(logs);
    } catch (error) {
      console.error('Error cargando actividad:', error);
    }
  }

  async function handleMarkAsRead(notificationId) {
    const success = await markNotificationAsRead(notificationId);
    if (success) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    }
  }

  async function handleLinkStudent() {
    setLinkError('');
    try {
      await linkParentToStudent(linkEmail, 'apoderado');
      setShowLinkModal(false);
      setLinkEmail('');
      alert('Solicitud enviada. El estudiante debe aceptar la vinculación.');
      loadData();
    } catch (error) {
      setLinkError(error.message);
    }
  }

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'test_completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'test_started': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'user_login': return <Activity className="w-4 h-4 text-purple-500" />;
      case 'career_viewed': return <Eye className="w-4 h-4 text-yellow-500" />;
      case 'dashboard_viewed': return <TrendingUp className="w-4 h-4 text-blue-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatActionDescription = (actionType) => {
    const descriptions = {
      test_completed: 'Completó test vocacional',
      test_started: 'Inició test vocacional',
      user_login: 'Inició sesión',
      user_logout: 'Cerró sesión',
      career_viewed: 'Consultó una carrera',
      dashboard_viewed: 'Visitó el dashboard',
      profile_updated: 'Actualizó su perfil',
      session_scheduled: 'Agendó sesión de orientación'
    };
    return descriptions[actionType] || actionType;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Panel de Apoderado</h1>
              <p className="text-gray-600 mt-1">Seguimiento y progreso de tus hijos</p>
            </div>

            <button
              onClick={() => setShowLinkModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Vincular Estudiante
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Notificaciones */}
        {notifications.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Bell className="w-6 h-6 text-blue-600" />
              Notificaciones Recientes
            </h2>
            <div className="space-y-3">
              {notifications.slice(0, 5).map(notification => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.created_at).toLocaleString('es-CL')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <XCircle size={20} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Estudiantes */}
        {students.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay estudiantes vinculados
            </h3>
            <p className="text-gray-600 mb-6">
              Vincúlate con tus hijos para hacer seguimiento de su progreso vocacional
            </p>
            <button
              onClick={() => setShowLinkModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Vincular Primer Estudiante
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Lista de Estudiantes */}
            <div className="lg:col-span-1">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Mis Hijos</h2>
              <div className="space-y-3">
                {students.map(student => (
                  <button
                    key={student.relationship.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedStudent?.relationship.id === student.relationship.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {student.studentInfo?.user_metadata?.full_name || 'Estudiante'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {student.stats?.totalActions || 0} actividades (30d)
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Detalles del Estudiante Seleccionado */}
            <div className="lg:col-span-2">
              {selectedStudent && (
                <>
                  {/* Estadísticas */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-lg shadow-sm p-4">
                      <Activity className="w-8 h-8 text-blue-600 mb-2" />
                      <p className="text-sm text-gray-600">Actividades</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedStudent.stats?.totalActions || 0}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4">
                      <FileText className="w-8 h-8 text-green-600 mb-2" />
                      <p className="text-sm text-gray-600">Tests</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedStudent.lastTest ? '1' : '0'}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4">
                      <Clock className="w-8 h-8 text-purple-600 mb-2" />
                      <p className="text-sm text-gray-600">Última actividad</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {activityLog[0]
                          ? new Date(activityLog[0].created_at).toLocaleDateString('es-CL')
                          : 'N/A'}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4">
                      <TrendingUp className="w-8 h-8 text-yellow-600 mb-2" />
                      <p className="text-sm text-gray-600">Código Holland</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedStudent.lastTest?.codigo_holland || '-'}
                      </p>
                    </div>
                  </div>

                  {/* Último Test */}
                  {selectedStudent.lastTest && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Resultado del Test Vocacional
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Código Holland</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {selectedStudent.lastTest.codigo_holland}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Nivel de Certeza</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {selectedStudent.lastTest.certeza}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Fecha</p>
                          <p className="text-sm text-gray-900">
                            {new Date(selectedStudent.lastTest.created_at).toLocaleDateString('es-CL')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Duración</p>
                          <p className="text-sm text-gray-900">
                            {selectedStudent.lastTest.duracion_minutos} minutos
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Log de Actividad */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-blue-600" />
                      Actividad Reciente
                    </h3>
                    <div className="space-y-3">
                      {activityLog.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                          No hay actividad registrada
                        </p>
                      ) : (
                        activityLog.map(log => (
                          <div
                            key={log.id}
                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            {getActionIcon(log.action_type)}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {formatActionDescription(log.action_type)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(log.created_at).toLocaleString('es-CL')}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Vincular Estudiante */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Vincular Estudiante
            </h2>
            <p className="text-gray-600 mb-6">
              Ingresa el email del estudiante que deseas vincular. Él/ella deberá aceptar la solicitud.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email del Estudiante
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={linkEmail}
                  onChange={(e) => setLinkEmail(e.target.value)}
                  placeholder="estudiante@example.com"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {linkError && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle size={16} />
                  {linkError}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkEmail('');
                  setLinkError('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleLinkStudent}
                disabled={!linkEmail}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enviar Solicitud
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
