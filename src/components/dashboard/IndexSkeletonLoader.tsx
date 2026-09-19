import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

interface IndexSkeletonLoaderProps {
  /**
   * Si true, n'affiche que le skeleton de la section basse (onglets + graphiques/tableaux),
   * utilisé lorsque TopSection est déjà monté et que seul le rapport change.
   */
  onlyBottom?: boolean;
}

export const IndexSkeletonLoader: React.FC<IndexSkeletonLoaderProps> = ({ onlyBottom = false }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200 w-full" aria-busy="true" aria-label="Chargement du tableau de bord">
      {/* ─── 1. SECTION HAUTE : TopSection (Titre + 3 Roues de scores réelles) ─ */}
      {!onlyBottom && (
        <div className="space-y-4 mb-6">
          {/* En-tête Hero avec titre, IA button et Export PDF */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <Skeleton className="h-8 w-56 sm:w-72 rounded-lg" />
                <Skeleton className="h-7 w-32 rounded-full" />
              </div>
              <Skeleton className="h-4 w-44 rounded" />
            </div>

            {/* Bouton Télécharger le rapport PDF */}
            <Skeleton className="h-9 w-44 rounded-xl self-start sm:self-auto" />
          </div>

          {/* Carte des 3 Roues de Scores (Citations, Score GEO, Score Agentique) */}
          <Card className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-around gap-6 sm:gap-4 py-4">
              {/* Roue 1 : Citations Totales */}
              <div className="relative w-[160px] sm:w-[190px] aspect-square rounded-full border-[14px] sm:border-[16px] border-muted/50 flex flex-col items-center justify-center space-y-1 shrink-0 mx-auto">
                <Skeleton className="h-9 sm:h-11 w-14 rounded-md" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>

              {/* Roue 2 : Score GEO */}
              <div className="relative w-[160px] sm:w-[190px] aspect-square rounded-full border-[14px] sm:border-[16px] border-muted/50 flex flex-col items-center justify-center space-y-1 shrink-0 mx-auto">
                <Skeleton className="h-9 sm:h-11 w-12 rounded-md" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>

              {/* Roue 3 : Score Agentique + Lien M2M */}
              <div className="flex flex-col items-center shrink-0 mx-auto space-y-2">
                <div className="relative w-[160px] sm:w-[190px] aspect-square rounded-full border-[14px] sm:border-[16px] border-muted/50 flex flex-col items-center justify-center space-y-1">
                  <Skeleton className="h-9 sm:h-11 w-10 rounded-md" />
                  <Skeleton className="h-3 w-22 rounded" />
                </div>
                <Skeleton className="h-3.5 w-24 rounded" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ─── 2. SECTION BASSE : Barre d'onglets intra-page ───────────────────── */}
      <div className="space-y-6">
        {/* Sticky Tabs Bar Skeleton (5 onglets réels) */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200/80 -mx-4 px-4 mb-4 py-2 flex items-center justify-between gap-3">
          <div className="h-auto p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 flex items-center gap-1 overflow-x-auto scrollbar-none">
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-7 w-24 rounded-lg" />
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-7 w-28 rounded-lg" />
            <Skeleton className="h-7 w-32 rounded-lg" />
          </div>
        </div>

        {/* ─── 3. CONTENU RÉEL DE LA VUE PAR DÉFAUT (Citations) ────────────── */}
        <div className="space-y-6">
          {/* Section à 2 colonnes : Citations par modèle + Analyse concurrentielle */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Colonne Gauche (7/12) : Citations par modèle */}
            <Card className="lg:col-span-7 rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-40 rounded" />
                  <Skeleton className="w-4 h-4 rounded-full" />
                </div>
                <Skeleton className="h-8 w-16 rounded-lg" />
              </div>

              {/* Alerte / Synthèse */}
              <Skeleton className="h-14 w-full rounded-xl" />

              {/* Tableau des modèles */}
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="p-3 bg-muted/40 border-b border-border flex justify-between">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-4 w-16 rounded" />
                </div>
                <div className="divide-y divide-border">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Skeleton className="w-6 h-6 rounded-lg shrink-0" />
                        <Skeleton className="h-4 w-28 rounded" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-12 rounded-full" />
                        <Skeleton className="w-7 h-7 rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Colonne Droite (5/12) : Analyse concurrentielle */}
            <Card className="lg:col-span-5 rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-44 rounded" />
                  <Skeleton className="w-4 h-4 rounded-full" />
                </div>
                <Skeleton className="h-8 w-28 rounded-lg" />
              </div>

              {/* Alerte positionnement */}
              <Skeleton className="h-14 w-full rounded-xl" />

              {/* Liste des concurrents */}
              <div className="space-y-2.5 pt-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-3 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="w-6 h-6 rounded-md shrink-0" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32 rounded" />
                        <Skeleton className="h-2.5 w-20 rounded" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Section Pleine Largeur : Tableau des Domaines & Sources */}
          <Card className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
              <div className="space-y-1">
                <Skeleton className="h-5 w-52 rounded" />
                <Skeleton className="h-3.5 w-72 rounded" />
              </div>
              <Skeleton className="h-8 w-44 rounded-lg" />
            </div>

            {/* Tableau des sources */}
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="p-3 bg-muted/40 border-b border-border flex justify-between">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-4 w-24 rounded hidden sm:inline-block" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
              <div className="divide-y divide-border">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-40 rounded" />
                        <Skeleton className="h-3 w-24 rounded" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-20 rounded-full hidden sm:inline-block" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
