import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface CompetitorData {
  name: string;
  domain: string;
  traffic: number;
  keywords: number;
  backlinks: number;
  domain_rating: number;
  organic_keywords: number;
  paid_keywords: number;
  top_keywords: string[];
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  // Nouveaux champs pour afficher toutes les données
  url?: string;
  alternative_urls?: string[];
  similarity_score?: number;
  confidence_level?: number;
  model_rank?: number;
  reasoning?: string;
  context_snippet?: string | null;
  mentioned_features?: string[];
  competitive_advantages?: string[];
}

interface DetailedCompetitiveAnalysisProps {
  competitors: CompetitorData[];
  isLoading?: boolean;
}

function DetailedCompetitiveAnalysis({ 
  competitors, 
  isLoading = false 
}: DetailedCompetitiveAnalysisProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  console.log('🔍 DetailedCompetitiveAnalysis - competitors:', competitors);
  console.log('🔍 DetailedCompetitiveAnalysis - competitors length:', competitors?.length);
  console.log('🔍 DetailedCompetitiveAnalysis - isLoading:', isLoading);

  if (!competitors || competitors.length === 0) {
    console.log('⚠️ Aucune donnée de concurrents - competitors:', competitors);
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Aucune donnée de concurrents disponible</p>
          <p className="text-xs text-gray-400 mt-2">
            Debug: competitors = {JSON.stringify(competitors)}
          </p>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (value: number, threshold: number = 0) => {
    if (value > threshold) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value < threshold) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {competitors.map((competitor, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{competitor.name}</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href={`https://${competitor.domain}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Visiter
                  </a>
                </Button>
              </div>
              <p className="text-sm text-gray-600">{competitor.domain}</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Score de similarité et confiance */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    {getTrendIcon(competitor.similarity_score || 0, 0.5)}
                    <span className="text-2xl font-bold">
                      {Math.round((competitor.similarity_score || 0) * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Score de similarité</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    {getTrendIcon(competitor.confidence_level || 0, 0.8)}
                    <span className="text-2xl font-bold">
                      {Math.round((competitor.confidence_level || 0) * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Niveau de confiance</p>
                </div>
              </div>

              {/* Rang du modèle */}
              {competitor.model_rank && (
                <div className="text-center">
                  <Badge variant="outline" className="text-sm">
                    Rang #{competitor.model_rank}
                  </Badge>
                </div>
              )}

              {/* Raisonnement de l'IA */}
              {competitor.reasoning && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Raisonnement IA:</strong> {competitor.reasoning}
                  </p>
                </div>
              )}

              {/* URL complète */}
              {competitor.url && (
                <div className="text-sm">
                  <strong>URL:</strong> 
                  <a 
                    href={competitor.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline ml-1"
                  >
                    {competitor.url}
                  </a>
                </div>
              )}

              {/* URLs alternatives */}
              {competitor.alternative_urls && competitor.alternative_urls.length > 0 && (
                <div className="text-sm">
                  <strong>URLs alternatives:</strong>
                  <ul className="mt-1 space-y-1">
                    {competitor.alternative_urls.map((url, idx) => (
                      <li key={idx}>
                        <a 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Fonctionnalités mentionnées */}
              {competitor.mentioned_features && competitor.mentioned_features.length > 0 && (
                <div className="text-sm">
                  <strong>Fonctionnalités mentionnées:</strong>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {competitor.mentioned_features.map((feature, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Avantages concurrentiels */}
              {competitor.competitive_advantages && competitor.competitive_advantages.length > 0 && (
                <div className="text-sm">
                  <strong>Avantages concurrentiels:</strong>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {competitor.competitive_advantages.map((advantage, idx) => (
                      <Badge key={idx} variant="default" className="text-xs bg-green-100 text-green-800">
                        {advantage}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Snippet de contexte */}
              {competitor.context_snippet && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Contexte:</strong> {competitor.context_snippet}
                  </p>
                </div>
              )}

              {/* Métriques traditionnelles (si disponibles) */}
              {(competitor.traffic > 0 || competitor.domain_rating > 0) && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {getTrendIcon(competitor.traffic, 100000)}
                      <span className="text-2xl font-bold">
                        {formatNumber(competitor.traffic)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Trafic mensuel</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {getTrendIcon(competitor.domain_rating, 50)}
                      <span className="text-2xl font-bold">
                        {competitor.domain_rating}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Domain Rating</p>
                  </div>
                </div>
              )}


              {/* Top mots-clés */}
              {competitor.top_keywords && competitor.top_keywords.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Top mots-clés</h4>
                  <div className="flex flex-wrap gap-1">
                    {competitor.top_keywords.slice(0, 3).map((keyword, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Forces et faiblesses */}
              <div className="space-y-3">
                {competitor.strengths && competitor.strengths.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-green-700 mb-1">Forces</h4>
                    <ul className="text-xs text-green-600 space-y-1">
                      {competitor.strengths.slice(0, 2).map((strength, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-green-500">•</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {competitor.weaknesses && competitor.weaknesses.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-red-700 mb-1">Faiblesses</h4>
                    <ul className="text-xs text-red-600 space-y-1">
                      {competitor.weaknesses.slice(0, 2).map((weakness, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-red-500">•</span>
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default DetailedCompetitiveAnalysis;