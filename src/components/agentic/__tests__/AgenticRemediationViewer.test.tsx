import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgenticRemediationViewer } from '../AgenticRemediationViewer';

const mockPack = {
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
};

describe('AgenticRemediationViewer', () => {
  it('renders all file tabs with complete filenames without truncation', () => {
    render(<AgenticRemediationViewer remediationPack={mockPack} />);

    expect(screen.getAllByText('openapi.json').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('llms.txt')).toBeInTheDocument();
    expect(screen.getByText('agent.json')).toBeInTheDocument();
    expect(screen.getByText('agentic-resources.json')).toBeInTheDocument();
    expect(screen.getByText('pricing.json')).toBeInTheDocument();
    expect(screen.getByText('schema_org_product.json')).toBeInTheDocument();
  });

  it('shows deployment path and protocol for the active file', () => {
    render(<AgenticRemediationViewer remediationPack={mockPack} activeFile="openapi.json" />);

    expect(screen.getByText('/openapi.json')).toBeInTheDocument();
    expect(screen.getByText('OpenAPI 3.1')).toBeInTheDocument();
  });

  it('allows clicking tabs to switch files and update metadata', () => {
    const handleActiveFileChange = jest.fn();
    render(
      <AgenticRemediationViewer
        remediationPack={mockPack}
        onActiveFileChange={handleActiveFileChange}
      />
    );

    const a2aTab = screen.getByText('agent.json');
    fireEvent.click(a2aTab);

    expect(handleActiveFileChange).toHaveBeenCalledWith('agent.json');
    expect(screen.getByText('/.well-known/agent.json')).toBeInTheDocument();
    expect(screen.getByText('Protocole A2A')).toBeInTheDocument();
  });

  it('provides copy and download buttons', () => {
    render(<AgenticRemediationViewer remediationPack={mockPack} />);

    expect(screen.getByRole('button', { name: /copier/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /télécharger/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pack complet/i })).toBeInTheDocument();
  });
});
