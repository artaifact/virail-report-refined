import React, { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';

interface SchemaItem {
  '@type'?: string;
  [key: string]: unknown;
}

interface SchemaPreviewProps {
  schemas: SchemaItem[];
  title?: string;
}

export function SchemaPreview({ schemas, title = 'Donnees structurees' }: SchemaPreviewProps) {
  const [collapsedIndices, setCollapsedIndices] = useState<Set<number>>(new Set());
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (schema: SchemaItem, index: number) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Fallback silencieux
    }
  };

  if (schemas.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">Aucune donnee structuree trouvee.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
          {schemas.length} schema{schemas.length > 1 ? 's' : ''}
        </span>
      </div>
      <div className="space-y-3">
        {schemas.map((schema, index) => {
          const isExpanded = !collapsedIndices.has(index);
          const schemaType = String(schema['@type'] || 'Unknown');

          return (
            <div key={index} className="rounded border border-border bg-muted/30 overflow-hidden">
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  const next = new Set(collapsedIndices);
                  if (isExpanded) next.add(index); else next.delete(index);
                  setCollapsedIndices(next);
                }}
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {schemaType}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(schema, index);
                  }}
                  className="p-1.5 rounded hover:bg-muted transition-colors"
                  title="Copier le JSON"
                >
                  {copiedIndex === index ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
              </div>
              {isExpanded && (
                <div className="border-t border-border p-3">
                  <pre className="text-xs text-muted-foreground overflow-auto max-h-60 font-mono">
                    {JSON.stringify(schema, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
