import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Search,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Share2,
  Copy,
  Check,
  Lock,
  Zap,
  Globe,
  Layers,
  FileCode,
} from 'lucide-react';
import { actionabilityEngine } from '@/services/actionability/ActionabilityEngine';
import { UnifiedActionabilityScore } from '@/types/scoring';
import { AgenticBadge } from '@/components/ui/AgenticBadge';
import { normalizeDomain } from '@/utils/entityNormalizer';
import { MethodologyModal } from '@/components/scoring/MethodologyModal';

export const Snapshot: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white pb-20">
      {/* Header Public */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
              V
            </div>
            <span className="font-bold text-lg tracking-tight text-white">
              Viraill <span className="text-blue-400 font-medium text-xs px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">Snapshot</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsMethodologyOpen(true)}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Méthodologie
            </button>
            <Link
              to="/login"
              className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm"
            >
              Connexion
            </Link>
          </div>
        </div>
      </header>

      {/* Hero & Barre de Scan */}
      <div className="max-w-4xl mx-auto px-4 pt-12 sm:pt-16 pb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6 animate-fade-in">
          <ShieldCheck size={13} />
          <span>Audit Public d'Actionnabilité & Citations IA</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          Votre site est-il prêt pour les <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">agents & moteurs IA</span> ?
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mb-8">
          Mesurez instantanément votre visibilité dans 9 LLMs, la compréhension sémantique de vos données et votre éligibilité aux transactions autonomes.
        </p>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-2.5 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-4 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Entrez votre site (ex: tally.so, doctolib.fr...)"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full bg-transparent pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-semibold text-sm text-white shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="inline-block animate-spin">⟳</span>
            ) : (
              <>
                <span>Auditer</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Résultats de l'Audit */}
      {result && (
        <div className="max-w-5xl mx-auto px-4 animate-fade-in">
          {/* Header Résultat */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10 pb-6 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">{result.targetDomain}</h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    Méthode {result.methodVersion}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Audit d'actionnabilité générative calculé le {new Date(result.calculatedAt).toLocaleDateString('fr-FR')}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={copyShareLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
                >
                  {copiedLink ? <Check size={13} className="text-green-400" /> : <Share2 size={13} />}
                  <span>{copiedLink ? 'Lien copié !' : 'Partager ce rapport'}</span>
                </button>
              </div>
            </div>

            {/* Score Monumental & 3 Niveaux */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 relative z-10">
              {/* Score Global */}
              <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Score d'Actionnabilité
                </span>
                <div className="text-6xl sm:text-7xl font-black text-white tracking-tight leading-none mb-2">
                  {result.overallScore}
                  <span className="text-2xl text-slate-500 font-bold">/100</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 font-bold text-sm mb-3">
                  Grade {result.grade}
                </div>
                <p className="text-xs text-slate-400 max-w-xs">
                  Synthèse équilibrée de visibilité LLM, lisibilité sémantique et préparation machine.
                </p>
              </div>

              {/* Détail des 3 Couches */}
              <div className="lg:col-span-8 flex flex-col justify-between gap-3">
                {/* Niveau 1 */}
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Globe size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {result.levels.found_and_cited.title}
                      </div>
                      <div className="text-xs text-slate-400">
                        {result.levels.found_and_cited.status}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-white">{result.levels.found_and_cited.score}</span>
                    <span className="text-xs text-slate-500">/100</span>
                    <div className="text-[10px] text-slate-500 font-medium">Poids : 40%</div>
                  </div>
                </div>

                {/* Niveau 2 */}
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Layers size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {result.levels.understood_and_preferred.title}
                      </div>
                      <div className="text-xs text-slate-400">
                        {result.levels.understood_and_preferred.status}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-white">{result.levels.understood_and_preferred.score}</span>
                    <span className="text-xs text-slate-500">/100</span>
                    <div className="text-[10px] text-slate-500 font-medium">Poids : 30%</div>
                  </div>
                </div>

                {/* Niveau 3 */}
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Zap size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {result.levels.actionable_and_transacting.title}
                      </div>
                      <div className="text-xs text-slate-400">
                        {result.levels.actionable_and_transacting.status}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-white">{result.levels.actionable_and_transacting.score}</span>
                    <span className="text-xs text-slate-500">/100</span>
                    <div className="text-[10px] text-slate-500 font-medium">Poids : 30%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top 3 Correctifs Prioritaires */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="text-amber-400" size={18} />
              <span>Priorités Immédiates pour Débloquer vos Citations</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.topFixes.map((fix) => (
                <div key={fix.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {fix.category}
                      </span>
                      <span className="text-[10px] font-semibold text-amber-400">
                        Impact : {fix.impact.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white mb-2">{fix.title}</div>
                    <p className="text-xs text-slate-400 leading-relaxed">{fix.description}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Effort : {fix.effort}</span>
                    <Link to="/register" className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1">
                      Générer le patch <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>
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

            <div className="md:col-span-7 p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-900/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <Lock size={13} />
                  <span>Cockpit Privé Viraill Pro</span>
                </div>
                <h4 className="text-lg font-bold text-white mb-2">
                  Accédez à la cartographie complète de vos concurrents et citations
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Découvrez exactement sur quels prompts Gemini, Grok, ChatGPT, Claude et Perplexity citent vos concurrents à votre place, et téléchargez les artefacts clés en main (JSON-LD, OpenAPI 3.1, pack M2M).
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white transition-all shadow-md flex items-center gap-2"
                >
                  <span>Créer mon compte et voir le rapport complet</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
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
