import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Copy, Download } from 'lucide-react';
import { AgenticRemediationPack } from '@/services/agenticService';

interface AgenticRemediationViewerProps {
  remediationPack?: AgenticRemediationPack;
}

export const AgenticRemediationViewer: React.FC<AgenticRemediationViewerProps> = ({ remediationPack }) => {
  const files = remediationPack?.files || {};
  const fileKeys = Object.keys(files);
  const defaultTab = fileKeys.length > 0 ? fileKeys[0] : 'llms.txt';

  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [copied, setCopied] = useState<boolean>(false);

  const currentContent = files[activeTab] || '// Fichier de remédiation en attente de génération.';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = activeTab.split('/').pop() || 'remediation.txt';
    const blob = new Blob([currentContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (fileKeys.length === 0) {
    return (
      <div className="p-8 text-center text-xs sm:text-sm text-slate-500 rounded-xl border border-slate-200/80 bg-slate-50/50 dark:bg-slate-900/50 font-sans">
        Aucun pack de remédiation généré. Activez l'option "Générer le Pack de Remédiation" lors de l'audit.
      </div>
    );
  }

  return (
    <Card className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm font-sans">
      {/* Tabs Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 px-3 py-1.5 overflow-x-auto">
        <div className="flex gap-1 overflow-x-auto">
          {fileKeys.map((fileKey) => (
            <button
              key={fileKey}
              onClick={() => setActiveTab(fileKey)}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === fileKey
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/50'
              }`}
            >
              {fileKey.split('/').pop()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="h-7 text-xs gap-1.5 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium shadow-xs transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copié' : 'Copier'}
          </Button>

          <Button
            size="sm"
            onClick={handleDownload}
            className="h-7 text-xs gap-1.5 px-2.5 rounded-lg bg-[#1A3AFF] hover:bg-[#1530D9] text-white font-medium shadow-xs transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Télécharger
          </Button>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="relative bg-[#0b0f17] p-4 max-h-[460px] overflow-y-auto font-mono text-xs text-slate-200 leading-relaxed">
        <pre className="overflow-x-auto whitespace-pre-wrap break-all">
          <code>{currentContent}</code>
        </pre>
      </div>
    </Card>
  );
};
