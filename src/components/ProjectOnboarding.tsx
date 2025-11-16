import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, ChevronDown, ChevronRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { onboardingService } from '@/services/onboardingService';

interface ProjectOnboardingProps {
  open: boolean;
  onComplete?: (data: OnboardingData) => void;
  onClose?: () => void;
}

interface OnboardingData {
  accountType: 'agency' | 'in-house';
  agencyName?: string;
  agencyUrl?: string;
  brandName: string;
  brandUrl: string;
  location: string;
  selectedTopics: string[];
  selectedPrompts: string[];
}

const STEPS = ['Configuration', 'Projet', 'Sujets', 'Prompts', 'Résultats', 'Plan'] as const;

const TOPICS = [
  { id: 'reputation', label: 'Gestion de la réputation en ligne' },
  { id: 'marketing', label: 'Marketing digital local' },
  { id: 'communication', label: 'Solutions de communication omnicanale' },
  { id: 'publicite', label: 'Stratégies de publicité locale' },
  { id: 'visibilite', label: 'Visibilité en ligne PME' },
];

const PROMPTS_BY_TOPIC: Record<string, Array<{ id: string; text: string }>> = {
  reputation: [
    { id: 'rep1', text: 'Outils de surveillance de réputation en ligne pour PME' },
    { id: 'rep2', text: 'Conseils pour une bonne gestion des commentaires clients en ligne' },
    { id: 'rep3', text: 'Comment protéger l\'image de ma marque sur les réseaux sociaux ?' },
    { id: 'rep4', text: 'Comment gérer les avis négatifs sur ma fiche Google?' },
    { id: 'rep5', text: 'Quelles stratégies pour améliorer la e-réputation de mon commerce ?' },
  ],
  marketing: [
    { id: 'mkt1', text: 'Stratégies de marketing digital pour PME locales' },
    { id: 'mkt2', text: 'Comment améliorer ma visibilité locale en ligne ?' },
    { id: 'mkt3', text: 'Outils de marketing digital pour commerces locaux' },
    { id: 'mkt4', text: 'Techniques de référencement local pour PME' },
    { id: 'mkt5', text: 'Comment créer une présence digitale locale efficace ?' },
  ],
  communication: [
    { id: 'com1', text: 'Solutions de communication omnicanale pour PME' },
    { id: 'com2', text: 'Comment unifier ma communication sur tous les canaux ?' },
    { id: 'com3', text: 'Outils de communication multicanale' },
    { id: 'com4', text: 'Stratégies de communication intégrée' },
    { id: 'com5', text: 'Comment gérer la cohérence de ma communication ?' },
  ],
  publicite: [
    { id: 'pub1', text: 'Stratégies de publicité locale pour PME' },
    { id: 'pub2', text: 'Comment cibler ma publicité localement ?' },
    { id: 'pub3', text: 'Outils de publicité locale en ligne' },
    { id: 'pub4', text: 'Techniques de publicité géolocalisée' },
    { id: 'pub5', text: 'Comment optimiser mon budget publicitaire local ?' },
  ],
  visibilite: [
    { id: 'vis1', text: 'Comment améliorer ma visibilité en ligne en tant que PME ?' },
    { id: 'vis2', text: 'Stratégies de visibilité digitale pour commerces locaux' },
    { id: 'vis3', text: 'Outils pour augmenter la visibilité en ligne' },
    { id: 'vis4', text: 'Techniques de référencement local' },
    { id: 'vis5', text: 'Comment apparaître dans les résultats de recherche locaux ?' },
  ],
};

const COUNTRIES = [
  { value: 'us', label: 'États-Unis', code: 'US' },
  { value: 'fr', label: 'France', code: 'FR' },
  { value: 'ca', label: 'Canada', code: 'CA' },
  { value: 'uk', label: 'Royaume-Uni', code: 'GB' },
  { value: 'de', label: 'Allemagne', code: 'DE' },
  { value: 'es', label: 'Espagne', code: 'ES' },
  { value: 'it', label: 'Italie', code: 'IT' },
  { value: 'be', label: 'Belgique', code: 'BE' },
  { value: 'ch', label: 'Suisse', code: 'CH' },
  { value: 'nl', label: 'Pays-Bas', code: 'NL' },
];

// Fonction pour obtenir l'URL du drapeau depuis l'API
const getFlagUrl = (countryCode: string, size: 'w20' | 'w40' | 'w80' | 'w160' | 'w320' = 'w40') => {
  // Utilisation de l'API flagcdn.com (gratuite et sans clé API)
  return `https://flagcdn.com/${size}/${countryCode.toLowerCase()}.png`;
};

export function ProjectOnboarding({ open, onComplete, onClose }: ProjectOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [accountType, setAccountType] = useState<'agency' | 'in-house'>('agency');
  const [agencyName, setAgencyName] = useState('');
  const [agencyUrl, setAgencyUrl] = useState('');
  const [brandName, setBrandName] = useState('');
  const [brandUrl, setBrandUrl] = useState('');
  const [location, setLocation] = useState('us');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  if (!open) return null;

  // Fonction pour mapper l'étape actuelle vers le format API
  const getOnboardingStep = (step: number): 'setup' | 'project' | 'topics' | 'prompts' | 'results' | 'plan' => {
    switch (step) {
      case 0:
        return 'setup';
      case 1:
        return 'project';
      case 2:
        return 'topics';
      case 3:
        return 'prompts';
      case 4:
        return 'results';
      case 5:
        return 'plan';
      default:
        return 'setup';
    }
  };

  // Fonction pour envoyer les données à l'API
  const saveAccountDataToAPI = async () => {
    try {
      const selectedCountry = COUNTRIES.find((c) => c.value === location) || COUNTRIES[0];
      
      // Construire l'objet de données en incluant seulement les champs remplis
      const apiData: {
        account_type: 'agency' | 'in_house';
        agency_name?: string;
        agency_url?: string;
        brand_name?: string;
        brand_url?: string;
        location_country: string;
        location_country_code: string;
        onboarding_step: 'setup' | 'project' | 'topics' | 'prompts' | 'results' | 'plan';
      } = {
        account_type: accountType === 'agency' ? 'agency' : 'in_house',
        location_country: selectedCountry.label,
        location_country_code: selectedCountry.code,
        onboarding_step: getOnboardingStep(currentStep),
      };

      // Ajouter les données d'agence si c'est une agence et que les champs sont remplis
      if (accountType === 'agency') {
        if (agencyName.trim()) {
          apiData.agency_name = agencyName.trim();
        }
        if (agencyUrl.trim()) {
          apiData.agency_url = agencyUrl.trim();
        }
      }

      // Ajouter les données de marque si elles sont remplies (à partir de l'étape 1)
      if (brandName.trim()) {
        apiData.brand_name = brandName.trim();
      }
      if (brandUrl.trim()) {
        apiData.brand_url = brandUrl.trim();
      }

      await onboardingService.saveAccountData(apiData);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données d\'onboarding:', error);
      // Ne pas bloquer l'utilisateur en cas d'erreur
    }
  };

  const handleNext = async () => {
    if (currentStep < 3) {
      // Sauvegarder les données avant de passer à l'étape suivante
      await saveAccountDataToAPI();
      setCurrentStep(currentStep + 1);
    } else {
      // Dernière étape : sauvegarder et compléter
      await saveAccountDataToAPI();
      
      const data: OnboardingData = {
        accountType,
        agencyName: accountType === 'agency' ? agencyName : undefined,
        agencyUrl: accountType === 'agency' ? agencyUrl : undefined,
        brandName,
        brandUrl,
        location,
        selectedTopics,
        selectedPrompts,
      };
      onComplete?.(data);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  };

  const togglePrompt = (promptId: string) => {
    setSelectedPrompts((prev) =>
      prev.includes(promptId)
        ? prev.filter((id) => id !== promptId)
        : [...prev, promptId]
    );
  };

  const toggleTopicExpansion = (topicId: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicId]: !prev[topicId],
    }));
  };

  const getSelectedPromptsCount = () => {
    return selectedPrompts.length;
  };

  const getTotalPromptsCount = () => {
    return Object.values(PROMPTS_BY_TOPIC).flat().length;
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Account type
        // Pour agence, les champs sont requis, pour in-house on peut continuer directement
        if (accountType === 'agency') {
          return agencyName.trim() !== '' && agencyUrl.trim() !== '';
        }
        return true; // In-house peut continuer sans champs supplémentaires
      case 1: // Project
        return brandName.trim() !== '' && brandUrl.trim() !== '';
      case 2: // Topics
        return selectedTopics.length > 0;
      case 3: // Prompts
        return selectedPrompts.length > 0;
      default:
        return true;
    }
  };

  const selectedCountry = COUNTRIES.find((c) => c.value === location) || COUNTRIES[0];

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="flex flex-col h-full">
        {/* Breadcrumb */}
        <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center gap-3 text-sm">
            {STEPS.map((step, index) => (
              <div key={step} className="flex items-center gap-3">
                <span
                  className={cn(
                    'font-medium transition-colors',
                    index === currentStep
                      ? 'text-meetmind-primary font-semibold'
                      : index < currentStep
                      ? 'text-slate-500'
                      : 'text-slate-300'
                  )}
                >
                  {step}
                </span>
                {index < STEPS.length - 1 && (
                  <span className="text-slate-300">•</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
          <div className="w-full max-w-2xl py-8">
            {/* Step 0: Account Type */}
            {currentStep === 0 && (
              <div className="space-y-8">
                <div className="text-center space-y-3">
                  <h1 className="text-4xl font-bold text-slate-900">Type de compte</h1>
                  <p className="text-slate-600 text-lg">Optimisez votre présence dans les moteurs génératifs (ChatGPT, Perplexity, Gemini) et mesurez votre visibilité dans leurs réponses</p>
                </div>

                <RadioGroup value={accountType} onValueChange={(v) => setAccountType(v as 'agency' | 'in-house')}>
                  <div className="space-y-4">
                    {/* Agency Card */}
                    <label
                      className={cn(
                        'relative flex cursor-pointer rounded-xl border-2 p-6 transition-all shadow-sm hover:shadow-md',
                        accountType === 'agency'
                          ? 'border-meetmind-primary bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg shadow-blue-100/50'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                      )}
                    >
                      <RadioGroupItem value="agency" id="agency" className="sr-only" />
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          {accountType === 'agency' ? (
                            <div className="h-6 w-6 rounded-full bg-meetmind-primary flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          ) : (
                            <div className="h-6 w-6 rounded-full border-2 border-slate-300 flex-shrink-0 mt-0.5" />
                          )}
                          <h3 className="font-bold text-xl text-slate-900">Agence</h3>
                        </div>
                        <p className="text-slate-600 mb-5 text-base">Gérez l'optimisation SEO/LLM pour plusieurs marques clientes et suivez leur performance dans les réponses des assistants IA</p>
                        <div className="space-y-2.5 pt-2 border-t border-slate-200">
                          <div className="flex items-center gap-2.5 text-sm text-slate-700">
                            <Check className={cn(
                              "h-4 w-4 flex-shrink-0",
                              accountType === 'agency' ? 'text-meetmind-primary' : 'text-slate-400'
                            )} />
                            <span>Gestion de plusieurs projets SEO/LLM</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-sm text-slate-700">
                            <Check className={cn(
                              "h-4 w-4 flex-shrink-0",
                              accountType === 'agency' ? 'text-meetmind-primary' : 'text-slate-400'
                            )} />
                            <span>Tableaux de bord par client</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-sm text-slate-700">
                            <Check className={cn(
                              "h-4 w-4 flex-shrink-0",
                              accountType === 'agency' ? 'text-meetmind-primary' : 'text-slate-400'
                            )} />
                            <span>Rapports de performance multi-marques</span>
                          </div>
                        </div>
                      </div>
                    </label>

                    {/* In-house Card */}
                    <label
                      className={cn(
                        'relative flex cursor-pointer rounded-xl border-2 p-6 transition-all shadow-sm hover:shadow-md',
                        accountType === 'in-house'
                          ? 'border-meetmind-primary bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg shadow-blue-100/50'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                      )}
                    >
                      <RadioGroupItem value="in-house" id="in-house" className="sr-only" />
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          {accountType === 'in-house' ? (
                            <div className="h-6 w-6 rounded-full bg-meetmind-primary flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          ) : (
                            <div className="h-6 w-6 rounded-full border-2 border-slate-300 flex-shrink-0 mt-0.5" />
                          )}
                          <h3 className="font-bold text-xl text-slate-900">Interne</h3>
                        </div>
                        <p className="text-slate-600 mb-5 text-base">Entreprises optimisant leur propre marque pour apparaître dans les réponses des LLM</p>
                        <div className="space-y-2.5 pt-2 border-t border-slate-200">
                          <div className="flex items-center gap-2.5 text-sm text-slate-700">
                            <Check className={cn(
                              "h-4 w-4 flex-shrink-0",
                              accountType === 'in-house' ? 'text-meetmind-primary' : 'text-slate-400'
                            )} />
                            <span>Focus sur votre marque unique</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-sm text-slate-700">
                            <Check className={cn(
                              "h-4 w-4 flex-shrink-0",
                              accountType === 'in-house' ? 'text-meetmind-primary' : 'text-slate-400'
                            )} />
                            <span>Analytics détaillées de visibilité LLM</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-sm text-slate-700">
                            <Check className={cn(
                              "h-4 w-4 flex-shrink-0",
                              accountType === 'in-house' ? 'text-meetmind-primary' : 'text-slate-400'
                            )} />
                            <span>Recommandations d'optimisation personnalisées</span>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                </RadioGroup>

                {accountType === 'agency' && (
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="agency-name">Nom de votre agence</Label>
                      <Input
                        id="agency-name"
                        placeholder="Ex: Mon Agence Digital"
                        value={agencyName}
                        onChange={(e) => setAgencyName(e.target.value)}
                      />
                      <p className="text-xs text-slate-500">Le nom de votre agence qui gérera les projets SEO/LLM</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="agency-url">Site web de l'agence</Label>
                      <Input
                        id="agency-url"
                        placeholder="mon-agence.com"
                        value={agencyUrl}
                        onChange={(e) => setAgencyUrl(e.target.value)}
                      />
                      <p className="text-xs text-slate-500">L'URL de votre site web professionnel</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 1: Project Setup */}
            {currentStep === 1 && (
              <div className="space-y-8">
                <div className="text-center space-y-3">
                  <h1 className="text-4xl font-bold text-slate-900">Configurez votre premier projet</h1>
                  <p className="text-slate-600 text-lg">Définissez la marque que vous souhaitez analyser et optimiser pour les moteurs génératifs</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand-name">Nom de la marque</Label>
                    <Input
                      id="brand-name"
                      placeholder="Ex: Votre Marque"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                    />
                    <p className="text-xs text-slate-500">Le nom exact de la marque que vous souhaitez analyser dans les LLM</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand-url">Site web de la marque</Label>
                    <Input
                      id="brand-url"
                      placeholder="exemple.com"
                      value={brandUrl}
                      onChange={(e) => setBrandUrl(e.target.value)}
                    />
                    <p className="text-xs text-slate-500">L'URL du site web que nous analyserons pour optimiser sa visibilité dans les LLM</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Zone géographique cible</Label>
                    <Select value={location} onValueChange={setLocation}>
                      <SelectTrigger id="location" className="w-full h-12">
                        <SelectValue>
                          <div className="flex items-center gap-3">
                            <img 
                              src={getFlagUrl(selectedCountry.code, 'w40')} 
                              alt={`Drapeau ${selectedCountry.label}`}
                              className="w-6 h-4 object-cover rounded-sm border border-slate-200"
                              onError={(e) => {
                                // Fallback si l'image ne charge pas
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <span className="font-medium">{selectedCountry.label}</span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country.value} value={country.value} className="py-3 pl-8">
                            <div className="flex items-center gap-3">
                              <img 
                                src={getFlagUrl(country.code, 'w40')} 
                                alt={`Drapeau ${country.label}`}
                                className="w-6 h-4 object-cover rounded-sm border border-slate-200"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                              <span className="font-medium">{country.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Review Topics */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <div className="text-center space-y-3">
                  <h1 className="text-4xl font-bold text-slate-900">Choisissez vos thématiques</h1>
                  <p className="text-slate-600 max-w-xl mx-auto text-lg">
                    Sélectionnez les domaines d'expertise sur lesquels vous voulez apparaître dans les réponses des LLM. Nous testerons la visibilité de votre marque sur ces sujets dans ChatGPT, Perplexity, Gemini et autres assistants IA.
                  </p>
                </div>

                <div className="text-sm font-medium text-meetmind-primary mb-6 bg-blue-50 px-4 py-2 rounded-lg inline-block">
                  {selectedTopics.length}/{TOPICS.length} sujets sélectionnés
                </div>

                <div className="space-y-3">
                  {TOPICS.map((topic) => {
                    const isSelected = selectedTopics.includes(topic.id);
                    return (
                      <div
                        key={topic.id}
                        className={cn(
                          'flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all shadow-sm hover:shadow-md',
                          isSelected
                            ? 'border-meetmind-primary bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md shadow-blue-100/50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        )}
                        onClick={() => toggleTopic(topic.id)}
                      >
                        <div className="flex-shrink-0">
                          {isSelected ? (
                            <div className="h-6 w-6 rounded-lg bg-meetmind-primary flex items-center justify-center shadow-md">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          ) : (
                            <div className="h-6 w-6 rounded-lg border-2 border-slate-300 bg-slate-50" />
                          )}
                        </div>
                        <span className={cn(
                          "flex-1 font-medium",
                          isSelected ? 'text-slate-900' : 'text-slate-700'
                        )}>{topic.label}</span>
                      </div>
                    );
                  })}
                </div>

                <button className="text-sm font-medium text-meetmind-primary hover:text-meetmind-soft-blue flex items-center gap-2 transition-colors">
                  <span className="text-lg">+</span> Ajouter un sujet personnalisé
                </button>
              </div>
            )}

            {/* Step 3: Review Prompts */}
            {currentStep === 3 && (
              <div className="space-y-8">
                <div className="text-center space-y-3">
                  <h1 className="text-4xl font-bold text-slate-900">Sélectionnez vos prompts de test</h1>
                  <p className="text-slate-600 text-lg">
                    Choisissez les questions que nous utiliserons pour évaluer la visibilité de votre marque dans les LLM. Ces prompts représentent les requêtes réelles que vos prospects pourraient poser aux assistants IA pour trouver vos services.
                  </p>
                </div>

                <div className="text-sm font-medium text-meetmind-primary mb-6 bg-blue-50 px-4 py-2 rounded-lg inline-block">
                  {getSelectedPromptsCount()}/{getTotalPromptsCount()} prompts sélectionnés
                </div>

                <div className="space-y-3">
                  {TOPICS.filter((topic) => selectedTopics.includes(topic.id)).map((topic) => {
                    const prompts = PROMPTS_BY_TOPIC[topic.id] || [];
                    const isExpanded = expandedTopics[topic.id];
                    const topicPromptsSelected = prompts.filter((p) => selectedPrompts.includes(p.id)).length;

                    return (
                      <div key={topic.id} className="border-2 border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
                        <button
                          onClick={() => toggleTopicExpansion(topic.id)}
                          className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-meetmind-primary" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-slate-400" />
                            )}
                            <span className="font-semibold text-slate-900">{topic.label}</span>
                            <span className="text-sm font-medium text-meetmind-primary bg-blue-50 px-2.5 py-1 rounded-full">{prompts.length}</span>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-slate-200 bg-slate-50/50 p-5 space-y-3">
                            {prompts.map((prompt) => {
                              const isSelected = selectedPrompts.includes(prompt.id);
                              return (
                                <div
                                  key={prompt.id}
                                  className={cn(
                                    'flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all',
                                    isSelected
                                      ? 'bg-white border-2 border-meetmind-primary shadow-md'
                                      : 'bg-white border-2 border-slate-200 hover:border-slate-300 hover:shadow-sm'
                                  )}
                                  onClick={() => togglePrompt(prompt.id)}
                                >
                                  <div className="flex-shrink-0">
                                    {isSelected ? (
                                      <div className="h-5 w-5 rounded-lg bg-meetmind-primary flex items-center justify-center shadow-sm">
                                        <Check className="h-3.5 w-3.5 text-white" />
                                      </div>
                                    ) : (
                                      <div className="h-5 w-5 rounded-lg border-2 border-slate-300 bg-slate-50" />
                                    )}
                                  </div>
                                  <span className={cn(
                                    "flex-1 text-sm",
                                    isSelected ? 'text-slate-900 font-medium' : 'text-slate-700'
                                  )}>{prompt.text}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button className="text-sm font-medium text-meetmind-primary hover:text-meetmind-soft-blue flex items-center gap-2 transition-colors">
                  <span className="text-lg">+</span> Ajouter un prompt personnalisé
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Previous and Next buttons - Sticky */}
        <div className="border-t border-slate-200 bg-white/95 backdrop-blur-sm px-6 py-4 flex items-center justify-between sticky bottom-0 z-10">
          <div>
            {currentStep > 0 && (
              <Button
                onClick={handleBack}
                variant="outline"
                className="px-6 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Précédent
              </Button>
            )}
          </div>
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className={cn(
              "px-8 py-6 text-base font-semibold shadow-lg transition-all",
              canProceed()
                ? "bg-meetmind-primary text-white hover:bg-meetmind-soft-blue hover:shadow-xl hover:shadow-blue-500/30"
                : "bg-slate-300 text-slate-500 cursor-not-allowed"
            )}
          >
            {currentStep === 3 ? 'Parfait' : 'Suivant'}
            {currentStep < 3 && <ChevronRight className="ml-2 h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

