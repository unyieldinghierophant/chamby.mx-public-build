import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useEffect } from "react";
import Index from "./pages/Index";
import Search from "./pages/Search";
import Auth from "./pages/Auth";
import ProviderLanding from "./pages/ProviderLanding";
import TaskerOnboarding from "./pages/TaskerOnboarding";
import TaskerVerification from "./pages/TaskerVerification";
import TaskerDashboard from "./pages/TaskerDashboard";
import TaskerProfile from "./pages/TaskerProfile";
import UserProfile from "./pages/UserProfile";
import ProfileSettings from "./pages/ProfileSettings";
import SecuritySettings from "./pages/SecuritySettings";
import PaymentSettings from "./pages/PaymentSettings";
import GeneralSettings from "./pages/GeneralSettings";
import Messages from "./pages/Messages";
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
import ProviderProfile from "./pages/ProviderProfile";

const queryClient = new QueryClient();

// Component to handle GitHub Pages redirects
const RedirectHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('App mounted, current location:', location.pathname);
    
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
            <Route path="/user-landing" element={<Index />} />
            <Route path="/search" element={<Search />} />
            <Route path="/jobs" element={<Search />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/tasker-landing" element={<ProviderLanding />} />
            <Route path="/service/:serviceType" element={<ServiceDetail />} />
            <Route path="/booking/:jobId" element={<BookingForm />} />
            <Route path="/booking-summary/:bookingId" element={<BookingSummary />} />
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
              path="/messages" 
              element={
                <ProtectedRoute>
                  <Messages />
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
            <Route path="/provider/:id" element={<ProviderProfile />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
