import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { PaymentProvider } from "@/contexts/PaymentContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute, AdminRoute } from "@/components/ProtectedRoute";
import { OnboardingProvider } from "@/components/OnboardingProvider";
import Index from "./pages/Index";
import Analyses from "./pages/Analyses";
import Audience from "./pages/Audience";
import Content from "./pages/Content";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import Competition from "./pages/Competition";
import Export from "./pages/Export";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import GoogleCallback from "./pages/GoogleCallback";
import Diagnostic from "./pages/Diagnostic";
import GlobalSearch from "./components/GlobalSearch";
import OptimizationAgent from "./pages/OptimizationAgent";
import ApiDemo from "./pages/ApiDemo";
import TechnicalOptimization from "./pages/TechnicalOptimization";
import TextualOptimization from "./pages/TextualOptimization";
import SiteOptimization from "./pages/SiteOptimization";
import Pricing from "./pages/Pricing";
import PaymentTest from "./pages/PaymentTest";
import PaymentSuccess from "./pages/PaymentSuccess";
import LLMODashboard from "./pages/LLMODashboard";
import AdminWaitlist from "./pages/AdminWaitlist";
import AdminMessages from "./pages/AdminMessages";
import ProjectOnboardingDemo from "./pages/ProjectOnboardingDemo";

const queryClient = new QueryClient();

// Composant Header simplifié
function AppHeader() {
  return (
    <header className="flex h-10 sm:h-12 shrink-0 items-center gap-4 px-4 sm:px-6 supports-[backdrop-filter]:bg-background/80 bg-background/90 backdrop-blur-sm border-b border-border">
      <SidebarTrigger className="-ml-1 text-muted-foreground h-8 w-8 sm:h-7 sm:w-7" />
    </header>
  );
}

// Layout principal avec authentification
function MainLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <AppHeader />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/analyses" element={<Analyses />} />
            <Route path="/llmo-dashboard" element={<LLMODashboard />} />
            <Route path="/admin/waitlist" element={<AdminRoute><AdminWaitlist /></AdminRoute>} />
            <Route path="/admin/messages" element={<AdminRoute><AdminMessages /></AdminRoute>} />
            <Route path="/competition" element={<Competition />} />
            <Route path="/sites-optimization" element={<SiteOptimization />} />
            <Route path="/optimisation/technique" element={<TechnicalOptimization />} />
            <Route path="/optimisation/textuelle" element={<TextualOptimization />} />
            <Route path="/optimization-agent" element={<OptimizationAgent />} />
            <Route path="/export" element={<Export />} />
            <Route path="/audience" element={<Audience />} />
            <Route path="/content" element={<Content />} />
            <Route path="/api-demo" element={<ApiDemo />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/payment-test" element={<PaymentTest />} />
            <Route path="/success" element={<PaymentSuccess />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<Help />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SidebarInset>
        <GlobalSearch />
      </div>
    </SidebarProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* <ThemeProvider> */}
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <PaymentProvider>
            <Routes>
              {/* Routes publiques */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth/google/callback" element={<GoogleCallback />} />
              <Route path="/diagnostic" element={<Diagnostic />} />
              <Route path="/project-onboarding-demo" element={<ProjectOnboardingDemo />} />
              
              {/* Routes protégées */}
              <Route path="/*" element={
                <ProtectedRoute>
                  <OnboardingProvider>
                    <MainLayout />
                  </OnboardingProvider>
                </ProtectedRoute>
              } />
            </Routes>
            </PaymentProvider>
          </AuthProvider>
        </BrowserRouter>
      {/* </ThemeProvider> */}
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
