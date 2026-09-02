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
} from "@/components/ui/sidebar"
import {
  Home,
  MessageSquare,
  Globe,
  Swords,
  Tag,
  Users,
  Folder,
  Building2,
  CreditCard,
  Wallet,
  ChevronsUpDown,
  Plus,
  LogOut,
  ShieldCheck,
  BadgeDollarSign,
  PlusCircle,
  Target,
  TrendingUp,
  FileText,
  LayoutGrid,
} from "lucide-react"
import { Badge } from '@/components/ui/badge'
import { usePayment } from '@/contexts/PaymentContext'
import { useLocation, Link, useNavigate, useSearchParams } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useAuthContext } from "@/contexts/AuthContext"
import { AuthService } from "@/services/authService"
import { useReports, useReport, getLatestReportId } from "@/hooks/useReports"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NewAnalysisModal } from "./NewAnalysisModal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import * as React from "react"
import { NotificationBell } from "./NotificationBell"

export function AppSidebar() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, logout } = useAuthContext()
  const { userPlan, isLoading } = usePayment()
  const { isMobile, setOpenMobile } = useSidebar()
  const [isNewAnalysisModalOpen, setIsNewAnalysisModalOpen] = React.useState(false)
  const [isReportsModalOpen, setIsReportsModalOpen] = React.useState(false)

  // Récupérer le nom de domaine pour l'afficher à la place de "Virail Studio"
  const explicitReportId = location.state?.selectedReportId || searchParams.get('reportId');
  const { reports } = useReports();
  const reportId = explicitReportId || getLatestReportId(reports);
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

  const localUser = AuthService.getUser?.() as any
  const isProd = import.meta.env.PROD
  const isAdminLocal = Boolean(localUser?.is_admin ?? localUser?.isAdmin)
  const isAdmin = isProd 
    ? isAdminLocal 
    : (isAdminLocal || Boolean((user as any)?.is_admin || (user as any)?.isAdmin))

  const handleNavigation = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const data = {
    navMain: [
      {
        title: "Général",
        items: [
          {
            title: "Vue d'ensemble",
            url: "/",
            icon: Home,
            badge: undefined as string | undefined,
          },
          {
            title: "Concurrentielle",
            url: "/competition",
            icon: Target,
            badge: undefined as string | undefined,
          },

        ],
      },
      {
        title: "Paramètres",
        items: [
          {
            title: "Personnes",
            url: "/settings",
            icon: Users,
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
      ...(isAdmin ? [{
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
            icon: LayoutGrid,
            badge: undefined as string | undefined,
          },
          {
            title: "Doc abonnements",
            url: "/admin/subscriptions-docs",
            icon: FileText,
            badge: undefined as string | undefined,
          },
        ],
      }] : []),
    ],
  }

  return (
    <Sidebar className="border-r bg-sidebar text-sidebar-foreground" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => setIsReportsModalOpen(true)}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="currentColor" className="text-primary" opacity="0.15" />
                  <path d="M8 12l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary" />
                </svg>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{domainName || "Viraill"}</span>
                <span className="truncate text-[11px] text-muted-foreground">Mes analyses</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {data.navMain.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.title === "Général" && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => setIsNewAnalysisModalOpen(true)}
                      tooltip="Nouvelle Analyse"
                      className="font-medium"
                      style={{ 
                        color: '#3B82F6'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#3B82F6';
                        e.currentTarget.style.backgroundColor = 'rgba(239, 246, 255, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#3B82F6';
                        e.currentTarget.style.backgroundColor = '';
                      }}
                    >
                      <PlusCircle className="size-4" />
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
                          isActive && "border-l-2 border-primary rounded-l-none font-semibold"
                        )}
                      >
                        <Link to={explicitReportId ? `${item.url}?reportId=${explicitReportId}` : item.url} onClick={handleNavigation}>
                          <item.icon />
                          <span>{item.title}</span>
                          {item.badge && (
                            <span className="ml-auto text-xs font-medium text-muted-foreground">{item.badge}</span>
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
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.avatar_url} alt={user?.username} />
                    <AvatarFallback className="rounded-lg">{user?.username?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.username || "Utilisateur"}</span>
                    <span className="truncate text-xs">{user?.email || "user@example.com"}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user?.avatar_url} alt={user?.username} />
                      <AvatarFallback className="rounded-lg">{user?.username?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{user?.username || "Utilisateur"}</span>
                      <span className="truncate text-xs">{user?.email || "user@example.com"}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <BadgeDollarSign className="mr-2 h-4 w-4" />
                  Upgrade to Pro
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  Compte
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/pricing')}>
                  Facturation
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Se déconnecter
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

      {/* Modal plein écran - Mes analyses */}
      <Dialog open={isReportsModalOpen} onOpenChange={setIsReportsModalOpen}>
        <DialogContent className="sm:max-w-2xl p-0 gap-0 rounded-2xl overflow-hidden">
          <div className="flex flex-col max-h-[70vh]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Mes analyses</h2>
              <p className="text-xs text-gray-500 mt-0.5">{reports.length} rapport{reports.length > 1 ? 's' : ''}</p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3">
              <div className="flex flex-col gap-1.5">
                {reports.map((report) => {
                  const reportDomain = (() => {
                    try { return new URL(report.url).hostname.replace('www.', ''); } catch { return report.url; }
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
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                        isActive ? "bg-primary/5" : "hover:bg-gray-50"
                      )}
                    >
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${reportDomain}&sz=32`}
                        alt={reportDomain}
                        className="w-6 h-6 rounded flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className={cn("font-medium truncate text-sm", isActive ? "text-primary" : "text-gray-900")}>{reportDomain}</div>
                      </div>
                      {isActive && (
                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Sidebar>
  )
}