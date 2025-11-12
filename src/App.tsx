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
import Index from "./pages/Index";
import Home from "./pages/Home";
import UserAuth from "./pages/UserAuth";
import TaskerAuth from "./pages/TaskerAuth";
import ProviderLanding from "./pages/ProviderLanding";
import UserLanding from "./pages/UserLanding";
import AuthCallback from "./pages/AuthCallback";
import TaskerOnboarding from "./pages/TaskerOnboarding";
import TaskerVerification from "./pages/TaskerVerification";
import TaskerProfile from "./pages/TaskerProfile";
import UserProfile from "./pages/UserProfile";
import ProfileSettings from "./pages/ProfileSettings";
import SecuritySettings from "./pages/SecuritySettings";
import PaymentSettings from "./pages/PaymentSettings";
import GeneralSettings from "./pages/GeneralSettings";
import SavedLocations from "./pages/SavedLocations";
import DataExport from "./pages/DataExport";
import AccountDeletion from "./pages/AccountDeletion";
import ProtectedRoute from "./components/ProtectedRoute";
import BookingForm from "./pages/BookingForm";
import BookingSummary from "./pages/BookingSummary";
import ServiceDetail from "./pages/ServiceDetail";
import NotFound from "./pages/NotFound";
import MobileJobs from "./pages/MobileJobs";
import MobileFavorites from "./pages/MobileFavorites";
import MobileProfile from "./pages/MobileProfile";
import BookingDateTime from "./pages/BookingDateTime";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import BookJob from "./pages/BookJob";
import PagoVisita from "./pages/PagoVisita";
import EsperandoProveedor from "./pages/EsperandoProveedor";
import PhotoRedirect from "./pages/PhotoRedirect";
import ChatBot from "./components/ChatBot";
import ProviderPortal from "./pages/ProviderPortal";
import ProviderDashboardHome from "./pages/provider-portal/ProviderDashboardHome";
import ProviderJobs from "./pages/provider-portal/ProviderJobs";
import ProviderCalendar from "./pages/provider-portal/ProviderCalendar";
import ProviderMap from "./pages/provider-portal/ProviderMap";
import ProviderPayments from "./pages/provider-portal/ProviderPayments";
import ProviderVerification from "./pages/provider-portal/ProviderVerification";
import ProviderProfileEdit from "./pages/provider-portal/ProviderProfileEdit";
import ProviderSupport from "./pages/provider-portal/ProviderSupport";
import ProviderNotifications from "./pages/provider-portal/ProviderNotifications";
import RescheduleRequest from "./pages/provider-portal/RescheduleRequest";
import BecomeProvider from "./pages/BecomeProvider";
import RoleSelection from "./pages/RoleSelection";
import Blog from "./pages/Blog";
import HelpCenter from "./pages/HelpCenter";

const queryClient = new QueryClient();

// Component to conditionally render ChatBot
const ConditionalChatBot = () => {
  const location = useRouterLocation();
  const hideOnRoutes = ["/book-job", "/solicitar-servicio"];

  if (hideOnRoutes.includes(location.pathname)) {
    return null;
  }

  return <ChatBot />;
};

// Component to handle GitHub Pages redirects
const RedirectHandler = () => {
  const navigate = useNavigate();
  const location = useRouterLocation();

  useEffect(() => {
    console.log("App mounted, current location:", location.pathname);

    // Don't interfere with auth callback - let it process OAuth first
    if (location.pathname === "/auth/callback" || location.pathname === "/callback") {
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
            <ConditionalChatBot />
            <RedirectHandler />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/user-landing" element={<UserLanding />} />
              <Route path="/solicitar-servicio" element={<Navigate to="/book-job" replace />} />
              <Route path="/book-job" element={<BookJob />} />
              <Route path="/auth/user" element={<UserAuth />} />
              <Route path="/auth/tasker" element={<TaskerAuth />} />
              <Route path="/become-provider" element={<BecomeProvider />} />
              <Route path="/choose-role" element={<RoleSelection />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/callback" element={<AuthCallback />} />
              <Route path="/dashboard/user" element={<Navigate to="/user-landing" replace />} />
              <Route path="/tasker-landing" element={<ProviderLanding />} />
              <Route path="/booking/datetime/:providerId" element={<BookingDateTime />} />
              <Route path="/service/:serviceType" element={<ServiceDetail />} />
              <Route path="/booking/:jobId" element={<BookingForm />} />
              <Route path="/booking/summary" element={<BookingSummary />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-canceled" element={<PaymentCanceled />} />

              <Route path="/pago-visita" element={<PagoVisita />} />
              <Route path="/esperando-proveedor" element={<EsperandoProveedor />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/help-center" element={<HelpCenter />} />
              <Route path="/provider-landing" element={<ProviderLanding />} />

              <Route
                path="/tasker-profile"
                element={
                  <ProtectedRoute requireTasker>
                    <TaskerProfile />
                  </ProtectedRoute>
                }
              />
              {/* Provider Portal Routes */}
              <Route
                path="/provider-portal"
                element={
                  <ProtectedRoute requireTasker>
                    <ProviderPortal />
                  </ProtectedRoute>
                }
              >
                <Route index element={<ProviderDashboardHome />} />
                <Route path="jobs" element={<ProviderJobs />} />
                <Route path="calendar" element={<ProviderCalendar />} />
                <Route path="map" element={<ProviderMap />} />
                <Route path="payments" element={<ProviderPayments />} />
                <Route path="verification" element={<ProviderVerification />} />
                <Route path="profile" element={<ProviderProfileEdit />} />
                <Route path="support" element={<ProviderSupport />} />
                <Route path="notifications" element={<ProviderNotifications />} />
                <Route path="reschedule/:id" element={<RescheduleRequest />} />
              </Route>
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
                path="/profile/payments"
                element={
                  <ProtectedRoute>
                    <PaymentSettings />
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

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
