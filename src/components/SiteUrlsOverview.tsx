import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { 
  Globe, 
  Search, 
  ArrowRight, 
  ExternalLink,
  Clock,
  BarChart3,
  FileText,
  Target,
  Zap,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';

interface AnalyzedSite {
  id: string;
  url: string;
  title?: string;
  domain: string;
  score?: number;
  status: 'analyzed' | 'analyzing' | 'error';
  analysisDate: string;
  hasOptimization?: boolean;
  optimizationCount?: number;
  optimizationId?: string; // ID de l'optimisation associée
}

const SiteUrlsOverview: React.FC = () => {
  const [sites, setSites] = useState<AnalyzedSite[]>([]);
  const [filteredSites, setFilteredSites] = useState<AnalyzedSite[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fonction pour extraire le domaine d'une URL
  const extractDomain = (url: string): string => {
    try {
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };

  // Fonction pour formater la date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Charger les sites analysés
  const loadAnalyzedSites = async () => {
    try {
      setIsLoading(true);
      setError(null);


      // Récupérer les sites depuis l'endpoint /optimize
              const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.viraill.com';
              const optimizeResponse = await AuthService.makeAuthenticatedRequest(`${API_BASE_URL}/optimize`);
      
      if (optimizeResponse.ok) {
        const optimizeData = await optimizeResponse.json();
        
        // Adapter les données selon la structure de la réponse
        let sitesData = [];
        
        if (Array.isArray(optimizeData)) {
          sitesData = optimizeData;
        } else if (optimizeData.sites) {
          sitesData = optimizeData.sites;
        } else if (optimizeData.data) {
          sitesData = optimizeData.data;
        } else {
            sitesData = [];
        }

        const optimizeSites = sitesData.map((site: any, index: number) => ({
          id: site.id || `site-${index}`,
          url: site.url || site.website_url || site.domain || '',
          title: site.title || site.name || extractDomain(site.url || site.website_url || site.domain || ''),
          domain: extractDomain(site.url || site.website_url || site.domain || ''),
          score: site.score || site.llmo_score || site.optimization_score || 0,
          status: site.status || 'analyzed' as const,
          analysisDate: site.created_at || site.date || site.analysisDate || new Date().toISOString(),
          hasOptimization: site.hasOptimization || site.optimized || false,
          optimizationCount: site.optimizationCount || site.optimizations || 0,
          optimizationId: site.id || site.optimization_id || site.optimizationId // ID pour charger l'optimisation
        })) || [];

        setSites(optimizeSites);
        setFilteredSites(optimizeSites);
      } else {
        
        // Fallback vers des données d'exemple
        const mockSites: AnalyzedSite[] = [
          {
            id: '1',
            url: 'https://example.com',
            title: 'Example Domain',
            domain: 'example.com',
            score: 0,
            status: 'analyzed',
            analysisDate: new Date(Date.now() - 86400000).toISOString(),
            hasOptimization: true,
            optimizationCount: 1,
            optimizationId: 'mock-opt-1' // ID pour charger l'optimisation mock
          },
          {
            id: '2', 
            url: 'https://www.amundi-ee.com/epargnant',
            title: 'Amundi Épargne Entreprise',
            domain: 'amundi-ee.com',
            score: 0,
            status: 'analyzed',
            analysisDate: new Date(Date.now() - 172800000).toISOString(),
            hasOptimization: true,
            optimizationCount: 1,
            optimizationId: '1' // ID réel de votre exemple JSON
          },
          {
            id: '3',
            url: 'https://trainline.com',
            title: 'Trainline',
            domain: 'trainline.com',
            score: 82,
            status: 'analyzed',
            analysisDate: new Date(Date.now() - 259200000).toISOString(),
            hasOptimization: true,
            optimizationCount: 1,
            optimizationId: 'mock-opt-3'
          },
          {
            id: '4',
            url: 'https://omio.com',
            title: 'Omio',
            domain: 'omio.com',
            score: 71,
            status: 'analyzed',
            analysisDate: new Date(Date.now() - 345600000).toISOString(),
            hasOptimization: false,
            optimizationCount: 0,
            optimizationId: undefined
          }
        ];

        setSites(mockSites);
        setFilteredSites(mockSites);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des sites');
      
      // En cas d'erreur, utiliser les données mock
      const mockSites: AnalyzedSite[] = [
        {
          id: '1',
          url: 'https://virail.fr',
          title: 'Virail France',
          domain: 'virail.fr',
          score: 74,
          status: 'analyzed',
          analysisDate: new Date(Date.now() - 86400000).toISOString(),
          hasOptimization: true,
          optimizationCount: 3
        },
        {
          id: '2', 
          url: 'https://booking.com',
          title: 'Booking.com',
          domain: 'booking.com',
          score: 68,
          status: 'analyzed',
          analysisDate: new Date(Date.now() - 172800000).toISOString(),
          hasOptimization: false,
          optimizationCount: 0
        }
      ];

      setSites(mockSites);
      setFilteredSites(mockSites);
    } finally {
      setIsLoading(false);
    }
  };

  // Effet pour charger les données au montage
  useEffect(() => {
    loadAnalyzedSites();
  }, []);

  // Effet pour filtrer les sites selon le terme de recherche
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSites(sites);
    } else {
      const filtered = sites.filter(site => 
        site.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (site.title && site.title.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredSites(filtered);
    }
  }, [searchTerm, sites]);

  // Navigation vers l'optimisation textuelle avec chargement direct par ID
  const handleOptimizeSite = (site: AnalyzedSite) => {
    if (site.optimizationId) {
      // Stocker l'ID de l'optimisation à charger
      localStorage.setItem('loadOptimizationById', site.optimizationId);
      
      // Stocker aussi le contexte du site pour l'affichage
      localStorage.setItem('selectedSiteForOptimization', JSON.stringify({
        url: site.url,
        domain: site.domain,
        title: site.title,
        score: site.score
      }));

      navigate('/optimisation/textuelle');
      
      toast({
        title: "Chargement de l'optimisation",
        description: `Affichage de l'analyse pour ${site.domain}`
      });
    } else {
      // Fallback : créer une nouvelle optimisation
      localStorage.setItem('selectedSiteForOptimization', JSON.stringify({
        url: site.url,
        domain: site.domain,
        title: site.title,
        score: site.score
      }));

      navigate('/optimisation/textuelle');
      
      toast({
        title: "Nouvelle optimisation",
        description: `Créer une optimisation pour ${site.domain}`
      });
    }
  };

  // Fonction pour obtenir la couleur du score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  // Fonction pour obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'analyzed':
        return <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0">Analysé</Badge>;
      case 'analyzing':
        return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0">En cours</Badge>;
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-primary" />
            Sites Analysés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-8 w-24 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5 text-primary" />
              Sites Analysés pour Optimisation
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              Sélectionnez un site pour lancer une optimisation textuelle de son contenu
            </CardDescription>
          </div>
          <Badge variant="secondary" className="self-start sm:self-auto font-mono">
            {filteredSites.length} site{filteredSites.length > 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un site par nom ou URL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Separator />

        {/* Gestion des erreurs */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive text-sm font-medium">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadAnalyzedSites}
              className="mt-2"
            >
              Réessayer
            </Button>
          </div>
        )}

        {/* Liste des sites */}
        <div className="space-y-3">
          {filteredSites.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">
                {searchTerm ? 'Aucun site trouvé' : 'Aucun site analysé'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                {searchTerm 
                  ? 'Essayez de modifier votre terme de recherche.' 
                  : 'Commencez par analyser des sites pour pouvoir les optimiser avec l\'IA.'
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => navigate('/analyses')}
                  className="gap-2"
                  size="sm"
                >
                  <BarChart3 className="h-4 w-4" />
                  Aller aux analyses
                </Button>
              )}
            </div>
          ) : (
            filteredSites.map((site) => (
              <div 
                key={site.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card hover:bg-muted/40 rounded-xl border border-border transition-colors group gap-4"
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 text-primary">
                    <Globe className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold text-foreground truncate text-sm sm:text-base">
                        {site.title || site.domain}
                      </h4>
                      {getStatusBadge(site.status)}
                      {site.hasOptimization && (
                        <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-0 gap-1 text-xs">
                          <Zap className="h-3 w-3" />
                          {site.optimizationCount} opt.
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                      <div className="flex items-center gap-1 min-w-0">
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="truncate">{site.url}</span>
                      </div>
                      <div className="hidden sm:inline text-muted-foreground/40">•</div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(site.analysisDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 hidden sm:block">
                    <div className={`text-2xl font-bold font-mono ${getScoreColor(site.score || 0)}`}>
                      {site.score || '--'}
                    </div>
                    <div className="text-xs text-muted-foreground">Score LLMO</div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                  <div className="text-left sm:hidden shrink-0">
                    <div className={`text-xl font-bold font-mono ${getScoreColor(site.score || 0)}`}>
                      {site.score || '--'}
                    </div>
                    <div className="text-xs text-muted-foreground">Score LLMO</div>
                  </div>
                  <Button
                    onClick={() => handleOptimizeSite(site)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 group-hover:border-primary/50 group-hover:text-primary transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    Optimiser
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Actions supplémentaires */}
        {filteredSites.length > 0 && (
          <>
            <Separator />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-muted-foreground pt-1">
              <div className="flex flex-wrap items-center gap-3">
                <span>
                  {filteredSites.filter(s => s.hasOptimization).length} site{filteredSites.filter(s => s.hasOptimization).length > 1 ? 's' : ''} avec optimisation
                </span>
                <span>•</span>
                <span>
                  Score moyen: <strong className="text-foreground font-semibold">{Math.round(filteredSites.reduce((acc, site) => acc + (site.score || 0), 0) / filteredSites.length)}</strong>
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/analyses')}
                  className="flex items-center gap-1.5"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  Voir analyses
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/optimisation/textuelle')}
                  className="flex items-center gap-1.5"
                >
                  <Target className="h-3.5 w-3.5" />
                  Nouvelle optimisation
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SiteUrlsOverview;