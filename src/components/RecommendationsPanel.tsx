
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Star, Target, CheckCircle, ArrowRight, TrendingUp, AlertTriangle, Clock, Zap, Layers, FileSearch, Award, Rocket, BarChart3 } from "lucide-react";

interface RecommendationsPanelProps {
  data: any;
}

const RecommendationsPanel = ({ data }: RecommendationsPanelProps) => {
  if (!data) return null;

  const priorityRecommendations = [
    {
      priority: "high",
      category: "Structure",
      title: "Ajouter une hiérarchie HTML sémantique",
      description: "Structurer le contenu avec des balises h1, h2, h3 pour améliorer la compréhension IA",
      impact: "Amélioration de 25-40% de la visibilité",
      effort: "Faible",
      timeEstimate: "2-4 heures"
    },
    {
      priority: "high",
      category: "Contenu",
      title: "Intégrer des données chiffrées sourcées",
      description: "Ajouter des statistiques précises avec sources pour renforcer la crédibilité",
      impact: "Amélioration de 30-50% de la citabilité",
      effort: "Moyen",
      timeEstimate: "1-2 jours"
    },
    {
      priority: "medium",
      category: "Optimisation",
      title: "Créer du contenu original et citable",
      description: "Développer des insights uniques et des analyses originales",
      impact: "Amélioration de 20-35% de la recommandation",
      effort: "Élevé",
      timeEstimate: "1 semaine"
    }
  ];

  const quickWins = [
    "Ajouter des meta descriptions optimisées",
    "Structurer les FAQ pour les IA conversationnelles",
    "Optimiser les temps de chargement",
    "Améliorer la navigation interne"
  ];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Priorité élevée</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Priorité moyenne</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Priorité faible</Badge>;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "medium":
        return <TrendingUp className="h-5 w-5 text-yellow-500" />;
      default:
        return <Target className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Priority Recommendations */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900">Recommandations Prioritaires</CardTitle>
              <CardDescription className="text-gray-600">
                Actions à fort impact pour améliorer votre optimisation GEO
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {priorityRecommendations.map((rec, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    {getPriorityIcon(rec.priority)}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{rec.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {getPriorityBadge(rec.priority)}
                  <Badge variant="outline" className="text-gray-600">{rec.category}</Badge>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4 leading-relaxed">{rec.description}</p>
              
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="text-xs text-green-600 font-medium mb-1 flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" />
                    Impact estimé
                  </div>
                  <div className="font-semibold text-green-700">{rec.impact}</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="text-xs text-blue-600 font-medium mb-1 flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    Effort requis
                  </div>
                  <div className="font-semibold text-blue-700">{rec.effort}</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <div className="text-xs text-purple-600 font-medium mb-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Temps estimé
                  </div>
                  <div className="font-semibold text-purple-700">{rec.timeEstimate}</div>
                </div>
              </div>
              
              <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Marquer comme terminé
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Wins */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Rocket className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900">Actions Rapides</CardTitle>
              <CardDescription className="text-gray-600">
                Améliorations faciles à implémenter pour des résultats immédiats
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {quickWins.map((win, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="text-gray-900 flex-1">{win}</span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Progress Tracking */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Award className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900">Progression de l'Optimisation</CardTitle>
              <CardDescription className="text-gray-600">
                Suivi de vos améliorations GEO
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Score LLMO global</span>
              <span className="text-2xl font-bold text-blue-600">72/100</span>
            </div>
            <Progress value={72} className="h-3" />
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { value: "8/12", label: "Recommandations appliquées", color: "blue", icon: CheckCircle },
              { value: "+15%", label: "Amélioration ce mois", color: "green", icon: TrendingUp },
              { value: "A", label: "Grade LLMO actuel", color: "purple", icon: Award }
            ].map((metric, index) => (
              <div key={index} className={`text-center p-4 rounded-lg border ${
                metric.color === 'blue' ? 'bg-blue-50 border-blue-200' :
                metric.color === 'green' ? 'bg-green-50 border-green-200' : 'bg-purple-50 border-purple-200'
              }`}>
                <div className="flex items-center justify-center mb-2">
                  <metric.icon className={`h-5 w-5 ${
                    metric.color === 'blue' ? 'text-blue-600' :
                    metric.color === 'green' ? 'text-green-600' : 'text-purple-600'
                  }`} />
                </div>
                <div className={`text-xl font-bold mb-1 ${
                  metric.color === 'blue' ? 'text-blue-700' :
                  metric.color === 'green' ? 'text-green-700' : 'text-purple-700'
                }`}>{metric.value}</div>
                <div className="text-sm text-gray-600">{metric.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecommendationsPanel;
