import React from 'react';
import { SemanticAnalysisData } from '../../types/llmo-report';
import { Brain, BarChart3, FileText, CheckCircle, Lightbulb, Zap } from 'lucide-react';

interface SemanticSectionProps {
  semanticAnalyses: SemanticAnalysisData[];
}

/**
 * Composant qui affiche les analyses sémantiques détaillées par les LLMs
 * Inclut tous les scores de qualité et les recommandations d'amélioration
 */
export const SemanticSection: React.FC<SemanticSectionProps> = ({ semanticAnalyses }) => {
  if (!semanticAnalyses || semanticAnalyses.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Analyse Sémantique
        </h3>
        <p className="text-gray-500">Aucune analyse sémantique disponible.</p>
      </div>
    );
  }

  const averageOverallScore = Math.round(
    semanticAnalyses.reduce((sum, analysis) => sum + analysis.overallScore, 0) / semanticAnalyses.length
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Analyse Sémantique
            </h3>
            <p className="text-sm text-gray-600">
              Score moyen: {averageOverallScore}/100 • {semanticAnalyses.length} analyse{semanticAnalyses.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        {/* Score moyen global */}
        <div className="text-center">
          <div className={`text-3xl font-bold ${getScoreColor(averageOverallScore)}`}>
            {averageOverallScore}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">
            Score Global
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {semanticAnalyses.map((analysis, index) => (
          <SemanticCard key={index} analysis={analysis} />
        ))}
      </div>
    </div>
  );
};

/**
 * Carte individuelle pour l'analyse sémantique d'un LLM
 */
const SemanticCard: React.FC<{ analysis: SemanticAnalysisData }> = ({ analysis }) => {
  const scores = [
    { label: 'Cohérence', score: analysis.coherenceScore, icon: <CheckCircle className="w-4 h-4" />, color: 'blue' },
    { label: 'Densité', score: analysis.densityScore, icon: <BarChart3 className="w-4 h-4" />, color: 'green' },
    { label: 'Complexité', score: analysis.complexityScore, icon: <FileText className="w-4 h-4" />, color: 'purple' },
    { label: 'Clarté', score: analysis.clarityScore, icon: <Lightbulb className="w-4 h-4" />, color: 'yellow' },
    { label: 'Embeddings', score: analysis.embeddingScore, icon: <Brain className="w-4 h-4" />, color: 'indigo' },
    { label: 'Tokenisation', score: analysis.tokenizationScore, icon: <Zap className="w-4 h-4" />, color: 'pink' }
  ].filter(item => item.score !== undefined);

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50/30 rounded-lg p-6 border border-gray-100">
      {/* En-tête avec LLM et score global */}
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-semibold text-gray-900 text-lg">{analysis.llm}</h4>
        <div className="flex items-center gap-3">
          <div className={`text-2xl font-bold ${getScoreColor(analysis.overallScore)}`}>
            {analysis.overallScore}
          </div>
          <div className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
            Global
          </div>
        </div>
      </div>

      {/* Grille des scores détaillés */}
      {scores.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {scores.map((scoreItem, idx) => (
            <ScoreMetric key={idx} {...scoreItem} />
          ))}
        </div>
      )}

      {/* Résumé exécutif */}
      {analysis.executiveSummary && (
        <div className="mb-6">
          <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
            Résumé Exécutif
          </h5>
          <div className="bg-white/60 rounded-lg p-4">
            <p className="text-gray-700 text-sm leading-relaxed">
              {analysis.executiveSummary}
            </p>
          </div>
        </div>
      )}

      {/* Recommandations d'amélioration */}
      {analysis.improvements && analysis.improvements.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            Recommandations d'Amélioration
          </h5>
          <div className="space-y-3">
            {analysis.improvements.map((improvement, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-amber-800 text-sm leading-relaxed">
                  {improvement}
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
 * Composant pour afficher une métrique de score individuelle
 */
const ScoreMetric: React.FC<{
  label: string;
  score: number;
  icon: React.ReactNode;
  color: string;
}> = ({ label, score, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    pink: 'bg-pink-50 border-pink-200 text-pink-700'
  };

  const selectedColorClass = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <div className={`${selectedColorClass} rounded-lg p-3 border`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-xs">{label}</span>
        </div>
        <span className="font-bold text-sm">{score}</span>
      </div>
      
      {/* Barre de progression mini */}
      <div className="w-full bg-white/50 rounded-full h-1.5">
        <div 
          className={`h-1.5 rounded-full transition-all duration-300 ${getScoreBarColor(score)}`}
          style={{ width: `${score}%` }}
        ></div>
      </div>
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