
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FileText, Code, BarChart3, Zap, AlertTriangle, CheckCircle } from "lucide-react";

interface ContentAnalysisProps {
  data: any;
}

interface ContentStrength {
  title?: string;
  description?: string;
}

const ContentAnalysis = ({ data }: ContentAnalysisProps) => {
  if (!data) return null;

  const semanticMetrics = [
    {
      category: "Cohérence sémantique",
      score: data.metrics?.semanticCoherence || 72,
      range: "65-80",
      status: "good",
      description: "Vocabulaire cohérent lié au voyage et à la réservation, mais transitions parfois abruptes"
    },
    {
      category: "Densité informationnelle",
      score: 67,
      range: "65-70",
      status: "moderate",
      description: "Information diluée par répétitions et listes longues"
    },
    {
      category: "Complexité syntaxique",
      score: 60,
      range: "50-70",
      status: "moderate",
      description: "Prédominance de phrases simples, peu de variation"
    },
    {
      category: "Clarté conceptuelle",
      score: data.metrics?.conceptualClarity || 80,
      range: "75-85",
      status: "good",
      description: "Concepts clés bien définis, hiérarchisation logique"
    },
    {
      category: "Facilité de tokenisation",
      score: data.metrics?.tokenizationEase || 85,
      range: "80-90",
      status: "excellent",
      description: "Structure bien adaptée aux tokenizers modernes"
    }
  ];

  const getScoreColor = (status: string) => {
    switch (status) {
      case "excellent": return "text-green-600";
      case "good": return "text-blue-600";
      case "moderate": return "text-yellow-600";
      default: return "text-red-600";
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case "excellent": return "bg-green-500";
      case "good": return "bg-blue-500";
      case "moderate": return "bg-yellow-500";
      default: return "bg-red-500";
    }
  };

  const contentIssues = data.content?.weaknesses || [
    {
      type: "Structure",
      severity: "high",
      title: "Manque de structure HTML sémantique",
      description: "Absence de balises h1, h2, etc. pour hiérarchiser le contenu",
      impact: "Difficulté pour les IA à comprendre la structure du contenu"
    },
    {
      type: "Données",
      severity: "high", 
      title: "Absence de statistiques précises",
      description: "Manque de données chiffrées et sourcées",
      impact: "Réduction de la crédibilité et de la citable par les IA"
    },
    {
      type: "Originalité",
      severity: "medium",
      title: "Peu d'éléments citables originaux",
      description: "Contenu principalement promotionnel sans valeur ajoutée unique",
      impact: "Faible probabilité de recommandation par les IA"
    },
    {
      type: "Fluidité",
      severity: "medium",
      title: "Transitions abruptes",
      description: "Passages brusques entre sections sans liens logiques",
      impact: "Difficulté de compréhension et d'indexation"
    }
  ];

  const contentStrengths: (string | ContentStrength)[] = data.content?.strengths || [
    "Vocabulaire spécialisé cohérent",
    "Structure tokenization-friendly", 
    "Concepts clairement définis",
    "Contenu actualisé"
  ];

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return <Badge className="bg-red-100 text-red-800">Élevé</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800">Moyen</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800">Faible</Badge>;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Semantic Analysis Metrics */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Analyse Sémantique Détaillée
          </CardTitle>
          <CardDescription className="text-gray-600">
            Évaluation de la qualité et structure du contenu pour l'optimisation IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {semanticMetrics.map((metric, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">{metric.category}</h4>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${getScoreColor(metric.status)}`}>
                    {metric.score}
                  </span>
                  <span className="text-sm text-gray-500">/100</span>
                </div>
              </div>
              <Progress 
                value={metric.score} 
                className="h-3"
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{metric.description}</span>
                <Badge variant="outline" className="border-gray-300 text-gray-600">{metric.range}/100</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Content Issues */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Problèmes de Contenu Identifiés
          </CardTitle>
          <CardDescription className="text-gray-600">
            Points d'amélioration prioritaires pour optimiser la visibilité IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {contentIssues.map((issue: any, index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getSeverityIcon(issue.severity)}
                  <h4 className="font-semibold text-gray-900">{issue.title}</h4>
                </div>
                <div className="flex items-center gap-2">
                  {getSeverityBadge(issue.severity)}
                  <Badge variant="outline" className="border-gray-300 text-gray-600">{issue.type}</Badge>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
              <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                <p className="text-sm text-gray-700">
                  <strong>Impact:</strong> {issue.impact}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Content Strengths */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Forces du Contenu
          </CardTitle>
          <CardDescription className="text-gray-600">
            Éléments positifs à maintenir et renforcer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {contentStrengths.map((strength: string | ContentStrength, index: number) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900 mb-1">
                    {typeof strength === 'string' ? strength : strength.title || ''}
                  </h4>
                  <p className="text-sm text-green-700">
                    {typeof strength === 'string' ? '' : strength.description || ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technical Analysis */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Code className="h-5 w-5 text-purple-600" />
            Analyse Technique
          </CardTitle>
          <CardDescription className="text-gray-600">
            Évaluation de la structure technique du contenu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600 mb-2">HTML</div>
              <p className="text-sm text-gray-600">Structure sémantique à améliorer</p>
              <Badge className="mt-2 bg-yellow-100 text-yellow-800 border-yellow-300">Modéré</Badge>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600 mb-2">Tokenisation</div>
              <p className="text-sm text-gray-600">Excellente compatibilité IA</p>
              <Badge className="mt-2 bg-green-100 text-green-800 border-green-300">Excellent</Badge>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600 mb-2">Lisibilité</div>
              <p className="text-sm text-gray-600">Concepts clairs et définis</p>
              <Badge className="mt-2 bg-green-100 text-green-800 border-green-300">Bon</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentAnalysis;
