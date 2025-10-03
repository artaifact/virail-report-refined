import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Trophy, 
  Target,
  ExternalLink,
  Calendar,
  Users,
  Brain,
  Crown,
  Medal,
  Star
} from "lucide-react";

interface CompetitiveAnalysisDisplayProps {
  analysisData?: any;
  isLoading?: boolean;
}

const CompetitiveAnalysisDisplay: React.FC<CompetitiveAnalysisDisplayProps> = ({ 
  analysisData, 
  isLoading 
}) => {
  // Normaliser si on reçoit un tableau de concurrents directement
  const normalizedData = Array.isArray(analysisData) ? { competitors: analysisData } : analysisData;
  console.log('🔍 CompetitiveAnalysisDisplay - Données reçues (normalisées si besoin):', normalizedData);
  // Si on charge
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Chargement de l'analyse...</p>
        </div>
      </div>
    );
  }

  // Si pas de données
  if (!normalizedData) {
    return (
      <Card className="bg-neutral-50">
        <CardHeader>
          <CardTitle>Aucune analyse disponible</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-600">Sélectionnez une analyse pour voir les résultats.</p>
        </CardContent>
      </Card>
    );
  }

  // Détecter le format des données
  const isApiFormat = normalizedData.analysis_id && normalizedData.competitors && normalizedData.stats;
  const isLegacyFormat = normalizedData.userSite && normalizedData.competitors;
  
  console.log('🔍 Format des données détecté:', {
    isApiFormat,
    isLegacyFormat,
    hasAnalysisId: !!normalizedData.analysis_id,
    hasUserSite: !!normalizedData.userSite,
    hasCompetitors: !!normalizedData.competitors,
    competitorsLength: normalizedData.competitors?.length
  });

  if (!isApiFormat && !isLegacyFormat) {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle>Format de données non reconnu</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-800">Les données d'analyse ne sont pas dans un format reconnu.</p>
          <pre className="mt-2 text-xs bg-yellow-100 p-2 rounded overflow-auto max-h-32">
            {JSON.stringify(analysisData, null, 2)}
          </pre>
        </CardContent>
      </Card>
    );
  }

  // Adapter les données selon le format
  let competitors, title, description, url, createdAt, modelsUsed, totalMentions;
  let miniLLMResults: any[] = [];
  let benchmarkError: string | undefined;
  
  if (isApiFormat) {
    // Format API direct
    competitors = normalizedData.competitors || [];
    title = normalizedData.title || 'Analyse Concurrentielle';
    description = normalizedData.description || '';
    url = normalizedData.url || '';
    createdAt = normalizedData.created_at || new Date().toISOString();
    modelsUsed = normalizedData.stats?.models_used || [];
    totalMentions = normalizedData.stats?.total_mentions || 0;
    const rawMini = normalizedData.mini_llm_results || normalizedData.miniLLMResults;
    miniLLMResults = Array.isArray(rawMini) ? rawMini : (rawMini ? Object.values(rawMini) : []);
    benchmarkError = normalizedData.benchmark_results?.error;
    
    console.log('🎯 Données API extraites:', {
      title,
      description: `"${description}"`,
      descriptionLength: description?.length,
      url,
      modelsUsed: modelsUsed.length,
      competitorsCount: competitors.length
    });
  } else {
    // Format legacy (CompetitiveAnalysisResult)
    competitors = normalizedData.competitors || [];
    title = normalizedData.userSite?.domain || 'Analyse Concurrentielle';
    description = normalizedData.userSite?.url ? `Analyse de ${normalizedData.userSite?.url}` : '';
    url = normalizedData.userSite?.url || '';
    createdAt = normalizedData.timestamp || new Date().toISOString();
    // Lire les champs enrichis si présents, sinon valeurs par défaut
    modelsUsed = normalizedData.stats?.models_used || ['GPT-4', 'Claude', 'Gemini'];
    totalMentions = (normalizedData.stats?.total_mentions ?? competitors.length);
    const rawMiniLegacy = normalizedData.mini_llm_results || normalizedData.miniLLMResults;
    miniLLMResults = Array.isArray(rawMiniLegacy) ? rawMiniLegacy : (rawMiniLegacy ? Object.values(rawMiniLegacy) : []);
    benchmarkError = normalizedData.benchmark_results?.error || normalizedData.benchmarkError;
  }

  // Calculs simples
  const sortedCompetitors = [...competitors].sort((a, b) => {
    const scoreA = a.average_score || a.report?.total_score / 100 || 0;
    const scoreB = b.average_score || b.report?.total_score / 100 || 0;
    return scoreB - scoreA;
  });
  
  const avgScore = competitors.length > 0 ? 
    competitors.reduce((sum, c) => sum + (c.average_score || c.report?.total_score / 100 || 0), 0) / competitors.length : 0;
  const userScore = Math.max(50, Math.min(85, Math.round(avgScore * 100) - 10));
  const userRank = sortedCompetitors.filter(c => (c.average_score || c.report?.total_score / 100 || 0) * 100 > userScore).length + 1;
  const totalAnalyzed = competitors.length + 1;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-4 w-4 text-yellow-500" />;
    if (rank <= 3) return <Medal className="h-4 w-4 text-orange-500" />;
    return <Trophy className="h-4 w-4 text-blue-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Benchmark error */}
      {benchmarkError && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <Star className="h-5 w-5 text-red-500" /> Problème de benchmark
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 text-sm">{benchmarkError}</p>
          </CardContent>
        </Card>
      )}
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{title}</h1>
              <p className="text-primary-100 mb-4 leading-relaxed">{description}</p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Analysé {new Date(createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{competitors.length} concurrents</span>
                </div>
                <div className="flex items-center gap-1">
                  <Brain className="h-4 w-4" />
                  <span>{modelsUsed.length} modèles IA</span>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center min-w-[150px]">
              <div className="text-3xl font-bold">{userScore}</div>
              <div className="text-primary-100 text-sm mb-2">Score estimé</div>
              <div className="flex items-center justify-center gap-1">
                {getRankIcon(userRank)}
                <span className="text-sm">Rang {userRank}/{totalAnalyzed}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{sortedCompetitors.filter(c => c.average_score >= 0.85).length}</div>
            <div className="text-sm text-neutral-600">Leaders (≥85)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary-600">{sortedCompetitors.filter(c => c.average_score >= 0.75 && c.average_score < 0.85).length}</div>
            <div className="text-sm text-neutral-600">Challengers (75-84)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{sortedCompetitors.filter(c => c.average_score < 0.75).length}</div>
            <div className="text-sm text-neutral-600">Suiveurs (&lt;75)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{totalMentions}</div>
            <div className="text-sm text-neutral-600">Mentions totales</div>
          </CardContent>
        </Card>
      </div>

      {/* Position utilisateur */}
      <Card className="border-2 border-primary-300 bg-primary-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary-800">
            <Target className="h-5 w-5" />
            Votre Position
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">
                {userRank}
              </div>
              <div>
                <h3 className="font-bold text-lg text-primary-900">{title.split(' - ')[0] || 'Votre site'}</h3>
                <p className="text-primary-700">{url}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary-900">{userScore}/100</div>
              <Badge className="bg-primary-100 text-primary-800">Score estimé</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classement des concurrents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Classement des Concurrents ({competitors.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedCompetitors.map((competitor, index) => {
              const score = Math.round((competitor.average_score || competitor.report?.total_score / 100 || 0) * 100);
              const rank = score > userScore ? index + 1 : index + 2;
              const competitorUrl = competitor.url || competitor.domain || '';
              const mentions = competitor.mentions || 1;
              const sources = competitor.sources || competitor.report?.sources || ['IA'];
              
              return (
                <div key={competitor.name || competitor.domain} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      rank === 1 ? 'bg-yellow-500' :
                      rank <= 3 ? 'bg-gray-500' :
                      rank <= 5 ? 'bg-orange-500' :
                      'bg-gray-400'
                    }`}>
                      {rank}
                    </div>
                    <div>
                      <h4 className="font-medium">{competitor.name || competitor.domain}</h4>
                      <div className="flex items-center gap-1 text-sm text-neutral-600">
                        <ExternalLink className="h-3 w-3" />
                        <span>{competitorUrl.replace('https://', '').replace('www.', '')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{score}/100</div>
                    <div className="flex items-center gap-1 text-xs text-neutral-500">
                      <span>{mentions} mention{mentions > 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span>{sources.length} source{sources.length > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sources IA */}
      {modelsUsed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Sources d'Analyse IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {modelsUsed.map((model: string) => {
                const count = competitors.reduce((acc, comp) => {
                  const sources = comp.sources || comp.report?.sources || [];
                  return acc + (sources.includes(model) ? 1 : 0);
                }, 0);
                return (
                  <div key={model} className="text-center p-3 bg-neutral-50 rounded-lg">
                    <div className="font-medium text-sm">{model}</div>
                    <div className="text-2xl font-bold text-primary-700">{count}</div>
                    <div className="text-xs text-neutral-500">mentions</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analyses IA par concurrent (llm_analysis inline) */}
      {Array.isArray(competitors) && competitors.some((c: any) => !!c.llm_analysis) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" /> Analyses IA détaillées ({competitors.filter((c: any) => !!c.llm_analysis).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {competitors.filter((c: any) => !!c.llm_analysis).map((c: any) => {
                const compUrl = (c.url || c.domain || '').toString();
                const analysis = c.llm_analysis || {};
                return (
                  <div key={c.name || c.domain} className="p-4 bg-neutral-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-semibold">{c.name || c.domain}</div>
                        <div className="text-xs text-neutral-600">{compUrl.replace('https://', '').replace('www.', '')}</div>
                      </div>
                      {typeof analysis?.score_menace === 'number' && (
                        <div className="text-right">
                          <div className="text-sm text-neutral-600">Menace</div>
                          <div className="text-lg font-bold text-primary-700">{analysis.score_menace}/10</div>
                        </div>
                      )}
                    </div>
                    {analysis?.analyse_resume && (
                      <p className="text-sm text-neutral-700 mb-3">{analysis.analyse_resume}</p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Array.isArray(analysis?.forces_principales) && analysis.forces_principales.length > 0 && (
                        <div className="bg-white rounded-md p-3">
                          <div className="font-medium mb-2">Forces principales</div>
                          <ul className="list-disc ml-5 text-sm text-neutral-700 space-y-1">
                            {analysis.forces_principales.slice(0, 5).map((s: string, idx: number) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {Array.isArray(analysis?.faiblesses_principales) && analysis.faiblesses_principales.length > 0 && (
                        <div className="bg-white rounded-md p-3">
                          <div className="font-medium mb-2">Faiblesses principales</div>
                          <ul className="list-disc ml-5 text-sm text-neutral-700 space-y-1">
                            {analysis.faiblesses_principales.slice(0, 5).map((s: string, idx: number) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {Array.isArray(analysis?.differenciateurs) && analysis.differenciateurs.length > 0 && (
                        <div className="bg-white rounded-md p-3">
                          <div className="font-medium mb-2">Différenciateurs</div>
                          <ul className="list-disc ml-5 text-sm text-neutral-700 space-y-1">
                            {analysis.differenciateurs.slice(0, 5).map((s: string, idx: number) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {Array.isArray(analysis?.opportunites_differenciation) && analysis.opportunites_differenciation.length > 0 && (
                        <div className="bg-white rounded-md p-3 md:col-span-2">
                          <div className="font-medium mb-2">Opportunités de différenciation</div>
                          <ul className="list-disc ml-5 text-sm text-gray-700 space-y-1">
                            {analysis.opportunites_differenciation.slice(0, 6).map((s: string, idx: number) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mini LLM Results */}
      {miniLLMResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" /> Analyses IA détaillées ({miniLLMResults.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {miniLLMResults.map((r: any) => (
                <div key={(r.competitor_url || r.competitor_name)} className="p-4 bg-neutral-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-semibold">{r.competitor_name}</div>
                      <div className="text-xs text-neutral-600">{(r.competitor_url || '').replace('https://', '').replace('www.', '')}</div>
                    </div>
                    {typeof r.llm_analysis?.score_menace === 'number' && (
                      <div className="text-right">
                        <div className="text-sm text-neutral-600">Menace</div>
                        <div className="text-lg font-bold text-primary-700">{r.llm_analysis.score_menace}/10</div>
                      </div>
                    )}
                  </div>
                  {r.llm_analysis?.analyse_resume && (
                    <p className="text-sm text-neutral-700 mb-3">{r.llm_analysis.analyse_resume}</p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Array.isArray(r.llm_analysis?.forces_principales) && r.llm_analysis.forces_principales.length > 0 && (
                      <div className="bg-white rounded-md p-3">
                        <div className="font-medium mb-2">Forces principales</div>
                        <ul className="list-disc ml-5 text-sm text-neutral-700 space-y-1">
                          {r.llm_analysis.forces_principales.slice(0, 5).map((s: string, idx: number) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(r.llm_analysis?.faiblesses_principales) && r.llm_analysis.faiblesses_principales.length > 0 && (
                      <div className="bg-white rounded-md p-3">
                        <div className="font-medium mb-2">Faiblesses principales</div>
                        <ul className="list-disc ml-5 text-sm text-neutral-700 space-y-1">
                          {r.llm_analysis.faiblesses_principales.slice(0, 5).map((s: string, idx: number) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(r.llm_analysis?.differenciateurs) && r.llm_analysis.differenciateurs.length > 0 && (
                      <div className="bg-white rounded-md p-3">
                        <div className="font-medium mb-2">Différenciateurs</div>
                        <ul className="list-disc ml-5 text-sm text-neutral-700 space-y-1">
                          {r.llm_analysis.differenciateurs.slice(0, 5).map((s: string, idx: number) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(r.llm_analysis?.opportunites_differenciation) && r.llm_analysis.opportunites_differenciation.length > 0 && (
                      <div className="bg-white rounded-md p-3 md:col-span-2">
                        <div className="font-medium mb-2">Opportunités de différenciation</div>
                        <ul className="list-disc ml-5 text-sm text-gray-700 space-y-1">
                          {r.llm_analysis.opportunites_differenciation.slice(0, 6).map((s: string, idx: number) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CompetitiveAnalysisDisplay;