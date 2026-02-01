import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * Página de callback después de autenticar con Google
 * Maneja el redirect de OAuth y redirige al test
 */
function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase maneja automáticamente el hash fragment
    // Solo necesitamos esperar y redirigir
    const handleCallback = async () => {
      try {
        // Verificar que el usuario esté autenticado
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error in auth callback:', error);
          navigate('/?error=auth_failed');
          return;
        }

        if (session) {
          console.log('✅ Usuario autenticado:', session.user.email);

          // PASO 1: Verificar si ya tiene perfil vinculado por user_id
          let { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error checking profile:', profileError);
          }

          // PASO 2: Verificar si hay código de activación pendiente (flujo B2B)
          const pendingActivationCode = localStorage.getItem('pendingActivationCode');
          if (pendingActivationCode && !profile) {
            console.log('🔑 Procesando código de activación:', pendingActivationCode);

            // Buscar perfil con el código de activación
            const { data: activationProfile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('activation_code', pendingActivationCode)
              .eq('is_activated', false)
              .single();

            if (activationProfile) {
              console.log('🔗 Activando cuenta con código...');

              const { error: activateError } = await supabase
                .from('user_profiles')
                .update({
                  user_id: session.user.id,
                  is_activated: true,
                  status: 'active',
                  activation_code: null // Limpiar código usado
                })
                .eq('id', activationProfile.id);

              if (!activateError) {
                console.log('✅ Cuenta activada exitosamente');
                profile = { ...activationProfile, user_id: session.user.id, is_activated: true };
                localStorage.removeItem('pendingActivationCode');
              } else {
                console.error('❌ Error activando cuenta:', activateError);
              }
            } else {
              console.warn('⚠️ Código de activación inválido o ya usado');
              localStorage.removeItem('pendingActivationCode');
            }
          }

          // PASO 3: Si no tiene perfil vinculado ni activación, buscar perfil pendiente por email
          if (!profile) {
            console.log('🔍 Buscando perfil pendiente por email:', session.user.email);

            const { data: pendingProfile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('user_email', session.user.email)
              .is('user_id', null)
              .single();

            // Si existe un perfil pendiente, vincularlo
            if (pendingProfile) {
              console.log('🔗 Vinculando perfil pendiente...');

              const { error: linkError } = await supabase
                .from('user_profiles')
                .update({ user_id: session.user.id })
                .eq('id', pendingProfile.id);

              if (!linkError) {
                console.log('✅ Perfil vinculado exitosamente');
                profile = { ...pendingProfile, user_id: session.user.id };
              } else {
                console.error('❌ Error vinculando perfil:', linkError);
              }
            }
          }

          // PASO 4: Redirigir según el perfil
          if (profile) {
            // Ya tiene perfil, redirigir según el rol
            const roleRedirects = {
              super_admin: '/admin',
              admin: '/admin',
              admin_colegio: '/admin',
              orientador: '/orientador/dashboard',
              apoderado: '/parent',
              estudiante: '/dashboard'
            };

            const defaultRedirect = roleRedirects[profile.role] || '/dashboard';
            const returnTo = sessionStorage.getItem('returnTo') || defaultRedirect;
            sessionStorage.removeItem('returnTo');

            console.log('🚀 Redirigiendo a:', returnTo);
            navigate(returnTo);
          } else {
            // No tiene perfil (ni vinculado ni pendiente), completar perfil
            console.log('📝 Redirigiendo a completar perfil');
            navigate('/complete-profile');
          }
        } else {
          // No hay sesión, volver al inicio
          navigate('/');
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        navigate('/?error=unexpected');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-orienta-dark flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-orienta-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-white mb-2">Autenticando...</h2>
        <p className="text-white/60">Espera un momento mientras completamos el inicio de sesión</p>
      </div>
    </div>
  );
}

export default AuthCallback;
