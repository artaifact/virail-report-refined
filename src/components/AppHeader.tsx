import * as React from "react";
import { useLocation } from "react-router-dom";
import { Search, Globe } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AppHeaderProps {
  domainName?: string | null;
}

const ROUTE_LABELS: Record<string, string> = {
  "/": "Vue d'ensemble",
  "/analyses": "Analyses",
  "/llmo-dashboard": "LLMO Dashboard",
  "/competition": "Concurrentielle",
  "/ameliorer": "Améliorer",
  "/agentic": "Éligibilité Agentique",
  "/sites-optimization": "Optimisation des sites",
  "/optimisation/technique": "Optimisation technique",
  "/optimisation/textuelle": "Optimisation textuelle",
  "/optimization-agent": "Agent d'optimisation",
  "/export": "Export",
  "/audience": "Audience",
  "/content": "Contenu",
  "/api-demo": "API Démo",
  "/pricing": "Facturation & Plans",
  "/payment-test": "Test paiement",
  "/success": "Paiement réussi",
  "/settings": "Paramètres",
  "/help": "Aide & Documentation",
  "/admin/waitlist": "Admin Waitlist",
  "/admin/messages": "Admin Messages",
  "/admin/subscriptions-docs": "Admin Abonnements",
  "/admin/plans": "Admin Plans",
};

export function AppHeader({ domainName }: AppHeaderProps) {
  const location = useLocation();

  const currentPageTitle = React.useMemo(() => {
    if (ROUTE_LABELS[location.pathname]) {
      return ROUTE_LABELS[location.pathname];
    }
    // Matcher de préfixe pour routes imbriquées
    const matchedKey = Object.keys(ROUTE_LABELS).find(
      (path) => path !== "/" && location.pathname.startsWith(path)
    );
    return matchedKey ? ROUTE_LABELS[matchedKey] : "Tableau de bord";
  }, [location.pathname]);

  const triggerGlobalSearch = () => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "k",
        metaKey: true,
        ctrlKey: true,
        bubbles: true,
      })
    );
  };

  const domain = domainName || "Viraill";

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-background/80 px-3 sm:px-4 backdrop-blur-md transition-all">
      {/* Zone gauche : Trigger + Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarTrigger className="-ml-1 h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors" />
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start">
            Basculer la barre latérale
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-4 bg-border/60" />

        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="text-xs sm:text-sm font-medium">
            <BreadcrumbItem className="hidden xs:inline-flex items-center gap-1.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Globe className="h-3 w-3" />
              </span>
              <BreadcrumbLink
                href="/"
                className="max-w-[120px] sm:max-w-[200px] truncate text-muted-foreground hover:text-foreground transition-colors"
                title={domain}
              >
                {domain}
              </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator className="hidden xs:inline-flex" />

            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold text-foreground truncate max-w-[150px] sm:max-w-none">
                {currentPageTitle}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Zone droite : Recherche rapide + Notifications */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Raccourci recherche rapide shadcn */}
        <Button
          variant="outline"
          size="sm"
          onClick={triggerGlobalSearch}
          className="relative h-8 w-8 sm:w-56 sm:justify-between px-2 sm:px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 border-border/60 shadow-none font-normal"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline-block truncate">Rechercher...</span>
          </div>
          <kbd className="hidden sm:inline-flex pointer-events-none h-4 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        {/* Cloche de notifications */}
        <NotificationBell />
      </div>
    </header>
  );
}
