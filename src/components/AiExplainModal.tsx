import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Brain,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Lightbulb,
  ShieldCheck,
  Zap,
  Layers,
  HelpCircle,
} from "lucide-react";
import { modelLogos } from "@/components/ModelLogosCarousel";

interface AiExplainModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainName?: string | null;
  geoScore?: number | null;
  totalCitations?: number;
  citationsByModel?: Record<string, number>;
  onGoToAmeliorer?: () => void;
}

const getCommercialModelName = (raw: string): string => {
  const n = raw.toLowerCase().trim();
  if (n.includes('sonar')) return 'Perplexity';
  if (n.includes('claude')) return 'Claude';
  if (n.startsWith('gpt') || n === 'chatgpt') return 'ChatGPT';
  if (n.includes('gemini') || n === 'ai overview' || n === 'ai-overview') return 'Gemini';
  if (n.includes('mistral') || n.includes('mixtral')) return 'Mistral';
  if (n.includes('deepseek')) return 'DeepSeek';
  if (n.includes('llama')) return 'Meta AI';
  if (n.includes('qwen')) return 'Qwen';
  if (n.includes('grok')) return 'Grok';
  return raw;
};

const getModelLogoSrc = (modelName: string): string | null => {
  if (!modelName) return null;
  const name = modelName.toLowerCase();
  for (const [key, path] of Object.entries(modelLogos)) {
    if (name.includes(key)) return path;
  }
  return null;
};

export function AiExplainModal({
  open,
  onOpenChange,
  domainName = 'votre domaine',
  geoScore,
  totalCitations = 0,
  citationsByModel = {},
  onGoToAmeliorer,
}: AiExplainModalProps) {
  const score = geoScore !== null && geoScore !== undefined ? geoScore : null;

  // Modèles qui citent le domaine
  const citedModels = Object.entries(citationsByModel)
    .filter(([_, count]) => count > 0)
    .map(([raw, count]) => ({
      name: getCommercialModelName(raw),
      count,
      logo: getModelLogoSrc(raw),
    }))
    .sort((a, b) => b.count - a.count);

  // Évaluation de la santé globale
  const scoreLevel = score !== null ? (
    score >= 75 ? 'excellent' : score >= 50 ? 'moderate' : 'low'
  ) : 'unknown';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl bg-white border border-slate-200 shadow-2xl">
        {/* En-tête avec gradient discret */}
        <div className="bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 p-6 border-b border-slate-200/80">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100/70 text-indigo-700 border border-indigo-200/60">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Synthèse Exécutive IA
              </span>
              <span className="text-xs text-slate-400 font-medium">· Audit GEO & Moteurs LLM</span>
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              Comprendre votre visibilité IA — <span className="text-indigo-600">{domainName}</span>
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              Explication en langage clair de votre positionnement génératif (GEO), de votre score et des raisons pour lesquelles les LLMs vous citent ou vous ignorent.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Corps modal */}
        <div className="p-6 space-y-6">
          {/* Bandeau d'évaluation rapide (Score + Citations) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Score Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1">
                <span>Score GEO Global</span>
                <Brain className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="flex items-baseline gap-2 my-1">
                <span className="text-3xl font-extrabold text-slate-900">
                  {score !== null ? score : '--'}
                </span>
                <span className="text-xs text-slate-400 font-medium">/ 100</span>
              </div>
              <div className="text-xs">
                {scoreLevel === 'excellent' && (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Forte autorité perçue
                  </span>
                )}
                {scoreLevel === 'moderate' && (
                  <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" /> Base solide à amplifier
                  </span>
                )}
                {scoreLevel === 'low' && (
                  <span className="inline-flex items-center gap-1 text-orange-700 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" /> Fort potentiel de gain
                  </span>
                )}
                {scoreLevel === 'unknown' && (
                  <span className="text-slate-500">Score en cours de calcul</span>
                )}
              </div>
            </div>

            {/* Citations Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1">
                <span>Citations Détectées</span>
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-2 my-1">
                <span className="text-3xl font-extrabold text-slate-900">{totalCitations}</span>
                <span className="text-xs text-slate-400 font-medium">mentions directes</span>
              </div>
              <p className="text-xs text-slate-500 truncate">
                {citedModels.length > 0
                  ? `Présent sur ${citedModels.length} moteur(s) génératif(s)`
                  : 'Aucune citation active détectée'}
              </p>
            </div>

            {/* Modèles Actifs */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1">
                <span>Moteurs Référents</span>
                <Layers className="w-4 h-4 text-sky-500" />
              </div>
              <div className="flex items-center gap-2 my-2 flex-wrap min-h-[32px]">
                {citedModels.length > 0 ? (
                  citedModels.slice(0, 4).map((m, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-700 shadow-2xs"
                      title={`${m.count} citations sur ${m.name}`}
                    >
                      {m.logo && <img src={m.logo} alt={m.name} className="w-3.5 h-3.5 object-contain" />}
                      <span>{m.name}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">En attente de citations</span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {citedModels.length > 0 ? 'Modèles générant du trafic' : 'Visibilité à construire'}
              </p>
            </div>
          </div>

          {/* 1. Comment les LLMs comprennent votre domaine */}
          <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-semibold text-sm">
                1
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Comment les LLMs perçoivent votre contenu
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-9">
              {scoreLevel === 'excellent' ? (
                <>
                  Les moteurs de recherche génératifs (ChatGPT, Perplexity, Gemini, Claude) identifient <strong className="text-slate-900">{domainName}</strong> comme une autorité fiable dans sa thématique. Vos pages fournissent des réponses directes, factuelles et facilement citables dans leurs réponses de synthèse.
                </>
              ) : scoreLevel === 'moderate' ? (
                <>
                  Les modèles de langage reconnaissent l'existence et l'offre de <strong className="text-slate-900">{domainName}</strong>, mais vos pages manquent parfois de structure sémantique directe (balises de données structurées, tableaux comparatifs clairs ou réponses directes) pour être systématiquement choisies comme source principale face aux agrégateurs concurrents.
                </>
              ) : (
                <>
                  Pour les IA génératives, <strong className="text-slate-900">{domainName}</strong> souffre d'un manque d'exposition et de signaux de confiance explicites. Le contenu textuel est difficilement exploité par les agents de recherche (Perplexity Bot, ChatGPT Search), ce qui conduit les modèles à citer vos concurrents directs.
                </>
              )}
            </p>
          </div>

          {/* 2. Pourquoi ces citations ? */}
          <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-semibold text-sm">
                2
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Facteurs clés influençant vos citations génératives
              </h3>
            </div>
            <div className="pl-9 space-y-2.5 text-xs sm:text-sm text-slate-600">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-slate-900">Autorité thématique & Entités nommées :</strong> Les LLMs valorisent la cohérence sémantique et la présence d'entités claires (concepts clés, marques, spécifications) plutôt que de simples mots-clés.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-slate-900">Accessibilité aux robots IA :</strong> L'accès technique des robots de crawling (GPTBot, PerplexityBot, ClaudeBot) et la rapidité d'affichage HTML permettent aux moteurs d'extraire la donnée sans friction.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-slate-900">Balisage Schema.org & Réponses directes :</strong> Les résumés de type FAQ, tableaux de prix ou fiches produit structurées offrent aux LLMs un texte prêt à être synthétisé et cité avec un lien source.
                </div>
              </div>
            </div>
          </div>

          {/* 3. Recommandations prioritaires pour surperformer */}
          <div className="p-4 sm:p-5 rounded-xl border border-indigo-100 bg-indigo-50/40 shadow-xs">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-semibold text-sm shadow-xs">
                3
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Que faire dès maintenant pour augmenter vos citations ?
              </h3>
            </div>
            <div className="pl-9 space-y-2 text-xs sm:text-sm text-slate-700">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                <span>
                  <strong>Structurer les pages clés :</strong> Intégrer des blocs "En résumé" ou FAQ avec balises Schema.org pour alimenter directement les moteurs de réponse.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                <span>
                  <strong>Renforcer les sources & preuves :</strong> Mentionner des chiffres vérifiables, des études ou des dates précises pour que les LLMs vous retiennent comme source primaire.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                <span>
                  <strong>Appliquer les optimisations du plan d'action :</strong> Suivre pas-à-pas les correctifs techniques et sémantiques détaillés dans la section <em>Améliorer</em>.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pied de page */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500 text-center sm:text-left">
            Besoin de déployer ces ajustements ? Retrouvez la feuille de route détaillée dans l'onglet Améliorer.
          </p>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-initial text-slate-600 border-slate-200 hover:bg-slate-100"
            >
              Fermer
            </Button>
            {onGoToAmeliorer && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onGoToAmeliorer();
                }}
                className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs inline-flex items-center gap-1.5"
              >
                <span>Voir le plan d'actions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
