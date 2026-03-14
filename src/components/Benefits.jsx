import { useEffect, useRef, useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLanguage } from '../lib/i18n/LanguageContext'
import { t, tx } from '../lib/i18n/translations'

// Animated counter component
function AnimatedCounter({ value, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [isVisible])

  useEffect(() => {
    if (!isVisible) return

    const numValue = parseInt(value.replace(/\D/g, ''))
    const duration = 2000
    const steps = 60
    const increment = numValue / steps

    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= numValue) {
        setCount(numValue)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [isVisible, value])

  return <span ref={ref}>{count}{suffix}</span>
}

export default function Benefits() {
  const { lang } = useLanguage();
  const stats = [
    { value: '1000+', label: tx(t.benefits.stat1, lang) },
    { value: '50+', label: tx(t.benefits.stat2, lang) },
    { value: '4.8/5', label: tx(t.benefits.stat3, lang) },
    { value: '98%', label: tx(t.benefits.stat4, lang) },
  ];
  const benefits = [
    {
      icon: '📊',
      title: tx(t.benefits.b1t, lang),
      description: tx(t.benefits.b1d, lang)
    },
    {
      icon: '🔬',
      title: tx(t.benefits.b2t, lang),
      description: tx(t.benefits.b2d, lang)
    },
    {
      icon: '👨‍⚕️',
      title: tx(t.benefits.b3t, lang),
      description: tx(t.benefits.b3d, lang)
    },
    {
      icon: '⚡',
      title: tx(t.benefits.b4t, lang),
      description: tx(t.benefits.b4d, lang)
    },
    {
      icon: '💰',
      title: tx(t.benefits.b5t, lang),
      description: tx(t.benefits.b5d, lang)
    },
    {
      icon: '🔒',
      title: tx(t.benefits.b6t, lang),
      description: tx(t.benefits.b6d, lang)
    }
  ];
  return (
    <section className="py-20 bg-gradient-to-b from-white to-vocari-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats */}
        <motion.div 
          className="grid md:grid-cols-4 gap-6 mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {stats.map((stat, index) => (
            <motion.div 
              key={index} 
              className="text-center p-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="text-4xl font-black text-vocari-primary mb-2">
                <AnimatedCounter value={stat.value} />
              </div>
              <div className="text-gray-600">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Benefits Grid */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-poppins font-bold text-vocari-dark mb-4">
            {tx(t.benefits.title, lang)}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {tx(t.benefits.subtitle, lang)}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow cursor-default"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div className="text-4xl mb-4">{benefit.icon}</div>
              <h3 className="font-bold text-vocari-dark mb-2">{benefit.title}</h3>
              <p className="text-gray-600 text-sm">{benefit.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Trust badges */}
        <motion.div 
          className="mt-16 flex flex-wrap justify-center items-center gap-8 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          {[
            tx(t.benefits.trust1, lang),
            tx(t.benefits.trust2, lang),
            tx(t.benefits.trust3, lang),
            tx(t.benefits.trust4, lang)
          ].map((text, i) => (
            <motion.div 
              key={i}
              className="flex items-center gap-2 text-gray-600"
              whileHover={{ scale: 1.05 }}
            >
              <CheckCircle className="text-green-500 w-5 h-5" />
              <span className="text-sm">{text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
