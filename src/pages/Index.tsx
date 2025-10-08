import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Trust from "@/components/Trust";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";

const Index = () => {
  return (
    <div className="min-h-screen bg-background mobile-pb-nav">
      <Header />
      <main>
        <div className="animate-fade-in">
          <Hero />
        </div>
        <div className="animate-blur-fade" style={{ animationDelay: '0.3s' }}>
          <HowItWorks />
        </div>
        <div className="animate-blur-fade" style={{ animationDelay: '0.6s' }}>
          <Trust />
        </div>
      </main>
      {/* Desktop footer, hide on mobile */}
      <div className="desktop-only">
        <Footer />
      </div>
      {/* Mobile bottom navigation */}
      <div className="mobile-only">
        <MobileBottomNav />
      </div>
    </div>
  );
};

export default Index;
