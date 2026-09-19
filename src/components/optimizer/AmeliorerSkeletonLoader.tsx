import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export const AmeliorerSkeletonLoader: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 w-full" aria-busy="true" aria-label="Chargement des optimisations">
      {/* 1. Navigation Tabs Skeleton */}
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-muted/70 border border-border/60">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-36 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-36 rounded-lg" />
        </div>
      </div>

      {/* 2. Hero Score & Overview Skeleton */}
      <Card className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left: Score Box */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-muted/60 border border-border/80 flex flex-col items-center justify-center shrink-0 p-3 space-y-1.5">
              <Skeleton className="h-8 w-12 rounded" />
              <Skeleton className="h-3 w-14 rounded" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-48 sm:w-64 rounded-lg" />
                <Skeleton className="h-5 w-20 rounded-md" />
              </div>
              <Skeleton className="h-4 w-72 sm:w-96 rounded" />
              <div className="flex items-center gap-2 pt-1">
                <Skeleton className="h-3.5 w-24 rounded" />
                <Skeleton className="h-3.5 w-32 rounded" />
              </div>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto self-stretch sm:self-auto justify-start lg:justify-end shrink-0">
            <Skeleton className="h-9 w-32 rounded-xl" />
            <Skeleton className="h-9 w-36 rounded-xl" />
          </div>
        </div>

        {/* 4 Sub-metrics Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-6 mt-6 border-t border-border/60">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-24 rounded" />
                <Skeleton className="h-3.5 w-8 rounded" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
              <Skeleton className="h-2.5 w-20 rounded" />
            </div>
          ))}
        </div>
      </Card>

      {/* 3. Priority Recommendations Card Skeleton */}
      <Card className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Skeleton className="w-4 h-4 rounded" />
              <Skeleton className="h-4 w-44 rounded" />
            </div>
            <Skeleton className="h-3 w-64 rounded" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        <div className="p-4 sm:p-5 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl border border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3 flex-1">
                <Skeleton className="w-7 h-7 rounded-lg shrink-0 mt-0.5" />
                <div className="space-y-1.5 w-full">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-52 rounded" />
                    <Skeleton className="h-4 w-16 rounded-md" />
                    <Skeleton className="h-4 w-14 rounded-md" />
                  </div>
                  <Skeleton className="h-3 w-4/5 rounded" />
                </div>
              </div>
              <Skeleton className="h-8 w-24 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      </Card>

      {/* 4. Code / Remediation Generator Preview Skeleton */}
      <Card className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border/60 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-4 w-16 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-7 w-24 rounded-lg" />
          </div>
        </div>

        <div className="p-5 space-y-2.5 bg-muted/10 font-mono">
          <Skeleton className="h-3.5 w-32 rounded bg-muted-foreground/15" />
          <Skeleton className="h-3.5 w-64 rounded bg-muted-foreground/15 ml-4" />
          <Skeleton className="h-3.5 w-48 rounded bg-muted-foreground/15 ml-8" />
          <Skeleton className="h-3.5 w-80 rounded bg-muted-foreground/15 ml-8" />
          <Skeleton className="h-3.5 w-96 rounded bg-muted-foreground/15 ml-8" />
          <Skeleton className="h-3.5 w-56 rounded bg-muted-foreground/15 ml-4" />
          <Skeleton className="h-3.5 w-24 rounded bg-muted-foreground/15" />
        </div>
      </Card>
    </div>
  );
};
