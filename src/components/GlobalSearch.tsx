import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart3,
  Wrench,
  Cpu,
  CreditCard,
  Settings,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  Zap,
  Globe,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

interface SearchAction {
  title: string;
  description: string;
  path: string;
  category: "Navigation" | "Métriques" | "Actions" | "Système";
  icon?: React.ComponentType<{ className?: string }>;
}

const SEARCH_ITEMS: SearchAction[] = [
  // Navigation principale
  {
    title: "Vue d'ensemble",
    description: "Score global, aperçu des métriques et citations",
    path: "/",
    category: "Navigation",
    icon: LayoutDashboard,
  },
  {
    title: "Analyse Concurrentielle",
    description: "Comparaison des parts de voix et citations",
    path: "/competition",
    category: "Navigation",
    icon: BarChart3,
  },
  {
    title: "Plan d'actions & Améliorer",
    description: "Feuille de route et correctifs sémantiques",
    path: "/ameliorer",
    category: "Navigation",
    icon: Wrench,
  },
  {
    title: "Cockpit Agentique",
    description: "Protocoles machine-to-machine et conformité LLM",
    path: "/agentic",
    category: "Navigation",
    icon: Cpu,
  },
  {
    title: "Facturation & Abonnements",
    description: "Gestion des formules et consommation",
    path: "/pricing",
    category: "Navigation",
    icon: CreditCard,
  },
  {
    title: "Paramètres du compte",
    description: "Profil, équipe et préférences",
    path: "/settings",
    category: "Navigation",
    icon: Settings,
  },
  {
    title: "Aide & Documentation",
    description: "Guides méthodologiques et assistance",
    path: "/help",
    category: "Navigation",
    icon: HelpCircle,
  },

  // Métriques & Analyses clés
  {
    title: "Score GEO Global",
    description: "Visibilité dans les moteurs génératifs (ChatGPT, Perplexity...)",
    path: "/",
    category: "Métriques",
    icon: Globe,
  },
  {
    title: "Score E-E-A-T",
    description: "Expertise, Expérience, Autorité et Confiance",
    path: "/ameliorer",
    category: "Métriques",
    icon: ShieldCheck,
  },
  {
    title: "Citations LLM",
    description: "Mentions directes et sources d'entraînement",
    path: "/competition",
    category: "Métriques",
    icon: TrendingUp,
  },

  // Actions & Quick Wins
  {
    title: "Quick Wins",
    description: "Actions rapides à impact immédiat sur le référencement",
    path: "/ameliorer",
    category: "Actions",
    icon: Zap,
  },
];

export const GlobalSearch = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  const navItems = SEARCH_ITEMS.filter((item) => item.category === "Navigation");
  const metricItems = SEARCH_ITEMS.filter((item) => item.category === "Métriques");
  const actionItems = SEARCH_ITEMS.filter((item) => item.category === "Actions");

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
      <CommandInput placeholder="Rechercher une page, métrique ou action... (⌘K)" />
      <CommandList className="max-h-[360px] py-2">
        <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">
          Aucun résultat trouvé pour votre recherche.
        </CommandEmpty>

        <CommandGroup heading="Pages & Navigation">
          {navItems.map((item) => {
            const Icon = item.icon || LayoutDashboard;
            return (
              <CommandItem
                key={item.title}
                value={`${item.title} ${item.description}`}
                onSelect={() => handleSelect(item.path)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-medium text-sm text-foreground truncate">{item.title}</span>
                  <span className="text-xs text-muted-foreground truncate">{item.description}</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-normal shrink-0">
                  {item.category}
                </Badge>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator className="my-1" />

        <CommandGroup heading="Métriques & Indicateurs">
          {metricItems.map((item) => {
            const Icon = item.icon || TrendingUp;
            return (
              <CommandItem
                key={item.title}
                value={`${item.title} ${item.description}`}
                onSelect={() => handleSelect(item.path)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-medium text-sm text-foreground truncate">{item.title}</span>
                  <span className="text-xs text-muted-foreground truncate">{item.description}</span>
                </div>
                <Badge variant="secondary" className="text-[10px] font-normal shrink-0">
                  {item.category}
                </Badge>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator className="my-1" />

        <CommandGroup heading="Recommandations">
          {actionItems.map((item) => {
            const Icon = item.icon || Zap;
            return (
              <CommandItem
                key={item.title}
                value={`${item.title} ${item.description}`}
                onSelect={() => handleSelect(item.path)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-medium text-sm text-foreground truncate">{item.title}</span>
                  <span className="text-xs text-muted-foreground truncate">{item.description}</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-normal shrink-0">
                  {item.category}
                </Badge>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default GlobalSearch;
