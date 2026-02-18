import { motion, AnimatePresence } from 'framer-motion'

// Animation variants
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
}

export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export const fadeInDown = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 }
}

export const fadeInLeft = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
}

export const fadeInRight = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 }
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 }
}

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

// Animation props presets
export const animationPresets = {
  fast: { duration: 0.2 },
  normal: { duration: 0.3 },
  slow: { duration: 0.5 }
}

// Reusable Animated component
export function Animated({ 
  children, 
  animation = 'fadeInUp', 
  delay = 0,
  duration = 0.5,
  className = '',
  ...props 
}) {
  const variants = {
    fadeIn,
    fadeInUp,
    fadeInDown,
    fadeInLeft,
    fadeInRight,
    scaleIn
  }

  const SelectedMotion = motion.div

  return (
    <SelectedMotion
      className={className}
      initial="hidden"
      animate="visible"
      variants={variants[animation]}
      transition={{ 
        duration, 
        delay, 
        ease: 'easeOut' 
      }}
      {...props}
    >
      {children}
    </SelectedMotion>
  )
}

// Animated list with stagger
export function AnimatedList({ 
  children, 
  animation = 'fadeInUp',
  className = '',
  ...props 
}) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Animated card with hover effect
export function AnimatedCard({ 
  children, 
  className = '',
  hoverEffect = 'lift',
  ...props 
}) {
  const hoverVariants = {
    lift: { y: -4, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)' },
    scale: { scale: 1.02 },
    glow: { boxShadow: '0 0 30px rgba(99, 102, 241, 0.3)' }
  }

  return (
    <motion.div
      className={className}
      whileHover={hoverVariants[hoverEffect]}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Page transition wrapper
export function PageTransition({ children, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}

// Skeleton loading component
export function Skeleton({ className = '', ...props }) {
  return (
    <div 
      className={`shimmer bg-gray-200 rounded ${className}`}
      {...props}
    />
  )
}

// Button with micro-interaction
export function AnimatedButton({ 
  children, 
  className = '',
  variant = 'primary',
  ...props 
}) {
  return (
    <motion.button
      className={`btn-micro ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
      {...props}
    >
      {children}
    </motion.button>
  )
}

// Number counter animation
export function CountUp({ value, className = '' }) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {value}
    </motion.span>
  )
}

export default {
  Animated,
  AnimatedList,
  AnimatedCard,
  PageTransition,
  Skeleton,
  AnimatedButton,
  fadeIn,
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  staggerContainer
}
