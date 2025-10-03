import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useTextualOptimization } from '@/hooks/useTextualOptimization';
import { useReports } from '@/hooks/useReports';
import { useToast } from '@/hooks/use-toast';
import { OptimizationRequest, getAvailableStrategies, getAvailableTones } from '@/services/textualOptimizationService';
import { AuthService } from '@/services/authService';

const TextualOptimization: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Récupérer l'ID depuis l'état de navigation ou les paramètres URL
  const optimizationId = location.state?.optimizationId || searchParams.get('id');
  
  const {
    optimizations,
    currentOptimization,
    isLoading,
    isProcessing,
    error,
    loadOptimization,
    createOptimization,
    clearError,
    clearCurrentOptimization,
    getImprovementScore
  } = useTextualOptimization(optimizationId);

  const { createAnalysis } = useReports();
  const { toast } = useToast();

  // État pour les onglets comme dans LLMO Dashboard
  const [activeTab, setActiveTab] = useState('Résumé');

  // Debug: afficher les données chargées
  useEffect(() => {
    console.log('🔍 TextualOptimization - État actuel:');
    console.log('📊 Optimizations:', optimizations);
    console.log('📊 Current Optimization:', currentOptimization);
    console.log('📊 Loading:', isLoading);
    console.log('📊 Processing:', isProcessing);
    console.log('📊 Error:', error);
  }, [optimizations, currentOptimization, isLoading, isProcessing, error]);

  // États pour le formulaire de création
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSiteContext, setSelectedSiteContext] = useState<any>(null);
  
  // États pour le dialogue d'analyse LLMO
  const [newAnalysisUrl, setNewAnalysisUrl] = useState("");
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [includeOptimization, setIncludeOptimization] = useState(true);
  
  const [formData, setFormData] = useState<OptimizationRequest>({
    text: '',
    content_domain: 'Transport',
    target_audience: 'Voyageurs',
    primary_strategy: 'Statistics' as any,
    primary_details: '',
    secondary_strategy: 'Cite_Sources' as any,
    secondary_details: '',
    tone: 'Commercial' as any,
    key_points: {
      primary: '',
      secondary: ''
    },
    constraints: {
      avoid: '',
      length: '200-300 mots',
      keywords: '',
      semantic_fields: ''
    }
  });

  // Fonction pour créer une optimisation
  const handleCreateOptimization = async () => {
    if (!formData.text.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un texte à optimiser",
        variant: "destructive",
      });
      return;
    }

    try {
      await createOptimization(formData);
      setShowCreateForm(false);
      setFormData({
        text: '',
        content_domain: 'Transport',
        target_audience: 'Voyageurs',
        primary_strategy: 'Statistics',
        primary_details: '',
        secondary_strategy: 'Cite_Sources',
        secondary_details: '',
        tone: 'Commercial',
        key_points: {
          primary: '',
          secondary: ''
        },
        constraints: {
          avoid: '',
          length: '200-300 mots',
          keywords: '',
          semantic_fields: ''
        }
      });
      toast({
        title: "Succès",
        description: "Optimisation créée avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de la création de l\'optimisation:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de l'optimisation",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Hero Header Section */}
        <div className="relative overflow-hidden bg-card px-8 py-12 border-b border-border">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-muted/50"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold text-foreground mb-3">
                Optimisation Textuelle
              </h1>
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                Optimisez votre contenu avec l'intelligence artificielle et des stratégies d'enrichissement avancées.
              </p>
              <div className="flex items-center gap-4">
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-semibold px-6 py-3 h-auto"
                  disabled={isProcessing}
                >
                  Nouvelle Optimisation
                </Button>
                    <Button 
                  onClick={() => window.location.reload()}
                      variant="outline"
                      className="border-border text-foreground hover:bg-muted px-6 py-3 h-auto"
                    >
                  Recharger
                    </Button>
              </div>
            </div>
            
            {/* Stats preview */}
            <div className="hidden lg:block">
              <div className="bg-primary rounded-2xl p-6 border border-primary">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-foreground mb-1">{optimizations?.length || 0}</div>
                  <div className="text-primary-foreground/80 text-sm font-medium">Optimisations</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <span className="text-primary-foreground text-sm">IA</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-8 py-6">
        <div className="flex items-center justify-center">
          <div className="bg-card rounded-xl p-2 shadow-lg border border-transparent inline-block relative">
            {/* Indicateur animé qui se déplace */}
            <div
              className="absolute top-2 bottom-2 bg-primary rounded-lg transition-all duration-300 ease-in-out"
              style={{
                width: 'calc(33.333% - 0.2rem)',
                left: '0.5rem',
                transform: activeTab === 'Résumé' ? 'translateX(0)' :
                  activeTab === 'Modifications' ? 'translateX(calc(100% + 0.2rem))' :
                    activeTab === 'Analyse' ? 'translateX(calc(200% + 0.4rem))' :
                      'translateX(0)'
              }}
            ></div>

            <div className="relative flex items-center justify-center space-x-0 z-10">
              <button
                onClick={() => setActiveTab('Résumé')}
                className="px-6 py-3 transition-all duration-300 font-medium rounded-lg border border-transparent relative z-20"
                style={{ color: activeTab === 'Résumé' ? 'white' : 'var(--muted-foreground)' }}
              >
                Résumé
              </button>
              <button
                onClick={() => setActiveTab('Modifications')}
                className="px-6 py-3 transition-all duration-300 font-medium rounded-lg border border-transparent relative z-20"
                style={{ color: activeTab === 'Modifications' ? 'white' : 'var(--muted-foreground)' }}
              >
                Modifications
              </button>
              <button
                onClick={() => setActiveTab('Analyse')}
                className="px-6 py-3 transition-all duration-300 font-medium rounded-lg border border-transparent relative z-20"
                style={{ color: activeTab === 'Analyse' ? 'white' : 'var(--muted-foreground)' }}
              >
                Analyse
              </button>
            </div>
        </div>
      </div>

        {/* Debug Info */}
      {error && (
          <div className="mt-4 p-4 bg-muted border border-border rounded-lg">
            <p className="text-foreground font-medium">Erreur: {error}</p>
          </div>
        )}

        {isLoading && (
          <div className="mt-4 p-4 bg-muted border border-border rounded-lg">
            <p className="text-foreground font-medium">Chargement des optimisations...</p>
          </div>
        )}

        {/* Contenu conditionnel selon l'onglet actif */}
        {activeTab === 'Résumé' && (
          <div className="mt-8 space-y-6">

            {/* Optimisation actuelle */}
            {currentOptimization && (
              <div className="space-y-6">
                {/* Informations générales */}
                <Card className="bg-card border border-border shadow-sm">
                  <CardHeader className="bg-muted border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                        <CardTitle className="flex items-center gap-3 text-xl text-foreground">
                          Optimisation #{currentOptimization.id}
                </CardTitle>
                        <CardDescription className="mt-2 text-muted-foreground">
                          URL: {currentOptimization.url} • {new Date(currentOptimization.created_at).toLocaleDateString()}
                        </CardDescription>
              </div>
                      <Badge className="bg-muted text-foreground">{currentOptimization.analysis_llm}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 text-foreground">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{currentOptimization.input_parameters.original_text_words}</div>
                        <div className="text-sm text-muted-foreground">Mots originaux</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{currentOptimization.optimized_text.split(' ').length}</div>
                        <div className="text-sm text-muted-foreground">Mots optimisés</div>
                        </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{currentOptimization.input_parameters.primary_strategy}</div>
                        <div className="text-sm text-muted-foreground">Stratégie</div>
                        </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{currentOptimization.input_parameters.tone}</div>
                        <div className="text-sm text-muted-foreground">Ton</div>
                      </div>
            </div>
          </CardContent>
        </Card>

                {/* Texte optimisé */}
                <Card className="bg-card border border-border shadow-sm">
              <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      Texte Optimisé
                    </CardTitle>
                <CardDescription className="text-muted-foreground">
                      Version optimisée du contenu avec les améliorations appliquées
                </CardDescription>
              </CardHeader>
              <CardContent>
                    <div className="bg-muted rounded-lg p-4 max-h-96 overflow-y-auto">
                      <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                        {currentOptimization.optimized_text}
                  </p>
                </div>
              </CardContent>
            </Card>

                {/* Checklist de conformité */}
                <Card className="bg-card border border-border shadow-sm">
              <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      Checklist de Conformité
                    </CardTitle>
                <CardDescription className="text-muted-foreground">
                      Vérification des critères d'optimisation
                </CardDescription>
              </CardHeader>
              <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(currentOptimization.analysis_details.checklist).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          {value ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-red-600">✗</span>
                          )}
                          <span className={`text-sm ${value ? 'text-green-700' : 'text-red-700'}`}>
                            {key}
                          </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              </div>
            )}
          </div>
        )}


            {/* Onglet Modifications */}
        {activeTab === 'Modifications' && (
          <div className="mt-8">
            <Card className="bg-card border border-border shadow-sm">
                <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  Modifications Apportées
                </CardTitle>
                  <CardDescription>
                  Détail des modifications effectuées lors de l'optimisation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                {currentOptimization ? (
                  <div className="space-y-4">
                    {currentOptimization.analysis_details.modifications.map((modification, index) => (
                      <div key={index} className="border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                              <Badge 
                              variant="outline" 
                              className={
                                modification.impact === 'Positif' ? 'border-border text-foreground' :
                                modification.impact === 'Optimisation' ? 'border-border text-foreground' :
                                modification.impact === 'Neutre' ? 'border-border text-muted-foreground' :
                                'border-border text-foreground'
                              }
                              >
                                {modification.impact}
                              </Badge>
                            <Badge variant="outline">{modification.type}</Badge>
                            </div>
                          </div>
                        <div className="space-y-2">
                          <div>
                            <span className="font-medium text-muted-foreground">Catégorie:</span>
                            <span className="ml-2 text-foreground">{modification.categorie}</span>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Modification:</span>
                            <span className="ml-2 text-foreground">{modification.modification}</span>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Justification:</span>
                            <span className="ml-2 text-foreground">{modification.justification}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <h3 className="text-xl font-semibold text-foreground mb-2">Aucune optimisation</h3>
                    <p className="text-muted-foreground">Sélectionnez une optimisation pour voir les modifications</p>
                  </div>
                )}
                </CardContent>
              </Card>
          </div>
        )}

        {/* Onglet Analyse */}
        {activeTab === 'Analyse' && (
          <div className="mt-8">
            <Card className="bg-card border border-border shadow-sm">
                <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  Analyse des Optimisations
                </CardTitle>
                <CardDescription>
                  Analysez les performances de vos optimisations
                </CardDescription>
                </CardHeader>
                <CardContent>
                {currentOptimization ? (
                  <div className="space-y-6">
                    {/* Analyse sémantique */}
                        <div>
                      <h4 className="text-lg font-semibold text-foreground mb-4">Analyse Sémantique</h4>
                      <div className="grid gap-4">
                        {currentOptimization.analysis_details.semantic_analysis.map((analysis, index) => (
                          <div key={index} className="border border-border rounded-lg p-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <span className="text-sm font-medium text-muted-foreground">Avant</span>
                                <p className="text-foreground">{analysis.Avant}</p>
                          </div>
                              <div>
                                <span className="text-sm font-medium text-muted-foreground">Après</span>
                                <p className="text-foreground">{analysis.Après}</p>
                        </div>
                              <div>
                                <span className="text-sm font-medium text-muted-foreground">Métrique</span>
                                <p className="text-foreground">{analysis.Métrique}</p>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-muted-foreground">Amélioration</span>
                                <p className="text-green-600 font-medium">{analysis.Amélioration}</p>
                              </div>
                        </div>
                      </div>
                    ))}
                      </div>
                  </div>

                    {/* Mapping sémantique */}
                  <div>
                      <h4 className="text-lg font-semibold text-foreground mb-4">Mapping Sémantique</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-border rounded-lg p-4">
                          <h5 className="font-medium text-muted-foreground mb-2">Entités Clés</h5>
                          <p className="text-foreground">{currentOptimization.analysis_details.semantic_mapping.entites_cles}</p>
                          </div>
                        <div className="border border-border rounded-lg p-4">
                          <h5 className="font-medium text-muted-foreground mb-2">Concepts Centraux</h5>
                          <p className="text-foreground">{currentOptimization.analysis_details.semantic_mapping.concepts_centraux}</p>
                        </div>
                        <div className="border border-border rounded-lg p-4">
                          <h5 className="font-medium text-muted-foreground mb-2">Champs Sémantiques</h5>
                          <p className="text-foreground">{currentOptimization.analysis_details.semantic_mapping.champs_semantiques}</p>
                    </div>
                        <div className="border border-border rounded-lg p-4">
                          <h5 className="font-medium text-muted-foreground mb-2">Relations Conceptuelles</h5>
                          <p className="text-foreground">{currentOptimization.analysis_details.semantic_mapping.relations_conceptuelles}</p>
                  </div>
                            </div>
                            </div>

                    {/* Sources */}
                    <div>
                      <h4 className="text-lg font-semibold text-foreground mb-4">Sources</h4>
                      <div className="space-y-2">
                        {currentOptimization.analysis_details.sources.map((source, index) => (
                          <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                            <span className="text-foreground">{source}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                    <h3 className="text-xl font-semibold text-foreground mb-2">Aucune optimisation</h3>
                    <p className="text-muted-foreground">Sélectionnez une optimisation pour voir l'analyse</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
          </div>
        )}

                      </div>
                      
      {/* Dialog pour créer une nouvelle optimisation */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Nouvelle Optimisation Textuelle
            </DialogTitle>
            <DialogDescription>
              Configurez les paramètres de votre optimisation
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid gap-4">
              <Label htmlFor="text">Texte à optimiser</Label>
              <Textarea
                id="text"
                placeholder="Saisissez votre texte à optimiser..."
                value={formData.text}
                onChange={(e) => setFormData({...formData, text: e.target.value})}
                className="min-h-[120px]"
              />
                      </div>
                      
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="domain">Domaine de contenu</Label>
                <Select value={formData.content_domain} onValueChange={(value) => setFormData({...formData, content_domain: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Transport">Transport</SelectItem>
                    <SelectItem value="E-commerce">E-commerce</SelectItem>
                    <SelectItem value="Services">Services</SelectItem>
                    <SelectItem value="Technologie">Technologie</SelectItem>
                  </SelectContent>
                </Select>
                      </div>
                      
              <div>
                <Label htmlFor="audience">Audience cible</Label>
                <Select value={formData.target_audience} onValueChange={(value) => setFormData({...formData, target_audience: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Voyageurs">Voyageurs</SelectItem>
                    <SelectItem value="Clients">Clients</SelectItem>
                    <SelectItem value="Professionnels">Professionnels</SelectItem>
                    <SelectItem value="Grand public">Grand public</SelectItem>
                  </SelectContent>
                </Select>
                      </div>
                    </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="primary-strategy">Stratégie principale</Label>
                <Select value={formData.primary_strategy} onValueChange={(value) => setFormData({...formData, primary_strategy: value as any})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableStrategies().map((strategy) => (
                      <SelectItem key={strategy.value} value={strategy.value}>{strategy.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tone">Ton</Label>
                <Select value={formData.tone} onValueChange={(value) => setFormData({...formData, tone: value as any})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableTones().map((tone) => (
                      <SelectItem key={tone.value} value={tone.value}>{tone.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Annuler
            </Button>
            <Button 
                onClick={handleCreateOptimization}
                disabled={isProcessing || !formData.text.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isProcessing ? (
                  <>
                    Optimisation en cours...
                  </>
                ) : (
                  <>
                    Créer l'optimisation
                  </>
                )}
            </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default TextualOptimization; 