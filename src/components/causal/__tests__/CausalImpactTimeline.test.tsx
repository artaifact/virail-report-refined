import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CausalImpactTimeline } from '../CausalImpactTimeline';

const renderComponent = (ui: React.ReactElement) => {
  return render(
    <TooltipProvider>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </TooltipProvider>
  );
};

describe('CausalImpactTimeline', () => {
  it('renders correctly with single audit (baseline mode)', () => {
    renderComponent(<CausalImpactTimeline domain="tally.so" />);

    // Title and domain check
    expect(screen.getByText(/Trajectoire & Impact Causal/i)).toBeInTheDocument();
    expect(screen.getAllByText(/tally\.so/i).length).toBeGreaterThanOrEqual(1);

    // Check mode switches
    expect(screen.getByText(/Suivi Réel/i)).toBeInTheDocument();
    expect(screen.getByText(/Projections/i)).toBeInTheDocument();

    // Baseline stats
    expect(screen.getByText(/Audit initial de référence/i)).toBeInTheDocument();
    expect(screen.getByText(/Citations Totales/i)).toBeInTheDocument();
    expect(screen.getByText(/Part de Voix/i)).toBeInTheDocument();
    expect(screen.getByText(/Moteurs Détecteurs/i)).toBeInTheDocument();
  });

  it('renders correctly with multiple audits (multi-report trajectory mode)', () => {
    const mockReports = [
      { id: 'rep-1', createdAt: '2026-05-01T10:00:00Z', metadata: { score: 50 } },
      { id: 'rep-2', createdAt: '2026-05-08T10:00:00Z', metadata: { score: 62 } },
    ];

    renderComponent(<CausalImpactTimeline domain="tally.so" domainReports={mockReports} />);

    // Check multi-audit metric cards
    expect(screen.getByText(/Score Initial ➔ Actuel/i)).toBeInTheDocument();
    expect(screen.getByText(/Lift Causal Net/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Points de Contrôle/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/2 audits/i).length).toBeGreaterThanOrEqual(1);
  });

  it('allows switching to projections view and selecting optimizations', () => {
    renderComponent(<CausalImpactTimeline domain="tally.so" />);

    // Switch to projections
    const projectionsBtn = screen.getByText(/Projections/i);
    fireEvent.click(projectionsBtn);

    const schemaOptButton = screen.getByText(/Schema\.org/i);
    expect(schemaOptButton).toBeInTheDocument();

    fireEvent.click(schemaOptButton);

    // After switching, the active analysis card should display the schema title
    const analysisCardTitle = screen.getAllByText(/Schema\.org/i);
    expect(analysisCardTitle.length).toBeGreaterThanOrEqual(1);

    // Check presence of metric lifts in projections
    expect(screen.getByText(/Gain de Citations/i)).toBeInTheDocument();
    expect(screen.getByText(/Part de Voix \(SoV\)/i)).toBeInTheDocument();
  });
});

