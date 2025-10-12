// Exemple d'utilisation du composant MiniLLMAnalysis
// Ce fichier montre comment utiliser le composant avec des données d'exemple

import MiniLLMAnalysis from './MiniLLMAnalysis';
import { MiniLLMResult } from '@/services/competitorAnalysisService';

// Données d'exemple basées sur votre JSON
const exampleData: MiniLLMResult[] = [
  {
    competitor_name: "Animo'Style",
    competitor_url: "https://www.animostyle.fr",
    llm_analysis: {
      forces_principales: [
        "Marque reconnue et établie (Animo'Style)",
        "Présence digitale forte",
        "Expérience utilisateur optimisée"
      ],
      faiblesses_principales: [
        "Potentiellement moins spécialisé que des acteurs locaux",
        "Tarifs potentiellement moins compétitifs"
      ],
      positionnement: "Animo'Style se positionne comme un acteur établi du marché avec une forte présence digitale.",
      differenciateurs: [
        "Marque reconnue et crédible",
        "Investissement dans le digital",
        "Large gamme de services"
      ],
      opportunites_differenciation: [
        "Se spécialiser sur des niches spécifiques",
        "Améliorer la personnalisation",
        "Optimiser les prix"
      ],
      score_menace: 9,
      analyse_resume: "Analyse concurrentielle de Animo'Style: concurrent établi avec un score de 0.95, nécessitant une stratégie de différenciation ciblée."
    },
    status: "success"
  },
  {
    competitor_name: "Maxi Zoo (Salons de toilettage)",
    competitor_url: "https://www.maxizoo.fr",
    llm_analysis: {
      forces_principales: [
        "Marque reconnue et établie (Maxi Zoo)",
        "Présence digitale forte",
        "Expérience utilisateur optimisée"
      ],
      faiblesses_principales: [
        "Potentiellement moins spécialisé que des acteurs locaux",
        "Tarifs potentiellement moins compétitifs"
      ],
      positionnement: "Maxi Zoo se positionne comme un acteur établi du marché avec une forte présence digitale.",
      differenciateurs: [
        "Marque reconnue et crédible",
        "Investissement dans le digital",
        "Large gamme de services"
      ],
      opportunites_differenciation: [
        "Se spécialiser sur des niches spécifiques",
        "Améliorer la personnalisation",
        "Optimiser les prix"
      ],
      score_menace: 9,
      analyse_resume: "Analyse concurrentielle de Maxi Zoo: concurrent établi avec un score de 0.90, nécessitant une stratégie de différenciation ciblée."
    },
    status: "success"
  },
  {
    competitor_name: "Bulldog & Co",
    competitor_url: "https://www.bulldogandco.fr",
    llm_analysis: {
      forces_principales: [
        "Marque reconnue et établie (Bulldog & Co)",
        "Présence digitale forte",
        "Expérience utilisateur optimisée"
      ],
      faiblesses_principales: [
        "Potentiellement moins spécialisé que des acteurs locaux",
        "Tarifs potentiellement moins compétitifs"
      ],
      positionnement: "Bulldog & Co se positionne comme un acteur établi du marché avec une forte présence digitale.",
      differenciateurs: [
        "Marque reconnue et crédible",
        "Investissement dans le digital",
        "Large gamme de services"
      ],
      opportunites_differenciation: [
        "Se spécialiser sur des niches spécifiques",
        "Améliorer la personnalisation",
        "Optimiser les prix"
      ],
      score_menace: 8,
      analyse_resume: "Analyse concurrentielle de Bulldog & Co: concurrent établi avec un score de 0.88, nécessitant une stratégie de différenciation ciblée."
    },
    status: "success"
  }
];

// Composant d'exemple pour tester
export const MiniLLMAnalysisExample = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-foreground">
        Exemple d'Analyse LLM Détaillée
      </h1>
      <p className="text-muted-foreground">
        Ce composant affiche les analyses LLM détaillées de vos concurrents avec des cartes interactives et des métriques visuelles.
      </p>
      
      <MiniLLMAnalysis 
        data={exampleData} 
        isLoading={false}
      />
    </div>
  );
};

export default MiniLLMAnalysisExample;
