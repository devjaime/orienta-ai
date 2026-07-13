import Header from '../components/Header';
import Hero from '../components/Hero';
import CareerPaths from '../components/landing/CareerPaths';
import VocationalFlow from '../components/landing/VocationalFlow';
import SkillGraphSection from '../components/landing/SkillGraphSection';
import ProjectOverview from '../components/landing/ProjectOverview';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';

function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-aura-surface text-aura-ink">
      <Header />
      <main>
        <Hero />
        <CareerPaths />
        <VocationalFlow />
        <SkillGraphSection />
        <ProjectOverview />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}

export default LandingPage;
