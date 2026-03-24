import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronRight, CheckCircle, Star, AlertCircle } from "lucide-react";
import { useState } from "react";
import type { MappedReportData } from "../../types/llmo-report";

interface ReportModulesProps {
  mappedData: MappedReportData;
}

const ReportModules = ({ mappedData }: ReportModulesProps) => {
  const [expandedModule, setExpandedModule] = useState<string | null>("perception");

  // Créer les modules avec les vraies données
  const modules = [
    {
      id: "perception",
      title: "Perception IA",
      icon: "🎭",
      status: "completed",
      color: "from-blue-500 to-blue-600",
      hasData: mappedData.perceptions.length > 0,
      data: mappedData.perceptions.length > 0 ? {
        "Sujet Principal": { 
          value: mappedData.perceptions[0].mainSubject || "Non spécifié", 
          status: mappedData.perceptions[0].mainSubject ? "success" : "warning" 
        },
        "Ton Général": { 
          value: mappedData.perceptions[0].generalTone || "Non analysé", 
          status: mappedData.perceptions[0].generalTone ? "success" : "warning" 
        },
        "Style d'Écriture": { 
          value: mappedData.perceptions[0].writingStyle || "Non défini", 
          status: mappedData.perceptions[0].writingStyle ? "success" : "warning" 
        },
        "Biais Détectés": { 
          value: mappedData.perceptions[0].bias || "Non détectés", 
          status: mappedData.perceptions[0].bias ? "warning" : "success" 
        },
        "Lisibilité": { 
          value: mappedData.perceptions[0].readability || "Non évaluée", 
          status: mappedData.perceptions[0].readability ? "success" : "warning" 
        }
      } : {}
    },
    {
      id: "audience",
      title: "Audience Cible", 
      icon: "👥",
      status: "completed",
      color: "from-green-500 to-green-600",
      hasData: mappedData.audiences.length > 0,
      data: mappedData.audiences.length > 0 ? {
        "Indices Explicites": { 
          value: mappedData.audiences[0].explicitIndicators || "Non spécifiés", 
          status: mappedData.audiences[0].explicitIndicators ? "success" : "warning" 
        },
        "Besoins & Désirs": { 
          value: mappedData.audiences[0].needsDesires || "Non identifiés", 
          status: mappedData.audiences[0].needsDesires ? "success" : "warning" 
        },
        "Signaux Distinctifs": { 
          value: mappedData.audiences[0].distinctiveSignals || "Non détectés", 
          status: mappedData.audiences[0].distinctiveSignals ? "success" : "warning" 
        },
        "Description Audience": { 
          value: mappedData.audiences[0].audienceDescription || "Non disponible", 
          status: mappedData.audiences[0].audienceDescription ? "success" : "warning" 
        }
      } : {}
    },
    {
      id: "recommendation",
      title: "Probabilité Recommandation",
      icon: "📊", 
      status: "completed",
      score: mappedData.recommendations.length > 0 ? mappedData.recommendations[0].score : 0,
      color: "from-purple-500 to-purple-600",
      hasData: mappedData.recommendations.length > 0,
      data: mappedData.recommendations.length > 0 ? {
        "Score": { 
          value: `${mappedData.recommendations[0].score}/100`, 
          status: mappedData.recommendations[0].score >= 70 ? "success" : 
                  mappedData.recommendations[0].score >= 50 ? "warning" : "error" 
        },
        "Justification": { 
          value: mappedData.recommendations[0].justification.substring(0, 100) + "...", 
          status: "info" 
        },
        "Suggestions": { 
          value: `${mappedData.recommendations[0].suggestions.length} recommandations`, 
          status: mappedData.recommendations[0].suggestions.length > 0 ? "success" : "warning" 
        },
        "Éléments Citables": { 
          value: mappedData.recommendations[0].citableElements || "Non spécifiés", 
          status: mappedData.recommendations[0].citableElements ? "success" : "warning" 
        }
      } : {}
    },
    {
      id: "value-prop",
      title: "Proposition de Valeur",
      icon: "💎",
      status: "completed",
      color: "from-orange-500 to-orange-600",
      hasData: mappedData.valueProps.length > 0,
      data: mappedData.valueProps.length > 0 ? {
        "Proposition Principale": { 
          value: mappedData.valueProps[0].mainValueProp || "Non identifiée", 
          status: mappedData.valueProps[0].mainValueProp ? "success" : "warning" 
        },
        "Positionnement Perçu": { 
          value: mappedData.valueProps[0].perceivedPositioning || "Non défini", 
          status: mappedData.valueProps[0].perceivedPositioning ? "success" : "warning" 
        },
        "Pertinence & Fiabilité": { 
          value: mappedData.valueProps[0].relevanceReliability || "Non évaluée", 
          status: mappedData.valueProps[0].relevanceReliability ? "success" : "warning" 
        }
      } : {}
    },
    {
      id: "semantic",
      title: "Analyse Sémantique",
      icon: "🧠",
      status: "completed",
      score: mappedData.semanticAnalyses.length > 0 ? mappedData.semanticAnalyses[0].overallScore : 0,
      color: "from-indigo-500 to-indigo-600",
      hasData: mappedData.semanticAnalyses.length > 0,
      data: mappedData.semanticAnalyses.length > 0 ? {
        "Score Global": { 
          value: `${mappedData.semanticAnalyses[0].overallScore}/100`, 
          status: mappedData.semanticAnalyses[0].overallScore >= 80 ? "success" : 
                  mappedData.semanticAnalyses[0].overallScore >= 60 ? "warning" : "error" 
        },
        "Cohérence": { 
          value: `${mappedData.semanticAnalyses[0].coherenceScore || 0}/100`, 
          status: (mappedData.semanticAnalyses[0].coherenceScore || 0) >= 75 ? "success" : "warning" 
        },
        "Densité Info": { 
          value: `${mappedData.semanticAnalyses[0].densityScore || 0}/100`, 
          status: (mappedData.semanticAnalyses[0].densityScore || 0) >= 75 ? "success" : "warning" 
        },
        "Complexité": { 
          value: `${mappedData.semanticAnalyses[0].complexityScore || 0}/100`, 
          status: (mappedData.semanticAnalyses[0].complexityScore || 0) >= 75 ? "success" : "warning" 
        },
        "Clarté": { 
          value: `${mappedData.semanticAnalyses[0].clarityScore || 0}/100`, 
          status: (mappedData.semanticAnalyses[0].clarityScore || 0) >= 75 ? "success" : "warning" 
        },
        "Améliorations": { 
          value: `${mappedData.semanticAnalyses[0].improvements.length} suggérées`, 
          status: "info" 
        }
      } : {}
    },
    {
      id: "strategy",
      title: "Synthèse Stratégique",
      icon: "🎯",
      status: "completed",
      color: "from-red-500 to-red-600",
      hasData: mappedData.strategicSyntheses.length > 0,
      data: mappedData.strategicSyntheses.length > 0 ? {
        "Quick Wins": { 
          value: `${mappedData.strategicSyntheses[0].quickWins.length} actions rapides`, 
          status: mappedData.strategicSyntheses[0].quickWins.length > 0 ? "success" : "warning" 
        },
        "Actions Stratégiques": { 
          value: `${mappedData.strategicSyntheses[0].strategicActions.length} actions long terme`, 
          status: mappedData.strategicSyntheses[0].strategicActions.length > 0 ? "success" : "warning" 
        },
        "Synthèse Globale": { 
          value: mappedData.strategicSyntheses[0].globalSynthesis ? "Disponible" : "Non disponible", 
          status: mappedData.strategicSyntheses[0].globalSynthesis ? "success" : "warning" 
        }
      } : {}
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success": return <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>;
      case "warning": return <div className="w-2 h-2 bg-amber-500 rounded-full"></div>;
      case "error": return <div className="w-2 h-2 bg-red-500 rounded-full"></div>;
      default: return <div className="w-2 h-2 bg-blue-500 rounded-full"></div>;
    }
  };

  // Filtrer seulement les modules avec des données
  const modulesWithData = modules.filter(module => module.hasData);

  if (modulesWithData.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          Aucune donnée de module disponible
        </h3>
        <p className="text-yellow-700">
          Les données détaillées des modules LLMO ne sont pas encore disponibles pour ce rapport.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Modules d'Analyse LLMO</h2>
        <p className="text-gray-600">Analyse complète en {modulesWithData.length} modules spécialisés</p>
      </div>

      {/* Modules Grid */}
      <div className="grid gap-4">
        {modulesWithData.map((module) => (
          <Card 
            key={module.id} 
            className="group border-0 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden bg-white"
          >
            <div 
              className={`h-1 bg-gradient-to-r ${module.color}`}
            ></div>
            
            <CardHeader 
              className="cursor-pointer transition-colors hover:bg-gray-50/50 pb-4"
              onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="text-xl sm:text-2xl bg-gray-50 p-2 sm:p-3 rounded-lg flex-shrink-0">
                    {module.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">{module.title}</h3>
                      {module.score !== undefined && (
                        <Badge variant="outline" className="font-bold text-gray-700 border-gray-300">
                          {module.score}/100
                        </Badge>
                      )}
                    </div>
                    {module.score !== undefined && (
                      <div className="flex items-center gap-3">
                        <Progress value={module.score} className="w-20 sm:w-32 h-2" />
                        <div className="flex">
                          {Array.from({ length: Math.floor(module.score / 25) }, (_, i) => (
                            <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium hidden sm:inline-flex">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Terminé
                  </Badge>
                  <div className="p-1 rounded">
                    {expandedModule === module.id ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            {expandedModule === module.id && Object.keys(module.data).length > 0 && (
              <CardContent className="pt-0 border-t border-gray-100">
                <div className="grid gap-3 mt-4">
                  {Object.entries(module.data).map(([key, item]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(item.status)}
                        <div>
                          <span className="font-medium text-gray-900 text-sm">{key}</span>
                          <p className="text-sm text-gray-600 mt-0.5">{item.value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReportModules;
