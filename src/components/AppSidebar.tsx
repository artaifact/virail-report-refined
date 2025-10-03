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
} from "@/components/ui/sidebar"
import { LayoutDashboard, LineChart, Settings, CircleHelp, Trophy, ChevronRight, Globe2, Sparkles, Crown, ShieldCheck, UserCog, BadgeDollarSign } from "lucide-react"
import { Badge } from '@/components/ui/badge'
import { usePayment } from '@/contexts/PaymentContext'
import { useLocation, Link } from "react-router-dom"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { useAuthContext } from "@/contexts/AuthContext"
import { AuthService } from "@/services/authService"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import * as React from "react"

const navigationItems = [
  {
    title: "Tableau de bord",
    url: "/",
    icon: LayoutDashboard,
    gradient: "",
  },
  {
    title: "Analyses GEO",
    url: "/analyses",
    icon: LineChart,
    gradient: "",
  },
  // {
  //   title: "Audit LLMO",
  //   url: "/llmo-dashboard",
  //   icon: Sparkles,
  //   gradient: "",
  // },
  {
    title: "Analyse concurrentielle",
    url: "/competition",
    icon: Trophy,
    gradient: "",
  },
  {
    title: "Sites pour optimisation",
    url: "/sites-optimization",
    icon: Globe2,
    gradient: "",
  },
]

const bottomItems = [
  {
    title: "Plans & Tarifs",
    url: "/pricing",
    icon: BadgeDollarSign,
    gradient: "",
  },
  // {
  //   title: "Test Paiement",
  //   url: "/payment-test",
  //   icon: Sparkles,
  //   gradient: "",
  // },
  {
    title: "Profile",
    url: "/settings",
    icon: UserCog,
    gradient: "",
  },
  {
    title: "Aide",
    url: "/help",
    icon: CircleHelp,
    gradient: "",
  },
]

export function AppSidebar() {
  const location = useLocation()
  const { user } = useAuthContext()
  const { userPlan, isLoading } = usePayment()
  const localUser = AuthService.getUser?.() as any
  const isAdmin = (localUser?.is_admin || localUser?.isAdmin) ?? ((user as any)?.is_admin || (user as any)?.isAdmin)
  const adminItems = isAdmin ? [{ title: "Admin • Waitlist", url: "/admin/waitlist", icon: ShieldCheck, gradient: "" }] : []
  const allItems = [...navigationItems, ...adminItems, ...bottomItems]
  const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>({})

  // Auto-ouvrir le menu si on est sur une page enfant
  React.useEffect(() => {
    const newOpenMenus: Record<string, boolean> = {}
    navigationItems.forEach((item) => {
      if ((item as any).children && (item as any).urlPrefix && location.pathname.startsWith((item as any).urlPrefix)) {
        newOpenMenus[item.title] = true
      }
    })
    setOpenMenus(newOpenMenus)
  }, [location.pathname])

  const handleMenuToggle = (title: string, open: boolean) => {
    setOpenMenus(prev => ({ ...prev, [title]: open }))
  }



  return (
    <Sidebar className="border-r-0 bg-sidebar shadow-xl text-sidebar-foreground">
      {/* Header avec logo et branding */}
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-center mb-6">
          {/* <div className="w-12 h-12 bg-neutral-200 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-neutral-700" />
          </div> */}
          <div className="flex items-center justify-center w-full">
            <img
              src="/LOGO BLEU FOND TRANSPARENT (1).png"
              alt="Virail Studio"
              className="h-36 md:h-40 w-auto object-contain mx-auto"
            />
          </div>
        </div>
        
        {/* User info card */}
        {/* <div className="rounded-xl p-3 border border-neutral-200 bg-white">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 ring-2 ring-white shadow-sm">
              <AvatarFallback className="bg-neutral-200 text-neutral-700 font-semibold">
                {user ? String(user).charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-neutral-900 truncate">
                {user ? String(user) : 'Utilisateur'}
              </p>
              <p className="text-xs text-neutral-500">Analyste IA</p>
            </div>
          </div> */}
        {/* </div> */}
      </SidebarHeader>
      
      <SidebarContent className="px-4 pt-4 pb-0 flex-1 overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 uppercase text-xs font-bold px-3 py-2 mb-2 tracking-wider">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {allItems.map((item) => {
                const isActive = location.pathname === item.url || 
                  ((item as any).urlPrefix && location.pathname.startsWith((item as any).urlPrefix))
                
                return (
                  <SidebarMenuItem key={item.title}>
                    {(item as any).children ? (
                      <Collapsible 
                        open={openMenus[item.title]} 
                        onOpenChange={(open) => handleMenuToggle(item.title, open)}
                      >
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            className={cn(
                              "w-full justify-start group rounded-xl h-10 transition-all duration-200 hover:shadow-md",
                              isActive 
                                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                : "hover:bg-sidebar-accent"
                            )}
                          >
                            <div className="flex items-center gap-3 w-full">
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                isActive 
                                  ? "bg-sidebar-primary-foreground/10" 
                                  : "bg-sidebar-accent group-hover:bg-sidebar-accent/80"
                              )}>
                                <item.icon className="h-4 w-4" />
                              </div>
                              <span className="text-xs font-medium flex-1 text-left">{item.title}</span>
                              <ChevronRight className={cn(
                                "h-4 w-4 transition-transform duration-200", 
                                openMenus[item.title] && "rotate-90"
                              )} />
                            </div>
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenu className="pl-8 pt-2 space-y-1">
                            {(item as any).children?.map((child: any) => (
                              <SidebarMenuItem key={child.title}>
                                <SidebarMenuButton
                                  asChild
                                  className={cn(
                                    "w-full justify-start rounded-lg h-10 transition-all duration-200",
                                    location.pathname === child.url
                                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                                      : "hover:bg-sidebar-accent"
                                  )}
                                >
                                  <Link to={child.url} className="flex items-center gap-3 px-3 py-2 text-xs">
                                    <div className="w-2 h-2 rounded-full bg-current opacity-60"></div>
                                    {child.title}
                                  </Link>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            ))}
                          </SidebarMenu>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <SidebarMenuButton
                        asChild
                        className={cn(
                          "w-full justify-start group rounded-xl h-10 transition-all duration-200 hover:shadow-md",
                          isActive 
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "hover:bg-sidebar-accent"
                        )}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-3 py-2">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                            isActive 
                              ? "bg-sidebar-primary-foreground/10" 
                              : "bg-sidebar-accent group-hover:bg-sidebar-accent/80"
                          )}>
                            <item.icon className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 pt-4 pb-2 border-t border-sidebar-border mt-auto">
        {/* Plan actuel */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs text-sidebar-foreground/70">Plan actuel</span>
          <Badge variant="secondary" className="text-[10px]">
            {isLoading ? 'Chargement…' : (userPlan?.currentPlan?.name || 'Inconnu')}
          </Badge>
        </div>
        {/* Footer branding */}
        <div className="mt-2 pt-1">
          <p className="text-xs text-sidebar-foreground/60 text-center">
            © 2025 Virail Studio
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}