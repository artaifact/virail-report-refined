import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Code, 
  Zap, 
  Database, 
  Monitor, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

const TechnicalOptimization: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Code className="h-8 w-8 text-blue-600" />
          Optimisation Technique
        </h1>
        <p className="text-gray-600 mt-2">
          Recommandations d'optimisation pour améliorer les performances techniques de votre site.
        </p>
      </div>

      <Separator />

      {/* Vue d'ensemble des performances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Score Global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">85/100</div>
            <p className="text-xs text-gray-500 mt-1">Bon niveau général</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-600" />
              Vitesse de Chargement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">2.4s</div>
            <p className="text-xs text-gray-500 mt-1">À optimiser</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Monitor className="h-4 w-4 text-blue-600" />
              Performance Mobile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">78/100</div>
            <p className="text-xs text-gray-500 mt-1">Améliorations possibles</p>
          </CardContent>
        </Card>
      </div>

      {/* Recommandations prioritaires */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Recommandations Prioritaires
          </CardTitle>
          <CardDescription>
            Actions recommandées pour améliorer significativement les performances
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-red-900">Optimisation des images</h4>
                <p className="text-sm text-red-700 mt-1">
                  Les images représentent 60% du poids de la page. Compresser et convertir en WebP peut réduire le temps de chargement de 40%.
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="destructive" className="text-xs">Priorité Haute</Badge>
                  <Badge variant="outline" className="text-xs">Impact: -40% temps de chargement</Badge>
                </div>
              </div>
              <Button size="sm" variant="outline">
                Corriger
              </Button>
            </div>

            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <Database className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-orange-900">Cache navigateur</h4>
                <p className="text-sm text-orange-700 mt-1">
                  Configurer des en-têtes de cache appropriés pour les ressources statiques peut améliorer les visites répétées.
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">Priorité Moyenne</Badge>
                  <Badge variant="outline" className="text-xs">Impact: +25% vitesse retour</Badge>
                </div>
              </div>
              <Button size="sm" variant="outline">
                Configurer
              </Button>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-green-900">Minification CSS/JS</h4>
                <p className="text-sm text-green-700 mt-1">
                  Les fichiers CSS et JavaScript sont déjà minifiés. Bon travail !
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="default" className="text-xs bg-green-600">Optimisé</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Détails techniques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Métriques Core Web Vitals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">LCP (Largest Contentful Paint)</span>
                <Badge variant="secondary">2.1s</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '70%' }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">FID (First Input Delay)</span>
                <Badge variant="default" className="bg-green-600">45ms</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '90%' }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">CLS (Cumulative Layout Shift)</span>
                <Badge variant="default" className="bg-green-600">0.08</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Analyse des Ressources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Images</span>
                <div className="text-right">
                  <div className="text-sm font-medium">2.1 MB</div>
                  <div className="text-xs text-gray-500">60% du total</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">JavaScript</span>
                <div className="text-right">
                  <div className="text-sm font-medium">580 KB</div>
                  <div className="text-xs text-gray-500">16% du total</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">CSS</span>
                <div className="text-right">
                  <div className="text-sm font-medium">120 KB</div>
                  <div className="text-xs text-gray-500">3% du total</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Autres</span>
                <div className="text-right">
                  <div className="text-sm font-medium">750 KB</div>
                  <div className="text-xs text-gray-500">21% du total</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TechnicalOptimization; 