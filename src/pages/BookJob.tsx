import { JobBookingForm } from "@/components/JobBookingForm";
import { X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "@/assets/chamby-logo-new-icon.png";

const BookJob = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefillData = location.state as { category?: string; service?: string; description?: string } | null;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-background border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Chamby" className="w-8 h-8" />
            <span className="text-xl font-['Made_Dillan'] text-foreground">Chamby</span>
          </div>
          <button
            onClick={() => navigate('/user-landing')}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-blue-50/30 dark:from-blue-950/20 dark:via-background dark:to-blue-950/10 pt-24 pb-12 px-4 md:px-8">
        <JobBookingForm 
          initialService={prefillData?.service}
          initialDescription={prefillData?.description}
        />
      </div>
    </>
  );
};

export default BookJob;
