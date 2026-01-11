import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    producto: [
      { name: "Test Vocacional", href: "#test" },
      { name: "Cómo Funciona", href: "#solucion" },
      { name: "Precios", href: "#" },
      { name: "Demo", href: "#solucion" }
    ],
    empresa: [
      { name: "Acerca de", href: "#" },
      { name: "Nuestro Equipo", href: "#" },
      { name: "Carreras", href: "#" },
      { name: "Prensa", href: "#" }
    ],
    recursos: [
      { name: "Blog", href: "#" },
      { name: "Guías", href: "#" },
      { name: "Webinars", href: "#" },
      { name: "Centro de Ayuda", href: "#" }
    ],
    legal: [
      { name: "Política de Privacidad", href: "#" },
      { name: "Términos de Servicio", href: "#" },
      { name: "Cookies", href: "#" },
      { name: "GDPR", href: "#" }
    ]
  };

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Youtube, href: "#", label: "YouTube" }
  ];

  return (
    <footer className="bg-orienta-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <motion.div
              className="flex items-center space-x-2 mb-4"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="w-8 h-8 bg-orienta-blue rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <span className="text-white font-poppins font-semibold text-xl">Vocari</span>
            </motion.div>
            <motion.p 
              className="text-white/70 mb-6 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              Transformando la orientación vocacional en Latinoamérica mediante 
              inteligencia artificial y un enfoque humano que empodera a los jóvenes 
              para tomar decisiones conscientes sobre su futuro profesional.
            </motion.p>
            
            {/* Contact Info */}
            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 text-white/70">
                <Mail size={16} />
                <span>hola@vocari.com</span>
              </div>
              <div className="flex items-center gap-3 text-white/70">
                <Phone size={16} />
                <span>+56 9 1234 5678</span>
              </div>
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
                    <a 
                      href={link.href}
                      className="text-white/70 hover:text-orienta-blue transition-colors duration-300 text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Social Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="flex justify-center mb-8"
        >
          <div className="flex space-x-4">
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.href}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-orienta-blue transition-all duration-300 group"
                aria-label={social.label}
              >
                <social.icon 
                  size={20} 
                  className="text-white/70 group-hover:text-white transition-colors duration-300" 
                />
              </a>
            ))}
          </div>
        </motion.div>

        {/* Newsletter Signup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
          className="bg-white/5 rounded-2xl p-6 mb-8"
        >
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">
              Mantente informado
            </h3>
            <p className="text-white/70 mb-4">
              Recibe las últimas noticias sobre orientación vocacional y nuevas funcionalidades
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Tu correo electrónico"
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-orienta-blue transition-colors duration-300"
              />
              <button className="btn-primary px-6 py-3">
                Suscribirse
              </button>
            </div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center"
        >
          <p className="text-white/60 text-sm mb-4 md:mb-0">
            © {currentYear} Vocari. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6 text-sm text-white/60">
            <span>Hecho con ❤️ en Chile</span>
            <span>•</span>
            <span>Para Latinoamérica</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer; 