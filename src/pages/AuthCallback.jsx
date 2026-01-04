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

          // Verificar si el usuario ya completó su perfil
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            // Error real (no solo "no encontrado")
            console.error('Error checking profile:', profileError);
          }

          if (profile) {
            // Ya tiene perfil, ir al destino solicitado o al test
            const returnTo = sessionStorage.getItem('returnTo') || '/test';
            sessionStorage.removeItem('returnTo');
            navigate(returnTo);
          } else {
            // No tiene perfil, redirigir a completar perfil
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
