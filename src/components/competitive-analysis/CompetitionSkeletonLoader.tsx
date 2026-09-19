import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export const CompetitionSkeletonLoader: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 w-full" aria-busy="true" aria-label="Chargement de l'analyse concurrentielle">
      {/* ─── 1. TOP BAR : Export PDF Button Skeleton ───────────────────────── */}
      <div className="flex justify-end">
        <Skeleton className="h-9 w-52 rounded-xl shadow-xs" />
      </div>

      {/* ─── 2. SECTION HAUTE : Positionnement & Détails par Modèle (2 cols) ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Colonne Gauche : Votre positionnement & Trajectoire temporelle */}
        <Card className="p-5 md:p-7 rounded-[18px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-36 rounded" />
              <Skeleton className="h-3 w-48 rounded" />
            </div>
            <Skeleton className="w-4 h-4 rounded-full" />
          </div>

          {/* KPI Score Bar Preview */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>

          {/* Graphique d'évolution temporelle simulant Recharts */}
          <div className="h-[280px] w-full rounded-xl bg-slate-50/70 dark:bg-slate-800/40 p-4 flex flex-col justify-between border border-slate-100 dark:border-slate-800/60">
            {/* Lignes de grille horizontales avec shimmer */}
            <div className="space-y-8 pt-2">
              <div className="w-full border-b border-dashed border-slate-200 dark:border-slate-700 flex justify-between">
                <Skeleton className="h-2.5 w-6 -mt-3 rounded" />
              </div>
              <div className="w-full border-b border-dashed border-slate-200 dark:border-slate-700 flex justify-between">
                <Skeleton className="h-2.5 w-6 -mt-3 rounded" />
              </div>
              <div className="w-full border-b border-dashed border-slate-200 dark:border-slate-700 flex justify-between">
                <Skeleton className="h-2.5 w-6 -mt-3 rounded" />
              </div>
              <div className="w-full border-b border-dashed border-slate-200 dark:border-slate-700 flex justify-between">
                <Skeleton className="h-2.5 w-6 -mt-3 rounded" />
              </div>
            </div>

            {/* Simuler la courbe et points */}
            <div className="relative h-16 w-full flex items-center justify-around px-4">
              {[1, 2, 3, 4, 5, 6].map((pt) => (
                <div key={pt} className="flex flex-col items-center space-y-1">
                  <div className="w-3 h-3 rounded-full bg-primary/30 animate-pulse border-2 border-primary/60" />
                  <Skeleton className="h-2 w-8 rounded mt-2" />
                </div>
              ))}
            </div>

            {/* Labels Axe X */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 text-[10px]">
              <Skeleton className="h-2.5 w-12 rounded" />
              <Skeleton className="h-2.5 w-12 rounded" />
              <Skeleton className="h-2.5 w-12 rounded" />
              <Skeleton className="h-2.5 w-12 rounded" />
            </div>
          </div>
        </Card>

        {/* Colonne Droite : Détails par Modèle & Concurrents détectés */}
        <Card className="p-5 md:p-7 rounded-[18px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-32 rounded" />
              <Skeleton className="h-3 w-44 rounded" />
            </div>
            {/* Select modèle skeleton */}
            <Skeleton className="h-9 w-36 rounded-xl" />
          </div>

          {/* Titre secondaire & badge */}
          <div className="flex items-center justify-between pt-1">
            <Skeleton className="h-3.5 w-48 rounded" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>

          {/* Liste des 5 concurrents */}
          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3.5 w-28 rounded" />
                      <Skeleton className="h-3 w-16 rounded" />
                    </div>
                    <Skeleton className="h-1.5 w-3/4 rounded-full" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ─── 3. SECTION MILIEU : Matrice de Matérialité (Full Width) ───────── */}
      <Card className="p-6 md:p-7 rounded-[18px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-64 rounded-lg" />
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
            <Skeleton className="h-3.5 w-80 rounded" />
          </div>
          {/* Quadrants Legend Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-6 w-24 rounded-md" />
            <Skeleton className="h-6 w-22 rounded-md" />
            <Skeleton className="h-6 w-18 rounded-md" />
          </div>
        </div>

        {/* 2x2 Matrix Grid Skeleton */}
        <div className="relative h-[340px] w-full rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-700/60 overflow-hidden p-6 grid grid-cols-2 grid-rows-2 gap-4">
          {/* Lignes médianes de quadrant */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-dashed border-slate-300 dark:border-slate-600" />
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-l border-dashed border-slate-300 dark:border-slate-600" />

          {/* Quadrant 1 (Haut-Gauche : Acteurs de Niche) */}
          <div className="relative p-2 flex flex-col justify-between">
            <Skeleton className="h-3 w-28 rounded opacity-60" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-28 rounded-lg" />
              <Skeleton className="h-7 w-24 rounded-lg ml-6" />
            </div>
          </div>

          {/* Quadrant 2 (Haut-Droite : Leaders) */}
          <div className="relative p-2 flex flex-col justify-between items-end">
            <Skeleton className="h-3 w-20 rounded opacity-60" />
            <div className="space-y-2 items-end flex flex-col">
              <Skeleton className="h-7 w-32 rounded-lg" />
              <Skeleton className="h-7 w-26 rounded-lg mr-4" />
            </div>
          </div>

          {/* Quadrant 3 (Bas-Gauche : En Retard) */}
          <div className="relative p-2 flex flex-col justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-24 rounded-lg" />
              <Skeleton className="h-7 w-20 rounded-lg ml-4" />
            </div>
            <Skeleton className="h-3 w-22 rounded opacity-60" />
          </div>

          {/* Quadrant 4 (Bas-Droite : Émergents) */}
          <div className="relative p-2 flex flex-col justify-between items-end">
            <div className="space-y-2 items-end flex flex-col">
              <Skeleton className="h-7 w-30 rounded-lg" />
            </div>
            <Skeleton className="h-3 w-24 rounded opacity-60" />
          </div>
        </div>
      </Card>

      {/* ─── 4. SECTION BASSE : Benchmark Détaillé (Tableau) ─────────────────── */}
      <Card className="rounded-[18px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden space-y-0">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-4 w-48 rounded" />
            <Skeleton className="h-3 w-64 rounded" />
          </div>
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>

        {/* Table skeleton */}
        <div className="p-4 space-y-3">
          {/* Header row */}
          <div className="grid grid-cols-12 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs font-semibold">
            <div className="col-span-4"><Skeleton className="h-3 w-24 rounded" /></div>
            <div className="col-span-2"><Skeleton className="h-3 w-16 rounded" /></div>
            <div className="col-span-2"><Skeleton className="h-3 w-16 rounded" /></div>
            <div className="col-span-2"><Skeleton className="h-3 w-20 rounded" /></div>
            <div className="col-span-2 text-right"><Skeleton className="h-3 w-14 rounded ml-auto" /></div>
          </div>

          {/* Data rows */}
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="grid grid-cols-12 gap-3 p-3 border-b border-slate-100 dark:border-slate-800 items-center">
              <div className="col-span-4 flex items-center gap-2.5">
                <Skeleton className="w-6 h-6 rounded-md shrink-0" />
                <Skeleton className="h-3.5 w-32 rounded" />
              </div>
              <div className="col-span-2"><Skeleton className="h-5 w-16 rounded-full" /></div>
              <div className="col-span-2"><Skeleton className="h-4 w-12 rounded" /></div>
              <div className="col-span-2"><Skeleton className="h-2 w-24 rounded-full" /></div>
              <div className="col-span-2 flex justify-end"><Skeleton className="h-7 w-20 rounded-lg" /></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
