import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  BarChart3,
  CreditCard,
  Users2,
  ChevronsUpDown,
  LogOut,
  ShieldCheck,
  BadgeDollarSign,
  PlusCircle,
  Cpu,
  BookOpen,
  Layers,
  Wrench,
  Globe,
  Check,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePayment } from "@/contexts/PaymentContext";
import { useLocation, Link, useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/contexts/AuthContext";
import { AuthService } from "@/services/authService";
import { useReports, useReport, getLatestReportId } from "@/hooks/useReports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NewAnalysisModal } from "./NewAnalysisModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function AppSidebar() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const { userPlan } = usePayment();
  const { isMobile, setOpenMobile } = useSidebar();
  const [isNewAnalysisModalOpen, setIsNewAnalysisModalOpen] = React.useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = React.useState(false);
  const [reportFilterQuery, setReportFilterQuery] = React.useState("");

  // Récupérer le nom de domaine pour l'afficher à la place de "Virail Studio"
  const explicitReportId = location.state?.selectedReportId || searchParams.get("reportId");
  const { reports } = useReports();
  const reportId = explicitReportId || getLatestReportId(reports);
  const { report: reportData } = useReport(reportId);

  const domainName = React.useMemo(() => {
    if (!reportData?.report?.url) return null;
    try {
      const url = new URL(reportData.report.url);
      return url.hostname.replace("www.", "");
    } catch {
      return null;
    }
  }, [reportData]);

  const localUser = AuthService.getUser?.() as any;
  const isProd = import.meta.env.PROD;
  const isAdminLocal = Boolean(localUser?.is_admin ?? localUser?.isAdmin);
  const isAdmin = isProd
    ? isAdminLocal
    : (isAdminLocal || Boolean((user as any)?.is_admin || (user as any)?.isAdmin));

  const handleNavigation = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const filteredReports = React.useMemo(() => {
    if (!reportFilterQuery.trim()) return reports;
    const q = reportFilterQuery.toLowerCase();
    return reports.filter((r) => r.url?.toLowerCase().includes(q));
  }, [reports, reportFilterQuery]);

  const data = {
    navMain: [
      {
        title: "Général",
        items: [
          {
            title: "Vue d'ensemble",
            url: "/",
            icon: LayoutDashboard,
            badge: undefined as string | undefined,
          },
          {
            title: "Concurrentielle",
            url: "/competition",
            icon: BarChart3,
            badge: undefined as string | undefined,
          },
          {
            title: "Améliorer",
            url: "/ameliorer",
            icon: Wrench,
            badge: undefined as string | undefined,
          },
          {
            title: "Éligibilité Agentique",
            url: "/agentic",
            icon: Cpu,
            badge: "M2M" as string | undefined,
          },
        ],
      },
      {
        title: "Paramètres",
        items: [
          {
            title: "Personnes",
            url: "/settings",
            icon: Users2,
            badge: undefined as string | undefined,
          },
          {
            title: "Facturation",
            url: "/pricing",
            icon: CreditCard,
            badge: undefined as string | undefined,
          },
        ],
      },
      ...(isAdmin
        ? [
            {
              title: "Administration",
              items: [
                {
                  title: "Waitlist",
                  url: "/admin/waitlist",
                  icon: ShieldCheck,
                  badge: undefined as string | undefined,
                },
                {
                  title: "Plans",
                  url: "/admin/plans",
                  icon: Layers,
                  badge: undefined as string | undefined,
                },
                {
                  title: "Doc abonnements",
                  url: "/admin/subscriptions-docs",
                  icon: BookOpen,
                  badge: undefined as string | undefined,
                },
              ],
            },
          ]
        : []),
    ],
  };

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground" collapsible="icon">
      {/* Header : Sélecteur de domaine / Mes analyses */}
      <SidebarHeader className="p-2 border-b border-sidebar-border/60">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => setIsReportsModalOpen(true)}
              className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors group"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary flex-shrink-0 group-hover:scale-105 transition-transform">
                <Globe className="h-4 w-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                <span className="truncate font-semibold text-sidebar-foreground">
                  {domainName || "Viraill"}
                </span>
                <span className="truncate text-[11px] text-muted-foreground">
                  Mes analyses ({reports.length})
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground/70" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Contenu principal : Navigation */}
      <SidebarContent className="px-2 py-1">
        {data.navMain.map((group) => (
          <SidebarGroup key={group.title} className="py-2">
            <SidebarGroupLabel className="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase px-2">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.title === "Général" && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setIsNewAnalysisModalOpen(true)}
                      tooltip="Nouvelle Analyse"
                      className="font-medium text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                    >
                      <PlusCircle className="size-4 text-primary" />
                      <span>Nouvelle Analyse</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {group.items.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className={cn(
                          "transition-colors",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-2xs"
                            : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                        )}
                      >
                        <Link
                          to={explicitReportId ? `${item.url}?reportId=${explicitReportId}` : item.url}
                          onClick={handleNavigation}
                        >
                          <item.icon className={cn("size-4", isActive ? "text-primary" : "text-muted-foreground")} />
                          <span className="truncate">{item.title}</span>
                          {item.badge && (
                            <Badge
                              variant="secondary"
                              className="ml-auto text-[10px] font-semibold px-1.5 py-0 h-4 bg-primary/10 text-primary border-0"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer : Menu utilisateur */}
      <SidebarFooter className="p-2 border-t border-sidebar-border/60">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors"
                >
                  <Avatar className="h-8 w-8 rounded-lg border border-border/50">
                    <AvatarImage src={user?.avatar_url} alt={user?.username} />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                      {user?.username?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                    <span className="truncate font-semibold text-foreground">
                      {user?.username || "Utilisateur"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email || "user@example.com"}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-muted-foreground/70" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-60 rounded-xl shadow-xl border-border p-1"
                side="bottom"
                align="end"
                sideOffset={6}
              >
                <DropdownMenuLabel className="p-2 font-normal">
                  <div className="flex items-center gap-2.5 text-left text-sm">
                    <Avatar className="h-9 w-9 rounded-lg border border-border/50">
                      <AvatarImage src={user?.avatar_url} alt={user?.username} />
                      <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold">
                        {user?.username?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                      <span className="truncate font-semibold text-foreground">
                        {user?.username || "Utilisateur"}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user?.email || "user@example.com"}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate("/pricing")}
                  className="flex items-center justify-between cursor-pointer py-2 text-primary font-medium"
                >
                  <div className="flex items-center gap-2">
                    <BadgeDollarSign className="h-4 w-4" />
                    <span>Passer à Pro</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/30">
                    {userPlan?.plan || "Free"}
                  </Badge>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                  <Users2 className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Mon Compte</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/pricing")} className="cursor-pointer">
                  <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Facturation & Quotas</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Se déconnecter</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />

      <NewAnalysisModal
        open={isNewAnalysisModalOpen}
        onOpenChange={setIsNewAnalysisModalOpen}
      />

      {/* Modal - Mes analyses (Refactorisé shadcn avec recherche et ScrollArea) */}
      <Dialog open={isReportsModalOpen} onOpenChange={setIsReportsModalOpen}>
        <DialogContent className="sm:max-w-xl p-0 gap-0 rounded-2xl overflow-hidden shadow-2xl border-border">
          <DialogHeader className="px-6 py-5 border-b border-border bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-semibold text-foreground">
                  Mes analyses
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-1">
                  Sélectionnez un domaine pour visualiser son audit GEO et agentique.
                </DialogDescription>
              </div>
              <Badge variant="secondary" className="font-semibold text-xs">
                {reports.length} rapport{reports.length > 1 ? "s" : ""}
              </Badge>
            </div>

            {reports.length > 4 && (
              <div className="relative mt-3">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filtrer par URL ou domaine..."
                  value={reportFilterQuery}
                  onChange={(e) => setReportFilterQuery(e.target.value)}
                  className="pl-9 h-9 text-xs bg-background"
                />
              </div>
            )}
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] p-3">
            {filteredReports.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Aucun rapport ne correspond à votre filtre.
              </div>
            ) : (
              <div className="space-y-1">
                {filteredReports.map((report) => {
                  const reportDomain = (() => {
                    try {
                      return new URL(report.url).hostname.replace("www.", "");
                    } catch {
                      return report.url;
                    }
                  })();
                  const isActive = String(report.id) === String(reportId);

                  return (
                    <div
                      key={report.id}
                      onClick={() => {
                        navigate(`/?reportId=${report.id}`);
                        setIsReportsModalOpen(false);
                      }}
                      className={cn(
                        "flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all border",
                        isActive
                          ? "bg-primary/10 border-primary/20 text-foreground font-medium shadow-2xs"
                          : "border-transparent hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${reportDomain}&sz=32`}
                          alt={reportDomain}
                          className="w-5 h-5 rounded-md shrink-0 object-contain bg-background p-0.5 border border-border/50"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <span className="truncate text-sm">{reportDomain}</span>
                      </div>

                      {isActive && (
                        <span className="flex items-center gap-1.5 text-xs text-primary font-semibold shrink-0">
                          <Check className="h-3.5 w-3.5" />
                          <span>Actif</span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <div className="p-3 border-t border-border bg-muted/20 flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsReportsModalOpen(false);
                setIsNewAnalysisModalOpen(true);
              }}
              className="text-xs gap-1.5"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Nouvelle analyse</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsReportsModalOpen(false)}
              className="text-xs"
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}