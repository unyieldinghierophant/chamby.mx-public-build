import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Trust from "@/components/Trust";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";

const Index = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { role } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for OAuth callback and pending role
    const handleOAuthCallback = async () => {
      if (user) {
        const pendingRole = sessionStorage.getItem('pending_role');
        
        if (pendingRole) {
          // Clear the pending role
          sessionStorage.removeItem('pending_role');
          
          // If user just signed up with OAuth, ensure they have the right role
          if (pendingRole === 'provider') {
            // Check if client record exists and update role if needed
            const { data: clientData } = await supabase
              .from('clients')
              .select('role')
              .eq('email', user.email)
              .single();
            
            if (clientData && clientData.role !== 'provider') {
              await supabase
                .from('clients')
                .update({ role: 'provider' })
                .eq('email', user.email);
              
              await supabase
                .from('profiles')
                .update({ is_tasker: true })
                .eq('user_id', user.id);
            }
            
            navigate('/provider-dashboard');
            return;
          } else {
            navigate('/user-landing');
            return;
          }
        }
        
        // Normal redirect logic for non-OAuth or already set up users
        if (profile && role) {
          if (role === 'provider') {
            navigate('/provider-dashboard');
          }
          // Client users stay on the main page to browse jobs
        }
      }
    };
    
    handleOAuthCallback();
  }, [user, profile, role, navigate]);

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
