import { motion } from 'framer-motion';
import { Users, GraduationCap, Shield, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import GoogleSignIn from './GoogleSignIn';

function ProfileSelector() {
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  const profiles = [
    {
      id: 'estudiante',
      title: 'Estudiante',
      description: 'Descubre tu vocación con nuestro test IA y recibe orientación personalizada',
      icon: GraduationCap,
      color: 'blue',
      features: [
        'Test vocacional con IA',
        'Recomendaciones de carreras',
        'Chat con orientador virtual',
        'Seguimiento de progreso'
      ],
      path: '/dashboard'
    },
    {
      id: 'orientador',
      title: 'Orientador',
      description: 'Gestiona estudiantes, agenda sesiones y genera reportes con IA',
      icon: Users,
      color: 'purple',
      features: [
        'Dashboard de estudiantes',
        'Gestión de disponibilidad',
        'Apuntes con resumen IA',
        'Timeline de progreso'
      ],
      path: '/orientador/dashboard'
    },
    {
      id: 'administrador',
      title: 'Administrador',
      description: 'Administra la plataforma, usuarios y configura el sistema',
      icon: Shield,
      color: 'red',
      features: [
        'Panel de control completo',
        'Gestión de usuarios',
        'Estadísticas globales',
        'Configuración del sistema'
      ],
      path: '/admin'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: {
        bg: 'bg-blue-500/20',
        border: 'border-blue-500/50',
        text: 'text-blue-400',
        hover: 'hover:bg-blue-500/30',
        icon: 'text-blue-400'
      },
      purple: {
        bg: 'bg-purple-500/20',
        border: 'border-purple-500/50',
        text: 'text-purple-400',
        hover: 'hover:bg-purple-500/30',
        icon: 'text-purple-400'
      },
      red: {
        bg: 'bg-red-500/20',
        border: 'border-red-500/50',
        text: 'text-red-400',
        hover: 'hover:bg-red-500/30',
        icon: 'text-red-400'
      }
    };
    return colors[color] || colors.blue;
  };

  const handleProfileClick = (profile) => {
    setSelectedProfile(profile);
    setShowLogin(true);
  };

  const handleLoginSuccess = (user) => {
    // Redirigir según el perfil seleccionado
    if (selectedProfile) {
      window.location.href = selectedProfile.path;
    }
  };

  return (
    <section id="perfiles" className="py-20 bg-orienta-dark relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 right-20 w-40 h-40 bg-orienta-blue rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-purple-500 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            ¿Cómo quieres usar <span className="text-orienta-blue">Brújula</span>?
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Selecciona tu perfil para acceder a las funcionalidades diseñadas para ti
          </p>
        </motion.div>

        {/* Profile Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {profiles.map((profile, index) => {
            const Icon = profile.icon;
            const colors = getColorClasses(profile.color);

            return (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative bg-white/5 border ${colors.border} rounded-2xl p-8 ${colors.hover} transition-all cursor-pointer group`}
                onClick={() => handleProfileClick(profile)}
              >
                {/* Icon */}
                <div className={`${colors.bg} rounded-xl p-4 inline-block mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon className={`${colors.icon}`} size={40} />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-white mb-3">
                  {profile.title}
                </h3>

                {/* Description */}
                <p className="text-white/70 mb-6">
                  {profile.description}
                </p>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {profile.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-white/60 text-sm">
                      <span className={`${colors.text} mt-1`}>✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  className={`w-full flex items-center justify-center gap-2 ${colors.bg} ${colors.text} px-6 py-3 rounded-lg border ${colors.border} ${colors.hover} transition-all font-semibold group-hover:gap-4`}
                >
                  Ingresar como {profile.title}
                  <ArrowRight size={20} />
                </button>

                {/* Hover Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              </motion.div>
            );
          })}
        </div>

        {/* Login Modal */}
        {showLogin && selectedProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowLogin(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-orienta-dark border border-white/20 rounded-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="text-center mb-6">
                {(() => {
                  const Icon = selectedProfile.icon;
                  const colors = getColorClasses(selectedProfile.color);
                  return (
                    <div className={`${colors.bg} rounded-xl p-4 inline-block mb-4`}>
                      <Icon className={`${colors.icon}`} size={48} />
                    </div>
                  );
                })()}
                <h3 className="text-2xl font-bold text-white mb-2">
                  Ingresar como {selectedProfile.title}
                </h3>
                <p className="text-white/60">
                  Usa tu cuenta de Google para continuar
                </p>
              </div>

              {/* Google Sign In */}
              <div className="mb-6">
                <GoogleSignIn
                  onSuccess={handleLoginSuccess}
                  buttonText={`Continuar como ${selectedProfile.title}`}
                />
              </div>

              {/* Info */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-300 text-sm text-center">
                  Al iniciar sesión, tendrás acceso a todas las funcionalidades de {selectedProfile.title.toLowerCase()}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowLogin(false)}
                className="mt-6 w-full px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Cancelar
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-white/50 text-sm">
            ¿No estás seguro qué perfil elegir?{' '}
            <a href="#test" className="text-orienta-blue hover:underline">
              Prueba primero nuestro test vocacional gratuito
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default ProfileSelector;
