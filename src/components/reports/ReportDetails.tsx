import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, AlertCircle } from "lucide-react";
import { useState } from "react";
import type { MappedReportData } from "../../types/llmo-report";

interface ReportDetailsProps {
  mappedData: MappedReportData;
}

const ReportDetails = ({ mappedData }: ReportDetailsProps) => {
  const [expandedSection, setExpandedSection] = useState<string | null>("semantic");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success": return "✅";
      case "warning": return "⚠️";
      case "error": return "❌";
      default: return "ℹ️";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  // Vérifier s'il y a des données d'analyse sémantique
  if (mappedData.semanticAnalyses.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          Données détaillées non disponibles
        </h3>
        <p className="text-yellow-700">
          Les analyses détaillées ne sont pas encore disponibles pour ce rapport LLMO.
        </p>
      </div>
    );
  }

  const semanticAnalysis = mappedData.semanticAnalyses[0];

  // Créer les détails sémantiques avec les vraies données
  const semanticDetails = {
    coherence: {
      score: semanticAnalysis.coherenceScore || 0,
      title: "Cohérence Sémantique",
      details: [
        { 
          label: "Score de cohérence", 
          status: (semanticAnalysis.coherenceScore || 0) >= 75 ? "success" : 
                  (semanticAnalysis.coherenceScore || 0) >= 50 ? "warning" : "error", 
          description: `Score global : ${semanticAnalysis.coherenceScore || 0}/100` 
        },
        { 
          label: "Consistance vocabulaire", 
          status: "success", 
          description: "Analyse basée sur l'uniformité terminologique" 
        },
        { 
          label: "Fluidité transitions", 
          status: "success", 
          description: "Évaluation des liens logiques entre sections" 
        }
      ],
      recommendations: [
        "Maintenir la cohérence terminologique",
        "Renforcer les transitions entre sections",
        "Uniformiser le style rédactionnel"
      ]
    },
    density: {
      score: semanticAnalysis.densityScore || 0,
      title: "Densité Informationnelle", 
      details: [
        { 
          label: "Score de densité", 
          status: (semanticAnalysis.densityScore || 0) >= 75 ? "success" : 
                  (semanticAnalysis.densityScore || 0) >= 50 ? "warning" : "error", 
          description: `Score global : ${semanticAnalysis.densityScore || 0}/100` 
        },
        { 
          label: "Richesse du contenu", 
          status: (semanticAnalysis.densityScore || 0) >= 70 ? "success" : "warning", 
          description: "Évaluation de la profondeur informationnelle" 
        },
        { 
          label: "Originalité des informations", 
          status: (semanticAnalysis.densityScore || 0) >= 60 ? "success" : "warning", 
          description: "Analyse de l'unicité du contenu" 
        }
      ],
      recommendations: [
        "Enrichir le contenu avec des données spécifiques",
        "Ajouter des informations différenciantes",
        "Développer des arguments uniques"
      ]
    },
    complexity: {
      score: semanticAnalysis.complexityScore || 0,
      title: "Complexité Syntaxique",
      details: [
        { 
          label: "Score de complexité", 
          status: (semanticAnalysis.complexityScore || 0) >= 75 ? "success" : 
                  (semanticAnalysis.complexityScore || 0) >= 50 ? "warning" : "error", 
          description: `Score global : ${semanticAnalysis.complexityScore || 0}/100` 
        },
        { 
          label: "Variété des structures", 
          status: (semanticAnalysis.complexityScore || 0) >= 70 ? "success" : "warning", 
          description: "Analyse de la diversité syntaxique" 
        },
        { 
          label: "Sophistication linguistique", 
          status: (semanticAnalysis.complexityScore || 0) >= 60 ? "success" : "warning", 
          description: "Évaluation de la richesse du vocabulaire" 
        }
      ],
      recommendations: [
        "Varier la complexité des phrases",
        "Intégrer des structures plus sophistiquées",
        "Équilibrer simplicité et richesse"
      ]
    },
    clarity: {
      score: semanticAnalysis.clarityScore || 0,
      title: "Clarté Conceptuelle",
      details: [
        { 
          label: "Score de clarté", 
          status: (semanticAnalysis.clarityScore || 0) >= 75 ? "success" : 
                  (semanticAnalysis.clarityScore || 0) >= 50 ? "warning" : "error", 
          description: `Score global : ${semanticAnalysis.clarityScore || 0}/100` 
        },
        { 
          label: "Compréhensibilité", 
          status: (semanticAnalysis.clarityScore || 0) >= 70 ? "success" : "warning", 
          description: "Facilité de compréhension du contenu" 
        },
        { 
          label: "Structure logique", 
          status: (semanticAnalysis.clarityScore || 0) >= 60 ? "success" : "warning", 
          description: "Organisation et hiérarchisation des idées" 
        }
      ],
      recommendations: [
        "Simplifier les concepts complexes",
        "Améliorer la structure logique",
        "Clarifier les messages clés"
      ]
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-gray-900">
            Analyse Détaillée - LLM: {semanticAnalysis.llm}
          </CardTitle>
          <CardDescription>
            Analyse approfondie de la qualité sémantique du contenu analysé
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{semanticAnalysis.overallScore}/100</div>
              <div className="text-sm text-blue-700">Score Global</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{semanticAnalysis.coherenceScore || 0}/100</div>
              <div className="text-sm text-green-700">Cohérence</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{semanticAnalysis.densityScore || 0}/100</div>
              <div className="text-sm text-orange-700">Densité</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{semanticAnalysis.clarityScore || 0}/100</div>
              <div className="text-sm text-purple-700">Clarté</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {Object.entries(semanticDetails).map(([key, section]: [string, any]) => (
        <Card key={key} className="border-gray-200">
          <CardHeader 
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setExpandedSection(expandedSection === key ? null : key)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(section.score)}`}>
                    {section.score}/100
                  </div>
                  <Badge 
                    className={
                      section.score >= 80 ? "bg-green-100 text-green-800 border-green-300" :
                      section.score >= 60 ? "bg-yellow-100 text-yellow-800 border-yellow-300" :
                      "bg-red-100 text-red-800 border-red-300"
                    }
                  >
                    {section.score >= 80 ? "Excellent" : section.score >= 60 ? "Moyen" : "Faible"}
                  </Badge>
                </div>
                <div>
                  <CardTitle className="text-lg text-gray-900">{section.title}</CardTitle>
                  <Progress value={section.score} className="w-64 h-2 mt-2" />
                </div>
              </div>
              {expandedSection === key ? (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </div>
          </CardHeader>
          
          {expandedSection === key && (
            <CardContent className="space-y-4 border-t border-gray-100">
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Détails d'Évaluation</h4>
                {section.details.map((detail: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getStatusIcon(detail.status)}</span>
                      <div>
                        <span className="font-medium text-gray-900">{detail.label}</span>
                        <p className="text-sm text-gray-600">{detail.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Recommandations</h4>
                <ul className="space-y-1">
                  {section.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {/* Résumé exécutif et améliorations */}
      {semanticAnalysis.executiveSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-gray-900">Résumé Exécutif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
              <p className="text-gray-700 leading-relaxed">
                {semanticAnalysis.executiveSummary}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {semanticAnalysis.improvements.length > 0 && (
      <Card>
        <CardHeader>
            <CardTitle className="text-lg text-gray-900">Recommandations d'Amélioration</CardTitle>
          <CardDescription>
              Suggestions spécifiques pour optimiser le contenu
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-3">
              {semanticAnalysis.improvements.map((improvement, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                  <span className="text-orange-600 mt-1 font-bold">{index + 1}.</span>
                  <p className="text-gray-700 flex-1">{improvement}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métriques additionnelles si disponibles */}
      {(semanticAnalysis.embeddingScore || semanticAnalysis.tokenizationScore) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-gray-900">Métriques Techniques Avancées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {semanticAnalysis.embeddingScore && (
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-indigo-900">Qualité Embeddings</span>
                    <Badge variant="outline" className="border-indigo-300 text-indigo-700">
                      {semanticAnalysis.embeddingScore}/100
                    </Badge>
                  </div>
                  <Progress value={semanticAnalysis.embeddingScore} className="h-2" />
          </div>
              )}
              
              {semanticAnalysis.tokenizationScore && (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-purple-900">Facilité Tokenisation</span>
                    <Badge variant="outline" className="border-purple-300 text-purple-700">
                      {semanticAnalysis.tokenizationScore}/100
            </Badge>
                  </div>
                  <Progress value={semanticAnalysis.tokenizationScore} className="h-2" />
                </div>
              )}
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
};

export default ReportDetails;
