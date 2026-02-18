import { Mail, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    producto: [
      { name: "Test Vocacional", href: "/test" },
      { name: "Informes", href: "/informes" },
      { name: "Para Colegios", href: "/colegios" }
    ],
    legal: [
      { name: "Politica de Privacidad", href: "/privacidad" },
      { name: "Terminos de Servicio", href: "/terminos" }
    ]
  };

  return (
    <footer className="bg-vocari-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <motion.div
              className="flex items-center space-x-2 mb-4"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="w-8 h-8 bg-vocari-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <span className="text-white font-poppins font-semibold text-xl">Vocari</span>
            </motion.div>
            <motion.p
              className="text-white/70 mb-6 leading-relaxed max-w-md"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              Orientacion vocacional basada en ciencia y datos reales del MINEDUC
              para jovenes de Chile y Latinoamerica.
            </motion.p>

            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <motion.a 
                href="mailto:hola@vocari.com" 
                className="flex items-center gap-3 text-white/70 hover:text-vocari-primary transition-colors"
                whileHover={{ x: 4 }}
              >
                <Mail size={16} />
                hola@vocari.com
              </motion.a>
              <div className="flex items-center gap-3 text-white/70">
                <MapPin size={16} />
                <span>Santiago, Chile</span>
              </div>
            </motion.div>
          </div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([category, links], index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="font-semibold text-white mb-4 capitalize">
                {category}
              </h3>
              <ul className="space-y-2">
                {links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <motion.a
                      href={link.href}
                      className="text-white/70 hover:text-vocari-primary transition-colors duration-300 text-sm block"
                      whileHover={{ x: 4 }}
                    >
                      {link.name}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center"
        >
          <p className="text-white/60 text-sm mb-4 md:mb-0">
            &copy; {currentYear} Vocari. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6 text-sm text-white/60">
            <span>Hecho con amor en Chile</span>
            <span>&bull;</span>
            <span>Para Latinoamerica</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
