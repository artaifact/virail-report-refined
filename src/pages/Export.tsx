import { useState } from "react";
import { usePageTitle } from '@/hooks/usePageTitle';
import { Download, Share2, FileText, Mail, Copy, ExternalLink, Calendar, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useReports, useReport, getLatestReportId } from '@/hooks/useReports';
import { generateFullReportPdf } from '@/services/reportPdfService';

const Export = () => {
  usePageTitle('Export');
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

  const { reports } = useReports();
  const latestReportId = getLatestReportId(reports);
  const { report: reportData } = useReport(latestReportId);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPDF = async (type: string) => {
    if (!reportData) {
      toast({
        title: "Aucun rapport disponible",
        description: "Veuillez d'abord générer ou sélectionner un rapport dans le tableau de bord.",
        variant: "destructive",
      });
      return;
    }

    setIsExportingPdf(true);
    toast({
      title: "Génération en cours",
      description: `Préparation du rapport ${type} en PDF...`,
    });

    try {
      await generateFullReportPdf(reportData, null, {
        includeCitations: type === 'complet' || type === 'resume',
        includeRecommendations: type === 'complet' || type === 'recommandations',
        includeCompetition: type === 'complet' || type === 'competition',
      });
      toast({
        title: "Rapport PDF prêt",
        description: `Le document ${type} a été généré avec succès.`,
      });
    } catch (err: any) {
      toast({
        title: "Erreur d'exportation",
        description: err?.message || "Impossible de générer le document PDF.",
        variant: "destructive",
      });
    } finally {
      setIsExportingPdf(false);
    }
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
    <div className="flex-1 space-y-6 p-4 sm:p-6 md:p-8 bg-background min-h-screen text-foreground">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Export & Partage</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Exportez et partagez vos rapports d'optimisation GEO</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Export PDF */}
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Export PDF</CardTitle>
                <CardDescription>
                  Téléchargez vos rapports au format PDF haute fidélité
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-2.5">
              <Button 
                onClick={() => handleExportPDF("complet")}
                disabled={isExportingPdf}
                className="w-full justify-start gap-2 shadow-xs"
              >
                {isExportingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Rapport complet GEO
              </Button>
              
              <Button 
                onClick={() => handleExportPDF("resume")}
                variant="outline" 
                disabled={isExportingPdf}
                className="w-full justify-start gap-2"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                Résumé exécutif
              </Button>
              
              <Button 
                onClick={() => handleExportPDF("recommandations")}
                variant="outline" 
                disabled={isExportingPdf}
                className="w-full justify-start gap-2"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                Plan d'actions
              </Button>

              <Button 
                onClick={() => handleExportPDF("competition")}
                variant="outline" 
                disabled={isExportingPdf}
                className="w-full justify-start gap-2"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                Analyse concurrentielle
              </Button>
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">Options d'export</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-details" className="text-sm cursor-pointer">Inclure les détails techniques</Label>
                  <Switch id="include-details" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-charts" className="text-sm cursor-pointer">Inclure les graphiques</Label>
                  <Switch id="include-charts" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-recommendations" className="text-sm cursor-pointer">Inclure les recommandations</Label>
                  <Switch id="include-recommendations" defaultChecked />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Partage par lien */}
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <Share2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Partage par lien</CardTitle>
                <CardDescription>
                  Créez un lien sécurisé pour partager vos rapports en ligne
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Durée de validité</Label>
              <Select defaultValue="7days">
                <SelectTrigger className="w-full">
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

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="password-protected" className="text-sm cursor-pointer">Protégé par mot de passe</Label>
                <Switch id="password-protected" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="download-allowed" className="text-sm cursor-pointer">Autoriser le téléchargement</Label>
                <Switch id="download-allowed" defaultChecked />
              </div>
            </div>

            <Button 
              onClick={handleGenerateLink}
              disabled={isGeneratingLink}
              className="w-full mt-2"
            >
              {isGeneratingLink ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Génération en cours...
                </>
              ) : (
                "Générer le lien de partage"
              )}
            </Button>

            {shareableLink && (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg border border-border">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lien généré :</Label>
                <div className="flex gap-2">
                  <Input 
                    value={shareableLink} 
                    readOnly 
                    className="text-sm font-mono bg-background"
                  />
                  <Button 
                    size="icon" 
                    variant="outline"
                    onClick={handleCopyLink}
                    title="Copier le lien"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="outline"
                    onClick={() => window.open(shareableLink, '_blank')}
                    title="Ouvrir le lien"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Envoi par email */}
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Envoi par email</CardTitle>
                <CardDescription>
                  Envoyez directement vos rapports à vos collaborateurs ou clients
                </CardDescription>
              </div>
            </div>
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
                defaultValue="Rapport d'analyse GEO - Viraill"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-format">Format</Label>
              <Select defaultValue="pdf">
                <SelectTrigger id="email-format" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF complet</SelectItem>
                  <SelectItem value="summary">Résumé PDF</SelectItem>
                  <SelectItem value="link">Lien de partage sécurisé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleSendByEmail}
              className="w-full"
            >
              <Mail className="h-4 w-4 mr-2" />
              Envoyer par email
            </Button>
          </CardContent>
        </Card>

        {/* Rapports programmés */}
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Rapports programmés</CardTitle>
                <CardDescription>
                  Automatisez la génération et l'envoi de vos rapports périodiques
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Fréquence</Label>
              <Select defaultValue="weekly">
                <SelectTrigger className="w-full">
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
                placeholder="destinataire@entreprise.com"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <Label htmlFor="auto-enabled" className="text-sm cursor-pointer">Rapports automatiques activés</Label>
              <Switch id="auto-enabled" />
            </div>

            <div className="p-3.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <p className="text-sm text-foreground">
                <span className="font-semibold text-amber-700 dark:text-amber-400">Prochaine génération :</span> Lundi prochain à 09:00 (UTC)
              </p>
            </div>

            <Button 
              variant="outline" 
              className="w-full"
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
