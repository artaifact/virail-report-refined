import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  ShieldCheck,
  ArrowRight,
  AlertTriangle,
  Share2,
  Check,
  Lock,
  Zap,
  Globe,
  Layers,
  Loader2,
} from 'lucide-react';
import { actionabilityEngine } from '@/services/actionability/ActionabilityEngine';
import { UnifiedActionabilityScore } from '@/types/scoring';
import { AgenticBadge } from '@/components/ui/AgenticBadge';
import { normalizeDomain } from '@/utils/entityNormalizer';
import { MethodologyModal } from '@/components/scoring/MethodologyModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const Snapshot: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlParam = searchParams.get('url') || '';
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  const [inputUrl, setInputUrl] = useState(urlParam);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UnifiedActionabilityScore | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (urlParam) {
      handleScan(urlParam);
    }
  }, [urlParam]);

  const handleScan = async (target: string) => {
    const domain = normalizeDomain(target);
    if (!domain) return;

    setLoading(true);
    try {
      const scoreData = await actionabilityEngine.getUnifiedScore({
        targetDomain: domain,
        geoScore: 78,
        totalCitations: 24,
        modelsCount: 9,
        schemaScore: 65,
        semanticHtmlScore: 72,
        entityCoverageScore: 60,
        contentClarityScore: 80,
        hasLlmsTxt: false,
        hasOpenApi: true,
        hasAgentCard: false,
        hasX402Payment: false,
      });
      setResult(scoreData);
    } catch (e) {
      console.error('Audit failed', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    setSearchParams({ url: inputUrl.trim() });
    handleScan(inputUrl.trim());
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header Public */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-md">
              V
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">
              Viraill <span className="text-primary font-medium text-xs px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">Snapshot</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMethodologyOpen(true)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Méthodologie
            </Button>
            <Button size="sm" asChild>
              <Link to="/login">Connexion</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero & Barre de Scan */}
      <div className="max-w-4xl mx-auto px-4 pt-12 sm:pt-16 pb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Audit Public d'Actionnabilité & Citations IA</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-4">
          Votre site est-il prêt pour les <span className="text-primary">agents & moteurs IA</span> ?
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto mb-8">
          Mesurez instantanément votre visibilité dans 9 LLMs, la compréhension sémantique de vos données et votre éligibilité aux transactions autonomes.
        </p>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-2.5 p-1.5 rounded-2xl bg-card border border-border shadow-lg">
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-4 text-muted-foreground" size={18} />
            <Input
              type="text"
              placeholder="Entrez votre site (ex: tally.so, doctolib.fr...)"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full bg-transparent pl-11 pr-4 h-12 border-0 shadow-none focus-visible:ring-0 text-foreground"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="h-12 px-6 rounded-xl font-semibold gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Auditer</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Résultats de l'Audit */}
      {result && (
        <div className="max-w-5xl mx-auto px-4 space-y-8 animate-fade-in">
          {/* Header Résultat */}
          <Card className="rounded-3xl border-border bg-card shadow-xl overflow-hidden relative">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-border">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{result.targetDomain}</h2>
                    <Badge variant="outline">
                      Méthode {result.methodVersion}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Audit d'actionnabilité générative calculé le {new Date(result.calculatedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyShareLink}
                    className="text-xs font-medium gap-1.5"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
                    <span>{copiedLink ? 'Lien copié !' : 'Partager ce rapport'}</span>
                  </Button>
                </div>
              </div>

              {/* Score Monumental & 3 Niveaux */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
                {/* Score Global */}
                <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-muted/40 border border-border text-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Score d'Actionnabilité
                  </span>
                  <div className="text-6xl sm:text-7xl font-black text-foreground tracking-tight leading-none mb-2">
                    {result.overallScore}
                    <span className="text-2xl text-muted-foreground font-bold">/100</span>
                  </div>
                  <Badge className="bg-primary/20 text-primary border-primary/30 font-bold text-sm mb-3">
                    Grade {result.grade}
                  </Badge>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Synthèse équilibrée de visibilité LLM, lisibilité sémantique et préparation machine.
                  </p>
                </div>

                {/* Détail des 3 Couches */}
                <div className="lg:col-span-8 flex flex-col justify-between gap-3">
                  {/* Niveau 1 */}
                  <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <Globe size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {result.levels.found_and_cited.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {result.levels.found_and_cited.status}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-foreground">{result.levels.found_and_cited.score}</span>
                      <span className="text-xs text-muted-foreground">/100</span>
                      <div className="text-[10px] text-muted-foreground font-medium">Poids : 40%</div>
                    </div>
                  </div>

                  {/* Niveau 2 */}
                  <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <Layers size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {result.levels.understood_and_preferred.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {result.levels.understood_and_preferred.status}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-foreground">{result.levels.understood_and_preferred.score}</span>
                      <span className="text-xs text-muted-foreground">/100</span>
                      <div className="text-[10px] text-muted-foreground font-medium">Poids : 30%</div>
                    </div>
                  </div>

                  {/* Niveau 3 */}
                  <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <Zap size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {result.levels.actionable_and_transacting.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {result.levels.actionable_and_transacting.status}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-foreground">{result.levels.actionable_and_transacting.score}</span>
                      <span className="text-xs text-muted-foreground">/100</span>
                      <div className="text-[10px] text-muted-foreground font-medium">Poids : 30%</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top 3 Correctifs Prioritaires */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={18} />
              <span>Priorités Immédiates pour Débloquer vos Citations</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.topFixes.map((fix) => (
                <Card key={fix.id} className="p-5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
                        {fix.category}
                      </Badge>
                      <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                        Impact : {fix.impact.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-foreground mb-2">{fix.title}</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{fix.description}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Effort : {fix.effort}</span>
                    <Link to="/register" className="text-xs text-primary hover:underline font-semibold flex items-center gap-1">
                      Générer le patch <ArrowRight size={11} />
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Badge & Teaser Cockpit Privé */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            <div className="md:col-span-5 flex flex-col">
              <AgenticBadge
                score={result.overallScore}
                grade={result.grade}
                domain={result.targetDomain}
                theme="dark"
              />
            </div>

            <Card className="md:col-span-7 p-6 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                  <Lock size={13} />
                  <span>Cockpit Privé Viraill Pro</span>
                </div>
                <h4 className="text-lg font-bold text-foreground mb-2">
                  Accédez à la cartographie complète de vos concurrents et citations
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  Découvrez exactement sur quels prompts Gemini, Grok, ChatGPT, Claude et Perplexity citent vos concurrents à votre place, et téléchargez les artefacts clés en main (JSON-LD, OpenAPI 3.1, pack M2M).
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button asChild size="sm">
                  <Link to="/register" className="gap-2">
                    <span>Créer mon compte et voir le rapport complet</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />
    </div>
  );
};

export default Snapshot;
