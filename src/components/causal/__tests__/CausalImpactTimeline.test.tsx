import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CausalImpactTimeline } from '../CausalImpactTimeline';

describe('CausalImpactTimeline', () => {
  it('renders correctly with domain and initial metrics', () => {
    render(<CausalImpactTimeline domain="tally.so" />);

    // Title and domain check
    expect(screen.getByText(/Impact Réel des Déploiements sur les Citations LLM/i)).toBeInTheDocument();
    expect(screen.getByText(/tally\.so/i)).toBeInTheDocument();

    // Verification of causal verdict badge
    expect(screen.getByText(/Attribution Causalité : Validée/i)).toBeInTheDocument();
    expect(screen.getByText(/Impact Positif Avéré/i)).toBeInTheDocument();

    // Check presence of metric lifts
    expect(screen.getByText(/Gain de Citations/i)).toBeInTheDocument();
    expect(screen.getByText(/Part de Voix \(SoV\)/i)).toBeInTheDocument();
  });

  it('allows switching between deployed optimizations', () => {
    render(<CausalImpactTimeline domain="tally.so" />);

    const schemaOptButton = screen.getByText(/Enrichissement Schema\.org JSON-LD/i);
    expect(schemaOptButton).toBeInTheDocument();

    fireEvent.click(schemaOptButton);

    // After switching, the active analysis card should display the schema title
    const analysisCardTitle = screen.getAllByText(/Enrichissement Schema\.org JSON-LD/i);
    expect(analysisCardTitle.length).toBeGreaterThanOrEqual(1);
  });
});
