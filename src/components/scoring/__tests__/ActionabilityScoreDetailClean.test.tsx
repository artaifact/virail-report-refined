import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ActionabilityScoreDetail } from '../ActionabilityScoreDetail';
import { UnifiedActionabilityScore } from '@/types/scoring';

const mockUnified: UnifiedActionabilityScore = {
  overallScore: 47,
  grade: 'D',
  methodVersion: '2026.1',
  calculatedAt: '2026-09-24T10:00:00Z',
  targetDomain: 'peec.ai',
  confidence: 'high',
  provenance: {
    geoAnalysesCount: 1,
    modelsAuditedCount: 8,
    provider: 'viraill',
  },
  levels: {
    found_and_cited: {
      level: 1,
      id: 'found_and_cited',
      title: 'Être trouvé & cité',
      shortTitle: 'Trouvé',
      weight: 0.4,
      score: 68,
      grade: 'B',
      status: 'OK',
      description: 'Part de voix et fréquence de recommandation',
      metrics: [
        { id: 'm1', label: 'Taux de citation', score: 68, weight: 0.5 },
        { id: 'm2', label: 'Autorité des sources', score: 60, weight: 0.3 },
        { id: 'm3', label: 'Sentiment comparatif', score: 72, weight: 0.2 },
      ],
      keyObservations: ['41 citations recensées sur les moteurs génératifs audités.'],
    },
    understood_and_preferred: {
      level: 2,
      id: 'understood_and_preferred',
      title: 'Être compris & choisi',
      shortTitle: 'Compris',
      weight: 0.3,
      score: 51,
      grade: 'C',
      status: 'Warning',
      description: 'Lisibilité de l offre pour les extracteurs IA',
      metrics: [
        { id: 'm4', label: 'Données structurées', score: 0, weight: 0.5 },
        { id: 'm5', label: 'Structure sémantique HTML', score: 65, weight: 0.3 },
        { id: 'm6', label: 'Clarté factuelle', score: 55, weight: 0.2 },
      ],
      keyObservations: ['Balisage Schema.org absent · Risque d hallucination'],
    },
    actionable_and_transacting: {
      level: 3,
      id: 'actionable_and_transacting',
      title: 'Être actionnable (M2M)',
      shortTitle: 'Actionnable',
      weight: 0.3,
      score: 15,
      grade: 'D',
      status: 'Critical',
      description: 'Capacité d un agent autonome à interagir',
      metrics: [
        { id: 'm7', label: 'Aiguillage /llms.txt', score: 100, weight: 0.4 },
        { id: 'm8', label: 'Contrat d outils OpenAPI', score: 20, weight: 0.4 },
        { id: 'm9', label: 'Parcours réels', score: 0, weight: 0.2 },
      ],
      keyObservations: ['Agents M2M supportés (/llms.txt actif)'],
    },
  },
  topFixes: [
    {
      id: 'fix1',
      level: 3,
      title: 'Déployer un fichier /llms.txt à la racine du domaine',
      description: 'Fournit aux LLMs un sommaire propre.',
      impact: 'high',
      effort: 'low',
      category: 'Agent-Readiness',
    },
    {
      id: 'fix2',
      level: 2,
      title: 'Injecter le balisage Schema.org JSON-LD (Product & FAQPage)',
      description: 'Permet à ChatGPT d extraire les plans sans ambiguïté.',
      impact: 'high',
      effort: 'low',
      category: 'Sémantique',
    },
  ],
};

describe('ActionabilityScoreDetail Purification', () => {
  const renderComponent = () => {
    return render(
      <TooltipProvider>
        <BrowserRouter>
          <ActionabilityScoreDetail unified={mockUnified} domain="peec.ai" />
        </BrowserRouter>
      </TooltipProvider>
    );
  };

  it('renders purified hero with unified score and grade badge', () => {
    renderComponent();

    expect(screen.getByText(/Score d'Actionnabilité Unifié :/i)).toBeInTheDocument();
    expect(screen.getByText('47/100')).toBeInTheDocument();
    expect(screen.getByText('Grade D')).toBeInTheDocument();
    expect(screen.getByText('Optimisation requise')).toBeInTheDocument();
  });

  it('renders the 3 canonical level cards with equal height and no clumsy accordion buttons', () => {
    renderComponent();

    expect(screen.getByText('Niveau 1 (40%)')).toBeInTheDocument();
    expect(screen.getByText('Être trouvé & cité')).toBeInTheDocument();
    expect(screen.getByText('68/100')).toBeInTheDocument();

    expect(screen.getByText('Niveau 2 (30%)')).toBeInTheDocument();
    expect(screen.getByText('Être compris & choisi')).toBeInTheDocument();
    expect(screen.getByText('51/100')).toBeInTheDocument();

    expect(screen.getByText('Niveau 3 (30%)')).toBeInTheDocument();
    expect(screen.getByText('Être actionnable (M2M)')).toBeInTheDocument();
    expect(screen.getByText('15/100')).toBeInTheDocument();

    // Accordion expander buttons should NOT be present on the cards
    expect(screen.queryByText(/Déplier tous les détails/i)).not.toBeInTheDocument();
  });

  it('opens ActionabilityLevelDetailModal when clicking on a level card', () => {
    renderComponent();

    const level2Card = screen.getByText('Être compris & choisi');
    fireEvent.click(level2Card);

    // Modal opens displaying level 2 details
    expect(screen.getByText(/Détail du Palier d'Actionnabilité/i)).toBeInTheDocument();
    expect(screen.getByText(/Niveau 2 : Être compris & choisi/i)).toBeInTheDocument();
    expect(screen.getByText(/Données structurées \(Schema\.org\)/i)).toBeInTheDocument();
  });

  it('renders top fixes in a clean 1-line format', () => {
    renderComponent();

    expect(screen.getByText('Déployer un fichier /llms.txt à la racine du domaine')).toBeInTheDocument();
    expect(screen.getByText('Injecter le balisage Schema.org JSON-LD (Product & FAQPage)')).toBeInTheDocument();
    expect(screen.getAllByText('Impact Fort (+15 pts)').length).toBeGreaterThanOrEqual(1);
  });
});
