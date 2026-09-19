import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronRight, AlertCircle, ExternalLink, Globe } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { HELP } from '@/lib/help-content';
import { getModelLogo } from '@/components/dashboard/TopSection';
import { extractDomain } from '@/services/competitorAnalysisService';
import type { FullReportData } from '@/lib/api';
import { cn } from '@/lib/utils';

interface DomainsTableProps {
  reportData: FullReportData | null;
}

export function DomainsTable({ reportData }: DomainsTableProps) {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [domainModalOpen, setDomainModalOpen] = useState(false);

  const getTotalCitationsFromAPI = () => {
    if (reportData?.analyse_citation?.total_citations !== undefined) {
      return reportData.analyse_citation.total_citations;
    }
    if (!reportData?.analyses || reportData.analyses.length === 0) {
      return 0;
    }
    return reportData.analyses.reduce((sum, analysis) => {
      const geoData = analysis.modules?.audit_geo;
      const citations = geoData?.citations || geoData?.mentions || 0;
      return sum + Number(citations);
    }, 0);
  };

  const totalCitationsFromAPI = getTotalCitationsFromAPI();
  const hasApiData = reportData?.analyses && reportData.analyses.length > 0;

  const getDomainsFromAPI = () => {
    const clientUrl = (reportData as any)?.report?.url || (reportData as any)?.llmo_report?.url || '';
    const clientSiteName = reportData?.analyse_citation?.client_site_name || '';

    const cfm = reportData?.analyse_citation?.competitors_frequently_mentioned;
    if (cfm && Array.isArray(cfm) && cfm.length > 0) {
      return cfm.map((item: any) => {
        const domain = extractDomain(item.url || '');
        const isClientSite = clientUrl
          ? domain.includes(extractDomain(clientUrl))
          : clientSiteName
          ? domain.toLowerCase().includes(clientSiteName.toLowerCase())
          : false;
        return {
          icon: item.favicon_url || `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
          domain,
          used: `${Math.round(item.percentage ?? 0)} %`,
          citations: String(item.count ?? 0),
          type: isClientSite ? 'you' : 'corporate',
          label: isClientSite ? 'Votre Site' : 'Source',
          pages: 1,
          lastSeen: new Date().toLocaleDateString('fr-FR'),
          description: isClientSite
            ? `Votre site a été cité ${item.count} fois dans les réponses des modèles d'IA.`
            : `Source citée ${item.count} fois.`,
          highlight: isClientSite,
          models: [],
          sourceDetails: [{ url: item.url, title: item.name || domain }],
        };
      });
    }

    if (
      reportData?.analyse_citation?.detailed_results &&
      Array.isArray(reportData.analyse_citation.detailed_results)
    ) {
      const sourcesMap: Record<string, any> = {};
      const totalCalls = reportData.analyse_citation.total_llm_calls || 1;

      reportData.analyse_citation.detailed_results.forEach((result: any) => {
        if (result.sources && Array.isArray(result.sources)) {
          result.sources.forEach((source: any) => {
            if (!source.url) return;
            try {
              const domain = extractDomain(source.url);
              if (!domain) return;
              const isClientSite = clientUrl
                ? domain.includes(extractDomain(clientUrl))
                : clientSiteName
                ? domain.toLowerCase().includes(clientSiteName.toLowerCase())
                : false;

              if (!sourcesMap[domain]) {
                sourcesMap[domain] = {
                  domain,
                  title: source.title || domain,
                  mentions: 0,
                  urls: new Set(),
                  isClient: isClientSite,
                  models: new Set(),
                };
              }
              sourcesMap[domain].mentions += 1;
              sourcesMap[domain].urls.add(source.url);
              if (result.llm_model) sourcesMap[domain].models.add(result.llm_model);
            } catch (e) {}
          });
        }
      });

      if (Object.keys(sourcesMap).length === 0) {
        return [];
      }

      return Object.values(sourcesMap)
        .map((s: any) => ({
          icon: `https://www.google.com/s2/favicons?domain=${s.domain}&sz=32`,
          domain: s.domain,
          used: `${Math.round((s.mentions / totalCalls) * 100)} %`,
          citations: s.mentions.toString(),
          type: s.isClient ? 'you' : 'corporate',
          label: s.isClient ? 'Votre Site' : 'Source',
          pages: s.urls.size,
          lastSeen: new Date().toLocaleDateString('fr-FR'),
          description: s.isClient
            ? `Votre site a été cité ${s.mentions} fois dans les réponses des modèles d'IA.`
            : `Source externe citée ${s.mentions} fois.`,
          highlight: s.isClient,
          models: Array.from(s.models || []),
          sourceDetails: Array.from(s.urls).map((url) => {
            let title = s.title;
            reportData.analyse_citation.detailed_results.forEach((res: any) => {
              const match = res.sources?.find((src: any) => src.url === url);
              if (match && match.title) title = match.title;
            });
            return { url, title };
          }),
        }))
        .sort((a: any, b: any) => parseFloat(b.citations) - parseFloat(a.citations));
    }

    if (reportData?.analyse_citation?.citations_by_model) {
      const citationsByModel = reportData.analyse_citation.citations_by_model as Record<string, number>;
      const totalCitations = reportData.analyse_citation.total_citations || 0;
      const clientUrlFallback =
        (reportData as any)?.report?.url ||
        (reportData as any)?.llmo_report?.url ||
        reportData.analyse_citation?.client_site_url ||
        '';
      const clientDomain = clientUrlFallback
        ? extractDomain(clientUrlFallback)
        : reportData.analyse_citation?.client_site_name || '';

      const domains: any[] = [];
      const modelsThatCited = Object.values(citationsByModel).filter((count) => count > 0).length;
      const totalModels = Object.keys(citationsByModel).length;
      const usedPercentage = totalModels > 0 ? Math.round((modelsThatCited / totalModels) * 100) : 0;

      if (totalCitations > 0 && clientDomain) {
        domains.push({
          icon: `https://www.google.com/s2/favicons?domain=${clientDomain}&sz=32`,
          domain: clientDomain,
          used: `${usedPercentage}%`,
          citations: totalCitations.toString(),
          type: 'you',
          label: 'Votre Site',
          pages: 1,
          lastSeen: new Date().toLocaleDateString('fr-FR'),
          description: `Votre site a été cité ${totalCitations} fois par ${modelsThatCited} modèle(s) d'IA sur ${totalModels}.`,
          highlight: true,
          sourceDetails: [{ url: clientUrlFallback, title: clientDomain }],
        });
      }

      Object.entries(citationsByModel).forEach(([model, count]) => {
        if (count > 0) {
          const modelUsedPct = totalCitations > 0 ? Math.round((count / totalCitations) * 100) : 0;
          domains.push({
            icon: `https://www.google.com/s2/favicons?domain=${model}&sz=32`,
            domain: model,
            used: `${modelUsedPct}%`,
            citations: count.toString(),
            type: 'model',
            label: 'Modèle IA',
            pages: 1,
            lastSeen: new Date().toLocaleDateString('fr-FR'),
            description: `${model} a cité votre contenu ${count} fois.`,
            highlight: false,
            sourceDetails: [],
          });
        }
      });

      return domains.sort((a: any, b: any) => parseFloat(b.citations) - parseFloat(a.citations));
    }

    return [];
  };

  const domains = getDomainsFromAPI();

  if (domains.length === 0) {
    return (
      <Card className="rounded-2xl border-border/80 bg-card shadow-xs overflow-hidden">
        <CardHeader className="p-5 border-b border-border bg-muted/20 space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base sm:text-lg font-bold text-foreground">Domaines les plus cités</CardTitle>
            <InfoTooltip {...HELP.domainesLesPlusCites} />
          </div>
          <CardDescription className="text-xs text-muted-foreground">Sources citées</CardDescription>
        </CardHeader>
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          Aucune source citée détectée pour ce rapport.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-border/80 bg-card shadow-xs overflow-hidden">
      <CardHeader className="p-5 border-b border-border bg-muted/20 space-y-1">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base sm:text-lg font-bold text-foreground">Domaines les plus cités</CardTitle>
          <InfoTooltip {...HELP.domainesLesPlusCites} />
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Sources référencées dans les réponses des modèles d'IA
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        {hasApiData && totalCitationsFromAPI === 0 ? (
          <div className="p-6">
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive max-w-2xl mx-auto">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle className="font-semibold text-base">Aucune citation trouvée</AlertTitle>
              <AlertDescription className="text-xs leading-relaxed mt-1">
                Il n'y a pas de citation trouvée car vous n'êtes pas cité dans les moteurs génératifs. Consultez les
                recommandations pour améliorer votre visibilité et augmenter vos chances d'être cité.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="py-3 px-4 md:px-6 text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                      Domaine
                    </TableHead>
                    <TableHead className="py-3 px-4 md:px-6 text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                      Utilisé
                    </TableHead>
                    <TableHead className="py-3 px-4 md:px-6 text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                      Pages
                    </TableHead>
                    <TableHead className="py-3 px-4 md:px-6 text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                      Citations moy.
                    </TableHead>
                    <TableHead className="py-3 px-4 md:px-6 text-xs uppercase text-muted-foreground font-semibold tracking-wider text-right">
                      Type
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {domains.map((domain, index) => (
                    <TableRow
                      key={index}
                      className={cn(
                        'cursor-pointer transition-colors',
                        domain.highlight
                          ? 'bg-primary/5 hover:bg-primary/10 font-medium'
                          : 'hover:bg-muted/50'
                      )}
                      onClick={() => {
                        setSelectedDomain(domain.domain);
                        setDomainModalOpen(true);
                      }}
                    >
                      <TableCell className="py-3.5 px-4 md:px-6">
                        <div className="flex items-center gap-3 text-sm text-foreground">
                          <img
                            src={domain.icon}
                            alt={domain.domain}
                            width={20}
                            height={20}
                            className="rounded-xs shrink-0 bg-background p-0.5 border border-border/50"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="truncate max-w-[150px] sm:max-w-none font-medium">
                              {domain.domain}
                            </span>
                            {selectedDomain === domain.domain && (
                              <ChevronRight className="h-3.5 w-3.5 text-primary" />
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 px-4 md:px-6 text-sm text-foreground font-semibold">
                        {domain.used}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 md:px-6 text-sm text-muted-foreground">
                        {domain.pages}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 md:px-6 text-sm text-foreground font-semibold">
                        {domain.citations}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 md:px-6 text-right">
                        <Badge
                          variant={domain.type === 'you' ? 'default' : 'secondary'}
                          className={cn(
                            'text-[10px] font-semibold uppercase px-2 py-0.5 border-0',
                            domain.type === 'you'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                              : domain.type === 'model'
                              ? 'bg-primary/15 text-primary'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {domain.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Modal Détails Source */}
            <Dialog
              open={domainModalOpen}
              onOpenChange={(open) => {
                setDomainModalOpen(open);
                if (!open) setSelectedDomain(null);
              }}
            >
              <DialogContent className="w-[95vw] max-w-3xl max-h-[85vh] p-0 overflow-hidden rounded-2xl border-border shadow-2xl">
                {selectedDomain && (() => {
                  const dom = domains.find((d) => d.domain === selectedDomain);
                  if (!dom) return null;
                  return (
                    <div className="flex flex-col max-h-[85vh]">
                      <DialogHeader className="px-6 py-4 border-b border-border bg-muted/20">
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                          <Globe className="h-5 w-5 text-primary" />
                          <span>Informations détaillées — {dom.domain}</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                          Source citée dans les réponses des modèles d'IA
                        </DialogDescription>
                      </DialogHeader>

                      <ScrollArea className="flex-1 p-6">
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground leading-relaxed">{dom.description}</p>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3 rounded-xl border border-border bg-card">
                              <div className="text-xs text-muted-foreground">Pages citées</div>
                              <div className="text-lg font-bold text-foreground mt-0.5">{dom.pages}</div>
                            </div>
                            <div className="p-3 rounded-xl border border-border bg-card">
                              <div className="text-xs text-muted-foreground">Citations moy.</div>
                              <div className="text-lg font-bold text-foreground mt-0.5">{dom.citations}</div>
                            </div>
                            <div className="p-3 rounded-xl border border-border bg-card">
                              <div className="text-xs text-muted-foreground">Utilisé</div>
                              <div className="text-lg font-bold text-foreground mt-0.5">{dom.used}</div>
                            </div>
                            <div className="p-3 rounded-xl border border-border bg-card">
                              <div className="text-xs text-muted-foreground">Dernière vue</div>
                              <div className="text-sm font-semibold text-foreground mt-1">{dom.lastSeen}</div>
                            </div>
                          </div>

                          {dom.models && dom.models.length > 0 && (
                            <div className="pt-2">
                              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Cité par les modèles
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {dom.models.map((model: string, idx: number) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/20 text-xs text-foreground font-medium"
                                  >
                                    {getModelLogo(model) && (
                                      <img
                                        src={getModelLogo(model)!}
                                        alt={model}
                                        className="w-3.5 h-3.5 object-contain rounded-xs"
                                      />
                                    )}
                                    <span>{model}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {dom.sourceDetails && dom.sourceDetails.length > 0 && (
                            <div className="pt-2">
                              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                URLs sources identifiées
                              </div>
                              <div className="space-y-2">
                                {dom.sourceDetails.map((src: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between gap-3 text-xs"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="font-semibold text-foreground truncate mb-0.5">
                                        {src.title}
                                      </div>
                                      <div className="text-muted-foreground truncate">{src.url}</div>
                                    </div>
                                    <Button variant="ghost" size="icon" asChild className="h-8 w-8 shrink-0">
                                      <a href={src.url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-3.5 w-3.5" />
                                      </a>
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </ScrollArea>

                      <div className="p-3 border-t border-border bg-muted/20 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDomainModalOpen(false)}
                          className="text-xs"
                        >
                          Fermer
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </DialogContent>
            </Dialog>
          </>
        )}
      </CardContent>
    </Card>
  );
}
