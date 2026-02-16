import { JobBookingForm } from "@/components/JobBookingForm";
import { HandymanBookingFlow } from "@/components/handyman/HandymanBookingFlow";
import { GardeningBookingFlow } from "@/components/gardening/GardeningBookingFlow";
import { PlumbingBookingFlow } from "@/components/plumbing/PlumbingBookingFlow";
import { ElectricalBookingFlow } from "@/components/electrical/ElectricalBookingFlow";
import { CleaningBookingFlow } from "@/components/cleaning/CleaningBookingFlow";
import { AutoWashBookingFlow } from "@/components/auto-wash/AutoWashBookingFlow";
import { X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import logo from "@/assets/chamby-logo-new-horizontal.png";
import { ROUTES } from "@/constants/routes";

const BookJob = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Read canonical payload from query params — go straight into the wizard
  const intentParam = searchParams.get("intent") || "";
  const categoryParam = searchParams.get("category") || "";

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
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-0 flex items-center justify-between">
          <button
            onClick={() => navigate(ROUTES.USER_LANDING)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img
              src={logo}
              alt="Chamby"
              className="h-48 md:h-56 w-auto -my-16 md:-my-20"
            />
          </button>
          <button
            onClick={() => navigate(ROUTES.USER_LANDING)}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-blue-50/30 dark:from-blue-950/20 dark:via-background dark:to-blue-950/10 pt-24 pb-12 px-4 md:px-8">
        {isHandyman ? (
          <HandymanBookingFlow intentText={intentParam} />
        ) : isGardening ? (
          <GardeningBookingFlow />
        ) : isPlumbing ? (
          <PlumbingBookingFlow />
        ) : isElectrical ? (
          <ElectricalBookingFlow intentText={intentParam} />
        ) : isCleaning ? (
          <CleaningBookingFlow />
        ) : isAutoWash ? (
          <AutoWashBookingFlow />
        ) : (
          <JobBookingForm
            initialService={intentParam}
            initialDescription={intentParam}
          />
        )}
      </div>
    </>
  );
};

export default BookJob;
