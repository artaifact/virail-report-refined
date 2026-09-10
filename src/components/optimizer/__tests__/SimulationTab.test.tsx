import React from 'react';
import { render, screen } from '@testing-library/react';
import { SimulationTab } from '../SimulationTab';
import { ScoreCard } from '@/components/dashboard/ScoreCard';

describe('ScoreCard and SimulationTab Regression Guard', () => {
  describe('ScoreCard', () => {
    it('displays standard label when no regression is present', () => {
      render(<ScoreCard title="Score Test" score={90} />);
      expect(screen.getByText('Excellent')).toBeInTheDocument();
      expect(screen.getByText('90')).toBeInTheDocument();
    });

    it('displays regression warning and overrides label when isRegression is true', () => {
      render(
        <ScoreCard
          title="Score GPTBot"
          score={80}
          isRegression={true}
          delta={-10}
        />
      );
      expect(screen.getByText('Régression détectée (-10)')).toBeInTheDocument();
      expect(screen.queryByText('Excellent')).not.toBeInTheDocument();
    });
  });

  describe('SimulationTab', () => {
    it('flags an optimization regression when after < before (e.g. 90 -> 80)', () => {
      render(
        <SimulationTab
          crawlScore={{ overall: 80 }}
          originalScore={{ overall: 90 }}
          optimizedScore={{ overall: 80 }}
        />
      );

      // Vérifie la présence de l'alerte explicite de régression
      expect(screen.getByText(/Impact de l'optimisation \(Régression\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Alerte Régression/i)).toBeInTheDocument();
      expect(screen.getByText(/Régression d'indexation détectée/i)).toBeInTheDocument();

      // Vérifie que le ScoreCard ne qualifie pas le score de 80 d'Excellent en cas de régression
      expect(screen.queryByText('Excellent')).not.toBeInTheDocument();
    });

    it('renders normal impact when optimization is positive (e.g. 70 -> 85)', () => {
      render(
        <SimulationTab
          crawlScore={{ overall: 85 }}
          originalScore={{ overall: 70 }}
          optimizedScore={{ overall: 85 }}
        />
      );

      expect(screen.getByText("Impact de l'optimisation")).toBeInTheDocument();
      expect(screen.queryByText(/Alerte Régression/i)).not.toBeInTheDocument();
      expect(screen.getByText('+15')).toBeInTheDocument();
    });
  });
});
