import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
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
import TaskerDashboard from "./pages/TaskerDashboard";
import TaskerProfile from "./pages/TaskerProfile";
import UserProfile from "./pages/UserProfile";
import ProfileSettings from "./pages/ProfileSettings";
import SecuritySettings from "./pages/SecuritySettings";
import PaymentSettings from "./pages/PaymentSettings";
import GeneralSettings from "./pages/GeneralSettings";
import DataExport from "./pages/DataExport";
import AccountDeletion from "./pages/AccountDeletion";
import ProviderDashboard from "./pages/ProviderDashboard";
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
import NuevaSolicitud from "./pages/NuevaSolicitud";
import PagoVisita from "./pages/PagoVisita";
import EsperandoProveedor from "./pages/EsperandoProveedor";

const queryClient = new QueryClient();

// Component to handle GitHub Pages redirects
const RedirectHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('App mounted, current location:', location.pathname);
    
    // Don't interfere with auth callback - let it process OAuth first
    if (location.pathname === '/auth/callback') {
      console.log('Auth callback detected, skipping redirect handler');
      return;
    }
    
    // Check for stored redirect from 404.html
    const redirectPath = sessionStorage.getItem('redirect');
    if (redirectPath && redirectPath !== location.pathname) {
      console.log('Found redirect path in sessionStorage:', redirectPath);
      sessionStorage.removeItem('redirect');
      
      // Navigate to the stored path
      if (redirectPath.startsWith('/')) {
        console.log('Navigating to:', redirectPath);
        navigate(redirectPath, { replace: true });
      }
    }
  }, [navigate, location]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RedirectHandler />
          <Routes>
            <Route path="/" element={<Navigate to="/user-landing" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/user-landing" element={<Index />} />
            <Route path="/auth/user" element={<UserAuth />} />
            <Route path="/auth/tasker" element={<TaskerAuth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/dashboard/user" element={
              <ProtectedRoute requireAuth>
                <UserLanding />
              </ProtectedRoute>
            } />
            <Route path="/tasker-landing" element={<ProviderLanding />} />
            <Route path="/booking/datetime/:providerId" element={<BookingDateTime />} />
            <Route path="/service/:serviceType" element={<ServiceDetail />} />
            <Route path="/booking/:jobId" element={<BookingForm />} />
            <Route path="/booking/summary" element={<BookingSummary />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-canceled" element={<PaymentCanceled />} />
            <Route path="/nueva-solicitud" element={<NuevaSolicitud />} />
            <Route path="/pago-visita" element={<PagoVisita />} />
            <Route path="/esperando-proveedor" element={<EsperandoProveedor />} />
            <Route
              path="/provider-dashboard" 
              element={
                <ProtectedRoute requireAuth>
                  <ProviderDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tasker-onboarding" 
              element={
                <ProtectedRoute requireTasker>
                  <TaskerOnboarding />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/taskerverification" 
              element={
                <ProtectedRoute requireTasker>
                  <TaskerVerification />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tasker-dashboard" 
              element={
                <ProtectedRoute requireTasker>
                  <TaskerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tasker-profile" 
              element={
                <ProtectedRoute requireTasker>
                  <TaskerProfile />
                </ProtectedRoute>
              } 
            />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
