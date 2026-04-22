import { Analytics } from "@vercel/analytics/react";
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
import { useEffect, lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ROUTES } from "@/constants/routes";
import { trackPageView, isGALoaded } from "@/lib/analytics";

// Only eagerly import the homepage and critical shared components
import Index from "./pages/Index";
import ProtectedRoute from "./components/ProtectedRoute";
import CookieConsent from "./components/CookieConsent";
import ScrollToTop from "./components/ScrollToTop";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";

// Lazy-load everything else
const Home = lazy(() => import("./pages/Home"));
const ProviderOnboardingWizard = lazy(() => import("./pages/provider-portal/ProviderOnboardingWizard"));
const ProviderLanding = lazy(() => import("./pages/ProviderLanding"));
const UserLanding = lazy(() => import("./pages/UserLanding"));
const ProviderVerificationPage = lazy(() => import("./pages/ProviderVerification"));
const ProviderProfile = lazy(() => import("./pages/ProviderProfile"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const ProfileSettings = lazy(() => import("./pages/ProfileSettings"));
const SecuritySettings = lazy(() => import("./pages/SecuritySettings"));
const GeneralSettings = lazy(() => import("./pages/GeneralSettings"));
const SavedLocations = lazy(() => import("./pages/SavedLocations"));
const DataExport = lazy(() => import("./pages/DataExport"));
const AccountDeletion = lazy(() => import("./pages/AccountDeletion"));
const BookingForm = lazy(() => import("./pages/BookingForm"));
const MobileJobs = lazy(() => import("./pages/MobileJobs"));
const MobileFavorites = lazy(() => import("./pages/MobileFavorites"));
const MobileProfile = lazy(() => import("./pages/MobileProfile"));
const BookingDateTime = lazy(() => import("./pages/BookingDateTime"));
const BookJob = lazy(() => import("./pages/BookJob"));
const EsperandoProveedor = lazy(() => import("./pages/EsperandoProveedor"));
const PhotoRedirect = lazy(() => import("./pages/PhotoRedirect"));
const ProviderPortal = lazy(() => import("./pages/ProviderPortal"));
const ProviderDashboardHome = lazy(() => import("./pages/provider-portal/ProviderDashboardHome"));
const ProviderJobs = lazy(() => import("./pages/provider-portal/ProviderJobs"));
const JobTimelinePage = lazy(() => import("./pages/provider-portal/JobTimelinePage"));
const ProviderReviewsPage = lazy(() => import("./pages/provider-portal/ProviderReviewsPage"));
const ProviderCalendar = lazy(() => import("./pages/provider-portal/ProviderCalendar"));
const ProviderMap = lazy(() => import("./pages/provider-portal/ProviderMap"));
const ProviderVerification = lazy(() => import("./pages/provider-portal/ProviderVerification"));
const ProviderProfileEdit = lazy(() => import("./pages/provider-portal/ProviderProfileEdit"));
const ProviderSupport = lazy(() => import("./pages/provider-portal/ProviderSupport"));
const ProviderSkillsSelection = lazy(() => import("./pages/provider-portal/ProviderSkillsSelection"));
const ProviderMessages = lazy(() => import("./pages/provider-portal/ProviderMessages"));
const ProviderCreateHub = lazy(() => import("./pages/provider-portal/ProviderCreateHub"));
const ProviderAccount = lazy(() => import("./pages/provider-portal/ProviderAccount"));
const ProviderAccountDeletion = lazy(() => import("./pages/provider-portal/ProviderAccountDeletion"));
const RescheduleRequest = lazy(() => import("./pages/provider-portal/RescheduleRequest"));
const AvailableJobs = lazy(() => import("./pages/provider-portal/AvailableJobs"));
const RoleSelection = lazy(() => import("./pages/RoleSelection"));
const Blog = lazy(() => import("./pages/Blog"));
const HowItWorksPage = lazy(() => import("./pages/HowItWorks"));
const About = lazy(() => import("./pages/About"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const ActiveJobs = lazy(() => import("./pages/ActiveJobs"));
const Messages = lazy(() => import("./pages/Messages"));
const FindingProvider = lazy(() => import("./pages/FindingProvider"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const InvoicePayPage = lazy(() => import("./pages/InvoicePayPage"));
const InvoiceBuilderPage = lazy(() => import("./pages/provider/InvoiceBuilderPage"));
const InvoicePreviewPage = lazy(() => import("./pages/provider/InvoicePreviewPage"));
const ProviderInvoiceListPage = lazy(() => import("./pages/provider/ProviderInvoiceListPage"));
const ProviderEarningsPage = lazy(() => import("./pages/provider/ProviderEarningsPage"));
const ProviderPayoutsPage = lazy(() => import("./pages/provider/ProviderPayoutsPage"));
const ProviderPayoutDetailPage = lazy(() => import("./pages/provider/ProviderPayoutDetailPage"));
const ClientInvoiceListPage = lazy(() => import("./pages/client/ClientInvoiceListPage"));
const AdminPayoutDashboard = lazy(() => import("./pages/admin/AdminPayoutDashboard"));
const AdminPayoutDetailPage = lazy(() => import("./pages/admin/AdminPayoutDetailPage"));
const AdminSupportInbox = lazy(() => import("./pages/admin/AdminSupportInbox"));
const AdminDisputesPage = lazy(() => import("./pages/admin/AdminDisputesPage"));
const AdminProvidersPage = lazy(() => import("./pages/admin/AdminProvidersPage"));
const AdminConsolePage = lazy(() => import("./pages/admin/AdminConsolePage"));
const AdminJobDetail = lazy(() => import("./pages/admin/AdminJobDetail"));
const VisitFeePaymentPage = lazy(() => import("./pages/VisitFeePaymentPage"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Login = lazy(() => import("./pages/Login"));
const ProviderLogin = lazy(() => import("./pages/ProviderLogin"));

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


// Redirect subdomains to their respective areas of the app.
// admin.chamby.mx → /admin  |  proveedores.chamby.mx → /provider-portal
const SubdomainRouter = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const subdomain = window.location.hostname.split('.')[0];
    if (subdomain === 'admin') {
      navigate('/admin', { replace: true });
    } else if (subdomain === 'proveedores') {
      navigate('/provider-landing', { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

// Component to handle GitHub Pages redirects
const RedirectHandler = () => {
  const location = useRouterLocation();

  useEffect(() => {
    console.log("App mounted, current location:", location.pathname);

    // Check for stored redirect from 404.html
    const redirectPath = sessionStorage.getItem("redirect");
    if (redirectPath && redirectPath !== location.pathname + location.search) {
      console.log("Found redirect path in sessionStorage:", redirectPath);
      sessionStorage.removeItem("redirect");

      if (redirectPath.startsWith("/")) {
        // Use a hard reload (window.location.replace) instead of React Router navigate().
        // This ensures:
        // 1. Supabase can process OAuth auth codes from the URL on page initialization
        //    (Supabase only detects codes at page load, not on history.pushState changes)
        // 2. Index.tsx's logged-in redirect cannot race and override the intended destination
        console.log("Redirecting (hard) to:", redirectPath);
        window.location.replace(redirectPath);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            <ScrollToTop />
            <AnalyticsTracker />
            <SubdomainRouter />
            <RedirectHandler />
            <ErrorBoundary>
            <Suspense fallback={null}>
            <Routes>
              <Route path={ROUTES.HOME} element={<Index />} />
              <Route path={ROUTES.USER_LANDING} element={<UserLanding />} />
              <Route path={ROUTES.SOLICITAR_SERVICIO} element={<Navigate to={ROUTES.BOOK_JOB} replace />} />
              <Route path={ROUTES.BOOK_JOB} element={<BookJob />} />
              <Route path={ROUTES.LOGIN} element={<Login />} />
              <Route path={ROUTES.PROVIDER_LOGIN} element={<ProviderLogin />} />
              <Route path="/auth/user" element={<Navigate to="/login" replace />} />
              <Route path={ROUTES.PROVIDER_AUTH} element={<ProviderOnboardingWizard />} />
              {/* Redirect legacy auth/provider route to canonical /provider/onboarding */}
              <Route path="/auth/provider" element={<Navigate to={ROUTES.PROVIDER_AUTH} replace />} />
              
              <Route path={ROUTES.CHOOSE_ROLE} element={<RoleSelection />} />
              <Route path={ROUTES.AUTH_CALLBACK} element={<AuthCallback />} />
              <Route path={ROUTES.CALLBACK} element={<AuthCallback />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path={ROUTES.DASHBOARD_USER} element={<Navigate to={ROUTES.USER_LANDING} replace />} />
              <Route path="/provider-landing-legacy" element={<ProviderLanding />} />
              <Route path="/booking/datetime/:providerId" element={<BookingDateTime />} />
              {/* /service/:serviceType route removed - all services are now jobs */}
              <Route path="/booking/:jobId" element={<BookingForm />} />
              <Route path="/esperando-proveedor" element={<ProtectedRoute requireClient><EsperandoProveedor /></ProtectedRoute>} />
              <Route path="/active-jobs" element={<ProtectedRoute requireClient><ActiveJobs /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="/finding-provider" element={<ProtectedRoute requireClient><FindingProvider /></ProtectedRoute>} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/help-center" element={<HelpCenter />} />
              <Route path="/provider-landing" element={<ProviderLanding />} />
              <Route path={ROUTES.CHAMBYNAUTA} element={<ProviderLanding />} />
              <Route path={ROUTES.ABOUT} element={<About />} />
              <Route path={ROUTES.HOW_IT_WORKS} element={<HowItWorksPage />} />

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
                <Route path="jobs/:jobId" element={<JobTimelinePage />} />
                <Route path="available-jobs" element={<AvailableJobs />} />
                <Route path="messages" element={<ProviderMessages />} />
                <Route path="create" element={<ProviderCreateHub />} />
                <Route path="account" element={<ProviderAccount />} />
                <Route path="account/delete" element={<ProviderAccountDeletion />} />
                <Route path="calendar" element={<ProviderCalendar />} />
                <Route path="map" element={<ProviderMap />} />
                <Route path="verification" element={<ProviderVerification />} />
                <Route path="profile" element={<ProviderProfileEdit />} />
                <Route path="reviews" element={<ProviderReviewsPage />} />
                <Route path="support" element={<ProviderSupport />} />
                <Route path="reschedule/:id" element={<RescheduleRequest />} />
              </Route>
              <Route path={ROUTES.PROVIDER_SKILLS_SELECTION} element={<ProtectedRoute requireProvider><ProviderSkillsSelection /></ProtectedRoute>} />
              {/* Redirect old onboarding routes to canonical /provider/onboarding */}
              <Route path="/provider-portal/onboarding" element={<Navigate to={ROUTES.PROVIDER_AUTH} replace />} />
              <Route path="/provider-onboarding" element={<Navigate to={ROUTES.PROVIDER_AUTH} replace />} />
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
              {/* Mobile-specific routes (client) */}
              <Route
                path="/mobile-jobs"
                element={
                  <ProtectedRoute requireClient>
                    <MobileJobs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mobile-favorites"
                element={
                  <ProtectedRoute requireClient>
                    <MobileFavorites />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mobile-profile"
                element={
                  <ProtectedRoute requireClient>
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
                  <ProtectedRoute requireClient>
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

          {/* Admin Support Inbox */}
          <Route
            path="/admin/support"
            element={
              <ProtectedRoute requireAdmin>
                <AdminSupportInbox />
              </ProtectedRoute>
            }
          />

          {/* Admin Disputes Page */}
          <Route
            path="/admin/disputes"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDisputesPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Providers Page */}
          <Route
            path="/admin/providers"
            element={
              <ProtectedRoute requireAdmin>
                <AdminProvidersPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Conflict Resolution Console */}
          <Route
            path="/admin/console"
            element={
              <ProtectedRoute requireAdmin>
                <AdminConsolePage />
              </ProtectedRoute>
            }
          />

          {/* Admin Job Detail */}
          <Route
            path="/admin/jobs/:bookingId"
            element={
              <ProtectedRoute requireAdmin>
                <AdminJobDetail />
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
            </Suspense>
            </ErrorBoundary>
            <CookieConsent />
            <Analytics />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
