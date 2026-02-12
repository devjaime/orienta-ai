/**
 * ActivateAccount - Página de activación de cuenta con código
 * Permite a estudiantes activar su cuenta usando el código proporcionado por el colegio
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  KeyRound,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Building2,
  User,
  Mail,
  BookOpen
} from 'lucide-react';
import { getCurrentUser, signInWithGoogle } from '../lib/supabase';
import { checkActivationCode, activateAccountWithCode } from '../lib/institutionService';

function ActivateAccount() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [code, setCode] = useState(searchParams.get('code') || '');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [pendingProfile, setPendingProfile] = useState(null);
  const [activated, setActivated] = useState(false);
  const [user, setUser] = useState(null);

  // Verificar si ya hay usuario autenticado
  useEffect(() => {
    checkUser();
  }, []);

  // Verificar código si viene en la URL
  useEffect(() => {
    if (searchParams.get('code')) {
      handleCheckCode();
    }
  }, []);

  const checkUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  // Verificar código de activación
  const handleCheckCode = async () => {
    if (!code || code.length < 6) {
      setError('El código debe tener al menos 6 caracteres');
      return;
    }

    setChecking(true);
    setError('');

    try {
      const profile = await checkActivationCode(code.toUpperCase());

      if (!profile) {
        setError('Código inválido o ya utilizado');
        setPendingProfile(null);
        return;
      }

      setPendingProfile(profile);
    } catch (err) {
      setError(err.message || 'Error al verificar el código');
      setPendingProfile(null);
    } finally {
      setChecking(false);
    }
  };

  // Activar cuenta (si ya está logueado)
  const handleActivate = async () => {
    if (!user) {
      // Necesita iniciar sesión primero
      handleSignIn();
      return;
    }

    setLoading(true);
    setError('');

    try {
      await activateAccountWithCode(code);
      setActivated(true);

      // Redirigir al dashboard después de 2 segundos
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Error al activar la cuenta');
    } finally {
      setLoading(false);
    }
  };

  // Iniciar sesión con Google
  const handleSignIn = async () => {
    try {
      // Guardar código en localStorage para después del callback
      localStorage.setItem('pendingActivationCode', code.toUpperCase());
      await signInWithGoogle();
    } catch (err) {
      setError('Error al iniciar sesión con Google');
    }
  };

  // Formatear código mientras escribe
  const handleCodeChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCode(value);
    setError('');
    setPendingProfile(null);
  };

  return (
    <div className="min-h-screen bg-vocari-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-vocari-dark mb-2">Vocari</h1>
          <p className="text-gray-500">Orientación Vocacional</p>
        </div>

        {/* Card principal */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
          {activated ? (
            // Estado: Cuenta activada
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-400" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-vocari-dark mb-2">¡Cuenta Activada!</h2>
              <p className="text-gray-600 mb-4">
                Tu cuenta ha sido vinculada exitosamente a tu colegio.
              </p>
              <p className="text-gray-400 text-sm">
                Redirigiendo al dashboard...
              </p>
            </motion.div>
          ) : pendingProfile ? (
            // Estado: Código válido, mostrar confirmación
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-vocari-b2b/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-vocari-b2b" size={32} />
                </div>
                <h2 className="text-xl font-bold text-vocari-dark mb-1">¡Código Válido!</h2>
                <p className="text-gray-500 text-sm">Confirma tus datos para activar</p>
              </div>

              {/* Datos del perfil pendiente */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-vocari-b2b/10 rounded-lg flex items-center justify-center">
                    <User className="text-vocari-b2b" size={20} />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Nombre</p>
                    <p className="text-gray-900 font-medium">{pendingProfile.nombre}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-vocari-b2b/10 rounded-lg flex items-center justify-center">
                    <Mail className="text-vocari-b2b" size={20} />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Email</p>
                    <p className="text-gray-900 font-medium">{pendingProfile.user_email}</p>
                  </div>
                </div>

                {pendingProfile.curso && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-vocari-b2b/10 rounded-lg flex items-center justify-center">
                      <BookOpen className="text-vocari-b2b" size={20} />
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Curso</p>
                      <p className="text-gray-900 font-medium">{pendingProfile.curso}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {/* Botón de activación */}
              {user ? (
                <button
                  onClick={handleActivate}
                  disabled={loading}
                  className="w-full py-3 bg-vocari-b2b text-white rounded-xl hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Activando...
                    </>
                  ) : (
                    <>
                      Activar mi Cuenta
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-500 text-sm text-center">
                    Inicia sesión con tu cuenta de Google para activar
                  </p>
                  <button
                    onClick={handleSignIn}
                    className="w-full py-3 bg-white text-gray-900 rounded-xl hover:bg-white/90 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continuar con Google
                  </button>
                </div>
              )}

              {/* Volver */}
              <button
                onClick={() => {
                  setPendingProfile(null);
                  setCode('');
                }}
                className="w-full py-2 text-white/60 hover:text-white text-sm transition-colors"
              >
                Usar otro código
              </button>
            </div>
          ) : (
            // Estado: Ingresar código
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-vocari-b2b/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="text-vocari-b2b" size={32} />
                </div>
                <h2 className="text-xl font-bold text-vocari-dark mb-1">Activar Cuenta</h2>
                <p className="text-gray-500 text-sm">
                  Ingresa el código que te entregó tu colegio
                </p>
              </div>

              {/* Input de código */}
              <div>
                <input
                  type="text"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="XXXXXXXX"
                  maxLength={8}
                  className="w-full px-4 py-4 bg-white/5 border border-gray-300 rounded-xl text-gray-900 text-center text-2xl font-mono tracking-[0.5em] placeholder-gray-400 focus:outline-none focus:border-vocari-b2b uppercase"
                  autoFocus
                />
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {/* Botón verificar */}
              <button
                onClick={handleCheckCode}
                disabled={checking || code.length < 6}
                className="w-full py-3 bg-vocari-b2b text-white rounded-xl hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checking ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    Verificar Código
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              {/* Ayuda */}
              <div className="text-center">
                <p className="text-white/40 text-xs">
                  ¿No tienes código? Contacta a tu orientador o administrador del colegio
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-gray-800 text-sm transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default ActivateAccount;
