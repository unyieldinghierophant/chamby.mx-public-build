import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useUserRole } from "@/hooks/useUserRole";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import HowItWorks from "@/components/HowItWorks";
import Trust from "@/components/Trust";
import Footer from "@/components/Footer";

const Index = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { role } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect users based on their role and verification status
    if (user && profile && role) {
      if (role === 'provider') {
        // Provider users go to provider dashboard
        navigate('/provider-dashboard');
      }
      // Client users stay on the main page to browse jobs
    }
  }, [user, profile, role, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <div className="animate-fade-in">
          <Hero />
        </div>
        <div className="animate-blur-fade" style={{ animationDelay: '0.3s' }}>
          <Services />
        </div>
        <div className="animate-blur-fade" style={{ animationDelay: '0.6s' }}>
          <HowItWorks />
        </div>
        <div className="animate-blur-fade" style={{ animationDelay: '0.9s' }}>
          <Trust />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
