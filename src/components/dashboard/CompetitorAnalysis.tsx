import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Zap, Users, Loader2 } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { HELP } from '@/lib/help-content';
import { getModelLogo } from '@/components/dashboard/TopSection';
import { getCommercialModelName } from '@/components/dashboard/GeoScoreChart';
import type { FullReportData } from '@/lib/api';
import {
  listCompetitorAnalyses,
  getCompetitorAnalysisById,
  extractDomain,
  CompetitorAnalysisResponse,
  mapApiResponseToCompetitorAnalysisResponse,
  mapAnalyseConcurrentielleV1ToResponse,
} from '@/services/competitorAnalysisService';
import { deduplicateCompetitors, normalizeBrandName, normalizeDomain } from '@/utils/entityNormalizer';

interface CompetitorAnalysisProps {
  reportData: FullReportData | null;
}

export function CompetitorAnalysis({ reportData }: CompetitorAnalysisProps) {
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [competitorAnalysis, setCompetitorAnalysis] = useState<CompetitorAnalysisResponse | null>(null);
  const [loadingCompetitors, setLoadingCompetitors] = useState(false);

  useEffect(() => {
    const loadCompetitorAnalysis = async () => {
      if (!reportData) return;

      const competitorData =
        reportData.analyse_concurrentielle_v1 ||
        reportData.competitor_analysis ||
        (reportData as any).competitors;

      if (competitorData) {
        let mappedAnalysis: CompetitorAnalysisResponse;

        if (reportData.analyse_concurrentielle_v1) {
          const reportId = reportData.report?.id || (reportData as any).llmo_report?.id || 0;
          mappedAnalysis = mapAnalyseConcurrentielleV1ToResponse(reportId, reportData.analyse_concurrentielle_v1);
        } else {
          mappedAnalysis = mapApiResponseToCompetitorAnalysisResponse(competitorData);
        }

        setCompetitorAnalysis(mappedAnalysis);

        if (!selectedModel) {
          const firstRaw =
            mappedAnalysis.models_analysis?.[0]?.model_info?.display_name ||
            mappedAnalysis.models_analysis?.[0]?.model_info?.model_name ||
            '';
          if (firstRaw) {
            setSelectedModel(getCommercialModelName(firstRaw));
          }
        }
        return;
      }

      const reportUrlValue = reportData.report?.url || (reportData as any)?.llmo_report?.url;
      if (!reportUrlValue) return;

      try {
        setLoadingCompetitors(true);
        const analyses = await listCompetitorAnalyses();

        const reportUrl = reportUrlValue.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/^www\./, '');
        const reportDomain = extractDomain(reportUrlValue).toLowerCase();

        const matchingAnalysis = analyses.find((analysis) => {
          const analysisUrl = (analysis.url || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/^www\./, '');
          const analysisDomain = extractDomain(analysis.url || '').toLowerCase();

          return (
            reportUrl === analysisUrl ||
            analysisUrl.includes(reportUrl) ||
            reportUrl.includes(analysisUrl) ||
            reportDomain === analysisDomain
          );
        });

        if (matchingAnalysis) {
          const fullAnalysis = await getCompetitorAnalysisById(matchingAnalysis.analysis_id);
          setCompetitorAnalysis(fullAnalysis);

          if (!selectedModel && fullAnalysis.models_analysis && fullAnalysis.models_analysis.length > 0) {
            const firstRaw =
              fullAnalysis.models_analysis[0].model_info?.display_name ||
              fullAnalysis.models_analysis[0].model_info?.model_name ||
              '';
            if (firstRaw) {
              setSelectedModel(getCommercialModelName(firstRaw));
            }
          }
        }
      } catch (error) {
      } finally {
        setLoadingCompetitors(false);
      }
    };

    loadCompetitorAnalysis();
  }, [reportData]);

  useEffect(() => {
    const seen = new Set<string>();
    const commercialNames = (
      competitorAnalysis?.models_analysis
        ?.filter((m) => m.competitors && m.competitors.length >= 2)
        .map((m) => getCommercialModelName(m.model_info?.display_name || m.model_info?.model_name || ''))
        .filter(Boolean) || []
    ).filter((name) => {
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    });

    if (commercialNames.length > 0) {
      if (!selectedModel) {
        setSelectedModel(commercialNames[0]);
      } else if (!commercialNames.includes(selectedModel)) {
        setSelectedModel(commercialNames[0]);
      }
    }
  }, [competitorAnalysis]);

  const v3Data = reportData?.analyse_concurrentielle_v3;
  const isV3 = v3Data && v3Data.consolidated_competitors && v3Data.consolidated_competitors.length > 0;

  const v3Models = useMemo(() => {
    if (!isV3) return [];
    const commercialSeen = new Set<string>();
    const models: { raw: string; commercial: string }[] = [];
    v3Data!.consolidated_competitors.forEach((c) => {
      c.source_models?.forEach((m) => {
        const commercial = getCommercialModelName(m);
        if (!commercialSeen.has(commercial)) {
          commercialSeen.add(commercial);
          models.push({ raw: m, commercial });
        }
      });
    });
    return models;
  }, [isV3, v3Data]);

  const competitors = useMemo(() => {
    if (isV3 && v3Data) {
      let filtered = v3Data.consolidated_competitors;
      if (selectedModel && selectedModel !== 'all') {
        filtered = filtered.filter((c) =>
          c.source_models?.some((m) => getCommercialModelName(m) === selectedModel)
        );
      }
      return filtered.slice(0, 5).map((c) => ({
        name: normalizeBrandName(c.name),
        domain: normalizeDomain(c.domain || c.name),
        score: Math.round(c.visibility_score || c.citation_share || 0),
        faviconUrl: c.favicon_url,
      }));
    }

    if (!competitorAnalysis?.models_analysis) return [];

    let modelData = competitorAnalysis.models_analysis.find((m) => {
      const rawName = m.model_info?.display_name || m.model_info?.model_name || '';
      return getCommercialModelName(rawName) === selectedModel;
    });

    if (!modelData && competitorAnalysis.models_analysis.length > 0) {
      modelData = competitorAnalysis.models_analysis[0];
    }

    if (!modelData?.competitors) return [];

    const deduped = deduplicateCompetitors(modelData.competitors);
    return deduped.slice(0, 5).map((c) => ({
      name: normalizeBrandName(c.name),
      domain: normalizeDomain(c.domain || c.name),
      score: Math.round(c.visibility_score || (c.presence_rate ? c.presence_rate * 100 : 0)),
      faviconUrl: c.favicon_url,
    }));
  }, [isV3, v3Data, competitorAnalysis, selectedModel]);

  const selectModels = useMemo(() => {
    if (isV3) {
      return v3Models.map((m) => m.commercial);
    }
    const seen = new Set<string>();
    const raw =
      competitorAnalysis?.models_analysis
        ?.filter((m) => m.competitors && m.competitors.length >= 2)
        .map((m) => m.model_info?.display_name || m.model_info?.model_name || '')
        .filter(Boolean) || [];

    return raw
      .map((m) => getCommercialModelName(m))
      .filter((name) => {
        if (seen.has(name)) return false;
        seen.add(name);
        return true;
      });
  }, [isV3, v3Models, competitorAnalysis]);

  return (
    <Card className="rounded-2xl border-border/80 bg-card shadow-xs p-4 sm:p-5 w-full">
      <CardHeader className="p-0 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 space-y-0">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base sm:text-lg font-bold text-foreground">
            Analyse concurrentielle
          </CardTitle>
          <InfoTooltip {...HELP.analyseConcurrentielle} side="bottom" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-muted-foreground shrink-0">Modèle:</span>
          <Select
            value={selectedModel}
            onValueChange={setSelectedModel}
            disabled={loadingCompetitors || selectModels.length === 0}
          >
            <SelectTrigger className="w-full sm:w-[200px] h-9 bg-background border-border text-xs">
              <SelectValue placeholder="Choisir un modèle" />
            </SelectTrigger>
            <SelectContent>
              {selectModels.map((modelName) => (
                <SelectItem key={modelName} value={modelName} className="text-xs">
                  <div className="flex items-center gap-2">
                    {getModelLogo(modelName) ? (
                      <img src={getModelLogo(modelName)!} alt={modelName} className="w-4 h-4 object-contain rounded-xs" />
                    ) : (
                      <Zap className="h-3.5 w-3.5 text-primary" />
                    )}
                    <span>{modelName}</span>
                  </div>
                </SelectItem>
              ))}
              {selectModels.length === 0 && (
                <SelectItem value="none" disabled>
                  Aucun modèle disponible
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="space-y-2.5">
          {loadingCompetitors ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Chargement des concurrents...</span>
            </div>
          ) : competitors.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Aucune donnée concurrentielle disponible pour ce modèle.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Top {competitors.length} Concurrents
                  {selectedModel && selectedModel !== 'all' ? ` — ${getCommercialModelName(selectedModel)}` : ''}
                </span>
                <Badge variant="secondary" className="text-[11px] font-medium">
                  {competitors.length} détecté{competitors.length > 1 ? 's' : ''}
                </Badge>
              </div>

              {competitors.map((competitor, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/50 transition-colors"
                >
                  <img
                    src={
                      (competitor as any).faviconUrl ||
                      `https://www.google.com/s2/favicons?domain=${competitor.domain}&sz=32`
                    }
                    alt={competitor.domain}
                    width={22}
                    height={22}
                    className="rounded-md shrink-0 bg-background p-0.5 border border-border/50"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">{competitor.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{competitor.domain}</div>
                  </div>
                  {competitor.score > 0 && (
                    <Badge variant="outline" className="text-xs font-semibold border-border">
                      {competitor.score}%
                    </Badge>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
