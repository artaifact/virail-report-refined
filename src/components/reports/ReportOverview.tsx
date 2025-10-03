
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Clock, CheckCircle, Target, Users, Lightbulb, Award, TrendingUp } from "lucide-react";

interface ReportOverviewProps {
  report: any;
}

const ReportOverview = ({ report }: ReportOverviewProps) => {
  return (
    <div className="space-y-6">
      {/* Header - Simplified and cleaner */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-xl">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900 font-semibold">
                  {report.url.toUpperCase()} - Analyse LLMO
                </CardTitle>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{report.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>{report.llmsCompleted} LLMs</span>
                  </div>
                  <span>{report.date}</span>
                </div>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-700 border-green-200">
              Terminé
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Scores - More compact and elegant */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Award className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Recommandation IA</h3>
                <p className="text-sm text-gray-600">Probabilité de recommandation</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl font-bold text-green-600">{report.overallScore}</div>
              <div className="text-gray-400">/100</div>
              <div className="flex gap-0.5">
                {Array.from({ length: Math.floor(report.overallScore / 25) }, (_, i) => (
                  <span key={i} className="text-yellow-400">⭐</span>
                ))}
              </div>
            </div>
            <Progress value={report.overallScore} className="h-2" />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Qualité Sémantique</h3>
                <p className="text-sm text-gray-600">Cohérence du contenu</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl font-bold text-blue-600">{report.semanticScore}</div>
              <div className="text-gray-400">/100</div>
              <div className="flex gap-0.5">
                {Array.from({ length: Math.floor(report.semanticScore / 25) }, (_, i) => (
                  <span key={i} className="text-yellow-400">⭐</span>
                ))}
              </div>
            </div>
            <Progress value={report.semanticScore} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Status cards - Simplified */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-gray-900">Modules Complétés</span>
              </div>
              <Badge className="bg-green-100 text-green-700 border-green-200">
                6/6
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div className="bg-green-600 h-2 rounded-full w-full"></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-900">Statut d'Analyse</span>
              </div>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                Terminé
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-2">Recommandations disponibles</p>
          </CardContent>
        </Card>
      </div>

      {/* Overview summary - Cleaner layout */}
      <Card className="border-0 shadow-md">
        <CardHeader className="border-b border-gray-100 pb-4">
          <CardTitle className="flex items-center gap-3 text-lg text-gray-900">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Lightbulb className="h-5 w-5 text-purple-600" />
            </div>
            Aperçu Rapide
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left column - Info */}
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg mt-0.5">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Audience Cible</h4>
                  <p className="text-sm text-gray-600">Voyageurs 25-45 ans, budget-conscients</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg mt-0.5">
                  <BarChart3 className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Perception Marché</h4>
                  <p className="text-sm text-gray-600">Plateforme de comparaison fiable</p>
                </div>
              </div>
            </div>
            
            {/* Right column - Insights */}
            <div className="space-y-4">
              <div className="bg-green-50 rounded-xl p-4 border border-green-200/50">
                <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Points Forts
                </h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Interface claire et intuitive</li>
                  <li>• Partenariats solides</li>
                  <li>• Large choix d'options</li>
                </ul>
              </div>
              
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-200/50">
                <h4 className="font-medium text-orange-900 mb-3 flex items-center gap-2">
                  <span className="text-orange-600">⚡</span>
                  À Améliorer
                </h4>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>• Optimisation SEO avancée</li>
                  <li>• Contenu différenciant</li>
                  <li>• Données plus précises</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportOverview;
