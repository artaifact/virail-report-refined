import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Layers, Globe, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';

export const Methodology: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white pb-20">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
              V
            </div>
            <span className="font-bold text-lg tracking-tight text-white">
              Viraill <span className="text-slate-400 font-normal text-sm">| Méthodologie Officielle</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/snapshot" className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Tester mon site
            </Link>
            <Link
              to="/login"
              className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm"
            >
              Connexion
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 pt-12 sm:pt-16 pb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6">
          <ShieldCheck size={14} />
          <span>Standard de Mesure Ouvert & Reproductible (Version 2026.1)</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          Comment Viraill calcule votre <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">Score d'Actionnabilité</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Découvrez la formule mathématique, la pondération des critères et les protocoles d'évaluation qui lient préparation technique, comportement des agents réels et visibilité dans les moteurs génératifs.
        </p>
      </div>

      {/* Contenu de la Méthodologie */}
      <div className="max-w-4xl mx-auto px-4 space-y-12">
        {/* Architecture en 3 Piliers */}
        <section className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <h2 className="text-2xl font-bold text-white">Le Modèle en Trois Couches</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Contrairement aux approches purement théoriques qui se contentent de vérifier la présence d'un fichier, le standard Viraill réconcilie les 3 dimensions indispensables à la conversion dans l'ère de l'intelligence artificielle :
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-blue-400">NIVEAU 1</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-300">40%</span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">Être Trouvé & Cité</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Part de voix, taux de citation et analyse de sentiment dans 9 LLMs majeurs (ChatGPT, Claude, Gemini, Perplexity, Grok, Mistral, Qwen, DeepSeek, Meta AI).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-indigo-400">NIVEAU 2</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300">30%</span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">Être Compris & Choisi</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Qualité des données structurées Schema.org (Product, Organization, FAQ), HTML sémantique et comparabilité des entités face aux concurrents.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-emerald-400">NIVEAU 3</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300">30%</span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">Être Actionnable & Convertir</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Documentation machine (/llms.txt), contrat OpenAPI 3.1 (/openapi.json), A2A Agent Card, rails de paiement machine x402 et validation par des Agent Journeys réels.
              </p>
            </div>
          </div>
        </section>

        {/* Formule Mathématique */}
        <section className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-2xl font-bold text-white">Formule Canonique de Calcul</h2>
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-sm text-blue-300 leading-relaxed overflow-x-auto">
            Score_Global = (0.40 × Score_Citations_GEO) + (0.30 × Score_Semantique_Schema) + (0.30 × Score_Actionnabilite_M2M)
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Chaque sous-score est normalisé sur une échelle de 0 à 100. Les scores ne sont calculés qu'à partir de sources horodatées et traçables. En cas d'indisponibilité d'un protocole, une dégradation proportionnelle est appliquée avec proposition d'un artefact de remédiation direct.
          </p>
        </section>

        {/* CTA */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-800/50 text-center space-y-4">
          <h3 className="text-xl font-bold text-white">Prêt à évaluer votre domaine ?</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Lancez un scan public instantané et découvrez votre score d'actionnabilité en quelques secondes.
          </p>
          <Link
            to="/snapshot"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm text-white transition-all shadow-lg shadow-blue-500/25"
          >
            <span>Lancer un Snapshot Gratuit</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Methodology;
