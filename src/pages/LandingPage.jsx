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
      <main>
        <Hero onStartTest={goToTest} />
        <ProblemSection />
        <HowItWorks />
        <Benefits />
        <Testimonials />
        <PricingSection />
        <FAQ />
        
        {/* Disclaimer honesto */}
        <div className="bg-amber-50 border-t border-amber-200 py-8">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <p className="text-amber-800 text-sm">
              <strong>📋 Estado del producto:</strong> Vocari es un MVP en desarrollo. 
              El test vocacional funciona. Los informes son generados automáticamente con base en tus respuestas 
              y datos públicos del MINEDUC. Estamos trabajando en integrar revisión por orientadores reales. 
              ¿Ayudas a mejorar? <a href="mailto:hola@vocari.cl" className="underline">Escríbenos</a>
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
