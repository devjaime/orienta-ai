import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Hero from '../components/Hero';
import ProblemSection from '../components/ProblemSection';
import HowItWorks from '../components/landing/HowItWorks';
import PricingSection from '../components/landing/PricingSection';
import FAQ from '../components/FAQ';
import Benefits from '../components/Benefits';
import Testimonials from '../components/Testimonials';
import Footer from '../components/Footer';
import AIChat from '../components/AIChat';
import SobreElProyecto from '../components/landing/SobreElProyecto';
import ArquitecturaSistema from '../components/landing/ArquitecturaSistema';

function LandingPage() {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const closeChat = () => {
    setIsChatOpen(false);
  };

  const goToTest = () => {
    navigate('/test');
  };

  return (
    <div className="min-h-screen bg-white">
      <Header onStartTest={goToTest} />

      {/* Banda de autoría — mt-16 para compensar el header fijo */}
      <div className="bg-vocari-primary text-white text-center py-2 text-sm mt-16">
        <span>
          Prototipo tecnológico desarrollado por{' '}
          <strong>Jaime Hernández</strong>
          {' '}·{' '}
          <a href="mailto:hernandez.hs@gmail.com" className="underline hover:no-underline">
            hernandez.hs@gmail.com
          </a>
        </span>
      </div>

      <main>
        <Hero onStartTest={goToTest} />
        <ProblemSection />
        <HowItWorks />
        <Benefits />
        <SobreElProyecto />
        <ArquitecturaSistema />
        <Testimonials />
        <PricingSection />
        <FAQ />

        {/* Nota de transparencia */}
        <div className="bg-amber-50 border-t border-amber-200 py-8">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <p className="text-amber-800 text-sm leading-relaxed">
              <strong>Estado del proyecto:</strong> La plataforma se encuentra en fase de exploración técnica
              y se presenta únicamente como demostración funcional. No está operando comercialmente.{' '}
              <a href="mailto:hernandez.hs@gmail.com" className="underline hover:no-underline">
                Contacto: hernandez.hs@gmail.com
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
      <AIChat isOpen={isChatOpen} onClose={closeChat} />
    </div>
  );
}

export default LandingPage;
