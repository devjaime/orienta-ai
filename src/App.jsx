import { motion } from 'framer-motion';
import { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ProblemSection from './components/ProblemSection';
import SolutionSection from './components/SolutionSection';
import ComparisonSection from './components/ComparisonSection';
import CTASection from './components/CTASection';
import Footer from './components/Footer';
import AIChat from './components/AIChat';
import RiasecEmbed from './components/RiasecEmbed';

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const openChat = () => {
    setIsChatOpen(true);
  };

  const closeChat = () => {
    setIsChatOpen(false);
  };

  return (
    <div className="min-h-screen bg-orienta-dark">
      <Header onOpenChat={openChat} />
      <main>
        <Hero onOpenChat={openChat} />
        <ProblemSection />
        <SolutionSection />
        <ComparisonSection />
        <RiasecEmbed />
        <CTASection onOpenChat={openChat} />
      </main>
      <Footer />
      <AIChat isOpen={isChatOpen} onClose={closeChat} />
    </div>
  );
}

export default App;
