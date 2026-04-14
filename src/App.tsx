import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import * as React from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Separator } from "@/components/ui/separator";
import { AuthProvider } from "@/contexts/AuthContext";
import { PaymentProvider } from "@/contexts/PaymentContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { StreamingProvider } from "@/contexts/StreamingContext";
import { StreamingNotification } from "@/components/StreamingNotification";
import { ProtectedRoute, AdminRoute } from "@/components/ProtectedRoute";

import { NotificationProvider } from "@/contexts/NotificationContext";
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
import AdminSubscriptionDocs from "./pages/AdminSubscriptionDocs";
import { useReports, useReport } from "@/hooks/useReports";

import { OnboardingLayout } from "./pages/onboarding/OnboardingLayout";
import { SetupStep } from "./pages/onboarding/SetupStep";
import { ProjectStep } from "./pages/onboarding/ProjectStep";
import { TopicsStep } from "./pages/onboarding/TopicsStep";
import { ResultsStep } from "./pages/onboarding/ResultsStep";
import { PlanStep } from "./pages/onboarding/PlanStep";

const queryClient = new QueryClient();

function getSidebarDefaultOpen(): boolean {
  try {
    const match = document.cookie.match(/(?:^|;\s*)sidebar:state=([^;]*)/);
    if (match) return match[1] === 'true';
  } catch {}
  return true;
}

function MainLayout() {
  const { reports } = useReports();
  const reportId = reports.length > 0 ? reports[reports.length - 1].id : null;
  const { report: reportData } = useReport(reportId);

  const domainName = React.useMemo(() => {
    if (!reportData?.report?.url) return null;
    try {
      const url = new URL(reportData.report.url);
      return url.hostname.replace('www.', '');
    } catch {
      return null;
    }
  }, [reportData]);

  return (
    <SidebarProvider defaultOpen={getSidebarDefaultOpen()}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1 overflow-x-hidden">
          <header className="flex h-12 shrink-0 items-center gap-2 px-4 border-b border-border bg-background/95 backdrop-blur-sm md:hidden">
            <SidebarTrigger className="-ml-1 h-8 w-8 text-muted-foreground" />
            <Separator orientation="vertical" className="mr-1 h-4" />
            <span className="text-sm font-medium text-foreground truncate">{domainName || "Virail Studio"}</span>
          </header>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/analyses" element={<Analyses />} />
            <Route path="/llmo-dashboard" element={<LLMODashboard />} />
            <Route path="/admin/waitlist" element={<AdminRoute><AdminWaitlist /></AdminRoute>} />
            <Route path="/admin/messages" element={<AdminRoute><AdminMessages /></AdminRoute>} />
            <Route path="/admin/subscriptions-docs" element={<AdminRoute><AdminSubscriptionDocs /></AdminRoute>} />
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
        <StreamingNotification />
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
            <StreamingProvider>
            <Routes>
              {/* Routes publiques */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              {/* <Route path="/auth/google/callback" element={<GoogleCallback />} /> */}
              <Route path="/diagnostic" element={<Diagnostic />} />
              {/* <Route path="/project-onboarding-demo" element={<ProjectOnboardingDemo />} /> */}
              
              {/* Routes d'onboarding (protégées) */}
              <Route path="/onboarding" element={
                <ProtectedRoute>
                  <OnboardingLayout />
                </ProtectedRoute>
              }>
                <Route index element={<SetupStep />} />
                <Route path="setup" element={<SetupStep />} />
                <Route path="project" element={<ProjectStep />} />
                <Route path="topics" element={<TopicsStep />} />
                <Route path="results" element={<ResultsStep />} />
                <Route path="plan" element={<PlanStep />} />
              </Route>
              
              {/* Routes protégées */}
              <Route path="/*" element={
                <ProtectedRoute>
                  <NotificationProvider>
                      <MainLayout />
                  </NotificationProvider>
                </ProtectedRoute>
              } />
            </Routes>
            </StreamingProvider>
            </PaymentProvider>
          </AuthProvider>
        </BrowserRouter>
      {/* </ThemeProvider> */}
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
