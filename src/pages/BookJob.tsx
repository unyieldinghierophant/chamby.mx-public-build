import { useEffect } from "react";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { getBookingConfig } from "@/components/booking/BookingFlowConfig";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";

const STORAGE_KEY_PREFIX = 'chamby_form_';

const BookJob = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();

  const intentParam = searchParams.get("intent") || "";
  const categoryParam = searchParams.get("category") || "";
  const newParam = searchParams.get("new") || "";

  // Block providers from requesting jobs
  useEffect(() => {
    if (!roleLoading && role === 'provider') {
      // Clear booking-return flags so UserLanding's safety-net doesn't
      // bounce the provider back here and trap them in a /login loop.
      localStorage.removeItem('booking_auth_return');
      localStorage.removeItem('booking_checkout_path');
      toast.error('Las cuentas de proveedor no pueden solicitar servicios. Inicia sesión con una cuenta de cliente.', { duration: 8000 });
      navigate('/login', { replace: true });
    }
  }, [role, roleLoading, navigate]);

  // Clear stale form data when a NEW booking starts
  useEffect(() => {
    if (newParam) {
      const keysToRemove = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_KEY_PREFIX));
      keysToRemove.forEach(k => localStorage.removeItem(k));
      localStorage.removeItem('booking_show_summary');
    }
  }, [newParam]);

  if (roleLoading) return null;
  if (role === 'provider') return null;

  // Force remount on category change or new-booking flag so the form
  // React state (description, photos, etc.) resets instead of carrying
  // over from the previous category. localStorage is cleared by the
  // useEffect above; this handles the in-memory state.
  const resolvedCategory = categoryParam || 'general';
  const flowKey = `${resolvedCategory}-${newParam || 'persist'}`;
  const bookingConfig = getBookingConfig(resolvedCategory);

  return (
    <div className="bg-gradient-to-br from-blue-50 via-background to-blue-50/30 dark:from-blue-950/20 dark:via-background dark:to-blue-950/10 pb-12 px-4 md:px-8 pt-3 md:pt-6">
      <BookingFlow key={flowKey} config={bookingConfig} intentText={intentParam} categorySlug={resolvedCategory} />
    </div>
  );
};

export default BookJob;
