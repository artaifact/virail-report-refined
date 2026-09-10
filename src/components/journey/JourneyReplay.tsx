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
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 size={13} />
          <span>Objectif Accompli (Satisfied)</span>
        </span>
      );
    }
    if (journey.verdict === 'partial') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertCircle size={13} />
          <span>Accomplissement Partiel (Friction détectée)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <XCircle size={13} />
        <span>Échec de l'Agent (Bloqué)</span>
      </span>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl text-slate-200">
      {/* Header Replay */}
      <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Bot size={20} />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>Agent Journey Replay</span>
              <span className="text-xs text-slate-500 font-normal">| {targetDomain}</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Intention : <strong className="text-slate-300 font-medium">{intentTitle}</strong> ({steps.length} étapes)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {getVerdictBadge()}
          <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
            <Clock size={12} />
            {journey.durationMs ? `${(journey.durationMs / 1000).toFixed(1)}s` : '1.4s'}
          </span>
        </div>
      </div>

      {/* Résumé d'expérience */}
      {journey.summary && (
        <div className="px-5 py-3.5 bg-slate-950/60 border-b border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5">
          <Terminal size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="leading-relaxed">
            <span className="font-semibold text-slate-200">Synthèse du raisonnement : </span>
            {journey.summary}
          </div>
        </div>
      )}

      {/* Timeline des étapes */}
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Trajectoire Comportementale Pas-à-Pas
          </span>
          <button
            onClick={() => setExpandedDetails(!expandedDetails)}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium cursor-pointer"
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
                    ? 'border-blue-500/60 bg-blue-500/10 shadow-sm'
                    : 'border-slate-800/80 bg-slate-950/30 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      #{step.stepIndex}
                    </span>
                    <span className="text-xs font-semibold text-white">{step.action}</span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      step.status === 'success'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : step.status === 'failed'
                        ? 'bg-rose-500/10 text-rose-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    {step.status.toUpperCase()}
                  </span>
                </div>

                {(expandedDetails || isCurrent) && step.reasoning && (
                  <div className="mt-2 text-xs text-slate-400 font-sans pl-7 border-l-2 border-slate-700/60 ml-2 py-0.5">
                    <span className="text-slate-500 italic">Raisonnement : </span>
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
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/30">
          <div className="text-xs font-semibold text-slate-400 mb-2">Points d'observation agent :</div>
          <ul className="space-y-1 text-xs text-slate-300">
            {journey.observations.map((obs, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
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
