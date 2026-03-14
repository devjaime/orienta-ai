import { Mail, MapPin, Code2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    plataforma: [
      { name: "Test Vocacional", href: "/test" },
      { name: "Demo Informe", href: "/demo-informe" },
      { name: "Demo Colegio", href: "/demo-colegio" }
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
              className="text-white/70 mb-4 leading-relaxed max-w-md"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              Prototipo tecnológico de plataforma de orientación vocacional para
              jóvenes de Chile y Latinoamérica. Desarrollado como exploración técnica.
            </motion.p>

            <motion.div
              className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 max-w-md"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              viewport={{ once: true }}
            >
              <p className="text-white/90 text-sm font-medium mb-1">Desarrollo y arquitectura de plataforma:</p>
              <p className="text-vocari-primary font-semibold">Jaime Hernández</p>
            </motion.div>

            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <motion.a
                href="mailto:hernandez.hs@gmail.com"
                className="flex items-center gap-3 text-white/70 hover:text-vocari-primary transition-colors"
                whileHover={{ x: 4 }}
              >
                <Mail size={16} />
                hernandez.hs@gmail.com
              </motion.a>
              <div className="flex items-center gap-3 text-white/70">
                <MapPin size={16} />
                <span>Santiago, Chile</span>
              </div>
              <motion.a
                href="https://github.com/devjaime/orienta-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-white/70 hover:text-vocari-primary transition-colors"
                whileHover={{ x: 4 }}
              >
                <Code2 size={16} />
                Ver código y documentación técnica
                <ExternalLink size={12} />
              </motion.a>
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
                    <motion.div whileHover={{ x: 4 }}>
                      <Link
                        to={link.href}
                        className="text-white/70 hover:text-vocari-primary transition-colors duration-300 text-sm block"
                      >
                        {link.name}
                      </Link>
                    </motion.div>
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
          className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <p className="text-white/60 text-sm mb-1">
              &copy; 2024–{currentYear} Vocari · Prototipo tecnológico. Todos los derechos reservados.
            </p>
            <p className="text-white/40 text-xs mb-1">
              Desarrollo y arquitectura de plataforma: <strong className="text-white/60">Jaime Hernández</strong>
              &nbsp;·&nbsp; Participante: <strong className="text-white/60">Natalia Soto</strong>
            </p>
            <p className="text-white/30 text-xs">
              Contacto: hernandez.hs@gmail.com &nbsp;·&nbsp;
              Uso comercial restringido — ver{' '}
              <a
                href="https://github.com/devjaime/orienta-ai/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white/60 transition-colors"
              >
                Licencia
              </a>
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-white/50">
            <span>Exploración técnica</span>
            <span>&bull;</span>
            <span>Portafolio profesional</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
