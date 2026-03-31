import { useEffect } from "react";
import { HandymanBookingFlow } from "@/components/handyman/HandymanBookingFlow";
import { X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

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
    <div className="bg-gradient-to-br from-blue-50 via-background to-blue-50/30 dark:from-blue-950/20 dark:via-background dark:to-blue-950/10 pb-12 px-4 md:px-8">
      {/* Minimal inline close button — no fixed header */}
      <div className="max-w-2xl mx-auto flex justify-end pt-3 md:pt-6">
        <button
          onClick={() => navigate(ROUTES.USER_LANDING)}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-6 h-6 text-muted-foreground" />
        </button>
      </div>
      <HandymanBookingFlow intentText={intentParam} categorySlug={categoryParam || 'general'} />
    </div>
  );
};

export default BookJob;
