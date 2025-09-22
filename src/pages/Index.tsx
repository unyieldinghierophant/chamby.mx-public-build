import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import HowItWorks from "@/components/HowItWorks";
import Trust from "@/components/Trust";
import Footer from "@/components/Footer";

const Index = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect verified taskers to their specialized dashboard
    if (user && profile?.is_tasker && profile?.verification_status === 'verified') {
      navigate('/tasker-dashboard');
    }
  }, [user, profile, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Services />
        <HowItWorks />
        <Trust />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
