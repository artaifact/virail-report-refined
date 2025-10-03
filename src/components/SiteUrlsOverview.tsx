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

      // console.log('🔍 Récupération des sites depuis /optimize...');

      // Récupérer les sites depuis l'endpoint /optimize
              const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.virail.studio';
              const optimizeResponse = await AuthService.makeAuthenticatedRequest(`${API_BASE_URL}/optimize`);
      
      if (optimizeResponse.ok) {
        const optimizeData = await optimizeResponse.json();
        // console.log('✅ Données reçues de /optimize:', optimizeData);
        
        // Adapter les données selon la structure de la réponse
        let sitesData = [];
        
        if (Array.isArray(optimizeData)) {
          sitesData = optimizeData;
        } else if (optimizeData.sites) {
          sitesData = optimizeData.sites;
        } else if (optimizeData.data) {
          sitesData = optimizeData.data;
        } else {
          console.warn('Structure de données inattendue:', optimizeData);
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

        // console.log('📊 Sites mappés:', optimizeSites);
        setSites(optimizeSites);
        setFilteredSites(optimizeSites);
      } else {
        console.warn('⚠️ Erreur API /optimize, utilisation des données mock. Status:', optimizeResponse.status);
        
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
      console.error('❌ Erreur lors du chargement des sites:', err);
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
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Fonction pour obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'analyzed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Analysé</Badge>;
      case 'analyzing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">En cours</Badge>;
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Sites Analysés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              Sites Analysés pour Optimisation
            </CardTitle>
            <CardDescription>
              Sélectionnez un site pour lancer une optimisation textuelle de son contenu
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {filteredSites.length} site{filteredSites.length > 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un site..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Separator />

        {/* Gestion des erreurs */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
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
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'Aucun site trouvé' : 'Aucun site analysé'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Essayez de modifier votre recherche' 
                  : 'Commencez par analyser des sites pour pouvoir les optimiser'
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => navigate('/analyses')}
                  className="flex items-center gap-2"
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
                className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Icône du site */}
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Globe className="h-6 w-6 text-blue-600" />
                  </div>

                  {/* Informations du site */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {site.title || site.domain}
                      </h4>
                      {getStatusBadge(site.status)}
                      {site.hasOptimization && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          <Zap className="h-3 w-3 mr-1" />
                          {site.optimizationCount} opt.
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        <span className="truncate max-w-xs">{site.url}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(site.analysisDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Score et métriques */}
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getScoreColor(site.score || 0)}`}>
                      {site.score || '--'}
                    </div>
                    <div className="text-xs text-gray-500">Score LLMO</div>
                  </div>
                </div>

                {/* Bouton d'action */}
                <div className="ml-4">
                  <Button
                    onClick={() => handleOptimizeSite(site)}
                    variant="outline"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2"
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
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <span>
                  {filteredSites.filter(s => s.hasOptimization).length} site{filteredSites.filter(s => s.hasOptimization).length > 1 ? 's' : ''} avec optimisation
                </span>
                <span>
                  Score moyen: {Math.round(filteredSites.reduce((acc, site) => acc + (site.score || 0), 0) / filteredSites.length)}
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/analyses')}
                  className="flex items-center gap-1"
                >
                  <BarChart3 className="h-3 w-3" />
                  Voir analyses
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/optimisation/textuelle')}
                  className="flex items-center gap-1"
                >
                  <Target className="h-3 w-3" />
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