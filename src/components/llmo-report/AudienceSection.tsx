import React from 'react';
import { AudienceData } from '../../types/llmo-report';
import { Users, Target, Lightbulb, UserCheck, Sparkles, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AudienceSectionProps {
  audiences: AudienceData[];
}

/**
 * Composant qui affiche les analyses d'audience cible par les LLMs
 * Permet de comprendre les différents segments identifiés
 */
export const AudienceSection: React.FC<AudienceSectionProps> = ({ audiences }) => {
  if (!audiences || audiences.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Audience Cible & Segments
          </h3>
          <p className="text-gray-600">Aucune analyse d'audience disponible.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              Audience Cible & Segments
            </h3>
            <p className="text-gray-600 mt-1">
              Analyse des segments d'audience par {audiences.length} LLM{audiences.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
          <TrendingUp className="w-3 h-3 mr-1" />
          {audiences.length} Analyse{audiences.length > 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="space-y-8">
        {audiences.map((audience, index) => (
          <AudienceCard key={index} audience={audience} />
        ))}
      </div>
    </div>
  );
};

/**
 * Carte individuelle pour l'analyse d'audience d'un LLM
 */
const AudienceCard: React.FC<{ audience: AudienceData }> = ({ audience }) => {
  return (
    <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300">
      {/* En-tête avec le nom du LLM */}
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-xl font-bold text-gray-900">{audience.llm}</h4>
        <Badge className="bg-emerald-100 text-emerald-800 font-semibold">
          Segmentation
        </Badge>
      </div>

      {/* Grille des analyses */}
      <div className="space-y-6">
        {audience.explicitIndicators && (
          <AudienceItem
            icon={<Target className="w-5 h-5" />}
            title="Indices Explicites"
            content={audience.explicitIndicators}
            color="blue"
          />
        )}

        {audience.needsDesires && (
          <AudienceItem
            icon={<Lightbulb className="w-5 h-5" />}
            title="Besoins & Désirs"
            content={audience.needsDesires}
            color="amber"
          />
        )}

        {audience.distinctiveSignals && (
          <AudienceItem
            icon={<UserCheck className="w-5 h-5" />}
            title="Signaux Distinctifs"
            content={audience.distinctiveSignals}
            color="purple"
          />
        )}

        {audience.audienceDescription && (
          <div className="border-t-2 border-gray-200 pt-6 mt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h5 className="text-lg font-bold text-gray-900">
                Description Détaillée de l'Audience
              </h5>
              {/* Détection du contenu en anglais */}
              {(audience.audienceDescription.includes('Based on') || 
                audience.audienceDescription.includes('target audience') ||
                audience.audienceDescription.includes('Demographics:')) && (
                <Badge variant="outline" className="border-blue-200 text-blue-700">
                  EN
                </Badge>
              )}
            </div>
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border-2 border-emerald-200">
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-900 leading-relaxed font-medium text-base whitespace-pre-wrap">
                  {audience.audienceDescription}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Composant pour afficher un élément individuel d'analyse d'audience
 */
const AudienceItem: React.FC<{
  icon: React.ReactNode;
  title: string;
  content: string;
  color: 'blue' | 'amber' | 'purple';
}> = ({ icon, title, content, color }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-gradient-to-r from-blue-50 to-blue-100',
      text: 'text-blue-900',
      border: 'border-blue-200',
      iconBg: 'bg-blue-500'
    },
    amber: {
      bg: 'bg-gradient-to-r from-amber-50 to-yellow-100',
      text: 'text-amber-900',
      border: 'border-amber-200',
      iconBg: 'bg-amber-500'
    },
    purple: {
      bg: 'bg-gradient-to-r from-purple-50 to-indigo-100',
      text: 'text-purple-900',
      border: 'border-purple-200',
      iconBg: 'bg-purple-500'
    }
  };

  const classes = colorClasses[color];

  // Détection simple du contenu en anglais
  const isEnglish = content.includes('target audience') || 
                   content.includes('The content') ||
                   content.includes('unique experiences') ||
                   content.includes('Demographics:') ||
                   content.includes('Based on');

  return (
    <div className={`${classes.bg} rounded-xl p-5 border-2 ${classes.border} hover:shadow-md transition-all duration-300`}>
      <div className="flex items-start gap-4">
        <div className={`${classes.iconBg} rounded-lg p-2 flex-shrink-0`}>
          <div className="text-white">
            {icon}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h5 className={`font-bold ${classes.text} text-lg`}>{title}</h5>
            {isEnglish && (
              <Badge variant="outline" className="border-blue-200 text-blue-700 text-xs">
                EN
              </Badge>
            )}
          </div>
          <div className="prose prose-sm max-w-none">
            <p className={`${classes.text} leading-relaxed font-medium whitespace-pre-wrap`}>
              {content}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};