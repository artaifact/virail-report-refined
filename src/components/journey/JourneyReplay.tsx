import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Cpu,
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground border border-border">
          <CheckCircle2 size={13} className="text-muted-foreground" />
          <span>Objectif Accompli (Satisfied)</span>
        </span>
      );
    }
    if (journey.verdict === 'partial') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground border border-border">
          <AlertCircle size={13} className="text-muted-foreground" />
          <span>Accomplissement Partiel (Friction)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground border border-border">
        <XCircle size={13} className="text-muted-foreground" />
        <span>Échec de l'Agent (Bloqué)</span>
      </span>
    );
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs text-foreground">
      {/* Header Replay */}
      <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-foreground">
            <Cpu size={20} />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground flex items-center gap-2">
              <span>Agent Journey Replay</span>
              <span className="text-xs text-muted-foreground font-normal">| {targetDomain}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Intention : <strong className="text-foreground font-semibold">{intentTitle}</strong> ({steps.length} étapes)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {getVerdictBadge()}
          <span className="text-xs text-muted-foreground font-mono flex items-center gap-1 font-medium">
            <Clock size={12} />
            {journey.durationMs ? `${(journey.durationMs / 1000).toFixed(1)}s` : '1.4s'}
          </span>
        </div>
      </div>

      {/* Résumé d'expérience */}
      {journey.summary && (
        <div className="px-5 py-3.5 bg-muted/40 border-b border-border text-xs text-muted-foreground flex items-start gap-2.5">
          <Terminal size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="leading-relaxed">
            <span className="font-semibold text-foreground">Synthèse du raisonnement : </span>
            {journey.summary}
          </div>
        </div>
      )}

      {/* Timeline des étapes */}
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Trajectoire Comportementale Pas-à-Pas
          </span>
          <button
            onClick={() => setExpandedDetails(!expandedDetails)}
            className="text-xs text-foreground hover:underline flex items-center gap-1 font-medium cursor-pointer"
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
                    ? 'border-foreground/40 bg-muted/40 shadow-xs ring-1 ring-foreground/20'
                    : 'border-border bg-card hover:bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                      #{step.stepIndex}
                    </span>
                    <span className="text-xs font-semibold text-foreground">{step.action}</span>
                  </div>

                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                    {step.status.toUpperCase()}
                  </span>
                </div>

                {(expandedDetails || isCurrent) && step.reasoning && (
                  <div className="mt-2 text-xs text-muted-foreground font-sans pl-7 border-l-2 border-border ml-2 py-0.5 leading-relaxed">
                    <span className="text-muted-foreground font-medium">Raisonnement : </span>
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
        <div className="px-5 py-4 border-t border-border bg-muted/20">
          <div className="text-xs font-semibold text-muted-foreground mb-2">Points d'observation agent :</div>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {journey.observations.map((obs, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-muted-foreground font-bold">•</span>
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
