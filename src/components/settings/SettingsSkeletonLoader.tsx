import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export const SettingsSkeletonLoader: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 w-full max-w-6xl mx-auto" aria-busy="true" aria-label="Chargement des paramètres">
      {/* ─── 1. HEADER DES PARAMÈTRES ───────────────────────────────────────── */}
      <div className="space-y-1.5 pb-2">
        <Skeleton className="h-8 w-60 rounded-xl" />
        <Skeleton className="h-4 w-96 rounded-lg" />
      </div>

      {/* ─── 2. GRILLE PRINCIPALE (2 COLONNES) ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Colonne Gauche : Informations personnelles */}
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs p-5 md:p-6 space-y-5">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
            <Skeleton className="h-5 w-44 rounded-md" />
          </div>

          {/* Avatar rond */}
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-full shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3 w-44 rounded" />
            </div>
          </div>

          {/* Champs de formulaire */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          </div>

          {/* Bouton d'enregistrement */}
          <div className="pt-2">
            <Skeleton className="h-9 w-40 rounded-xl" />
          </div>
        </Card>

        {/* Colonne Droite : Abonnement actuel & Quotas */}
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs p-5 md:p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
              <Skeleton className="h-5 w-40 rounded-md" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>

            {/* Détails du plan */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-28 rounded-lg" />
                <Skeleton className="h-6 w-24 rounded-lg" />
              </div>
              <Skeleton className="h-3.5 w-48 rounded" />
            </div>

            {/* Jauge de quotas d'usage */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-32 rounded" />
                <Skeleton className="h-3.5 w-20 rounded" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex items-center justify-between text-xs pt-1">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-3 w-28 rounded" />
              </div>
            </div>
          </div>

          {/* Boutons d'action pour le forfait */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <Skeleton className="h-9 w-36 rounded-xl" />
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>
        </Card>
      </div>

      {/* ─── 3. SECTION BASSE 1 : Facturation & Moyen de paiement ──────────── */}
      <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
          <Skeleton className="h-5 w-52 rounded-md" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-7 rounded-md" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
          </div>
          <Skeleton className="h-9 w-44 rounded-xl" />
        </div>
      </Card>

      {/* ─── 4. SECTION BASSE 2 : Historique des factures ───────────────────── */}
      <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden space-y-0">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <Skeleton className="h-5 w-44 rounded-md" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>

        {/* Table skeleton */}
        <div className="p-4 space-y-2.5">
          {/* Header */}
          <div className="grid grid-cols-12 gap-3 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs">
            <div className="col-span-3"><Skeleton className="h-3 w-20 rounded" /></div>
            <div className="col-span-3"><Skeleton className="h-3 w-24 rounded" /></div>
            <div className="col-span-2"><Skeleton className="h-3 w-16 rounded" /></div>
            <div className="col-span-2"><Skeleton className="h-3 w-14 rounded" /></div>
            <div className="col-span-2 text-right"><Skeleton className="h-3 w-10 rounded ml-auto" /></div>
          </div>

          {/* 3 Factures */}
          {[1, 2, 3].map((inv) => (
            <div key={inv} className="grid grid-cols-12 gap-3 p-3 border-b border-slate-100 dark:border-slate-800 items-center">
              <div className="col-span-3"><Skeleton className="h-3.5 w-28 rounded font-mono" /></div>
              <div className="col-span-3"><Skeleton className="h-3 w-28 rounded" /></div>
              <div className="col-span-2"><Skeleton className="h-3.5 w-16 rounded font-semibold" /></div>
              <div className="col-span-2"><Skeleton className="h-5 w-16 rounded-full" /></div>
              <div className="col-span-2 flex justify-end"><Skeleton className="w-7 h-7 rounded-md" /></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
