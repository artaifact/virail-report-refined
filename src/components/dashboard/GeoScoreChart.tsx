import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Download,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Zap,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  XCircle,
  Calendar,
  Layers,
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { HELP } from '@/lib/help-content';
import { getModelLogo } from '@/components/dashboard/TopSection';
import type { FullReportData } from '@/lib/api';
import { cn } from '@/lib/utils';

// Mapper les noms techniques API vers des noms commerciaux (marque uniquement)
export const getCommercialModelName = (apiName: string): string => {
  const n = apiName.toLowerCase().trim();
  if (n.includes('sonar')) return 'Perplexity';
  if (n.includes('claude')) return 'Claude';
  if (n.startsWith('gpt') || n === 'chatgpt') return 'ChatGPT';
  if (n.includes('gemini') || n === 'ai overview' || n === 'ai-overview') return 'Gemini';
  if (n.includes('mistral') || n.includes('mixtral')) return 'Mistral';
  if (n.includes('deepseek')) return 'DeepSeek';
  if (n.includes('llama')) return 'Meta AI';
  if (n.includes('qwen')) return 'Qwen';
  if (n.includes('grok')) return 'Grok';
  return apiName.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

export function exportToCsv(filename: string, rows: string[][]): void {
  const csvContent = rows
    .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface GeoScoreChartProps {
  reportData: FullReportData | null;
}

export function GeoScoreChart({ reportData }: GeoScoreChartProps) {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortCol, setSortCol] = useState<'name' | 'citations'>('citations');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (col: 'name' | 'citations') => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir(col === 'citations' ? 'desc' : 'asc');
    }
  };

  const getDataFromAPI = () => {
    const rawEntries: Array<{
      apiName: string;
      citations: number;
      lastUpdate: string;
      details: string;
    }> = [];
    const apiSeen = new Set<string>();

    if (reportData?.analyse_citation?.citations_by_model) {
      Object.entries(reportData.analyse_citation.citations_by_model).forEach(([modelName, citations]) => {
        if (!modelName) return;
        apiSeen.add(modelName.toLowerCase());
        const matchingAnalysis = reportData.analyses?.find(
          (a) => a.llm_name?.toLowerCase() === modelName.toLowerCase()
        );
        rawEntries.push({
          apiName: modelName,
          citations: citations as number,
          lastUpdate: matchingAnalysis?.created_at || new Date().toISOString(),
          details: matchingAnalysis?.modules?.audit_geo?.resume_executif_geo || 'Données de citation disponibles',
        });
      });
    }

    if (
      reportData?.analyse_citation?.detailed_results &&
      Array.isArray(reportData.analyse_citation.detailed_results)
    ) {
      const citationsFromDetails: Record<string, number> = {};
      reportData.analyse_citation.detailed_results.forEach((r: any) => {
        const model = r.llm_model || '';
        if (!model) return;
        if (!citationsFromDetails[model]) citationsFromDetails[model] = 0;
        if (r.citation_detected) {
          citationsFromDetails[model] += r.mentions || 1;
        }
      });
      Object.entries(citationsFromDetails).forEach(([modelName, citations]) => {
        if (!apiSeen.has(modelName.toLowerCase())) {
          rawEntries.push({
            apiName: modelName,
            citations,
            lastUpdate: new Date().toISOString(),
            details: 'Données de citation disponibles',
          });
        }
      });
    }

    const grouped: Record<
      string,
      { displayName: string; citations: number; lastUpdate: string; details: string; rawModel: string }
    > = {};

    rawEntries.forEach((entry) => {
      const displayName = getCommercialModelName(entry.apiName);
      if (grouped[displayName]) {
        grouped[displayName].citations += entry.citations;
      } else {
        grouped[displayName] = {
          displayName,
          citations: entry.citations,
          lastUpdate: entry.lastUpdate,
          details: entry.details,
          rawModel: entry.apiName,
        };
      }
    });

    const DEFAULT_EXPECTED_MODELS: { apiName: string; rawModel: string }[] = [
      { apiName: 'gpt-4o', rawModel: 'gpt-4o' },
      { apiName: 'claude-4-sonnet', rawModel: 'claude-4-sonnet' },
      { apiName: 'gemini-2.5-pro', rawModel: 'gemini-2.5-pro' },
      { apiName: 'mistral-large', rawModel: 'mistral-large' },
      { apiName: 'sonar-pro', rawModel: 'sonar-pro' },
      { apiName: 'deepseek-chat', rawModel: 'deepseek-chat' },
      { apiName: 'qwen-2.5-72b', rawModel: 'qwen-2.5-72b' },
      { apiName: 'llama-3.1-70b', rawModel: 'llama-3.1-70b' },
      { apiName: 'grok-4', rawModel: 'grok-4' },
    ];

    DEFAULT_EXPECTED_MODELS.forEach(({ apiName, rawModel }) => {
      const displayName = getCommercialModelName(apiName);
      if (!grouped[displayName]) {
        grouped[displayName] = {
          displayName,
          citations: -1,
          lastUpdate: new Date().toISOString(),
          details: 'Modèle non analysé lors de cette exécution.',
          rawModel,
        };
      }
    });

    return Object.values(grouped).sort((a, b) => {
      if (a.citations === -1 && b.citations !== -1) return 1;
      if (b.citations === -1 && a.citations !== -1) return -1;
      return b.citations - a.citations;
    });
  };

  const rawData = getDataFromAPI();
  const data = [...rawData].sort((a, b) => {
    if (sortCol === 'name') {
      const cmp = a.displayName.localeCompare(b.displayName, 'fr');
      return sortDir === 'asc' ? cmp : -cmp;
    }
    return sortDir === 'asc' ? a.citations - b.citations : b.citations - a.citations;
  });

  if (data.length === 0) {
    return (
      <Card className="rounded-2xl border-border/80 bg-card shadow-xs p-5 w-full">
        <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
            <span>Citations par modèle</span>
            <InfoTooltip {...HELP.citationsParModele} side="bottom" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 py-8 text-center text-sm text-muted-foreground">
          Aucune donnée d'analyse disponible pour ce rapport.
        </CardContent>
      </Card>
    );
  }

  const analyzedData = data.filter((item) => item.citations !== -1);
  const allCitationsZero = analyzedData.length > 0 && analyzedData.every((item) => item.citations === 0);
  const isApiData = analyzedData.length > 0;
  const totalCitations = analyzedData.reduce((sum, item) => sum + Math.max(0, item.citations), 0);

  const handleExportCsv = () => {
    const rows: string[][] = [['Modèle', 'Citations']];
    data.forEach((item) => rows.push([item.displayName, String(item.citations)]));
    exportToCsv('citations-par-modele.csv', rows);
  };

  return (
    <Card className="rounded-2xl border-border/80 bg-card shadow-xs p-4 sm:p-5 w-full">
      <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
            <span>Citations par modèle</span>
            <InfoTooltip {...HELP.citationsParModele} side="bottom" />
          </CardTitle>
        </div>
        {data.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="h-8 gap-1.5 text-xs font-medium rounded-lg"
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
            <span>CSV</span>
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-0 space-y-4">
        {allCitationsZero && isApiData && (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="text-sm font-semibold">Aucune citation détectée</AlertTitle>
            <AlertDescription className="text-xs leading-relaxed opacity-90">
              Votre site n'est <strong>pas encore cité</strong> dans les synthèses des moteurs IA testés. Consultez les recommandations sémantiques pour combler cet écart.
            </AlertDescription>
          </Alert>
        )}

        {totalCitations === 1 && isApiData && (
          <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-sm font-semibold">Visibilité initiale détectée</AlertTitle>
            <AlertDescription className="text-xs leading-relaxed">
              Votre site est cité <strong>1 seule fois</strong>. C'est un signal positif mais encore insuffisant pour garantir une présence durable.
            </AlertDescription>
          </Alert>
        )}

        {totalCitations >= 5 && isApiData && (
          <Alert className="bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <AlertTitle className="text-sm font-semibold">Excellente autorité perçue</AlertTitle>
            <AlertDescription className="text-xs leading-relaxed">
              Votre site enregistre <strong>{totalCitations} citations</strong> réparties sur vos moteurs cibles.
            </AlertDescription>
          </Alert>
        )}

        <div className="w-full overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="py-2.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSort('name')}
                    className="h-auto p-0 font-semibold text-xs text-foreground hover:text-primary gap-1 hover:bg-transparent"
                  >
                    <span>Modèle</span>
                    {sortCol === 'name' ? (
                      sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground/60" />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="text-right py-2.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSort('citations')}
                    className="h-auto p-0 font-semibold text-xs text-foreground hover:text-primary gap-1 hover:bg-transparent ml-auto"
                  >
                    <span>Citations</span>
                    {sortCol === 'citations' ? (
                      sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground/60" />
                    )}
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow
                  key={index}
                  onClick={() => {
                    setSelectedModel(item.displayName);
                    setIsModalOpen(true);
                  }}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2.5">
                      {getModelLogo(item.rawModel) ? (
                        <img src={getModelLogo(item.rawModel)!} alt="" className="w-5 h-5 object-contain rounded-xs" />
                      ) : (
                        <Zap className="h-4 w-4 text-primary" />
                      )}
                      <span className="font-semibold text-xs text-foreground">{item.displayName}</span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground/60 ml-0.5" />
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-right">
                    {item.citations === -1 ? (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground font-normal italic">
                        Non analysé
                      </Badge>
                    ) : item.citations === 0 && isApiData ? (
                      <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/10 font-medium">
                        Non cité
                      </Badge>
                    ) : item.citations >= 5 ? (
                      <Badge className="text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20">
                        {item.citations} citations
                      </Badge>
                    ) : item.citations === 1 ? (
                      <Badge variant="secondary" className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10">
                        {item.citations} citation
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[11px] font-bold">
                        {item.citations} citations
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Modal d'analyse détaillée shadcn */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[85vh] p-0 overflow-hidden rounded-2xl shadow-2xl border-border">
          {selectedModel && (() => {
            const selected = data.find((d) => d.displayName === selectedModel);
            const citations = selected?.citations ?? 0;

            return (
              <div className="flex flex-col max-h-[85vh]">
                <DialogHeader className="px-6 py-4 border-b border-border bg-muted/20">
                  <DialogTitle className="flex items-center gap-2.5 text-lg font-bold text-foreground">
                    {selected && getModelLogo(selected.rawModel) && (
                      <img src={getModelLogo(selected.rawModel)!} alt="" className="w-5 h-5 object-contain" />
                    )}
                    <span>Analyse détaillée — {selectedModel}</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Détail des citations, du statut d'inclusion et des requêtes testées.
                  </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6 space-y-5">
                  <div className="space-y-4">
                    {/* Alerte contextuelle */}
                    {citations === -1 ? (
                      <Alert className="bg-muted/40 border-border text-muted-foreground">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="text-sm font-semibold text-foreground">Non analysé</AlertTitle>
                        <AlertDescription className="text-xs">
                          {selectedModel} n'a pas été exécuté lors de cet audit spécifique.
                        </AlertDescription>
                      </Alert>
                    ) : citations === 0 ? (
                      <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="text-sm font-semibold">Aucune citation</AlertTitle>
                        <AlertDescription className="text-xs">
                          Votre site n'a pas été retenu comme source par {selectedModel}.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert className="bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-200">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <AlertTitle className="text-sm font-semibold">Présence active</AlertTitle>
                        <AlertDescription className="text-xs">
                          Votre domaine a été cité {citations} fois par {selectedModel}.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Résumé de l'analyse */}
                    {selected?.details && (
                      <div className="p-4 rounded-xl border border-border bg-muted/20">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                          Synthèse LLM
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">{selected.details}</p>
                      </div>
                    )}

                    {/* Statistiques en cartes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-4 rounded-xl border border-border bg-card">
                        <div className="text-xs text-muted-foreground mb-1">Citations détectées</div>
                        <div className="text-2xl font-extrabold text-foreground">
                          {selected?.citations === -1 ? '--' : selected?.citations || 0}
                        </div>
                      </div>
                      <div className="p-4 rounded-xl border border-border bg-card">
                        <div className="text-xs text-muted-foreground mb-1">Dernière mise à jour</div>
                        <div className="text-sm font-semibold text-foreground mt-1">
                          {(() => {
                            const dateStr = selected?.lastUpdate;
                            if (!dateStr) return 'N/A';
                            try {
                              return new Date(dateStr).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              });
                            } catch {
                              return dateStr;
                            }
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Requêtes testées */}
                    {(() => {
                      const detailed = reportData?.analyse_citation?.detailed_results;
                      if (!detailed || !Array.isArray(detailed)) return null;

                      const modelResults = detailed.filter((r: any) => {
                        const name = (r.llm_model || '').toLowerCase();
                        const sel = selectedModel.toLowerCase();
                        return name.includes(sel) || sel.includes(name.split('-')[0]);
                      });

                      if (modelResults.length === 0) return null;

                      const cited = modelResults.filter((r: any) => r.citation_detected);
                      const notCited = modelResults.filter((r: any) => !r.citation_detected);

                      return (
                        <div className="space-y-3 pt-2">
                          <h4 className="text-sm font-semibold text-foreground">
                            Requêtes testées ({modelResults.length})
                          </h4>

                          {cited.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Citations confirmées ({cited.length})</span>
                              </div>
                              <div className="space-y-2">
                                {cited.slice(0, 5).map((r: any, i: number) => (
                                  <div
                                    key={i}
                                    className="p-3 rounded-lg border border-border bg-muted/20 text-xs space-y-1.5"
                                  >
                                    {r.query && <div className="font-semibold text-foreground">« {r.query} »</div>}
                                    {r.response_excerpt && (
                                      <div className="text-muted-foreground leading-relaxed border-t border-border/50 pt-1.5">
                                        {r.response_excerpt.length > 200
                                          ? r.response_excerpt.substring(0, 200) + '…'
                                          : r.response_excerpt}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {notCited.length > 0 && (
                            <div className="space-y-2 pt-2">
                              <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                                <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>Non cité ({notCited.length})</span>
                              </div>
                              <div className="space-y-1.5">
                                {notCited.slice(0, 3).map((r: any, i: number) => (
                                  <div
                                    key={i}
                                    className="p-2.5 rounded-lg border border-border bg-card text-xs text-muted-foreground"
                                  >
                                    « {r.query || 'Requête sans citation'} »
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </ScrollArea>

                <div className="p-3 border-t border-border bg-muted/20 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)} className="text-xs">
                    Fermer
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
