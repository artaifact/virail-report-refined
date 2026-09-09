import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export const AgenticSkeletonLoader: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Gauge Card Skeleton */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
          <Skeleton className="w-32 h-32 rounded-full" />
        </div>
        <div className="flex-1 space-y-3 w-full text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <Skeleton className="h-6 w-36 rounded-md" />
            <Skeleton className="h-6 w-44 rounded-md" />
          </div>
          <Skeleton className="h-5 w-64 rounded mx-auto md:mx-0" />
          <div className="space-y-1.5 max-w-xl mx-auto md:mx-0">
            <Skeleton className="h-3.5 w-full rounded" />
            <Skeleton className="h-3.5 w-4/5 rounded" />
          </div>
        </div>
      </div>

      {/* 2. Pillars Skeleton */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-60 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 rounded-xl shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-32 rounded" />
                    <Skeleton className="h-2.5 w-44 rounded" />
                  </div>
                </div>
                <Skeleton className="h-5 w-14 rounded" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="space-y-2 pt-1">
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-5/6 rounded" />
                <Skeleton className="h-3 w-4/6 rounded" />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 3. Channels Matrix Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-72 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 space-y-2.5 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-4 w-12 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 rounded" />
                <Skeleton className="h-3.5 w-28 rounded" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-2.5 w-full rounded" />
                <Skeleton className="h-2.5 w-4/5 rounded" />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 4. Remediation Pack Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-56 rounded" />
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden rounded-xl shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-3 py-2">
            <div className="flex gap-2">
              <Skeleton className="h-7 w-20 rounded-lg" />
              <Skeleton className="h-7 w-24 rounded-lg" />
              <Skeleton className="h-7 w-20 rounded-lg" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-7 w-16 rounded-lg" />
              <Skeleton className="h-7 w-24 rounded-lg" />
            </div>
          </div>
          <div className="p-4 space-y-2 bg-[#0b0f17]/90 min-h-[160px]">
            <Skeleton className="h-3 w-3/4 rounded bg-slate-800" />
            <Skeleton className="h-3 w-1/2 rounded bg-slate-800" />
            <Skeleton className="h-3 w-4/5 rounded bg-slate-800" />
            <Skeleton className="h-3 w-2/3 rounded bg-slate-800" />
            <Skeleton className="h-3 w-3/5 rounded bg-slate-800" />
          </div>
        </Card>
      </div>
    </div>
  );
};
