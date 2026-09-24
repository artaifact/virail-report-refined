import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AgenticRemediationSection } from '../AgenticRemediationSection';
import * as agenticService from '@/services/agenticService';

jest.mock('@/services/agenticService', () => ({
  getLatestAgenticAudit: jest.fn(),
  runAgenticScan: jest.fn(),
}));

const mockReportData = {
  report: {
    id: 123,
    url: 'https://peec.ai',
  },
  agentic_scan: {
    score: 7,
    remediation_pack: {
      brand: 'PEEC',
      ready: true,
      files: {
        'openapi.json': '{\n  "openapi": "3.1.0"\n}',
        'llms.txt': '# PEEC Machine Interface',
        'agent.json': '{\n  "schema_version": "1.0.0"\n}',
        'agentic-resources.json': '{\n  "resources": ["/llms.txt"]\n}',
        'pricing.json': '{\n  "plans": []\n}',
        'schema_org_product.json': '{\n  "@context": "https://schema.org"\n}',
      },
    },
  },
};

describe('AgenticRemediationSection', () => {
  const renderComponent = () => {
    return render(
      <TooltipProvider>
        <BrowserRouter>
          <AgenticRemediationSection reportData={mockReportData as any} />
        </BrowserRouter>
      </TooltipProvider>
    );
  };

  it('renders clean header and score badge', () => {
    renderComponent();

    expect(screen.getByText(/Pack d'Éligibilité Agentique \(M2M\) — PEEC/i)).toBeInTheDocument();
    expect(screen.getByText(/Score M2M : 7\/100/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /régénérer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cockpit complet/i })).toBeInTheDocument();
  });

  it('renders all 4 interactive protocol cards', () => {
    renderComponent();

    expect(screen.getAllByText('OpenAPI 3.1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Protocole A2A')).toBeInTheDocument();
    expect(screen.getByText('Manifeste ARD')).toBeInTheDocument();
    expect(screen.getByText('Règlement x402')).toBeInTheDocument();
  });

  it('clicking a protocol card activates its corresponding file in the studio', async () => {
    renderComponent();

    const a2aCard = screen.getByRole('button', { name: /Protocole A2A/i });
    fireEvent.click(a2aCard);

    await waitFor(() => {
      expect(screen.getByText('/.well-known/agent.json')).toBeInTheDocument();
    });
  });
});
