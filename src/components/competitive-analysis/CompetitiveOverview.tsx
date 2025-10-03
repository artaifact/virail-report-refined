import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, TrendingDown, Target, Award, BarChart3 } from "lucide-react";
import { CompetitiveOverviewData, getRankColor, getScoreColor } from "@/lib/competitive-mapper";

interface CompetitiveOverviewProps {
  data: CompetitiveOverviewData;
}

const CompetitiveOverview: React.FC<CompetitiveOverviewProps> = ({ data }) => {
  const formatAdvantage = (advantage: number): string => {
    return advantage > 0 ? `+${advantage}` : `${advantage}`;
  };

  const getAdvantageIcon = (advantage: number) => {
    if (advantage > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (advantage < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Target className="h-4 w-4 text-gray-600" />;
  };

  const getAdvantageColor = (advantage: number): string => {
    if (advantage > 0) return "text-green-600 font-semibold";
    if (advantage < 0) return "text-red-600 font-semibold";
    return "text-gray-600";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Score Alan */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-600" />
            <span className="text-blue-700">Score Alan</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className={`text-3xl font-bold ${getScoreColor(data.alanScore)}`}>
              {data.alanScore}/80
            </div>
            <div className="flex items-center gap-2">
              <Trophy className={`h-4 w-4 ${getRankColor(data.alanRank)}`} />
              <span className={`text-sm font-medium ${getRankColor(data.alanRank)}`}>
                {data.alanRank}er sur {data.totalCompetitors}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avantage Concurrentiel */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className="text-green-700">Avantage</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {getAdvantageIcon(data.alanAdvantage)}
              <span className={`text-2xl font-bold ${getAdvantageColor(data.alanAdvantage)}`}>
                {formatAdvantage(data.alanAdvantage)} pts
              </span>
            </div>
            <div className="text-xs text-green-600">
              vs meilleur concurrent
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Moyen du Marché */}
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-yellow-600" />
            <span className="text-yellow-700">Marché</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-yellow-600">
              {data.averageScore}/80
            </div>
            <div className="text-xs text-yellow-600">
              Score moyen du secteur
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Écart avec la Concurrence */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            <span className="text-purple-700">Écart</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-sm text-purple-600">
              <div className="flex justify-between">
                <span>vs Wakam:</span>
                <span className="font-semibold">+{data.alanScore - data.bestCompetitorScore === 17 ? 17 : data.alanScore - 50} pts</span>
              </div>
              <div className="flex justify-between">
                <span>vs Malakoff:</span>
                <span className="font-semibold">+{data.alanScore - data.worstCompetitorScore} pts</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompetitiveOverview; 