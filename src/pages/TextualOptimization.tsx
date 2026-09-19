import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
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
  usePageTitle('Optimisation textuelle');
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
        <div className="relative overflow-hidden bg-card px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-12 border-b border-border">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-muted/50"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="max-w-3xl">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">
                Optimisation Textuelle
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 leading-relaxed">
                Optimisez votre contenu avec l'intelligence artificielle et des stratégies d'enrichissement avancées.
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
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
      <div className="px-4 py-4 sm:px-6 md:px-8 md:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-center">
            <TabsList className="grid grid-cols-3 max-w-md w-full h-11 bg-muted p-1">
              <TabsTrigger value="Résumé" className="text-sm font-medium">
                Résumé
              </TabsTrigger>
              <TabsTrigger value="Modifications" className="text-sm font-medium">
                Modifications
              </TabsTrigger>
              <TabsTrigger value="Analyse" className="text-sm font-medium">
                Analyse
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Debug Info */}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>Erreur: {error}</AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="mt-4 p-4 bg-muted/50 border border-border rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Chargement des optimisations...</p>
            </div>
          )}

          {/* Contenu conditionnel selon l'onglet actif */}
          <TabsContent value="Résumé" className="mt-6 space-y-6">
            {currentOptimization ? (
              <div className="space-y-6">
                {/* Informations générales */}
                <Card className="border border-border bg-card shadow-sm">
                  <CardHeader className="bg-muted/30 border-b border-border">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-xl text-foreground">
                          Optimisation #{currentOptimization.id}
                        </CardTitle>
                        <CardDescription className="mt-1 text-muted-foreground">
                          URL: <span className="font-mono">{currentOptimization.url}</span> • {new Date(currentOptimization.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="self-start sm:self-auto font-mono">
                        {currentOptimization.analysis_llm}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 text-foreground">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="text-center p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="text-2xl font-bold font-mono text-foreground">{currentOptimization.input_parameters.original_text_words}</div>
                        <div className="text-xs text-muted-foreground mt-1">Mots originaux</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="text-2xl font-bold font-mono text-foreground">{currentOptimization.optimized_text.split(' ').length}</div>
                        <div className="text-xs text-muted-foreground mt-1">Mots optimisés</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="text-base sm:text-lg font-semibold truncate text-foreground">{currentOptimization.input_parameters.primary_strategy}</div>
                        <div className="text-xs text-muted-foreground mt-1">Stratégie</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="text-base sm:text-lg font-semibold truncate text-foreground">{currentOptimization.input_parameters.tone}</div>
                        <div className="text-xs text-muted-foreground mt-1">Ton</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Texte optimisé */}
                <Card className="border border-border bg-card shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-foreground">
                      Texte Optimisé
                    </CardTitle>
                    <CardDescription>
                      Version optimisée du contenu avec les enrichissements sémantiques appliqués
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/40 rounded-xl p-4 sm:p-5 max-h-96 overflow-y-auto border border-border/60">
                      <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                        {currentOptimization.optimized_text}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Checklist de conformité */}
                <Card className="border border-border bg-card shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-foreground">
                      Checklist de Conformité
                    </CardTitle>
                    <CardDescription>
                      Vérification des critères d'optimisation et d'autorité sémantique
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(currentOptimization.analysis_details.checklist).map(([key, value]) => (
                        <div key={key} className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm ${value ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-destructive/5 border-destructive/20 text-destructive'}`}>
                          <span className="font-bold">{value ? '✓' : '✗'}</span>
                          <span className="truncate">{key}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-base font-semibold text-foreground mb-1">Aucune optimisation sélectionnée</h3>
                <p className="text-sm text-muted-foreground">Sélectionnez une optimisation dans la liste ou lancez-en une nouvelle.</p>
              </div>
            )}
          </TabsContent>

          {/* Onglet Modifications */}
          <TabsContent value="Modifications" className="mt-6">
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
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
                      <div key={index} className="border border-border rounded-xl p-4 bg-muted/20">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="secondary"
                              className={
                                modification.impact === 'Positif' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0' :
                                modification.impact === 'Optimisation' ? 'bg-primary/10 text-primary border-0' :
                                'border border-border text-muted-foreground'
                              }
                            >
                              {modification.impact}
                            </Badge>
                            <Badge variant="outline">{modification.type}</Badge>
                          </div>
                        </div>
                        <div className="space-y-1.5 text-sm">
                          <div>
                            <span className="font-medium text-muted-foreground">Catégorie :</span>
                            <span className="ml-2 text-foreground font-semibold">{modification.categorie}</span>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Modification :</span>
                            <span className="ml-2 text-foreground">{modification.modification}</span>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Justification :</span>
                            <span className="ml-2 text-muted-foreground italic">{modification.justification}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-base font-semibold text-foreground mb-1">Aucune optimisation</h3>
                    <p className="text-sm text-muted-foreground">Sélectionnez une optimisation pour voir les modifications.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Analyse */}
          <TabsContent value="Analyse" className="mt-6">
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  Analyse des Optimisations
                </CardTitle>
                <CardDescription>
                  Analysez les gains sémantiques et la couverture conceptuelle
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentOptimization ? (
                  <div className="space-y-6">
                    {/* Analyse sémantique */}
                    <div>
                      <h4 className="text-base font-semibold text-foreground mb-3">Analyse Sémantique</h4>
                      <div className="grid gap-3">
                        {currentOptimization.analysis_details.semantic_analysis.map((analysis, index) => (
                          <div key={index} className="border border-border rounded-xl p-4 bg-muted/20">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avant</span>
                                <p className="text-foreground mt-0.5">{analysis.Avant}</p>
                              </div>
                              <div>
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Après</span>
                                <p className="text-foreground mt-0.5">{analysis.Après}</p>
                              </div>
                              <div>
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Métrique</span>
                                <p className="text-foreground mt-0.5">{analysis.Métrique}</p>
                              </div>
                              <div>
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amélioration</span>
                                <p className="text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">{analysis.Amélioration}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mapping sémantique */}
                    <div>
                      <h4 className="text-base font-semibold text-foreground mb-3">Mapping Sémantique</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-border rounded-xl p-4 bg-muted/20">
                          <h5 className="font-semibold text-foreground text-sm mb-1.5">Entités Clés</h5>
                          <p className="text-muted-foreground text-sm leading-relaxed">{currentOptimization.analysis_details.semantic_mapping.entites_cles}</p>
                        </div>
                        <div className="border border-border rounded-xl p-4 bg-muted/20">
                          <h5 className="font-semibold text-foreground text-sm mb-1.5">Concepts Centraux</h5>
                          <p className="text-muted-foreground text-sm leading-relaxed">{currentOptimization.analysis_details.semantic_mapping.concepts_centraux}</p>
                        </div>
                        <div className="border border-border rounded-xl p-4 bg-muted/20">
                          <h5 className="font-semibold text-foreground text-sm mb-1.5">Champs Sémantiques</h5>
                          <p className="text-muted-foreground text-sm leading-relaxed">{currentOptimization.analysis_details.semantic_mapping.champs_semantiques}</p>
                        </div>
                        <div className="border border-border rounded-xl p-4 bg-muted/20">
                          <h5 className="font-semibold text-foreground text-sm mb-1.5">Relations Conceptuelles</h5>
                          <p className="text-muted-foreground text-sm leading-relaxed">{currentOptimization.analysis_details.semantic_mapping.relations_conceptuelles}</p>
                        </div>
                      </div>
                    </div>

                    {/* Sources */}
                    <div>
                      <h4 className="text-base font-semibold text-foreground mb-3">Sources</h4>
                      <div className="space-y-2">
                        {currentOptimization.analysis_details.sources.map((source, index) => (
                          <div key={index} className="flex items-center gap-2 p-3 bg-muted/30 border border-border rounded-lg text-sm">
                            <span className="text-foreground">{source}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-base font-semibold text-foreground mb-1">Aucune optimisation</h3>
                    <p className="text-sm text-muted-foreground">Sélectionnez une optimisation pour voir l'analyse.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
                      
      {/* Dialog pour créer une nouvelle optimisation */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
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