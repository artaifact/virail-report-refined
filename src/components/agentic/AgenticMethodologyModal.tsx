import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Cpu,
  Layers,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Code2,
  FileText,
  ShoppingCart,
  CreditCard,
  Network,
  Zap,
} from 'lucide-react';

interface AgenticMethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AgenticMethodologyModal: React.FC<AgenticMethodologyModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 bg-card text-foreground border border-border shadow-xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                Méthodologie & Barème d'Éligibilité Agentique (M2M)
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Comprendre comment les agents autonomes évaluent, sélectionnent ou disqualifient votre domaine.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1 text-xs">
          {/* Introduction Card */}
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span>Le Changement de Paradigme : Du SEO Humain à l'Éligibilité M2M</span>
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              En 2026, plus de 40% des requêtes d'achat, de comparaison et d'intégration logicielle ne sont plus exécutées par des internautes cliquant dans un navigateur, mais par des <strong className="text-foreground font-medium">agents d'IA autonomes</strong> (Claude Code, Cursor, Perplexity Pro, agents d'approvisionnement).
              Si un service ne propose pas de points de terminaison optimisés pour machines, l'agent subit des coûts excessifs en tokens ou des erreurs de parsing, entraînant une <strong className="text-foreground font-medium">élimination silencieuse</strong> de l'offre.
            </p>
          </div>

          {/* 3 Maturity Levels */}
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground text-xs">
              Les 3 Niveaux de Conformité Agentique
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-600 dark:text-rose-400 font-mono text-[13px]">
                    0 à 49 pts
                  </span>
                  <Badge variant="destructive" className="text-[9px] py-0 px-1.5">
                    Non Conforme
                  </Badge>
                </div>
                <div className="font-semibold text-foreground text-xs">
                  Disqualification Silencieuse
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  L'agent ne parvient pas à comprendre l'offre ni à automatiser la transaction. Risque d'abandon immédiat.
                </p>
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-600 dark:text-amber-400 font-mono text-[13px]">
                    50 à 79 pts
                  </span>
                  <Badge variant="secondary" className="text-[9px] py-0 px-1.5">
                    Agent-Friendly
                  </Badge>
                </div>
                <div className="font-semibold text-foreground text-xs">
                  Lisibilité Partielle
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Le domaine est analysable mais manque de rails directs de paiement ou de contrats de données typés.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-[13px]">
                    80 à 100 pts
                  </span>
                  <Badge variant="default" className="text-[9px] py-0 px-1.5">
                    Agentic Native
                  </Badge>
                </div>
                <div className="font-semibold text-foreground text-xs">
                  Exécutable & Recommandé
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Architecture 100% prête aux agents : documentation /llms.txt, serveurs MCP, schémas typés et rails x402.
                </p>
              </div>
            </div>
          </div>

          {/* Distribution of 100 pts across the 5 pillars */}
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground text-xs">
              Pondération des 100 Points sur les 5 Piliers
            </h4>

            <div className="space-y-1.5">
              {[
                {
                  icon: FileText,
                  name: '1. Ingestion & Documentation Machine',
                  pts: '20 pts',
                  desc: 'Vérifie la présence de /llms.txt, de routes .md miroirs et le support de Content Negotiation (MIME text/markdown).',
                },
                {
                  icon: Code2,
                  name: '2. Contrats & Interfaces de Données',
                  pts: '20 pts',
                  desc: 'Vérifie l’exposition d’une spécification OpenAPI 3.1 JSON publique et d’une grille tarifaire /api/pricing.json.',
                },
                {
                  icon: ShoppingCart,
                  name: '3. Achetabilité Sémantique',
                  pts: '20 pts',
                  desc: 'Vérifie le balisage Schema.org Product, Offer, price et currency pour les agents de comparaison tarifaire.',
                },
                {
                  icon: CreditCard,
                  name: '4. Règlement M2M (Protocole x402)',
                  pts: '25 pts',
                  desc: 'Vérifie la capacité à répondre au handshake HTTP 402 et à traiter des micro-paiements programmatiques.',
                },
                {
                  icon: Network,
                  name: '5. Canaux de Distribution Agentique',
                  pts: '15 pts',
                  desc: 'Vérifie la présence sur les 8 registres décentralisés (Anthropic MCP, Google A2A, DNS ARD, SKILL.md...).',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <item.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-foreground text-xs">{item.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{item.desc}</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-muted text-foreground shrink-0 border border-border/60 ml-2">
                    {item.pts}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-border/80">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 px-4 text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground border-border/80"
          >
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
