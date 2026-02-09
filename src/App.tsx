import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation as useRouterLocation,
  useNavigate,
} from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { ROUTES } from "@/constants/routes";
import Index from "./pages/Index";
import Home from "./pages/Home";
import UserOnboardingWizard from "./pages/UserOnboardingWizard";
import ProviderOnboardingWizard from "./pages/provider-portal/ProviderOnboardingWizard";
import ProviderLanding from "./pages/ProviderLanding";
import UserLanding from "./pages/UserLanding";
import AuthCallback from "./pages/AuthCallback";
import ProviderOnboarding from "./pages/ProviderOnboarding";
import ProviderVerificationPage from "./pages/ProviderVerification";
import ProviderProfile from "./pages/ProviderProfile";
import UserProfile from "./pages/UserProfile";
import ProfileSettings from "./pages/ProfileSettings";
import SecuritySettings from "./pages/SecuritySettings";
// Payment features disabled during cleanup
import GeneralSettings from "./pages/GeneralSettings";
import SavedLocations from "./pages/SavedLocations";
import DataExport from "./pages/DataExport";
import AccountDeletion from "./pages/AccountDeletion";
import ProtectedRoute from "./components/ProtectedRoute";
import BookingForm from "./pages/BookingForm";
// ServiceDetail removed - all services are now jobs
import NotFound from "./pages/NotFound";
import MobileJobs from "./pages/MobileJobs";
import MobileFavorites from "./pages/MobileFavorites";
import MobileProfile from "./pages/MobileProfile";
import BookingDateTime from "./pages/BookingDateTime";
import BookJob from "./pages/BookJob";
import EsperandoProveedor from "./pages/EsperandoProveedor";
import PhotoRedirect from "./pages/PhotoRedirect";

import ProviderPortal from "./pages/ProviderPortal";
import ProviderDashboardHome from "./pages/provider-portal/ProviderDashboardHome";
import ProviderJobs from "./pages/provider-portal/ProviderJobs";
import ProviderCalendar from "./pages/provider-portal/ProviderCalendar";
import ProviderMap from "./pages/provider-portal/ProviderMap";
// Provider payment features disabled during cleanup
import ProviderVerification from "./pages/provider-portal/ProviderVerification";
import ProviderProfileEdit from "./pages/provider-portal/ProviderProfileEdit";
import ProviderSupport from "./pages/provider-portal/ProviderSupport";
import ProviderSkillsSelection from "./pages/provider-portal/ProviderSkillsSelection";
import ProviderMessages from "./pages/provider-portal/ProviderMessages";
import ProviderCreateHub from "./pages/provider-portal/ProviderCreateHub";
import ProviderAccount from "./pages/provider-portal/ProviderAccount";
// Provider notifications disabled during cleanup
import RescheduleRequest from "./pages/provider-portal/RescheduleRequest";
import AvailableJobs from "./pages/provider-portal/AvailableJobs";

import RoleSelection from "./pages/RoleSelection";
import Blog from "./pages/Blog";
import HelpCenter from "./pages/HelpCenter";
import ActiveJobs from "./pages/ActiveJobs";
import FindingProvider from "./pages/FindingProvider";
import AdminDashboard from "./pages/AdminDashboard";
import InvoicePayPage from "./pages/InvoicePayPage";
import InvoiceBuilderPage from "./pages/provider/InvoiceBuilderPage";
import InvoicePreviewPage from "./pages/provider/InvoicePreviewPage";
import ProviderInvoiceListPage from "./pages/provider/ProviderInvoiceListPage";
import ProviderEarningsPage from "./pages/provider/ProviderEarningsPage";
import ProviderPayoutsPage from "./pages/provider/ProviderPayoutsPage";
import ProviderPayoutDetailPage from "./pages/provider/ProviderPayoutDetailPage";
import ClientInvoiceListPage from "./pages/client/ClientInvoiceListPage";
import AdminPayoutDashboard from "./pages/admin/AdminPayoutDashboard";
import AdminPayoutDetailPage from "./pages/admin/AdminPayoutDetailPage";
import VisitFeePaymentPage from "./pages/VisitFeePaymentPage";
import ResetPassword from "./pages/ResetPassword";
import Login from "./pages/Login";
import ProviderLogin from "./pages/ProviderLogin";
import CookieConsent from "./components/CookieConsent";
import { trackPageView, isGALoaded } from "@/lib/analytics";

const queryClient = new QueryClient();

// Tracks page views on route changes (only if GA is loaded)
const AnalyticsTracker = () => {
  const location = useRouterLocation();
  useEffect(() => {
    if (isGALoaded()) {
      trackPageView(location.pathname + location.search);
    }
  }, [location]);
  return null;
};


// Component to handle GitHub Pages redirects
const RedirectHandler = () => {
  const navigate = useNavigate();
  const location = useRouterLocation();

  useEffect(() => {
    console.log("App mounted, current location:", location.pathname);

    // Don't interfere with auth callback - let it process OAuth first
    if (location.pathname === ROUTES.AUTH_CALLBACK || location.pathname === ROUTES.CALLBACK) {
      console.log("Auth callback detected, skipping redirect handler");
      return;
    }

    // Check for stored redirect from 404.html
    const redirectPath = sessionStorage.getItem("redirect");
    if (redirectPath && redirectPath !== location.pathname) {
      console.log("Found redirect path in sessionStorage:", redirectPath);
      sessionStorage.removeItem("redirect");

      // Navigate to the stored path
      if (redirectPath.startsWith("/")) {
        console.log("Navigating to:", redirectPath);
        navigate(redirectPath, { replace: true });
      }
    }
  }, [navigate, location]);

  return null;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnalyticsTracker />
            <RedirectHandler />
            <Routes>
              <Route path={ROUTES.HOME} element={<Index />} />
              <Route path={ROUTES.USER_LANDING} element={<UserLanding />} />
              <Route path={ROUTES.SOLICITAR_SERVICIO} element={<Navigate to={ROUTES.BOOK_JOB} replace />} />
              <Route path={ROUTES.BOOK_JOB} element={<BookJob />} />
              <Route path={ROUTES.LOGIN} element={<Login />} />
              <Route path={ROUTES.PROVIDER_LOGIN} element={<ProviderLogin />} />
              <Route path={ROUTES.USER_AUTH} element={<UserOnboardingWizard />} />
              <Route path={ROUTES.PROVIDER_AUTH} element={<ProviderOnboardingWizard />} />
              
              <Route path={ROUTES.CHOOSE_ROLE} element={<RoleSelection />} />
              <Route path={ROUTES.AUTH_CALLBACK} element={<AuthCallback />} />
              <Route path={ROUTES.CALLBACK} element={<AuthCallback />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path={ROUTES.DASHBOARD_USER} element={<Navigate to={ROUTES.USER_LANDING} replace />} />
              <Route path="/provider-landing-legacy" element={<ProviderLanding />} />
              <Route path="/booking/datetime/:providerId" element={<BookingDateTime />} />
              {/* /service/:serviceType route removed - all services are now jobs */}
              <Route path="/booking/:jobId" element={<BookingForm />} />
              <Route path="/esperando-proveedor" element={<EsperandoProveedor />} />
              <Route path="/active-jobs" element={<ActiveJobs />} />
              <Route path="/finding-provider" element={<FindingProvider />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/help-center" element={<HelpCenter />} />
              <Route path="/provider-landing" element={<ProviderLanding />} />

              <Route
                path="/provider-profile"
                element={
                  <ProtectedRoute requireProvider>
                    <ProviderProfile />
                  </ProtectedRoute>
                }
              />
              {/* Provider Portal Routes */}
              <Route
                path="/provider-portal"
                element={
                  <ProtectedRoute requireProvider>
                    <ProviderPortal />
                  </ProtectedRoute>
                }
              >
                <Route index element={<ProviderDashboardHome />} />
                <Route path="jobs" element={<ProviderJobs />} />
                <Route path="available-jobs" element={<AvailableJobs />} />
                <Route path="messages" element={<ProviderMessages />} />
                <Route path="create" element={<ProviderCreateHub />} />
                <Route path="account" element={<ProviderAccount />} />
                <Route path="calendar" element={<ProviderCalendar />} />
                <Route path="map" element={<ProviderMap />} />
                <Route path="verification" element={<ProviderVerification />} />
                <Route path="profile" element={<ProviderProfileEdit />} />
                <Route path="support" element={<ProviderSupport />} />
                <Route path="reschedule/:id" element={<RescheduleRequest />} />
              </Route>
              <Route path={ROUTES.PROVIDER_SKILLS_SELECTION} element={<ProtectedRoute requireProvider><ProviderSkillsSelection /></ProtectedRoute>} />
              <Route path={ROUTES.PROVIDER_ONBOARDING_WIZARD} element={<ProviderOnboardingWizard />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/settings"
                element={
                  <ProtectedRoute>
                    <ProfileSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/security"
                element={
                  <ProtectedRoute>
                    <SecuritySettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/general"
                element={
                  <ProtectedRoute>
                    <GeneralSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/locations"
                element={
                  <ProtectedRoute>
                    <SavedLocations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/data-export"
                element={
                  <ProtectedRoute>
                    <DataExport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/account-deletion"
                element={
                  <ProtectedRoute>
                    <AccountDeletion />
                  </ProtectedRoute>
                }
              />
              {/* Mobile-specific routes */}
              <Route
                path="/mobile-jobs"
                element={
                  <ProtectedRoute requireAuth>
                    <MobileJobs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mobile-favorites"
                element={
                  <ProtectedRoute requireAuth>
                    <MobileFavorites />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mobile-profile"
                element={
                  <ProtectedRoute requireAuth>
                    <MobileProfile />
                  </ProtectedRoute>
                }
              />

              {/* Photo short link redirect */}
              <Route path="/p/:shortCode" element={<PhotoRedirect />} />

              {/* Admin Dashboard */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Client Invoice List */}
              <Route
                path="/invoices"
                element={
                  <ProtectedRoute>
                    <ClientInvoiceListPage />
                  </ProtectedRoute>
                }
              />

              {/* Invoice Payment Page */}
              <Route
                path="/invoice/:invoiceId"
                element={
                  <ProtectedRoute>
                    <InvoicePayPage />
                  </ProtectedRoute>
                }
              />

              {/* Provider Invoice Builder */}
              <Route
                path="/provider/invoices/create/:jobId"
                element={
                  <ProtectedRoute requireProvider>
                    <InvoiceBuilderPage />
                  </ProtectedRoute>
                }
              />

              {/* Provider Invoice Preview */}
              <Route
                path="/provider/invoices/preview/:invoiceId"
                element={
                  <ProtectedRoute requireProvider>
                    <InvoicePreviewPage />
                  </ProtectedRoute>
                }
              />

              {/* Provider Invoices List */}
              <Route
                path="/provider/invoices"
                element={
                  <ProtectedRoute requireProvider>
                    <ProviderInvoiceListPage />
                  </ProtectedRoute>
                }
              />

              {/* Provider Earnings Dashboard */}
              <Route
                path="/provider/earnings"
                element={
                  <ProtectedRoute requireProvider>
                    <ProviderEarningsPage />
                  </ProtectedRoute>
                }
              />

              {/* Provider Payouts Page */}
              <Route
                path="/provider/payouts"
                element={
                  <ProtectedRoute requireProvider>
                    <ProviderPayoutsPage />
                  </ProtectedRoute>
                }
              />

              {/* Provider Payout Detail Page */}
              <Route
                path="/provider/payouts/:payoutId"
                element={
                  <ProtectedRoute requireProvider>
                    <ProviderPayoutDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Payout Dashboard */}
              <Route
                path="/admin/payouts"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminPayoutDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Admin Payout Detail Page */}
              <Route
                path="/admin/payouts/:payoutId"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminPayoutDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Visit Fee Payment Page (customer fallback) */}
              <Route
                path="/job/:jobId/payment"
                element={
                  <ProtectedRoute>
                    <VisitFeePaymentPage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
            <CookieConsent />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
