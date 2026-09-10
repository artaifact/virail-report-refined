import React, { useState } from 'react';
import { Check, Copy, ShieldCheck } from 'lucide-react';

interface AgenticBadgeProps {
  score: number;
  grade: string;
  domain: string;
  theme?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
}

export const AgenticBadge: React.FC<AgenticBadgeProps> = ({
  score,
  grade,
  domain,
  theme = 'dark',
  size = 'md',
}) => {
  const [copied, setCopied] = useState<string | null>(null);

  const bgColor = theme === 'dark' ? '#0F172A' : '#FFFFFF';
  const textColor = theme === 'dark' ? '#F8FAFC' : '#0F172A';
  const borderColor = theme === 'dark' ? '#334155' : '#E2E8F0';
  const scoreBg = score >= 80 ? '#10B981' : score >= 60 ? '#6366F1' : '#F59E0B';

  const badgeMarkdown = `[![Viraill Agentic Readiness](https://api.viraill.com/v1/badge/${encodeURIComponent(domain)}.svg)](https://viraill.com/snapshot/${encodeURIComponent(domain)})`;
  const badgeHtml = `<a href="https://viraill.com/snapshot/${encodeURIComponent(domain)}" target="_blank" rel="noopener noreferrer"><img src="https://api.viraill.com/v1/badge/${encodeURIComponent(domain)}.svg" alt="Viraill Actionability Score" /></a>`;

  const copyToClipboard = (text: string, type: 'md' | 'html') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Badge Officiel d'Actionnabilité
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => copyToClipboard(badgeMarkdown, 'md')}
            className="text-[11px] flex items-center gap-1 px-2 py-1 rounded bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
          >
            {copied === 'md' ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
            Markdown
          </button>
          <button
            onClick={() => copyToClipboard(badgeHtml, 'html')}
            className="text-[11px] flex items-center gap-1 px-2 py-1 rounded bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
          >
            {copied === 'html' ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
            HTML
          </button>
        </div>
      </div>

      {/* Aperçu Visuel du Badge */}
      <div className="flex items-center justify-center p-3 rounded-lg bg-slate-950/5 border border-dashed border-border">
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            borderRadius: '6px',
            border: `1px solid ${borderColor}`,
            background: bgColor,
            overflow: 'hidden',
            fontFamily: 'Inter, system-ui, sans-serif',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              padding: size === 'sm' ? '3px 7px' : '5px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: size === 'sm' ? '11px' : '12px',
              fontWeight: 600,
              color: textColor,
            }}
          >
            <ShieldCheck size={14} style={{ color: '#3B82F6' }} />
            <span>viraill</span>
            <span style={{ color: '#94A3B8', fontWeight: 400 }}>readiness</span>
          </div>
          <div
            style={{
              padding: size === 'sm' ? '3px 8px' : '5px 12px',
              background: scoreBg,
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: size === 'sm' ? '11px' : '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>{score}/100</span>
            <span style={{ opacity: 0.85, fontSize: '10px' }}>({grade})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
