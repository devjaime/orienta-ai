import { Menu, X, LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCurrentUser, signOut } from '../lib/supabase';
import { useLanguage } from '../lib/i18n/LanguageContext';
import { t, tx } from '../lib/i18n/translations';

const Header = ({ onStartTest }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const location = useLocation();
  const { lang, toggle } = useLanguage();

  const isB2B = location.pathname.startsWith('/colegios');

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
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
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/60 shadow-sm"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2"
          >
            <div className={`w-8 h-8 ${isB2B ? 'bg-vocari-light' : 'bg-vocari-primary'} rounded-lg flex items-center justify-center`}>
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <span className="text-vocari-dark font-poppins font-semibold text-xl">Vocari</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#como-funciona" className="text-gray-600 hover:text-vocari-primary transition-colors duration-300 text-sm font-medium">
              {tx(t.header.navHowItWorks, lang)}
            </a>
            <a href="#sobre-el-proyecto" className="text-gray-600 hover:text-vocari-primary transition-colors duration-300 text-sm font-medium">
              {tx(t.header.navAbout, lang)}
            </a>
            <a href="#arquitectura" className="text-gray-600 hover:text-vocari-primary transition-colors duration-300 text-sm font-medium">
              {tx(t.header.navArchitecture, lang)}
            </a>
            <a
              href="https://github.com/devjaime/orienta-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-vocari-primary transition-colors duration-300 text-sm font-medium"
            >
              {tx(t.header.navCode, lang)}
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language toggle */}
            <button
              onClick={toggle}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-vocari-primary hover:text-vocari-primary transition-all"
              title={lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
            >
              {lang === 'es' ? 'EN' : 'ES'}
            </button>
            {!user ? (
              <>
                <Link
                  to="/test"
                  className="btn-primary text-sm px-6 py-2.5 inline-flex items-center gap-1.5"
                >
                  {tx(t.header.cta, lang)}
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-3">
                {userRole === 'admin' && (
                  <Link
                    to="/admin"
                    className="text-vocari-primary hover:text-vocari-light transition-colors text-sm font-medium"
                  >
                    Admin
                  </Link>
                )}
                {(userRole === 'orientador' || userRole === 'admin') && (
                  <Link
                    to="/orientador"
                    className="text-vocari-primary hover:text-vocari-light transition-colors text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                )}
                {userRole === 'estudiante' && (
                  <Link
                    to="/dashboard"
                    className="text-vocari-primary hover:text-vocari-light transition-colors text-sm font-medium"
                  >
                    Mi Dashboard
                  </Link>
                )}

                <img
                  src={user.user_metadata?.avatar_url}
                  alt={user.user_metadata?.full_name}
                  className="w-8 h-8 rounded-full border-2 border-vocari-primary/30"
                />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Cerrar sesion"
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-700 p-2"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            className="md:hidden py-4 border-t border-gray-100"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <nav className="flex flex-col space-y-4">
              <a href="#como-funciona" className="text-gray-600 hover:text-vocari-primary transition-colors duration-300">
                {tx(t.header.navHowItWorks, lang)}
              </a>
              <a href="#sobre-el-proyecto" className="text-gray-600 hover:text-vocari-primary transition-colors duration-300">
                {tx(t.header.navAbout, lang)}
              </a>
              <a href="#arquitectura" className="text-gray-600 hover:text-vocari-primary transition-colors duration-300">
                {tx(t.header.navArchitecture, lang)}
              </a>
              <a
                href="https://github.com/devjaime/orienta-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-vocari-primary transition-colors duration-300 font-medium"
              >
                {tx(t.header.navCode, lang)}
              </a>
              <button
                onClick={toggle}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-vocari-primary hover:text-vocari-primary transition-all w-fit"
              >
                {lang === 'es' ? '🌐 English' : '🌐 Español'}
              </button>
              <Link
                to="/test"
                className="btn-primary w-full text-center block"
              >
                {tx(t.header.cta, lang)}
              </Link>

              {user && (
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  {userRole === 'admin' && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-2 bg-vocari-primary/10 text-vocari-primary px-4 py-3 rounded-xl w-full"
                    >
                      <User size={18} />
                      <span>Panel de Administracion</span>
                    </Link>
                  )}
                  {(userRole === 'orientador' || userRole === 'admin') && (
                    <Link
                      to="/orientador"
                      className="flex items-center gap-2 bg-vocari-primary/10 text-vocari-primary px-4 py-3 rounded-xl w-full"
                    >
                      <User size={18} />
                      <span>Dashboard Orientador</span>
                    </Link>
                  )}

                  <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.user_metadata?.avatar_url}
                        alt={user.user_metadata?.full_name}
                        className="w-10 h-10 rounded-full border-2 border-vocari-primary/30"
                      />
                      <div>
                        <p className="text-gray-900 font-medium text-sm">
                          {user.user_metadata?.full_name}
                        </p>
                        <p className="text-gray-500 text-xs">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors px-3 py-2"
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
