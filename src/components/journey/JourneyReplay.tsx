import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Bot,
  Terminal,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { JourneyResult, JourneyStep } from '@/services/actionability/types';

interface JourneyReplayProps {
  journey: JourneyResult;
  intentTitle?: string;
  targetDomain: string;
}

export const JourneyReplay: React.FC<JourneyReplayProps> = ({
  journey,
  intentTitle = 'Navigation & Évaluation',
  targetDomain,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(
    journey.trajectory && journey.trajectory.length > 0 ? journey.trajectory.length - 1 : 0
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState(false);

  const steps = journey.trajectory || [];

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  const getVerdictBadge = () => {
    if (journey.verdict === 'satisfied') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={13} />
          <span>Objectif Accompli (Satisfied)</span>
        </span>
      );
    }
    if (journey.verdict === 'partial') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertCircle size={13} />
          <span>Accomplissement Partiel (Friction)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle size={13} />
        <span>Échec de l'Agent (Bloqué)</span>
      </span>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs text-slate-800">
      {/* Header Replay */}
      <div className="p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1A3AFF]">
            <Bot size={20} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Agent Journey Replay</span>
              <span className="text-xs text-slate-400 font-normal">| {targetDomain}</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Intention : <strong className="text-slate-700 font-semibold">{intentTitle}</strong> ({steps.length} étapes)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {getVerdictBadge()}
          <span className="text-xs text-slate-400 font-mono flex items-center gap-1 font-medium">
            <Clock size={12} />
            {journey.durationMs ? `${(journey.durationMs / 1000).toFixed(1)}s` : '1.4s'}
          </span>
        </div>
      </div>

      {/* Résumé d'expérience */}
      {journey.summary && (
        <div className="px-5 py-3.5 bg-indigo-50/50 border-b border-indigo-100 text-xs text-slate-700 flex items-start gap-2.5">
          <Terminal size={14} className="text-[#1A3AFF] mt-0.5 flex-shrink-0" />
          <div className="leading-relaxed">
            <span className="font-semibold text-slate-900">Synthèse du raisonnement : </span>
            {journey.summary}
          </div>
        </div>
      )}

      {/* Timeline des étapes */}
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Trajectoire Comportementale Pas-à-Pas
          </span>
          <button
            onClick={() => setExpandedDetails(!expandedDetails)}
            className="text-xs text-[#1A3AFF] hover:text-blue-700 flex items-center gap-1 font-medium cursor-pointer"
          >
            <span>{expandedDetails ? 'Masquer détails' : 'Afficher détails'}</span>
            {expandedDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        <div className="space-y-2">
          {steps.map((step, idx) => {
            const isCurrent = idx === currentStepIndex;
            return (
              <div
                key={step.stepIndex || idx}
                onClick={() => setCurrentStepIndex(idx)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isCurrent
                    ? 'border-[#1A3AFF] bg-blue-50/40 shadow-xs ring-1 ring-[#1A3AFF]/30'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                      #{step.stepIndex}
                    </span>
                    <span className="text-xs font-semibold text-slate-900">{step.action}</span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      step.status === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : step.status === 'failed'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {step.status.toUpperCase()}
                  </span>
                </div>

                {(expandedDetails || isCurrent) && step.reasoning && (
                  <div className="mt-2 text-xs text-slate-600 font-sans pl-7 border-l-2 border-slate-300 ml-2 py-0.5 leading-relaxed">
                    <span className="text-slate-400 font-medium">Raisonnement : </span>
                    {step.reasoning}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Observations clés */}
      {journey.observations && journey.observations.length > 0 && (
        <div className="px-5 py-4 border-t border-slate-200/80 bg-slate-50/60">
          <div className="text-xs font-semibold text-slate-600 mb-2">Points d'observation agent :</div>
          <ul className="space-y-1 text-xs text-slate-600">
            {journey.observations.map((obs, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#1A3AFF] font-bold">•</span>
                <span>{obs}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default JourneyReplay;
