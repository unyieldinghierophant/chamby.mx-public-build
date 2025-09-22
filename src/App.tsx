import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Search from "./pages/Search";
import Auth from "./pages/Auth";
import TaskerOnboarding from "./pages/TaskerOnboarding";
import Dashboard from "./pages/Dashboard";
import TaskerDashboard from "./pages/TaskerDashboard";
import TaskerProfile from "./pages/TaskerProfile";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/search" element={<Search />} />
            <Route path="/auth" element={<Auth />} />
            <Route 
              path="/tasker-onboarding" 
              element={
                <ProtectedRoute requireTasker>
                  <TaskerOnboarding />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requireTasker>
                  <Dashboard />
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
