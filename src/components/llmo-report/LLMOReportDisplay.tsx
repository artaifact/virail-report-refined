import React from 'react';
import { MappedReportData } from '../../types/llmo-report';
import { mapLLMOReportData } from '../../lib/llmo-mapper';
import { StatsCard } from './StatsCard';
import { PerceptionSection } from './PerceptionSection';
import { AudienceSection } from './AudienceSection';
import { RecommendationSection } from './RecommendationSection';
import { SemanticSection } from './SemanticSection';
import { StrategicSection } from './StrategicSection';
import { Globe, Clock, Brain, Target, TrendingUp, Users, Sparkles, Star, Zap } from 'lucide-react';
import { FullReportData } from '@/lib/api';
import { Badge } from '@/components/ui/badge';

interface LLMOReportDisplayProps {
  reportData: FullReportData | null;
  className?: string;
}

/**
 * Composant principal qui affiche un rapport LLMO complet
 * Intègre tous les composants de section et fournit une vue d'ensemble
 */
export const LLMOReportDisplay: React.FC<LLMOReportDisplayProps> = ({ 
  reportData, 
  className = '' 
}) => {
  // Mapping des données brutes vers les données structurées
  const mappedData: MappedReportData = mapLLMOReportData(reportData);

  if (!reportData) {
    return (
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-0 shadow-xl rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-yellow-800 mb-3">
          Données du rapport non disponibles
        </h3>
        <p className="text-yellow-700 leading-relaxed">
          Impossible de charger ou de mapper les données du rapport.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Enhanced Header with Modern Design */}
      <div className="relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 p-8">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Rapport d'Analyse GEO
                  </h2>
                  <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                    <Sparkles className="w-3 h-3 mr-1" />
                    IA Analysis
                  </Badge>
                </div>
                <p className="text-gray-600 break-all font-medium">
                  {mappedData.url}
                </p>
              </div>
            </div>
            
            {/* Overall Score Preview */}
            <div className="hidden lg:block">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1">
                    {Math.round((mappedData.overview.averageSemanticScore + mappedData.overview.averageRecommendationScore) / 2)}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Score Global</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-yellow-600 text-sm font-semibold">Premium</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="group bg-white rounded-xl p-4 border-2 border-blue-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
              <div className="text-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div className="font-bold text-gray-900 text-xs mb-1">Analyses</div>
                <div className="text-2xl font-bold text-blue-600 mb-1">{mappedData.overview.totalAnalyses}</div>
                <div className="text-xs text-gray-600">{mappedData.overview.completedAnalyses} complétées</div>
              </div>
            </div>

            <div className="group bg-white rounded-xl p-4 border-2 border-emerald-200 hover:border-emerald-300 hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
              <div className="text-center">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div className="font-bold text-gray-900 text-xs mb-1">Durée Moy.</div>
                <div className="text-2xl font-bold text-emerald-600 mb-1">{mappedData.overview.averageDuration}s</div>
                <div className="text-xs text-gray-600">par analyse</div>
              </div>
            </div>

            <div className="group bg-white rounded-xl p-4 border-2 border-purple-200 hover:border-purple-300 hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
              <div className="text-center">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <div className="font-bold text-gray-900 text-xs mb-1">Score Rec.</div>
                <div className="text-2xl font-bold text-purple-600 mb-1">{mappedData.overview.averageRecommendationScore}/100</div>
                <div className="text-xs text-gray-600">recommandation</div>
              </div>
            </div>

            <div className="group bg-white rounded-xl p-4 border-2 border-indigo-200 hover:border-indigo-300 hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
              <div className="text-center">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div className="font-bold text-gray-900 text-xs mb-1">Score Sém.</div>
                <div className="text-2xl font-bold text-indigo-600 mb-1">{mappedData.overview.averageSemanticScore}/100</div>
                <div className="text-xs text-gray-600">sémantique</div>
              </div>
            </div>

            <div className="group bg-white rounded-xl p-4 border-2 border-teal-200 hover:border-teal-300 hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
              <div className="text-center">
                <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div className="font-bold text-gray-900 text-xs mb-1">LLMs</div>
                <div className="text-2xl font-bold text-teal-600 mb-1">{mappedData.overview.llmNames.length}</div>
                <div className="text-xs text-gray-600">modèles utilisés</div>
              </div>
            </div>

            <div className="group bg-white rounded-xl p-4 border-2 border-amber-200 hover:border-amber-300 hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
              <div className="text-center">
                <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div className="font-bold text-gray-900 text-xs mb-1">Sections</div>
                <div className="text-2xl font-bold text-amber-600 mb-1">{getTotalSectionsWithData(mappedData)}</div>
                <div className="text-xs text-gray-600">avec données</div>
              </div>
            </div>
          </div>

          {/* Enhanced LLM Models Section */}
          {mappedData.overview.llmNames.length > 0 && (
            <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-bold text-gray-900">LLMs Analysés</h4>
                <Badge className="bg-blue-100 text-blue-800">
                  {mappedData.overview.llmNames.length} modèles
                </Badge>
              </div>
              <div className="flex flex-wrap gap-3">
                {mappedData.overview.llmNames.map((llm, index) => (
                  <div
                    key={index}
                    className="group px-4 py-2 bg-white border border-blue-200 rounded-xl text-gray-800 font-semibold hover:shadow-md transition-all duration-300 hover:scale-[1.05] hover:border-blue-300"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"></div>
                      {llm}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Sections with Modern Styling */}
      <div className="space-y-8">
        {/* Section Perception */}
        {mappedData.perceptions.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 overflow-hidden">
            <PerceptionSection perceptions={mappedData.perceptions} />
          </div>
        )}

        {/* Section Audience */}
        {mappedData.audiences.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 overflow-hidden">
            <AudienceSection audiences={mappedData.audiences} />
          </div>
        )}

        {/* Section Recommandations */}
        {mappedData.recommendations.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 overflow-hidden">
            <RecommendationSection recommendations={mappedData.recommendations} />
          </div>
        )}

        {/* Section Analyse Sémantique */}
        {mappedData.semanticAnalyses.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 overflow-hidden">
            <SemanticSection semanticAnalyses={mappedData.semanticAnalyses} />
          </div>
        )}

        {/* Section Synthèses Stratégiques */}
        {mappedData.strategicSyntheses.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 overflow-hidden">
            <StrategicSection strategicSyntheses={mappedData.strategicSyntheses} />
          </div>
        )}
      </div>

      {/* Enhanced Empty State */}
      {!hasAnyData(mappedData) && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-0 shadow-xl rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Brain className="w-10 w-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-yellow-800 mb-4">
            Aucune donnée d'analyse disponible
          </h3>
          <p className="text-yellow-700 text-lg leading-relaxed max-w-2xl mx-auto">
            Le rapport GEO semble être vide ou contenir des données dans un format non reconnu.
            Vérifiez que le fichier JSON contient les sections d'analyse attendues.
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Fonctions utilitaires pour l'analyse des données
 */
function getTotalSectionsWithData(data: MappedReportData): number {
  let count = 0;
  if (data.perceptions.length > 0) count++;
  if (data.audiences.length > 0) count++;
  if (data.recommendations.length > 0) count++;
  if (data.semanticAnalyses.length > 0) count++;
  if (data.strategicSyntheses.length > 0) count++;
  return count;
}

function hasAnyData(data: MappedReportData): boolean {
  return (
    data.perceptions.length > 0 ||
    data.audiences.length > 0 ||
    data.recommendations.length > 0 ||
    data.semanticAnalyses.length > 0 ||
    data.strategicSyntheses.length > 0
  );
}