import { JobBookingForm } from "@/components/JobBookingForm";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/chamby-logo-icon.png";

const BookJob = () => {
  const navigate = useNavigate();

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-background border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Chamby" className="w-8 h-8" />
            <span className="text-xl font-['Made_Dillan'] text-foreground">Chamby</span>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>
      <div className="min-h-screen bg-background pt-24 pb-12 px-4 md:px-8">
        <JobBookingForm />
      </div>
    </>
  );
};

export default BookJob;
