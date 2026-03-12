import { useEffect } from "react";
import { HandymanBookingFlow } from "@/components/handyman/HandymanBookingFlow";
import { X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ChambyLogoText from "@/components/ChambyLogoText";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY_PREFIX = 'chamby_form_';

const BookJob = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const intentParam = searchParams.get("intent") || "";
  const categoryParam = searchParams.get("category") || "";
  const newParam = searchParams.get("new") || "";

  // Clear stale form data when a NEW booking starts
  useEffect(() => {
    if (newParam) {
      const keysToRemove = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_KEY_PREFIX));
      keysToRemove.forEach(k => localStorage.removeItem(k));
      localStorage.removeItem('booking_show_summary');
    }
  }, [newParam]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-background border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative flex items-center h-16 md:h-20">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <ChambyLogoText onClick={() => navigate(ROUTES.USER_LANDING)} size="lg" />
          </div>
          <button
            onClick={() => navigate(ROUTES.USER_LANDING)}
            className="ml-auto p-2 hover:bg-accent rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-blue-50/30 dark:from-blue-950/20 dark:via-background dark:to-blue-950/10 pt-24 pb-12 px-4 md:px-8">
        <HandymanBookingFlow intentText={intentParam} categorySlug={categoryParam || 'general'} />
      </div>
    </>
  );
};

export default BookJob;
