import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

          {/* CTA Button */}
          <div className="hidden md:block">
            <button className="btn-primary">
              Explorar Plataforma
            </button>
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
              <button className="btn-primary w-full mt-4">
                Explorar Plataforma
              </button>
            </nav>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};

export default Header; 