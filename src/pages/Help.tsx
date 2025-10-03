
import { HelpCircle, Book, MessageCircle, Mail, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Help = () => {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Centre d'aide</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Documentation
            </CardTitle>
            <CardDescription>
              Guides et tutoriels pour utiliser GEO Analyzer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <ExternalLink className="h-4 w-4 mr-2" />
              Guide de démarrage rapide
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <ExternalLink className="h-4 w-4 mr-2" />
              Analyser vos contenus
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <ExternalLink className="h-4 w-4 mr-2" />
              Comprendre les métriques
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <ExternalLink className="h-4 w-4 mr-2" />
              FAQ complète
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Support
            </CardTitle>
            <CardDescription>
              Contactez notre équipe pour obtenir de l'aide
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full">
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat en direct
            </Button>
            <Button variant="outline" className="w-full">
              <Mail className="h-4 w-4 mr-2" />
              Envoyer un email
            </Button>
            <div className="text-sm text-muted-foreground mt-4">
              <p><strong>Heures d'ouverture :</strong></p>
              <p>Lun - Ven : 9h - 18h</p>
              <p>Réponse sous 24h</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Questions fréquentes
            </CardTitle>
            <CardDescription>
              Réponses aux questions les plus courantes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-1">Comment analyser un nouveau contenu ?</h4>
              <p className="text-xs text-muted-foreground">
                Utilisez le bouton "Analyser" dans la section contenu et suivez les instructions.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-1">Que signifient les métriques ?</h4>
              <p className="text-xs text-muted-foreground">
                Consultez notre guide des métriques dans la documentation.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-1">Comment exporter mes données ?</h4>
              <p className="text-xs text-muted-foreground">
                Rendez-vous dans Paramètres {'>'}Export pour télécharger vos rapports.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Tutoriels vidéo</CardTitle>
          <CardDescription>Apprenez à utiliser GEO Analyzer avec nos vidéos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="border rounded-lg p-4">
              <div className="bg-gray-100 rounded-lg h-32 mb-3 flex items-center justify-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[8px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1"></div>
                </div>
              </div>
              <h4 className="font-medium mb-1">Premiers pas avec GEO</h4>
              <p className="text-sm text-muted-foreground mb-2">Configuration initiale et tour d'horizon</p>
              <p className="text-xs text-muted-foreground">Durée : 5 min</p>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="bg-gray-100 rounded-lg h-32 mb-3 flex items-center justify-center">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[8px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1"></div>
                </div>
              </div>
              <h4 className="font-medium mb-1">Analyser vos contenus</h4>
              <p className="text-sm text-muted-foreground mb-2">Comment utiliser l'outil d'analyse</p>
              <p className="text-xs text-muted-foreground">Durée : 8 min</p>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="bg-gray-100 rounded-lg h-32 mb-3 flex items-center justify-center">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[8px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1"></div>
                </div>
              </div>
              <h4 className="font-medium mb-1">Interpréter les résultats</h4>
              <p className="text-sm text-muted-foreground mb-2">Comprendre et agir sur vos analyses</p>
              <p className="text-xs text-muted-foreground">Durée : 12 min</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Help;
