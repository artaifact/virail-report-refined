import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: number;
  max: number;
  description: string;
  icon: LucideIcon;
  status: "excellent" | "good" | "moderate" | "poor";
  className?: string;
}

const statusConfig = {
  excellent: {
    color: "bg-success-DEFAULT",
    badge: "bg-success-light text-success-dark",
    label: "Excellent",
  },
  good: {
    color: "bg-primary-500",
    badge: "bg-primary-100 text-primary-800",
    label: "Bon",
  },
  moderate: {
    color: "bg-warning-DEFAULT",
    badge: "bg-warning-light text-warning-dark",
    label: "Modéré",
  },
  poor: {
    color: "bg-error-DEFAULT",
    badge: "bg-error-light text-error-dark",
    label: "Faible",
  },
};

export function MetricCard({
  title,
  value,
  max,
  description,
  icon: Icon,
  status,
  className,
}: MetricCardProps) {
  const config = statusConfig[status];

  return (
    <Card className={cn("border-0 shadow-md transition-all duration-300 hover:shadow-lg", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Icon className="h-5 w-5 text-neutral-600" />
          <Badge className={config.badge}>{config.label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold">{value}</span>
              <span className="text-sm text-neutral-500">/{max}</span>
            </div>
            <Progress 
              value={value} 
              className={cn("h-2", config.color)}
            />
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-1">{title}</h3>
            <p className="text-xs text-neutral-600">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 