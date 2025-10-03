import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Search, Bell, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthProvider, useAuthContext } from "@/contexts/AuthContext";
import { PaymentProvider } from "@/contexts/PaymentContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProtectedRoute, AdminRoute } from "@/components/ProtectedRoute";
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

const queryClient = new QueryClient();

// Composant Header avec authentification
function AppHeader() {
  const { user, logout } = useAuthContext();

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border px-6 supports-[backdrop-filter]:bg-background/80 bg-background/90 backdrop-blur-sm">
      <SidebarTrigger className="-ml-1 text-muted-foreground" />
      <div className="flex-1 flex items-center justify-between">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher (Ctrl+K)" 
            className="pl-10 bg-background text-foreground placeholder:text-muted-foreground border-border focus:border-primary"
            onFocus={(e) => {
              e.preventDefault();
              e.target.blur();
              document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
            }}
          />
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"></div>
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">
                {user?.username.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="text-sm">
              <div className="font-medium text-foreground">{user?.username || 'Utilisateur'}</div>
              <div className="text-muted-foreground">{user?.email || 'user@example.com'}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} title="Se déconnecter">
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>
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
      <ThemeProvider>
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
              
              {/* Routes protégées */}
              <Route path="/*" element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              } />
            </Routes>
            </PaymentProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
