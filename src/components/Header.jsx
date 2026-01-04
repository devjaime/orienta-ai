import { motion } from 'framer-motion';
import { Menu, X, MessageCircle, LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCurrentUser, signOut } from '../lib/supabase';

const Header = ({ onOpenChat, onStartTest }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      // Get user role
      const { getUserProfile } = await import('../lib/supabase');
      const profile = await getUserProfile();
      setUserRole(profile?.role || 'user');
    }
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    window.location.href = '/';
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <motion.header 
      className="fixed top-0 left-0 right-0 z-50 bg-orienta-dark/95 backdrop-blur-sm border-b border-orienta-blue/20"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div 
            className="flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-8 h-8 bg-orienta-blue rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="text-white font-poppins font-semibold text-xl">Brújula</span>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a href="#problema" className="text-white/80 hover:text-orienta-blue transition-colors duration-300">
              El Problema
            </a>
            <a href="#solucion" className="text-white/80 hover:text-orienta-blue transition-colors duration-300">
              Nuestra Solución
            </a>
            <a href="#comparativa" className="text-white/80 hover:text-orienta-blue transition-colors duration-300">
              Comparativa
            </a>
            <a href="#test" className="text-white/80 hover:text-orienta-blue transition-colors duration-300">
              Test Vocacional
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={onOpenChat}
              className="flex items-center gap-2 bg-orienta-blue/20 text-orienta-blue px-4 py-2 rounded-xl hover:bg-orienta-blue/30 transition-all duration-300"
            >
              <MessageCircle size={18} />
              <span>Chat IA</span>
            </button>
            <button
              onClick={onStartTest}
              className="btn-primary"
            >
              Hacer Test Vocacional
            </button>

            {/* User Menu */}
            {user && (
              <div className="flex items-center gap-4 pl-4 border-l border-white/20">
                {/* Dashboard Links */}
                {userRole === 'admin' && (
                  <a
                    href="/admin"
                    className="text-purple-400 hover:text-purple-300 transition-colors text-sm font-medium"
                  >
                    Admin
                  </a>
                )}
                {(userRole === 'orientador' || userRole === 'admin') && (
                  <a
                    href="/orientador"
                    className="text-orienta-blue hover:text-blue-300 transition-colors text-sm font-medium"
                  >
                    Dashboard
                  </a>
                )}

                <img
                  src={user.user_metadata?.avatar_url}
                  alt={user.user_metadata?.full_name}
                  className="w-8 h-8 rounded-full border-2 border-orienta-blue/50"
                />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white p-2"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div 
            className="md:hidden py-4 border-t border-orienta-blue/20"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <nav className="flex flex-col space-y-4">
              <a href="#problema" className="text-white/80 hover:text-orienta-blue transition-colors duration-300">
                El Problema
              </a>
              <a href="#solucion" className="text-white/80 hover:text-orienta-blue transition-colors duration-300">
                Nuestra Solución
              </a>
              <a href="#comparativa" className="text-white/80 hover:text-orienta-blue transition-colors duration-300">
                Comparativa
              </a>
              <a href="#test" className="text-white/80 hover:text-orienta-blue transition-colors duration-300">
                Test Vocacional
              </a>
              <button
                onClick={onOpenChat}
                className="flex items-center gap-2 bg-orienta-blue/20 text-orienta-blue px-4 py-2 rounded-xl hover:bg-orienta-blue/30 transition-all duration-300 w-full justify-center"
              >
                <MessageCircle size={18} />
                <span>Chat IA</span>
              </button>
              <button
                onClick={onStartTest}
                className="btn-primary w-full"
              >
                Hacer Test Vocacional
              </button>

              {/* User Info & Logout (Mobile) */}
              {user && (
                <div className="pt-4 border-t border-white/20 space-y-3">
                  {/* Dashboard Links */}
                  {userRole === 'admin' && (
                    <a
                      href="/admin"
                      className="flex items-center gap-2 bg-purple-500/20 text-purple-400 px-4 py-3 rounded-xl hover:bg-purple-500/30 transition-all duration-300 w-full"
                    >
                      <User size={18} />
                      <span>Panel de Administración</span>
                    </a>
                  )}
                  {(userRole === 'orientador' || userRole === 'admin') && (
                    <a
                      href="/orientador"
                      className="flex items-center gap-2 bg-orienta-blue/20 text-orienta-blue px-4 py-3 rounded-xl hover:bg-orienta-blue/30 transition-all duration-300 w-full"
                    >
                      <User size={18} />
                      <span>Dashboard Orientador</span>
                    </a>
                  )}

                  <div className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.user_metadata?.avatar_url}
                        alt={user.user_metadata?.full_name}
                        className="w-10 h-10 rounded-full border-2 border-orienta-blue/50"
                      />
                      <div>
                        <p className="text-white font-medium text-sm">
                          {user.user_metadata?.full_name}
                        </p>
                        <p className="text-white/60 text-xs">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-white/80 hover:text-white transition-colors px-3 py-2"
                    >
                      <LogOut size={18} />
                      <span className="text-sm">Salir</span>
                    </button>
                  </div>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};

export default Header; 