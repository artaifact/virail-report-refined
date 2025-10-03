import React from 'react';
import { StrategicSynthesisData } from '../../types/llmo-report';
import { Target, Zap, CheckCircle2, FileText } from 'lucide-react';

interface StrategicSectionProps {
  strategicSyntheses: StrategicSynthesisData[];
}

/**
 * Composant qui affiche les synthèses stratégiques et recommandations LLMO
 * Inclut les quick wins et actions stratégiques à moyen terme
 */
export const StrategicSection: React.FC<StrategicSectionProps> = ({ strategicSyntheses }) => {
  if (!strategicSyntheses || strategicSyntheses.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Synthèses Stratégiques
        </h3>
        <p className="text-gray-500">Aucune synthèse stratégique disponible.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
          <Target className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Synthèses Stratégiques & Recommandations LLMO
          </h3>
          <p className="text-sm text-gray-600">
            Recommandations stratégiques de {strategicSyntheses.length} LLM{strategicSyntheses.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {strategicSyntheses.map((synthesis, index) => (
          <StrategicCard key={index} synthesis={synthesis} />
        ))}
      </div>
    </div>
  );
};

/**
 * Carte individuelle pour une synthèse stratégique d'un LLM
 */
const StrategicCard: React.FC<{ synthesis: StrategicSynthesisData }> = ({ synthesis }) => {
  return (
    <div className="bg-gradient-to-br from-rose-50 via-white to-orange-50/30 rounded-lg p-6 border border-gray-100">
      {/* En-tête avec le nom du LLM */}
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-semibold text-gray-900 text-lg">{synthesis.llm}</h4>
        <div className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm font-medium">
          Stratégie
        </div>
      </div>

      {/* Synthèse globale */}
      {synthesis.globalSynthesis && (
        <div className="mb-6">
          <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-600" />
            Synthèse Stratégique Globale
          </h5>
          <div className="bg-white/60 rounded-lg p-4">
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
              {synthesis.globalSynthesis}
            </p>
          </div>
        </div>
      )}

      {/* Quick Wins et Actions Stratégiques côte à côte */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Quick Wins */}
        {synthesis.quickWins && synthesis.quickWins.length > 0 && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-5 border border-green-200">
            <h5 className="font-medium text-green-800 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Quick Wins (Actions Immédiates)
            </h5>
            <div className="space-y-3">
              {synthesis.quickWins.map((quickWin, idx) => (
                <ActionItem
                  key={idx}
                  action={quickWin}
                  type="quick-win"
                  index={idx + 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* Actions Stratégiques */}
        {synthesis.strategicActions && synthesis.strategicActions.length > 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-200">
            <h5 className="font-medium text-blue-800 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Actions Stratégiques (Moyen Terme)
            </h5>
            <div className="space-y-3">
              {synthesis.strategicActions.map((action, idx) => (
                <ActionItem
                  key={idx}
                  action={action}
                  type="strategic"
                  index={idx + 1}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Conclusion */}
      {synthesis.conclusion && (
        <div className="border-t border-gray-200 pt-4">
          <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
            Conclusion
          </h5>
          <div className="bg-gradient-to-r from-rose-50 to-orange-50 rounded-lg p-4">
            <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">
              {synthesis.conclusion}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Composant pour afficher un élément d'action individuel
 */
const ActionItem: React.FC<{
  action: string;
  type: 'quick-win' | 'strategic';
  index: number;
}> = ({ action, type, index }) => {
  const colorClasses = {
    'quick-win': {
      bg: 'bg-green-100',
      text: 'text-green-800',
      icon: 'text-green-600',
      border: 'border-green-200'
    },
    'strategic': {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      icon: 'text-blue-600',
      border: 'border-blue-200'
    }
  };

  const colors = colorClasses[type];

  return (
    <div className={`${colors.bg} ${colors.border} rounded-lg p-3 border`}>
      <div className="flex items-start gap-3">
        <div className={`${colors.icon} flex-shrink-0 mt-0.5`}>
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`${colors.text} text-xs font-semibold`}>
              {type === 'quick-win' ? 'QW' : 'AS'} {index}
            </span>
          </div>
          <p className={`${colors.text} text-sm leading-relaxed`}>
            {action}
          </p>
        </div>
      </div>
    </div>
  );
}; 