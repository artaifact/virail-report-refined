import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
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

// Composant Header avec filtres
// function AppHeader() {
//   const location = useLocation();
//   const isHomePage = location.pathname === '/';
  
//   // États pour les filtres
//   const [selectedPeriod, setSelectedPeriod] = useState('Last 7 days');
//   const [selectedModel, setSelectedModel] = useState('All Models');
//   const [selectedTopic, setSelectedTopic] = useState('All Topics');

  // return (
    // <header className="flex h-auto min-h-[3rem] sm:min-h-[3.5rem] shrink-0 items-center gap-4 px-4 sm:px-6 supports-[backdrop-filter]:bg-background/80 bg-background/90 backdrop-blur-sm border-b border-border">
    //   <SidebarTrigger className="-ml-1 text-muted-foreground h-8 w-8 sm:h-7 sm:w-7" />
      
    //   {/* Filtres - Affichés uniquement sur la page d'accueil */}
    //   {isHomePage && (
    //     <div className="flex items-center gap-3 flex-1 ml-4">
          
    //       {/* Filtre Période */}
    //       {/* <div className="flex items-center gap-2">
    //         <span className="text-sm">📅</span>
    //         <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
    //           <SelectTrigger className="w-[140px] h-8 text-sm">
    //             <SelectValue />
    //           </SelectTrigger>
    //           <SelectContent>
    //             <SelectItem value="Last 7 days">Last 7 days</SelectItem>
    //             <SelectItem value="Last 30 days">Last 30 days</SelectItem>
    //             <SelectItem value="Last 90 days">Last 90 days</SelectItem>
    //             <SelectItem value="All time">All time</SelectItem>
    //           </SelectContent>
    //         </Select>
    //       </div> */}

    //       {/* Filtre Modèles */}
    //       <div className="flex items-center gap-2">
    //         <Select value={selectedModel} onValueChange={setSelectedModel}>
    //           <SelectTrigger className="w-[140px] h-8 text-sm">
    //             <SelectValue />
    //           </SelectTrigger>
    //           <SelectContent>
    //             <SelectItem value="models">Models</SelectItem>
    //             <SelectItem value="ChatGPT">ChatGPT</SelectItem>
    //             <SelectItem value="Perplexity">Perplexity</SelectItem>
    //             <SelectItem value="AI Overview">AI Overview</SelectItem>
    //             <SelectItem value="Gemini">Gemini</SelectItem>
    //             <SelectItem value="Claude">Claude</SelectItem>
    //           </SelectContent>
    //         </Select>
    //       </div>

    //       {/* Filtre Topics */}
    //       {/* <div className="flex items-center gap-2">
    //         <span className="text-sm">📋</span>
    //         <Select value={selectedTopic} onValueChange={setSelectedTopic}>
    //           <SelectTrigger className="w-[180px] h-8 text-sm">
    //             <SelectValue />
    //           </SelectTrigger>
    //           <SelectContent>
    //             <SelectItem value="All Topics">All Topics</SelectItem>
    //             <SelectItem value="Gestion de la réputation en ligne">Gestion de la réputation en ligne</SelectItem>
    //             <SelectItem value="Marketing digital local">Marketing digital local</SelectItem>
    //             <SelectItem value="Solutions de communication omnicanale">Solutions de communication omnicanale</SelectItem>
    //             <SelectItem value="Stratégies de publicité locale">Stratégies de publicité locale</SelectItem>
    //             <SelectItem value="Visibilité en ligne PME">Visibilité en ligne PME</SelectItem>
    //           </SelectContent>
    //         </Select>
    //       </div> */}
    //     </div>
    //   )}
    // </header>
//   );
// }

// Layout principal avec authentification
function MainLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1">
          {/* <AppHeader /> */}
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
              {/* <Route path="/auth/google/callback" element={<GoogleCallback />} /> */}
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
