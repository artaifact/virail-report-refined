import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  TrendingUp, 
  TrendingDown, 
  Lightbulb, 
  CheckCircle,
  ExternalLink,
  Star,
  Zap,
  Brain,
  Users,
  Award,
  Eye,
  Target,
  AlertTriangle
} from "lucide-react";

import { MiniLLMResult } from '@/services/competitorAnalysisService';

interface MiniLLMAnalysisProps {
  data: MiniLLMResult[];
  isLoading?: boolean;
}


const MiniLLMAnalysis = ({ data, isLoading = false }: MiniLLMAnalysisProps) => {
  // Fonction pour nettoyer le texte qui peut contenir du JSON brut
  const cleanText = (text: string | null | undefined): string => {
    if (!text || typeof text !== 'string') return '';
    
    let cleaned = text.trim();
    
    // Retirer les marqueurs de code markdown
    cleaned = cleaned.replace(/^```json\s*/i, '');
    cleaned = cleaned.replace(/^```\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/i, '');
    
    // Si ça ressemble à du JSON, essayer de le parser
    if (cleaned.trim().startsWith('{') || cleaned.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(cleaned);
        // Si c'est un objet avec des champs textuels, extraire le texte
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          // Chercher un champ texte en priorité
          if (parsed.analyse_resume && typeof parsed.analyse_resume === 'string' && parsed.analyse_resume.trim() && parsed.analyse_resume.trim() !== ' ') {
            return parsed.analyse_resume.trim();
          }
          if (parsed.positionnement && typeof parsed.positionnement === 'string' && parsed.positionnement.trim() && parsed.positionnement.trim() !== ' ') {
            return parsed.positionnement.trim();
          }
          if (parsed.description && typeof parsed.description === 'string' && parsed.description.trim()) {
            return parsed.description.trim();
          }
          
          // Créer un texte descriptif lisible à partir des champs structurés
          const parts: string[] = [];
          
          // Si c'est un objet de positionnement avec forces et faiblesses
          if (Array.isArray(parsed.forces_principales) || Array.isArray(parsed.faiblesses_principales)) {
            if (Array.isArray(parsed.forces_principales) && parsed.forces_principales.length > 0) {
              parts.push(`Points forts : ${parsed.forces_principales.join(', ')}`);
            }
            if (Array.isArray(parsed.faiblesses_principales) && parsed.faiblesses_principales.length > 0) {
              parts.push(`Points à améliorer : ${parsed.faiblesses_principales.join(', ')}`);
            }
            
            // Ajouter les différenciateurs et opportunités si disponibles
            if (Array.isArray(parsed.differenciateurs) && parsed.differenciateurs.length > 0) {
              parts.push(`Différenciateurs : ${parsed.differenciateurs.join(', ')}`);
            }
            if (Array.isArray(parsed.opportunites_differenciation) && parsed.opportunites_differenciation.length > 0) {
              parts.push(`Opportunités : ${parsed.opportunites_differenciation.join(', ')}`);
            }
            
            if (parts.length > 0) {
              return parts.join('. ');
            }
          }
        }
      } catch (e) {
        // Si le parsing échoue, chercher du JSON partiel dans le texte
        // Essayer d'extraire le JSON entre accolades
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
              if (parsed.analyse_resume && typeof parsed.analyse_resume === 'string') {
                return parsed.analyse_resume.trim();
              }
              if (parsed.positionnement && typeof parsed.positionnement === 'string') {
                return parsed.positionnement.trim();
              }
            }
          } catch (e2) {
            // Ignorer l'erreur de parsing
          }
        }
      }
    }
    
    // Nettoyer les retours à la ligne multiples
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    return cleaned.trim();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/5"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="border-none">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Brain className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            Aucune analyse LLM disponible
          </h3>
          <p className="text-sm text-muted-foreground text-center">
            Les analyses LLM détaillées seront affichées ici une fois disponibles.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques globales */}
      <div className="grid gap-2 md:grid-cols-3">
        <Card>
          <CardContent className="p-2">
            <div>
              <p className="text-xs text-muted-foreground">Concurrents analysés</p>
              <p className="text-lg font-bold text-foreground">{data.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2">
            <div>
              <p className="text-xs text-muted-foreground">Score moyen menace</p>
              <p className="text-lg font-bold text-foreground">
                {(data.reduce((acc, item) => acc + item.llm_analysis.score_menace, 0) / data.length).toFixed(1)}/10
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2">
            <div>
              <p className="text-xs text-muted-foreground">Menaces élevées</p>
              <p className="text-lg font-bold text-foreground">
                {data.filter(item => item.llm_analysis.score_menace >= 8).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cartes d'analyse par concurrent */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.map((item, index) => {
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold text-foreground line-clamp-2">
                      {item.competitor_name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate">
                        {item.competitor_url}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs font-medium">
                    Menace {item.llm_analysis.score_menace}/10
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Barre de progression de la menace */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Niveau de menace</span>
                    <span className="font-medium">{item.llm_analysis.score_menace}/10</span>
                  </div>
                  <Progress 
                    value={item.llm_analysis.score_menace * 10} 
                    className="h-2"
                  />
                </div>

                {/* Positionnement */}
                {item.llm_analysis.positionnement && cleanText(item.llm_analysis.positionnement) && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Eye className="h-4 w-4 text-gray-600" />
                      Positionnement
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {cleanText(item.llm_analysis.positionnement)}
                    </p>
                  </div>
                )}

                {/* Accordéon pour les détails */}
                <Accordion type="single" collapsible className="w-full">
                  {item.llm_analysis.forces_principales && item.llm_analysis.forces_principales.length > 0 && (
                    <AccordionItem value="strengths" className="border-none">
                      <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-gray-600" />
                          Forces principales ({item.llm_analysis.forces_principales.length})
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        <ul className="space-y-1">
                          {item.llm_analysis.forces_principales.map((strength, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {item.llm_analysis.faiblesses_principales && item.llm_analysis.faiblesses_principales.length > 0 && (
                    <AccordionItem value="weaknesses" className="border-none">
                      <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-2">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-red-500" />
                          Faiblesses ({item.llm_analysis.faiblesses_principales.length})
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        <ul className="space-y-1">
                          {item.llm_analysis.faiblesses_principales.map((weakness, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                              {weakness}
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {item.llm_analysis.differenciateurs && item.llm_analysis.differenciateurs.length > 0 && (
                    <AccordionItem value="differentiators" className="border-none">
                      <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-2">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          Différenciateurs ({item.llm_analysis.differenciateurs.length})
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        <ul className="space-y-1">
                          {item.llm_analysis.differenciateurs.map((diff, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <Award className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                              {diff}
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {item.llm_analysis.opportunites_differenciation && item.llm_analysis.opportunites_differenciation.length > 0 && (
                    <AccordionItem value="opportunities" className="border-none">
                      <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-2">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-blue-500" />
                          Opportunités ({item.llm_analysis.opportunites_differenciation.length})
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        <ul className="space-y-1">
                          {item.llm_analysis.opportunites_differenciation.map((opp, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <Zap className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                              {opp}
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>

                {/* Résumé de l'analyse */}
                {item.llm_analysis.analyse_resume && cleanText(item.llm_analysis.analyse_resume) && cleanText(item.llm_analysis.analyse_resume).trim() !== " " && (
                  <div className="pt-2 border-t border-border">
                    {/* <h4 className="text-sm font-medium text-foreground mb-2">
                      Résumé IA
                    </h4> */}
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {cleanText(item.llm_analysis.analyse_resume)}
                    </p>
                  </div>
                )}

                {/* Bouton d'action */}
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.open(item.competitor_url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Visiter le site
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MiniLLMAnalysis;
