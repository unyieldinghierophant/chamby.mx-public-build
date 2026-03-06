import { useState, useEffect } from "react";
import { JobBookingForm } from "@/components/JobBookingForm";
import { HandymanBookingFlow } from "@/components/handyman/HandymanBookingFlow";
import { GardeningBookingFlow } from "@/components/gardening/GardeningBookingFlow";
import { PlumbingBookingFlow } from "@/components/plumbing/PlumbingBookingFlow";
import { ElectricalBookingFlow } from "@/components/electrical/ElectricalBookingFlow";
import { CleaningBookingFlow } from "@/components/cleaning/CleaningBookingFlow";
import { AutoWashBookingFlow } from "@/components/auto-wash/AutoWashBookingFlow";
import { X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ChambyLogoText from "@/components/ChambyLogoText";
import { ROUTES } from "@/constants/routes";
import { WizardIntentStep } from "@/components/booking/WizardIntentStep";
import { useAuth } from "@/contexts/AuthContext";

const INTENT_CONFIRMED_KEY = 'booking_intent_confirmed';
const INTENT_TEXT_KEY = 'booking_confirmed_intent_text';
const STORAGE_KEY_PREFIX = 'chamby_form_';

const BookJob = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Read canonical payload from query params
  const intentParam = searchParams.get("intent") || "";
  const categoryParam = searchParams.get("category") || "";
  const newParam = searchParams.get("new") || "";

  // Step 1 gate: WizardIntentStep — user confirms/edits intent before entering wizard
  const [intentConfirmed, setIntentConfirmed] = useState(false);
  const [confirmedIntent, setConfirmedIntent] = useState("");

  // Clear stale form data when a NEW booking starts (detect via ?new= param)
  useEffect(() => {
    if (newParam) {
      // Clear all booking form persistence keys
      const keysToRemove = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_KEY_PREFIX));
      keysToRemove.forEach(k => localStorage.removeItem(k));
    }
  }, [newParam]);

  // On mount, check if intent was already confirmed (returning from OAuth redirect)
  // OR if user is authenticated with intent+category, skip the intent step entirely
  useEffect(() => {
    if (user && intentParam && categoryParam) {
      // Authenticated user with full params — skip intent step
      setConfirmedIntent(intentParam);
      setIntentConfirmed(true);
      return;
    }
    const wasConfirmed = localStorage.getItem(INTENT_CONFIRMED_KEY);
    const savedIntentText = localStorage.getItem(INTENT_TEXT_KEY);
    if (wasConfirmed === 'true' && (intentParam || savedIntentText)) {
      setConfirmedIntent(savedIntentText || intentParam);
      setIntentConfirmed(true);
    }
  }, [user]);

  // Clear intent confirmation when navigating away from booking
  useEffect(() => {
    return () => {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/book-job')) {
        localStorage.removeItem(INTENT_CONFIRMED_KEY);
        localStorage.removeItem(INTENT_TEXT_KEY);
      }
    };
  }, []);

  const handleIntentConfirm = (text: string) => {
    setConfirmedIntent(text);
    setIntentConfirmed(true);
    // Persist so it survives OAuth redirects
    localStorage.setItem(INTENT_CONFIRMED_KEY, 'true');
    localStorage.setItem(INTENT_TEXT_KEY, text);
  };

  // Determine which specialized flow to render based on category
  const category = categoryParam?.toLowerCase();
  const isHandyman = category === "handyman";
  const isGardening = category === "jardinería";
  const isPlumbing = category === "fontanería";
  const isElectrical = category === "electricidad";
  const isCleaning = category === "limpieza";
  const isAutoWash = category === "auto & lavado" || category === "auto y lavado";

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-background border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative flex items-center h-16 md:h-20">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <ChambyLogoText onClick={() => navigate(ROUTES.USER_LANDING)} size="lg" />
          </div>
          <button
            onClick={() => {
              // Clear intent persistence when user explicitly closes
              localStorage.removeItem(INTENT_CONFIRMED_KEY);
              localStorage.removeItem(INTENT_TEXT_KEY);
              navigate(ROUTES.USER_LANDING);
            }}
            className="ml-auto p-2 hover:bg-accent rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-blue-50/30 dark:from-blue-950/20 dark:via-background dark:to-blue-950/10 pt-24 pb-12 px-4 md:px-8">
        {!intentConfirmed ? (
          <WizardIntentStep
            intentText={intentParam}
            category={categoryParam}
            onConfirm={handleIntentConfirm}
            onBack={() => navigate(-1)}
          />
        ) : isHandyman ? (
          <HandymanBookingFlow intentText={confirmedIntent} />
        ) : isGardening ? (
          <GardeningBookingFlow intentText={confirmedIntent} />
        ) : isPlumbing ? (
          <PlumbingBookingFlow intentText={confirmedIntent} />
        ) : isElectrical ? (
          <ElectricalBookingFlow intentText={confirmedIntent} />
        ) : isCleaning ? (
          <CleaningBookingFlow intentText={confirmedIntent} />
        ) : isAutoWash ? (
          <AutoWashBookingFlow intentText={confirmedIntent} />
        ) : (
          <JobBookingForm
            initialService={confirmedIntent}
            initialDescription={confirmedIntent}
          />
        )}
      </div>
    </>
  );
};

export default BookJob;
