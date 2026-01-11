import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, AlertCircle, Clock } from 'lucide-react';
import { getCurrentUser, getUserProfile } from '../lib/supabase';
import { canAccessSystem } from '../lib/adminService';

/**
 * Componente para proteger rutas basado en roles y estados de usuario
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componente hijo a renderizar si tiene acceso
 * @param {Array<string>} props.allowedRoles - Roles permitidos para acceder (ej: ['estudiante', 'admin'])
 * @param {boolean} props.requireActive - Si requiere que el usuario esté activo (default: true)
 * @param {string} props.redirectTo - Ruta a la que redirigir si no tiene acceso (default: '/')
 * @param {string} props.customMessage - Mensaje personalizado de error
 */
function ProtectedRoute({
  children,
  allowedRoles = [],
  requireActive = true,
  redirectTo = '/',
  customMessage = null
}) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessMessage, setAccessMessage] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    setLoading(true);
    try {
      // 1. Verificar que haya usuario autenticado
      const user = await getCurrentUser();
      if (!user) {
        setAccessMessage('Debes iniciar sesión para acceder a esta página');
        setHasAccess(false);
        setTimeout(() => navigate(redirectTo), 2000);
        return;
      }

      // 2. Obtener perfil del usuario
      const profile = await getUserProfile();
      setUserProfile(profile);

      if (!profile) {
        setAccessMessage('No se encontró tu perfil de usuario');
        setHasAccess(false);
        setTimeout(() => navigate(redirectTo), 2000);
        return;
      }

      // 3. Verificar si puede acceder al sistema (estado activo, no suspendido, etc)
      const accessCheck = await canAccessSystem(user.id);
      if (!accessCheck.canAccess) {
        setAccessMessage(customMessage || accessCheck.reason);
        setHasAccess(false);
        setTimeout(() => navigate(redirectTo), 3000);
        return;
      }

      // 4. Verificar rol si se especificaron roles permitidos
      // EXCEPCIÓN: Admin tiene acceso a TODAS las rutas para demos y pruebas
      if (allowedRoles.length > 0 && profile.role !== 'admin') {
        if (!allowedRoles.includes(profile.role)) {
          const roleNames = {
            estudiante: 'estudiantes',
            apoderado: 'apoderados',
            orientador: 'orientadores',
            admin: 'administradores'
          };

          const allowedRolesText = allowedRoles
            .map(r => roleNames[r] || r)
            .join(', ');

          setAccessMessage(
            customMessage ||
            `Esta página está disponible solo para ${allowedRolesText}`
          );
          setHasAccess(false);
          setTimeout(() => navigate(redirectTo), 2000);
          return;
        }
      }

      // 5. Verificar estado activo si es requerido
      if (requireActive && profile.status !== 'active') {
        const statusMessages = {
          pending: 'Tu cuenta está pendiente de aprobación',
          inactive: 'Tu cuenta está inactiva',
          suspended: 'Tu cuenta ha sido suspendida',
          rejected: `Tu solicitud fue rechazada${profile.rejection_reason ? ': ' + profile.rejection_reason : ''}`
        };

        setAccessMessage(customMessage || statusMessages[profile.status] || 'No puedes acceder con el estado actual de tu cuenta');
        setHasAccess(false);
        setTimeout(() => navigate(redirectTo), 3000);
        return;
      }

      // ✅ Tiene acceso
      setHasAccess(true);
    } catch (error) {
      console.error('Error checking access:', error);
      setAccessMessage('Error verificando permisos. Intenta de nuevo.');
      setHasAccess(false);
      setTimeout(() => navigate(redirectTo), 2000);
    } finally {
      setLoading(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-orienta-dark flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-orienta-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Verificando permisos...</p>
        </motion.div>
      </div>
    );
  }

  // Access denied
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-orienta-dark flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white/5 border border-white/20 rounded-2xl p-8 text-center"
        >
          {userProfile?.status === 'pending' ? (
            <>
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="text-yellow-400" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Solicitud Pendiente
              </h2>
              <p className="text-white/70 mb-6">{accessMessage}</p>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                <p className="text-yellow-300 text-sm">
                  Un administrador revisará tu solicitud pronto. Te notificaremos por email cuando sea aprobada.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="text-red-400" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Acceso Denegado
              </h2>
              <p className="text-white/70 mb-6">{accessMessage}</p>
            </>
          )}

          <button
            onClick={() => navigate(redirectTo)}
            className="w-full px-6 py-3 bg-orienta-blue text-white rounded-lg hover:bg-orienta-blue/80 transition-colors"
          >
            Volver al Inicio
          </button>

          {userProfile?.status === 'rejected' && userProfile?.rejection_reason && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-300 text-sm">
                <strong>Razón:</strong> {userProfile.rejection_reason}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // ✅ Access granted - render children
  return <>{children}</>;
}

export default ProtectedRoute;
