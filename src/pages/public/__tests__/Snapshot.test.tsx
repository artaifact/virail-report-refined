import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Snapshot from '../Snapshot';
import { actionabilityEngine } from '@/services/actionability/ActionabilityEngine';

describe('Public Snapshot Page', () => {
  it('renders the public snapshot search hero', () => {
    render(
      <BrowserRouter>
        <Snapshot />
      </BrowserRouter>
    );

    expect(screen.getByText(/Votre site est-il prêt pour les/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Entrez votre site/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Auditer/i })).toBeInTheDocument();
  });

  it('runs an audit on form submit and displays 3-tier results', async () => {
    render(
      <BrowserRouter>
        <Snapshot />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText(/Entrez votre site/i);
    fireEvent.change(input, { target: { value: 'https://tally.so' } });

    const submitBtn = screen.getByRole('button', { name: /Auditer/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('tally.so')).toBeInTheDocument();
      expect(screen.getByText(/Score d'Actionnabilité/i)).toBeInTheDocument();
      expect(screen.getByText(/Niveau 1 — Être trouvé & cité/i)).toBeInTheDocument();
      expect(screen.getByText(/Niveau 2 — Être compris & choisi/i)).toBeInTheDocument();
      expect(screen.getByText(/Niveau 3 — Être actionnable & convertir/i)).toBeInTheDocument();
    });
  });
});
