import { ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BreadcrumbProps {
  items: { label: string; onClick?: () => void }[];
}

export const BreadcrumbCustom = ({ items }: BreadcrumbProps) => {
  return (
    <nav aria-label="Fil d'Ariane" className="flex items-center space-x-1.5 text-xs text-muted-foreground mb-4">
      <Home className="h-3.5 w-3.5" />
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-1.5">
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
          {item.onClick ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={item.onClick}
              className="p-0 h-auto font-normal text-muted-foreground hover:text-foreground hover:bg-transparent"
            >
              {item.label}
            </Button>
          ) : (
            <span className="font-medium text-foreground truncate max-w-[200px] sm:max-w-md">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
};
