import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, signInWithGoogle, signOut, getCurrentUser } from '../lib/supabase';
import { LogOut, User, KeyRound } from 'lucide-react';

/**
 * Componente de autenticación con Google Sign-In
 * Muestra botón de login si no está autenticado
 * Muestra info del usuario + botón logout si está autenticado
 */
function GoogleSignIn({ onAuthChange, onSuccess, showUserInfo = true, buttonText = 'Continuar con Google', showActivationLink = true }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verificar sesión al montar
    checkUser();

    // Escuchar cambios de autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);

      if (session?.user) {
        setUser(session.user);
        if (onAuthChange) onAuthChange(session.user);
        if (onSuccess) onSuccess(session.user);
      } else {
        setUser(null);
        if (onAuthChange) onAuthChange(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [onAuthChange]);

  const checkUser = async () => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (onAuthChange && currentUser) onAuthChange(currentUser);
    } catch (err) {
      console.error('Error checking user:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
      // El redirect se maneja automáticamente
    } catch (err) {
      console.error('Error signing in:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
      setUser(null);
      if (onAuthChange) onAuthChange(null);
    } catch (err) {
      console.error('Error signing out:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="w-6 h-6 border-2 border-orienta-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Usuario autenticado
  if (user && showUserInfo) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-2 bg-white/10 rounded-lg border border-white/20"
      >
        {user.user_metadata?.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt={user.user_metadata.full_name || user.email}
            className="w-8 h-8 rounded-full border-2 border-white/30"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-orienta-blue flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {user.user_metadata?.full_name || 'Usuario'}
          </p>
          <p className="text-xs text-white/60 truncate">{user.email}</p>
        </div>

        <button
          onClick={handleSignOut}
          disabled={loading}
          className="p-2 hover:bg-white/10 rounded transition-colors"
          title="Cerrar sesión"
        >
          <LogOut size={16} className="text-white/80" />
        </button>
      </motion.div>
    );
  }

  // Usuario autenticado (versión compacta)
  if (user && !showUserInfo) {
    return (
      <button
        onClick={handleSignOut}
        disabled={loading}
        className="px-4 py-2 text-sm text-white/80 hover:text-white transition-colors"
      >
        Cerrar sesión
      </button>
    );
  }

  // No autenticado - Mostrar botón de login
  return (
    <div className="space-y-2">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white text-gray-800 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>{buttonText}</span>
          </>
        )}
      </motion.button>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-red-400 text-center"
        >
          {error}
        </motion.p>
      )}

      {/* Enlace de activación para estudiantes con código del colegio */}
      {showActivationLink && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          onClick={() => navigate('/activate')}
          className="w-full flex items-center justify-center gap-2 text-sm text-white/60 hover:text-white transition-colors py-2"
        >
          <KeyRound size={14} />
          ¿Tienes un código de activación?
        </motion.button>
      )}
    </div>
  );
}

export default GoogleSignIn;
