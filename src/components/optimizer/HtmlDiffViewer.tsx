import React from 'react';

interface HtmlDiffViewerProps {
  original: string;
  optimized: string;
}

export function HtmlDiffViewer({ original, optimized }: HtmlDiffViewerProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">HTML Original</h3>
        <div className="rounded-lg border border-border bg-muted/50 p-4 overflow-auto max-h-[600px]">
          <pre className="text-xs text-foreground whitespace-pre-wrap break-all font-mono">
            {original}
          </pre>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">HTML Optimise</h3>
        <div className="rounded-lg border border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20 p-4 overflow-auto max-h-[600px]">
          <pre className="text-xs text-foreground whitespace-pre-wrap break-all font-mono">
            {optimized}
          </pre>
        </div>
      </div>
    </div>
  );
}
