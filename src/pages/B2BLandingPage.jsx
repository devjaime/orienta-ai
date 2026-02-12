import Header from '../components/Header';
import B2BHero from '../components/landing/B2BHero';
import B2BFeatures from '../components/landing/B2BFeatures';
import Footer from '../components/Footer';

function B2BLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header onStartTest={() => {}} />
      <main>
        <B2BHero />
        <B2BFeatures />
      </main>
      <Footer />
    </div>
  );
}

export default B2BLandingPage;
