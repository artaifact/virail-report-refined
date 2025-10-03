import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, BarChart3, FileText, Users } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { cn } from "@/lib/utils";

interface MetricsOverviewProps {
  data: any;
}

const MetricsOverview = ({ data }: MetricsOverviewProps) => {
  if (!data) return null;

  const metrics = [
    {
      title: "Score GEO Global",
      value: data.metrics.llmoScore,
      max: 100,
      status: data.metrics.llmoScore >= 75 ? "excellent" : data.metrics.llmoScore >= 60 ? "good" : data.metrics.llmoScore >= 40 ? "moderate" : "poor",
      icon: BarChart3,
      description: "Probabilité de recommandation par les IA"
    },
    {
      title: "Cohérence Sémantique",
      value: data.metrics.semanticCoherence,
      max: 100,
      status: data.metrics.semanticCoherence >= 75 ? "excellent" : data.metrics.semanticCoherence >= 60 ? "good" : data.metrics.semanticCoherence >= 40 ? "moderate" : "poor",
      icon: FileText,
      description: "Vocabulaire cohérent et transitions fluides"
    },
    {
      title: "Facilité de Tokenisation",
      value: data.metrics.tokenizationEase,
      max: 100,
      status: data.metrics.tokenizationEase >= 75 ? "excellent" : data.metrics.tokenizationEase >= 60 ? "good" : data.metrics.tokenizationEase >= 40 ? "moderate" : "poor",
      icon: Target,
      description: "Structure adaptée aux tokenizers modernes"
    },
    {
      title: "Clarté Conceptuelle",
      value: data.metrics.conceptualClarity,
      max: 100,
      status: data.metrics.conceptualClarity >= 75 ? "excellent" : data.metrics.conceptualClarity >= 60 ? "good" : data.metrics.conceptualClarity >= 40 ? "moderate" : "poor",
      icon: Users,
      description: "Concepts clés bien définis"
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard
            key={index}
            {...metric}
            className="animate-slideIn"
            style={{ animationDelay: `${index * 100}ms` }}
          />
        ))}
      </div>

      {/* Detailed Analysis */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg animate-slideIn" style={{ animationDelay: "400ms" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success-DEFAULT" />
              Forces Identifiées
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.content.strengths.map((strength: string, index: number) => (
              <div key={index} className="flex items-start gap-3 group">
                <div className="w-2 h-2 bg-success-DEFAULT rounded-full mt-2 transition-transform group-hover:scale-150"></div>
                <div>
                  <p className="font-medium group-hover:text-success-DEFAULT transition-colors">{strength}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg animate-slideIn" style={{ animationDelay: "500ms" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-error-DEFAULT" />
              Faiblesses Détectées
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.content.weaknesses.slice(0, 4).map((weakness: any, index: number) => (
              <div key={index} className="flex items-start gap-3 group">
                <div className="w-2 h-2 bg-error-DEFAULT rounded-full mt-2 transition-transform group-hover:scale-150"></div>
                <div>
                  <p className="font-medium group-hover:text-error-DEFAULT transition-colors">{weakness.title}</p>
                  <p className="text-sm text-neutral-600">{weakness.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Brand & Product Perception */}
      <Card className="border-0 shadow-lg animate-slideIn" style={{ animationDelay: "600ms" }}>
        <CardHeader>
          <CardTitle>Perception de la Marque et du Produit</CardTitle>
          <CardDescription>Analyse de la proposition de valeur et du positionnement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
            <div>
                <h4 className="font-semibold mb-2 text-neutral-800">Site analysé</h4>
                <p className="text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                {data.website.url}
              </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2 text-neutral-800">Description</h4>
                <p className="text-sm text-neutral-600">
                {data.website.description}
              </p>
              </div>
            </div>
            
            <div className="space-y-4">
            <div>
                <h4 className="font-semibold mb-2 text-neutral-800">Profil d'audience</h4>
                <p className="text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                {data.audience.profile} ({data.audience.primaryAge})
              </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2 text-neutral-800">Segments principaux</h4>
              <div className="flex flex-wrap gap-2">
                {data.audience.segments.map((segment: any, index: number) => (
                    <Badge 
                      key={index} 
                      variant="outline"
                      className="hover:bg-primary-50 hover:text-primary-700 transition-colors"
                    >
                    {segment.title} ({segment.percentage}%)
                  </Badge>
                ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetricsOverview;
