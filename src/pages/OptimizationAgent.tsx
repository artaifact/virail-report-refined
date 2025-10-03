import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Bot, Globe, Settings, Zap, CheckCircle, Clock, Play, Pause, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const OptimizationAgent = () => {
  const [connectedSites, setConnectedSites] = useState([
    {
      id: '1',
      name: 'Mon Site E-commerce',
      url: 'https://monsite.com',
      cms: 'shopify',
      status: 'active',
      optimizationMode: 'draft',
      lastOptimization: '2024-06-03T10:30:00Z',
      optimizationCount: 12
    }
  ]);
  const [newSite, setNewSite] = useState({ name: '', url: '', cms: '', apiKey: '', optimizationMode: 'draft' });
  const { toast } = useToast();

  const handleConnectSite = () => {
    if (!newSite.name || !newSite.url || !newSite.cms) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    const site = {
      id: Date.now().toString(),
      name: newSite.name,
      url: newSite.url,
      cms: newSite.cms,
      status: 'active' as const,
      optimizationMode: newSite.optimizationMode as 'draft' | 'production',
      lastOptimization: new Date().toISOString(),
      optimizationCount: 0
    };

    setConnectedSites([...connectedSites, site]);
    setNewSite({ name: '', url: '', cms: '', apiKey: '', optimizationMode: 'draft' });
    
    toast({
      title: "Site connecté",
      description: `${newSite.name} a été connecté avec succès`,
    });
  };

  const handleToggleStatus = (siteId: string) => {
    setConnectedSites(sites => 
      sites.map(site => 
        site.id === siteId 
          ? { ...site, status: site.status === 'active' ? 'paused' : 'active' }
          : site
      )
    );
  };

  const handleDeleteSite = (siteId: string) => {
    setConnectedSites(sites => sites.filter(site => site.id !== siteId));
    toast({
      title: "Site supprimé",
      description: "Le site a été déconnecté de l'agent d'optimisation",
    });
  };

  const switchToConnectTab = () => {
    const connectTab = document.querySelector('[value="connect"]') as HTMLButtonElement;
    if (connectTab) {
      connectTab.click();
    }
  };

  const getCMSBadge = (cms: string) => {
    const cmsConfig = {
      wordpress: { label: 'WordPress', color: 'bg-blue-100 text-blue-800' },
      shopify: { label: 'Shopify', color: 'bg-green-100 text-green-800' },
      wix: { label: 'Wix', color: 'bg-purple-100 text-purple-800' }
    };
    const config = cmsConfig[cms as keyof typeof cmsConfig] || { label: cms, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
              Agent d'Optimisation
            </h1>
            <p className="text-gray-600 mt-2">
              Connectez vos sites CMS pour une optimisation GEO automatisée
            </p>
          </div>
        </div>

        <Tabs defaultValue="sites" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="sites">Sites Connectés</TabsTrigger>
            <TabsTrigger value="connect">Connecter un Site</TabsTrigger>
            <TabsTrigger value="settings">Configuration</TabsTrigger>
          </TabsList>

          {/* Sites Connectés */}
          <TabsContent value="sites" className="space-y-6">
            {connectedSites.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Globe className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun site connecté</h3>
                  <p className="text-gray-600 text-center mb-6">
                    Connectez votre premier site CMS pour commencer l'optimisation automatisée
                  </p>
                  <Button onClick={switchToConnectTab}>
                    Connecter un site
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {connectedSites.map((site) => (
                  <Card key={site.id} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <Globe className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-xl">{site.name}</CardTitle>
                            <CardDescription className="text-gray-600">
                              {site.url}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getCMSBadge(site.cms)}
                          <Badge variant={site.status === 'active' ? 'default' : 'secondary'}>
                            {site.status === 'active' ? 'Actif' : 'En pause'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <div className="text-sm text-blue-600 font-medium mb-1">Mode d'optimisation</div>
                          <div className="font-semibold text-blue-700">
                            {site.optimizationMode === 'draft' ? 'Brouillon' : 'Production'}
                          </div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <div className="text-sm text-green-600 font-medium mb-1">Optimisations</div>
                          <div className="font-semibold text-green-700">{site.optimizationCount} effectuées</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <div className="text-sm text-purple-600 font-medium mb-1">Dernière optimisation</div>
                          <div className="font-semibold text-purple-700">
                            {new Date(site.lastOptimization).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(site.id)}
                          >
                            {site.status === 'active' ? (
                              <>
                                <Pause className="h-4 w-4 mr-2" />
                                Mettre en pause
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Réactiver
                              </>
                            )}
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-2" />
                            Configurer
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSite(site.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Connecter un Site */}
          <TabsContent value="connect" className="space-y-6">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  Connecter un nouveau site
                </CardTitle>
                <CardDescription>
                  Ajoutez votre site CMS pour activer l'optimisation automatisée GEO
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="siteName">Nom du site *</Label>
                      <Input
                        id="siteName"
                        placeholder="Mon Site E-commerce"
                        value={newSite.name}
                        onChange={(e) => setNewSite({...newSite, name: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="siteUrl">URL du site *</Label>
                      <Input
                        id="siteUrl"
                        placeholder="https://monsite.com"
                        value={newSite.url}
                        onChange={(e) => setNewSite({...newSite, url: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cms">CMS utilisé *</Label>
                      <Select value={newSite.cms} onValueChange={(value) => setNewSite({...newSite, cms: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez votre CMS" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="wordpress">WordPress</SelectItem>
                          <SelectItem value="shopify">Shopify</SelectItem>
                          <SelectItem value="wix">Wix</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="apiKey">Clé API / Token d'accès</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        placeholder="Clé API de votre CMS"
                        value={newSite.apiKey}
                        onChange={(e) => setNewSite({...newSite, apiKey: e.target.value})}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Nécessaire pour modifier automatiquement votre contenu
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="optimizationMode" className="text-base font-medium">
                        Mode d'optimisation
                      </Label>
                      <p className="text-sm text-gray-600">
                        Choisissez si les optimisations doivent être appliquées directement ou sauvées en brouillon
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm">Brouillon</span>
                      <Switch
                        checked={newSite.optimizationMode === 'production'}
                        onCheckedChange={(checked) => 
                          setNewSite({...newSite, optimizationMode: checked ? 'production' : 'draft'})
                        }
                      />
                      <span className="text-sm">Production</span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">Important</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        L'agent d'optimisation analysera votre contenu et appliquera automatiquement les 
                        recommandations GEO. Assurez-vous d'avoir une sauvegarde de votre site.
                      </p>
                    </div>
                  </div>
                </div>

                <Button onClick={handleConnectSite} className="w-full" size="lg">
                  <Globe className="h-4 w-4 mr-2" />
                  Connecter le site
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuration */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  Configuration globale
                </CardTitle>
                <CardDescription>
                  Paramètres généraux de l'agent d'optimisation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Optimisation automatique</Label>
                      <p className="text-sm text-gray-600">
                        Activer l'optimisation automatique pour tous les sites connectés
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Notifications</Label>
                      <p className="text-sm text-gray-600">
                        Recevoir des notifications après chaque optimisation
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Sauvegarde automatique</Label>
                      <p className="text-sm text-gray-600">
                        Créer une sauvegarde avant chaque optimisation
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OptimizationAgent;
