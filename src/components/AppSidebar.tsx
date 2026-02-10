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
  TrendingUp
} from "lucide-react"
import { Badge } from '@/components/ui/badge'
import { usePayment } from '@/contexts/PaymentContext'
import { useLocation, Link, useNavigate, useSearchParams } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useAuthContext } from "@/contexts/AuthContext"
import { AuthService } from "@/services/authService"
import { useReports, useReport } from "@/hooks/useReports"
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

  // Récupérer le nom de domaine pour l'afficher à la place de "Virail Studio"
  const explicitReportId = location.state?.selectedReportId || searchParams.get('reportId');
  const { reports } = useReports();
  const reportId = explicitReportId || (reports.length > 0 ? reports[reports.length - 1].id : null);
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
    versions: ["1.0.0", "1.1.0-alpha", "2.0.0-beta1"],
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
            title: "Concurentielle",
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
          // Admin items only if admin
          ...(isAdmin ? [{
            title: "Admin • Waitlist",
            url: "/admin/waitlist",
            icon: ShieldCheck,
            badge: undefined as string | undefined,
          }] : []),
        ],
      },
    ],
  }

  return (
    <Sidebar className="border-r bg-sidebar text-sidebar-foreground" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{domainName || "Virail Studio"}</span>
                  </div>
                  <NotificationBell />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                align="start"
                side="bottom"
                sideOffset={4}
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Versions
                </DropdownMenuLabel>
                {data.versions.map((version) => (
                  <DropdownMenuItem
                    key={version}
                    onSelect={() => {}}
                    className="gap-2 p-2"
                  >
                    v{version}
                    {version === "1.0.0" && (
                      <div className="ml-auto flex h-4 w-4 items-center justify-center rounded-full border bg-background">
                        <Plus className="size-2" />
                      </div>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={location.pathname === item.url}
                      tooltip={item.title}
                    >
                      <Link to={item.url} onClick={handleNavigation}>
                        <item.icon />
                        <span>{item.title}</span>
                        {item.badge && (
                           <span className="ml-auto text-xs font-medium text-muted-foreground">{item.badge}</span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
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
    </Sidebar>
  )
}