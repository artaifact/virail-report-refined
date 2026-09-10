import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, Layers, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto p-5 sm:p-6 bg-card border-border text-foreground">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[11px] font-medium">
              Standard Viraill 2026.1
            </Badge>
          </div>
          <DialogTitle className="text-lg sm:text-xl font-bold text-foreground">
            Méthodologie de Calcul du Score d'Actionnabilité
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Formule mathématique canonique, pondération des 3 piliers et critères d'évaluation liant visibilité générative et compatibilité agentique.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2 text-xs sm:text-sm">
          {/* Canonical Formula */}
          <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
            <div className="text-xs font-semibold text-foreground">Formule Canonique de Calcul</div>
            <div className="p-3 rounded-lg bg-background border border-border font-mono text-xs text-foreground overflow-x-auto select-all">
              Score_Global = (0.40 × Score_Citations_GEO) + (0.30 × Score_Semantique_Schema) + (0.30 × Score_Actionnabilite_M2M)
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Chaque sous-score est normalisé de 0 à 100 à partir de données horodatées et vérifiables. En cas d'absence d'un protocole, une décote proportionnelle est appliquée avec proposition de correctif immédiat.
            </p>
          </div>

          {/* 3 Pillars */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Décomposition des 3 Niveaux
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Niveau 1 */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-normal">
                    Niveau 1
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] font-semibold">
                    40%
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs sm:text-sm">
                  <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span>Être Trouvé & Cité</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Part de voix, fréquence de citation et analyse de sentiment dans 9 LLMs majeurs (ChatGPT, Claude, Gemini, Perplexity, Grok, Mistral, Qwen, DeepSeek, Meta AI).
                </p>
              </div>

              {/* Niveau 2 */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-normal">
                    Niveau 2
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] font-semibold">
                    30%
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs sm:text-sm">
                  <Layers className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span>Être Compris & Choisi</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Qualité des balisages Schema.org (Product, Organization, FAQ), HTML sémantique, clarté des propositions de valeur et comparabilité face aux concurrents.
                </p>
              </div>

              {/* Niveau 3 */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-normal">
                    Niveau 3
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] font-semibold">
                    30%
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs sm:text-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span>Être Actionnable</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Documentation machine (/llms.txt), contrat d'API OpenAPI 3.1, carte agentique A2A, rails de micro-paiement x402 et validation par des Agent Journeys réels.
                </p>
              </div>
            </div>
          </div>

          {/* Protocols & Traceability */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
            <div className="text-xs font-semibold text-foreground">Principes d'Évaluation & Reproductibilité</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <span>Audits multi-modèles réels et non de simples approximations statistiques.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <span>Validation dynamique des crawlers (GPTBot, ClaudeBot, PerplexityBot).</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <span>Génération systématique de patchs de remédiation clé en main.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <span>Mesure de l'impact causal (ROI) suite aux déploiements techniques.</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MethodologyModal;
