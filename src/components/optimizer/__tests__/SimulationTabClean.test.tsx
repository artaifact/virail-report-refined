import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SimulationTab } from '../SimulationTab';

const mockData = {
  platform: 'generic',
  crawlerPerspective: {
    title: 'Peec AI - AI Search Analytics for Marketing Teams',
    description: 'Peec AI helps marketing teams analyze brand performance across ChatGPT, Perplexity, and Gemini.',
    semantic_sections: [
      'AI search analytics for marketing teams',
      'Understand how AI sees your brand',
      'Turn AI search insights into new customers',
      'Create powerful reports',
    ],
    headings_hierarchy: [{ level: 'H1', text: 'AI search analytics for marketing teams' }],
  },
  existingSchemas: [{ '@type': 'Organization' }],
  entityCoverage: {
    total_entities: 4,
    identified_entities: 4,
    coverage_percentage: 100,
    entities: ['Peec AI', 'AI Search', 'ChatGPT', 'Perplexity'],
  },
  schemasAdded: ['SoftwareApplication', 'WebSite'],
  enrichments: ['author_metadata', 'canonical_url'],
  missingSchemas: ['FAQPage'],
  recommendations: [
    { message: 'Ajouter un schéma FAQPage', priority: 'high' },
  ],
};

describe('SimulationTab Purification', () => {
  const renderTab = () => {
    return render(
      <TooltipProvider>
        <SimulationTab {...mockData} />
      </TooltipProvider>
    );
  };

  it('renders clean snippet preview and CMS badge with InfoTooltip', () => {
    renderTab();

    expect(screen.getByText('Peec AI - AI Search Analytics for Marketing Teams')).toBeInTheDocument();
    expect(screen.getByText('Site personnalisé (aucun CMS détecté)')).toBeInTheDocument();
  });

  it('renders semantic sections without overflowing vertical bars', () => {
    renderTab();

    expect(screen.getByText(/Sections sémantiques détectées \(4\)/i)).toBeInTheDocument();
    expect(screen.getAllByText('AI search analytics for marketing teams').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Understand how AI sees your brand')).toBeInTheDocument();
  });

  it('filters out raw metadata keys (total_entities, etc.) and displays actual entities', () => {
    renderTab();

    // Do NOT display internal database fields as entity badges
    expect(screen.queryByText('total entities')).not.toBeInTheDocument();
    expect(screen.queryByText('identified entities')).not.toBeInTheDocument();
    expect(screen.queryByText('coverage percentage')).not.toBeInTheDocument();

    // Displays real entities
    expect(screen.getByText('Peec AI')).toBeInTheDocument();
    expect(screen.getByText('AI Search')).toBeInTheDocument();
  });

  it('consolidates optimizations into a clean unified pack', () => {
    renderTab();

    const optButton = screen.getByRole('button', { name: /Optimisations appliquées/i });
    expect(optButton).toBeInTheDocument();
    fireEvent.click(optButton);

    expect(screen.getByText('SoftwareApplication')).toBeInTheDocument();
    expect(screen.getByText('WebSite')).toBeInTheDocument();
  });

  it('consolidates missing schemas and recommendations into a clean actions pack', () => {
    renderTab();

    const actionsButton = screen.getByRole('button', { name: /Actions & Schémas recommandés/i });
    expect(actionsButton).toBeInTheDocument();
    fireEvent.click(actionsButton);

    expect(screen.getByText('FAQPage')).toBeInTheDocument();
    expect(screen.getByText('Ajouter un schéma FAQPage')).toBeInTheDocument();
  });
});
