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
      </main>
      <Footer />
      <AIChat isOpen={isChatOpen} onClose={closeChat} />
    </div>
  );
}

export default LandingPage;
