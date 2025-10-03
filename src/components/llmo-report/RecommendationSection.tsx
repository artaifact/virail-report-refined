import React from 'react';
import { RecommendationData } from '../../types/llmo-report';
import { ThumbsUp, MessageSquare, Eye, Lightbulb, TrendingUp } from 'lucide-react';

interface RecommendationSectionProps {
  recommendations: RecommendationData[];
}

/**
 * Composant qui affiche les analyses de probabilité de recommandation par les LLMs
 * Inclut les scores, justifications et suggestions d'amélioration
 */
export const RecommendationSection: React.FC<RecommendationSectionProps> = ({ recommendations }) => {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Probabilité de Recommandation
        </h3>
        <p className="text-gray-500">Aucune analyse de recommandation disponible.</p>
      </div>
    );
  }

  const averageScore = Math.round(
    recommendations.reduce((sum, rec) => sum + rec.score, 0) / recommendations.length
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
            <ThumbsUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Probabilité de Recommandation
            </h3>
            <p className="text-sm text-gray-600">
              Score moyen: {averageScore}/100 • {recommendations.length} analyse{recommendations.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        {/* Score moyen global */}
        <div className="text-center">
          <div className={`text-3xl font-bold ${getScoreColor(averageScore)}`}>
            {averageScore}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">
            Score Moyen
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {recommendations.map((recommendation, index) => (
          <RecommendationCard key={index} recommendation={recommendation} />
        ))}
      </div>
    </div>
  );
};

/**
 * Carte individuelle pour l'analyse de recommandation d'un LLM
 */
const RecommendationCard: React.FC<{ recommendation: RecommendationData }> = ({ recommendation }) => {
  return (
    <div className="bg-gradient-to-br from-purple-50 via-white to-indigo-50/30 rounded-lg p-6 border border-gray-100">
      {/* En-tête avec LLM et score */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900 text-lg">{recommendation.llm}</h4>
        <div className="flex items-center gap-3">
          <div className={`text-2xl font-bold ${getScoreColor(recommendation.score)}`}>
            {recommendation.score}
          </div>
          <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
            /100
          </div>
        </div>
      </div>

      {/* Barre de progression du score */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Probabilité de Recommandation</span>
          <span>{recommendation.score}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${getScoreBarColor(recommendation.score)}`}
            style={{ width: `${recommendation.score}%` }}
          ></div>
        </div>
      </div>

      {/* Justification */}
      {recommendation.justification && (
        <div className="mb-6">
          <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            Justification du Score
          </h5>
          <div className="bg-white/60 rounded-lg p-4">
            <p className="text-gray-700 text-sm leading-relaxed">
              {recommendation.justification}
            </p>
          </div>
        </div>
      )}

      {/* Éléments citables et visibilité */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {recommendation.citableElements && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h6 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Éléments Citables
            </h6>
            <p className="text-blue-700 text-sm leading-relaxed">
              {recommendation.citableElements}
            </p>
          </div>
        )}

        {recommendation.llmVisibility && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h6 className="font-medium text-green-800 mb-2 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Visibilité LLM
            </h6>
            <p className="text-green-700 text-sm leading-relaxed">
              {recommendation.llmVisibility}
            </p>
          </div>
        )}
      </div>

      {/* Suggestions d'amélioration */}
      {recommendation.suggestions && recommendation.suggestions.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            Suggestions d'Amélioration
          </h5>
          <div className="space-y-2">
            {recommendation.suggestions.map((suggestion, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-amber-800 text-sm leading-relaxed">
                  {suggestion}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Fonctions utilitaires pour les couleurs des scores
 */
function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

function getScoreBarColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
} 