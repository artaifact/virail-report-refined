import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  AlertCircle,
  Shield,
  Zap,
  Target,
  Calendar
} from "lucide-react";
import { SWOTAnalysisData } from "@/lib/competitive-mapper";

interface SWOTAnalysisProps {
  data: SWOTAnalysisData;
}

const SWOTAnalysis: React.FC<SWOTAnalysisProps> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Target className="h-6 w-6" />
            Analyse SWOT - Position Concurrentielle d'Alan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-600">
            Une analyse stratégique complète des forces, faiblesses, opportunités et menaces 
            identifiées dans le contexte concurrentiel du secteur de l'assurance santé.
          </p>
        </CardContent>
      </Card>

      {/* Grille SWOT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Forces */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              Forces ({data.forces.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.forces.map((force, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-green-100 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-green-900 text-sm">
                    {force.titre}
                  </h4>
                  {force.score && (
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      {force.score}
                    </Badge>
                  )}
                </div>
                <p className="text-green-700 text-sm leading-relaxed">
                  {force.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Faiblesses */}
        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Faiblesses ({data.faiblesses.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.faiblesses.map((faiblesse, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-red-100 shadow-sm">
                <h4 className="font-semibold text-red-900 text-sm mb-2">
                  {faiblesse.titre}
                </h4>
                <p className="text-red-700 text-sm leading-relaxed">
                  {faiblesse.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Opportunités */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <TrendingUp className="h-5 w-5" />
              Opportunités ({data.opportunites.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.opportunites.map((opportunite, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                <h4 className="font-semibold text-blue-900 text-sm mb-2">
                  {opportunite.titre}
                </h4>
                <p className="text-blue-700 text-sm leading-relaxed">
                  {opportunite.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Menaces */}
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="h-5 w-5" />
              Menaces ({data.menaces.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.menaces.map((menace, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-yellow-100 shadow-sm">
                <h4 className="font-semibold text-yellow-900 text-sm mb-2">
                  {menace.titre}
                </h4>
                <p className="text-yellow-700 text-sm leading-relaxed">
                  {menace.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Résumé stratégique */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Zap className="h-5 w-5" />
            Synthèse Stratégique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">{data.forces.length}</div>
              <div className="text-xs text-green-600 font-medium">Forces clés</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-red-600">{data.faiblesses.length}</div>
              <div className="text-xs text-red-600 font-medium">Points à améliorer</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">{data.opportunites.length}</div>
              <div className="text-xs text-blue-600 font-medium">Opportunités</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-yellow-600">{data.menaces.length}</div>
              <div className="text-xs text-yellow-600 font-medium">Menaces à surveiller</div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-purple-100 rounded-lg">
            <p className="text-sm text-purple-800">
              <strong>Positionnement :</strong> Alan présente un profil stratégique solide avec 
              {data.forces.length} forces majeures identifiées, notamment en pertinence contextuelle 
              et crédibilité. Les {data.opportunites.length} opportunités offrent des leviers de 
              croissance significatifs, particulièrement en différenciation technique.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SWOTAnalysis; 