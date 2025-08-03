import { motion } from 'framer-motion';
import Header from './components/Header';
import Hero from './components/Hero';
import ProblemSection from './components/ProblemSection';
import SolutionSection from './components/SolutionSection';
import ComparisonSection from './components/ComparisonSection';
import CTASection from './components/CTASection';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-orienta-dark">
      <Header />
      <main>
        <Hero />
        <ProblemSection />
        <SolutionSection />
        <ComparisonSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

export default App;
