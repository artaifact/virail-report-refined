
import { useState } from "react";
import { Download, Share2, FileText, Mail, Copy, ExternalLink, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const Export = () => {
  const [shareableLink, setShareableLink] = useState("");
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState("");
  const { toast } = useToast();

  const handleGenerateLink = async () => {
    setIsGeneratingLink(true);
    
    // Simulation de génération de lien
    setTimeout(() => {
      const generatedLink = `https://llmo.app/shared/report-${Math.random().toString(36).substr(2, 9)}`;
      setShareableLink(generatedLink);
      setIsGeneratingLink(false);
      
      toast({
        title: "Lien généré",
        description: "Le lien de partage a été créé avec succès.",
      });
    }, 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    toast({
      title: "Lien copié",
      description: "Le lien a été copié dans votre presse-papier.",
    });
  };

  const handleExportPDF = (type: string) => {
    toast({
      title: "Export en cours",
      description: `Génération du rapport ${type} en PDF...`,
    });
  };

  const handleSendByEmail = () => {
    if (!emailRecipients.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir au moins une adresse email.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Email envoyé",
      description: `Le rapport a été envoyé à ${emailRecipients.split(',').length} destinataire(s).`,
    });
    setEmailRecipients("");
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-gradient-to-br from-blue-50 via-white to-blue-100 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Export & Partage</h2>
          <p className="text-gray-600 mt-1">Exportez et partagez vos rapports GEO</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Export PDF */}
        <Card className="bg-white shadow-sm border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-600" />
              Export PDF
            </CardTitle>
            <CardDescription>
              Téléchargez vos rapports au format PDF
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <Button 
                onClick={() => handleExportPDF("complet")}
                className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <FileText className="h-4 w-4" />
                Rapport complet GEO
              </Button>
              
              <Button 
                onClick={() => handleExportPDF("resume")}
                variant="outline" 
                className="w-full justify-start gap-2"
              >
                <FileText className="h-4 w-4" />
                Résumé exécutif
              </Button>
              
              <Button 
                onClick={() => handleExportPDF("recommandations")}
                variant="outline" 
                className="w-full justify-start gap-2"
              >
                <FileText className="h-4 w-4" />
                Plan d'actions
              </Button>

              <Button 
                onClick={() => handleExportPDF("competition")}
                variant="outline" 
                className="w-full justify-start gap-2"
              >
                <FileText className="h-4 w-4" />
                Analyse concurrentielle
              </Button>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Options d'export</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-details">Inclure les détails techniques</Label>
                  <Switch id="include-details" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-charts">Inclure les graphiques</Label>
                  <Switch id="include-charts" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-recommendations">Inclure les recommandations</Label>
                  <Switch id="include-recommendations" defaultChecked />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Partage par lien */}
        <Card className="bg-white shadow-sm border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-green-600" />
              Partage par lien
            </CardTitle>
            <CardDescription>
              Créez un lien sécurisé pour partager vos rapports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Durée de validité</Label>
              <Select defaultValue="7days">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1day">24 heures</SelectItem>
                  <SelectItem value="7days">7 jours</SelectItem>
                  <SelectItem value="30days">30 jours</SelectItem>
                  <SelectItem value="90days">90 jours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="password-protected">Protégé par mot de passe</Label>
                <Switch id="password-protected" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="download-allowed">Autoriser le téléchargement</Label>
                <Switch id="download-allowed" defaultChecked />
              </div>
            </div>

            <Button 
              onClick={handleGenerateLink}
              disabled={isGeneratingLink}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isGeneratingLink ? "Génération..." : "Générer le lien de partage"}
            </Button>

            {shareableLink && (
              <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                <Label className="text-sm font-medium">Lien généré :</Label>
                <div className="flex gap-2">
                  <Input 
                    value={shareableLink} 
                    readOnly 
                    className="text-sm"
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleCopyLink}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => window.open(shareableLink, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Envoi par email */}
        <Card className="bg-white shadow-sm border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-purple-600" />
              Envoi par email
            </CardTitle>
            <CardDescription>
              Envoyez directement vos rapports par email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-recipients">Destinataires (séparés par des virgules)</Label>
              <Input
                id="email-recipients"
                placeholder="email1@exemple.com, email2@exemple.com"
                value={emailRecipients}
                onChange={(e) => setEmailRecipients(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-subject">Objet du message</Label>
              <Input
                id="email-subject"
                defaultValue="Rapport d'analyse GEO"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-format">Format</Label>
              <Select defaultValue="pdf">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF complet</SelectItem>
                  <SelectItem value="summary">Résumé PDF</SelectItem>
                  <SelectItem value="link">Lien de partage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleSendByEmail}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Envoyer par email
            </Button>
          </CardContent>
        </Card>

        {/* Rapports programmés */}
        <Card className="bg-white shadow-sm border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              Rapports programmés
            </CardTitle>
            <CardDescription>
              Automatisez l'envoi de vos rapports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Fréquence</Label>
              <Select defaultValue="weekly">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Quotidien</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                  <SelectItem value="quarterly">Trimestriel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="auto-recipients">Destinataires automatiques</Label>
              <Input
                id="auto-recipients"
                placeholder="emails pour envoi automatique"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-enabled">Rapports automatiques activés</Label>
                <Switch id="auto-enabled" />
              </div>
            </div>

            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-800">
                <strong>Prochaine génération :</strong> Lundi 10 juin 2025 à 09:00
              </p>
            </div>

            <Button 
              variant="outline" 
              className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              Configurer la programmation
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Export;
