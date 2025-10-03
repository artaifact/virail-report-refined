import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb, 
  CheckSquare, 
  ArrowRight, 
  Target,
  Eye,
  EyeOff,
  Zap,
  TrendingUp,
  FileText
} from "lucide-react";
import { StrategicRecommendationsData } from "@/lib/competitive-mapper";

interface StrategicRecommendationsProps {
  data: StrategicRecommendationsData;
}

const StrategicRecommendations: React.FC<StrategicRecommendationsProps> = ({ data }) => {
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [showConclusion, setShowConclusion] = useState<boolean>(false);

  const toggleCard = (index: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedCards(newExpanded);
  };

  const getCardColor = (index: number): string => {
    const colors = [
      "from-blue-50 to-indigo-50 border-blue-200",
      "from-green-50 to-emerald-50 border-green-200", 
      "from-purple-50 to-pink-50 border-purple-200",
      "from-yellow-50 to-orange-50 border-yellow-200",
      "from-red-50 to-rose-50 border-red-200"
    ];
    return colors[index % colors.length];
  };

  const getIconColor = (index: number): string => {
    const colors = [
      "text-blue-600",
      "text-green-600",
      "text-purple-600", 
      "text-yellow-600",
      "text-red-600"
    ];
    return colors[index % colors.length];
  };

  const getIcon = (index: number) => {
    const icons = [
      <FileText className="h-5 w-5" />,
      <Target className="h-5 w-5" />,
      <TrendingUp className="h-5 w-5" />,
      <Zap className="h-5 w-5" />,
      <CheckSquare className="h-5 w-5" />
    ];
    return icons[index % icons.length];
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Lightbulb className="h-6 w-6" />
            Recommandations Stratégiques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-blue-600">
              Plan d'action prioritaire pour renforcer l'avantage concurrentiel d'Alan
            </p>
            <Badge className="bg-blue-100 text-blue-800">
              {data.recommendations.length} recommandations
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Liste des recommandations */}
      <div className="space-y-4">
        {data.recommendations.map((recommendation, index) => (
          <Card 
            key={index} 
            className={`bg-gradient-to-br ${getCardColor(index)} transition-all duration-200 hover:shadow-md`}
          >
            <CardHeader className="cursor-pointer" onClick={() => toggleCard(index)}>
              <div className="flex items-center justify-between">
                <CardTitle className={`flex items-center gap-3 ${getIconColor(index)}`}>
                  <div className={`p-2 bg-white rounded-lg ${getIconColor(index)}`}>
                    {getIcon(index)}
                  </div>
                  <div>
                    <div className="text-lg font-semibold">
                      {recommendation.titre}
                    </div>
                    <div className="text-sm opacity-75 font-normal">
                      {recommendation.actions.length} actions identifiées
                    </div>
                  </div>
                </CardTitle>
                <Button variant="ghost" size="sm">
                  {expandedCards.has(index) ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            
            {expandedCards.has(index) && (
              <CardContent className="space-y-3">
                <div className="bg-white p-4 rounded-lg border border-opacity-50">
                  <h4 className={`font-medium mb-3 ${getIconColor(index)}`}>
                    Actions recommandées :
                  </h4>
                  <div className="space-y-2">
                    {recommendation.actions.map((action, actionIndex) => (
                      <div key={actionIndex} className="flex items-start gap-3">
                        <div className={`p-1 rounded-full ${getIconColor(index)} bg-opacity-20 mt-1`}>
                          <ArrowRight className={`h-3 w-3 ${getIconColor(index)}`} />
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {action}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Priorité et impact estimé */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-opacity-50 text-center">
                    <div className="text-xs text-gray-500 mb-1">Priorité</div>
                    <div className={`font-semibold ${getIconColor(index)}`}>
                      {index === 0 ? "Élevée" : index === 1 ? "Élevée" : "Moyenne"}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-opacity-50 text-center">
                    <div className="text-xs text-gray-500 mb-1">Impact</div>
                    <div className={`font-semibold ${getIconColor(index)}`}>
                      {index < 2 ? "Fort" : "Moyen"}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-opacity-50 text-center">
                    <div className="text-xs text-gray-500 mb-1">Difficulté</div>
                    <div className={`font-semibold ${getIconColor(index)}`}>
                      {index === 0 ? "Moyenne" : index === 1 ? "Élevée" : "Faible"}
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Conclusion stratégique */}
      <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-700">
              <Target className="h-5 w-5" />
              Conclusion Stratégique
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConclusion(!showConclusion)}
            >
              {showConclusion ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Masquer
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Afficher
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        {showConclusion && (
          <CardContent>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <p className="text-gray-700 leading-relaxed">
                {data.conclusion}
              </p>
            </div>
            
            {/* Métriques de la conclusion */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">67/80</div>
                <div className="text-xs text-blue-600">Score actuel Alan</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">+17-20</div>
                <div className="text-xs text-green-600">Avantage vs concurrents</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">1er</div>
                <div className="text-xs text-purple-600">Position sur le marché</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default StrategicRecommendations; 