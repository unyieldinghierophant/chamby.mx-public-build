import { useEffect } from "react";
import { HandymanBookingFlow } from "@/components/handyman/HandymanBookingFlow";
import { useSearchParams } from "react-router-dom";

const STORAGE_KEY_PREFIX = 'chamby_form_';

const BookJob = () => {
  const [searchParams] = useSearchParams();

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
    <div className="bg-gradient-to-br from-blue-50 via-background to-blue-50/30 dark:from-blue-950/20 dark:via-background dark:to-blue-950/10 pb-12 px-4 md:px-8 pt-3 md:pt-6">
      <HandymanBookingFlow intentText={intentParam} categorySlug={categoryParam || 'general'} />
    </div>
  );
};

export default BookJob;
