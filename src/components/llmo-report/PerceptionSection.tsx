import React from 'react';
import { PerceptionData } from '../../types/llmo-report';
import { Eye, MessageCircle, PenTool, AlertTriangle, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PerceptionSectionProps {
  perceptions: PerceptionData[];
}

/**
 * Composant qui affiche les analyses de perception de marque par les LLMs
 * Permet de comparer les différentes perspectives sur le contenu analysé
 */
export const PerceptionSection: React.FC<PerceptionSectionProps> = ({ perceptions }) => {
  if (!perceptions || perceptions.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Eye className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Perception de la Marque/Produit
          </h3>
          <p className="text-gray-600">Aucune analyse de perception disponible.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Eye className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              Perception de la Marque/Produit
            </h3>
            <p className="text-gray-600 mt-1">
              Analyse de la perception par {perceptions.length} LLM{perceptions.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <Sparkles className="w-3 h-3 mr-1" />
          {perceptions.length} Analyse{perceptions.length > 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="space-y-8">
        {perceptions.map((perception, index) => (
          <PerceptionCard key={index} perception={perception} />
        ))}
      </div>
    </div>
  );
};

/**
 * Carte individuelle pour l'analyse de perception d'un LLM
 */
const PerceptionCard: React.FC<{ perception: PerceptionData }> = ({ perception }) => {
  return (
    <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
      {/* En-tête avec le nom du LLM */}
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-xl font-bold text-gray-900">{perception.llm}</h4>
        <Badge className="bg-blue-100 text-blue-800 font-semibold">
          Analyse IA
        </Badge>
      </div>

      {/* Grille des éléments principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {perception.mainSubject && (
          <PerceptionItem
            icon={<Eye className="w-5 h-5" />}
            label="Sujet Principal"
            content={perception.mainSubject}
            color="blue"
          />
        )}

        {perception.generalTone && (
          <PerceptionItem
            icon={<MessageCircle className="w-5 h-5" />}
            label="Ton Général"
            content={perception.generalTone}
            color="green"
          />
        )}

        {perception.writingStyle && (
          <PerceptionItem
            icon={<PenTool className="w-5 h-5" />}
            label="Style d'Écriture"
            content={perception.writingStyle}
            color="purple"
          />
        )}

        {perception.bias && (
          <PerceptionItem
            icon={<AlertTriangle className="w-5 h-5" />}
            label="Biais Détectés"
            content={perception.bias}
            color="red"
          />
        )}
      </div>

      {/* Lisibilité */}
      {perception.readability && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <h5 className="font-bold text-gray-900">Lisibilité et Compréhensibilité</h5>
          </div>
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
            <p className="text-gray-800 leading-relaxed font-medium">
              {perception.readability}
            </p>
          </div>
        </div>
      )}

      {/* Synthèse - Section la plus importante */}
      {perception.synthesis && (
        <div className="border-t-2 border-gray-200 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h5 className="text-lg font-bold text-gray-900">Synthèse de la Perception</h5>
          </div>
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border-2 border-emerald-200">
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-900 leading-relaxed font-medium text-base whitespace-pre-wrap">
                {perception.synthesis}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Composant pour afficher un élément individuel de perception
 */
const PerceptionItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  content: string;
  color: 'blue' | 'green' | 'purple' | 'red';
}> = ({ icon, label, content, color }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-gradient-to-r from-blue-50 to-blue-100',
      text: 'text-blue-900',
      border: 'border-blue-200',
      iconBg: 'bg-blue-500'
    },
    green: {
      bg: 'bg-gradient-to-r from-green-50 to-emerald-100',
      text: 'text-green-900',
      border: 'border-green-200',
      iconBg: 'bg-green-500'
    },
    purple: {
      bg: 'bg-gradient-to-r from-purple-50 to-indigo-100',
      text: 'text-purple-900',
      border: 'border-purple-200',
      iconBg: 'bg-purple-500'
    },
    red: {
      bg: 'bg-gradient-to-r from-red-50 to-pink-100',
      text: 'text-red-900',
      border: 'border-red-200',
      iconBg: 'bg-red-500'
    }
  };

  const classes = colorClasses[color];

  return (
    <div className={`${classes.bg} rounded-xl p-4 border-2 ${classes.border} hover:shadow-md transition-all duration-300`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-8 h-8 ${classes.iconBg} rounded-lg flex items-center justify-center`}>
          <div className="text-white">
            {icon}
          </div>
        </div>
        <span className={`font-bold ${classes.text}`}>{label}</span>
      </div>
      <p className={`${classes.text} leading-relaxed font-medium whitespace-pre-wrap`}>
        {content}
      </p>
    </div>
  );
};