// Variantes de animacion compartidas para Framer Motion
// Usa spring para movimientos naturales y variados

export const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring', stiffness: 100, damping: 20 }
};

export const fadeLeft = {
  initial: { opacity: 0, x: -40 },
  animate: { opacity: 1, x: 0 },
  transition: { type: 'spring', stiffness: 100, damping: 20 }
};

export const fadeRight = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  transition: { type: 'spring', stiffness: 100, damping: 20 }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { type: 'spring', stiffness: 150, damping: 15 }
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};

export const buttonHover = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.98 },
  transition: { type: 'spring', stiffness: 400, damping: 17 }
};

export const cardHover = {
  whileHover: { y: -4, boxShadow: '0 20px 40px rgba(79, 70, 229, 0.1)' },
  transition: { type: 'spring', stiffness: 300, damping: 20 }
};
