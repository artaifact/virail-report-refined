import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export const PricingSkeletonLoader: React.FC = () => {
  return (
    <div className="space-y-10 animate-in fade-in duration-300 w-full max-w-7xl mx-auto py-4" aria-busy="true" aria-label="Chargement des forfaits et tarifs">
      {/* ─── 1. HEADER DU SELECTEUR DE PLANS ────────────────────────────────── */}
      <div className="text-center space-y-3 max-w-2xl mx-auto px-4">
        <Skeleton className="h-9 sm:h-10 w-64 sm:w-80 rounded-xl mx-auto" />
        <Skeleton className="h-4 w-72 sm:w-96 rounded-lg mx-auto" />
        <div className="pt-1 flex justify-center">
          <Skeleton className="h-6 w-60 rounded-full" />
        </div>
      </div>

      {/* ─── 2. TOGGLE FACTURATION (Mensuel / Annuel) ───────────────────────── */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 gap-1">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-36 rounded-lg" />
        </div>
      </div>

      {/* ─── 3. GRILLE DES 3 FORFAITS (Starter, Pro, Entreprise) ─────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch px-2 sm:px-4">
        {/* CARTE 1 : Starter / Standard */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between shadow-xs space-y-6">
          <div className="space-y-5">
            {/* Header carte */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24 rounded-lg" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-48 rounded" />
            </div>

            {/* Prix */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <Skeleton className="h-10 w-24 rounded-lg" />
                <Skeleton className="h-4 w-12 rounded" />
              </div>
              <Skeleton className="h-3 w-32 rounded" />
            </div>

            {/* CTA Button */}
            <Skeleton className="h-10 w-full rounded-xl" />

            {/* Section Modèles IA */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <Skeleton className="h-3 w-32 rounded" />
              <div className="flex items-center gap-1.5 flex-wrap">
                {[1, 2, 3, 4, 5, 6].map((m) => (
                  <Skeleton key={m} className="w-6 h-6 rounded-md" />
                ))}
              </div>
            </div>

            {/* Liste des fonctionnalités */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <Skeleton className="h-3.5 w-28 rounded mb-2" />
              {[1, 2, 3, 4, 5].map((f) => (
                <div key={f} className="flex items-center gap-2.5">
                  <Skeleton className="w-4 h-4 rounded-full shrink-0" />
                  <Skeleton className="h-3 w-full rounded" />
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* CARTE 2 : Pro / Recommandé (Mise en avant avec bordure bleue) */}
        <Card className="relative rounded-2xl border-2 border-primary/50 dark:border-primary/60 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between shadow-lg ring-2 ring-primary/10 space-y-6">
          {/* Badge Populaire flottant */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <Skeleton className="h-7 w-32 rounded-full" />
          </div>

          <div className="space-y-5 pt-1">
            {/* Header carte */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-28 rounded-lg" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-52 rounded" />
            </div>

            {/* Prix */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <Skeleton className="h-10 w-28 rounded-lg" />
                <Skeleton className="h-4 w-12 rounded" />
              </div>
              <Skeleton className="h-3 w-36 rounded" />
            </div>

            {/* CTA Button Recommandé */}
            <Skeleton className="h-10 w-full rounded-xl bg-primary/20" />

            {/* Section Modèles IA */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <Skeleton className="h-3 w-40 rounded" />
              <div className="flex items-center gap-1.5 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((m) => (
                  <Skeleton key={m} className="w-6 h-6 rounded-md" />
                ))}
              </div>
            </div>

            {/* Liste des fonctionnalités */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <Skeleton className="h-3.5 w-32 rounded mb-2" />
              {[1, 2, 3, 4, 5, 6, 7].map((f) => (
                <div key={f} className="flex items-center gap-2.5">
                  <Skeleton className="w-4 h-4 rounded-full shrink-0" />
                  <Skeleton className="h-3 w-full rounded" />
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* CARTE 3 : Entreprise / Avancé */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between shadow-xs space-y-6">
          <div className="space-y-5">
            {/* Header carte */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24 rounded-lg" />
                <Skeleton className="h-5 w-18 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-44 rounded" />
            </div>

            {/* Prix */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <Skeleton className="h-10 w-28 rounded-lg" />
                <Skeleton className="h-4 w-12 rounded" />
              </div>
              <Skeleton className="h-3 w-32 rounded" />
            </div>

            {/* CTA Button */}
            <Skeleton className="h-10 w-full rounded-xl" />

            {/* Section Modèles IA */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <Skeleton className="h-3 w-36 rounded" />
              <div className="flex items-center gap-1.5 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((m) => (
                  <Skeleton key={m} className="w-6 h-6 rounded-md" />
                ))}
              </div>
            </div>

            {/* Liste des fonctionnalités */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <Skeleton className="h-3.5 w-32 rounded mb-2" />
              {[1, 2, 3, 4, 5, 6].map((f) => (
                <div key={f} className="flex items-center gap-2.5">
                  <Skeleton className="w-4 h-4 rounded-full shrink-0" />
                  <Skeleton className="h-3 w-full rounded" />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
