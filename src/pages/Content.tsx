import React, { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Video, MessageSquare, Twitter, Users, Copy, Download, Globe, Target, Zap, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { StatsCard } from "@/components/ui/stats-card";

const Content = () => {
  usePageTitle('Contenu');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [contentType, setContentType] = useState<string>("");

  const handleGenerate = async (type: string, formData: any) => {
    setIsGenerating(true);
    setContentType(type);
    
    // Simulate content generation
    setTimeout(() => {
      let content = "";
      switch (type) {
        case "article":
          content = `# ${formData.title || "Titre de l'article"}

## Introduction
Découvrez les meilleures destinations pour votre prochain voyage avec des conseils optimisés pour votre région.

## Contenu principal
[Contenu généré automatiquement basé sur les mots-clés: ${formData.keywords || "voyage, destination"}]

## Conclusion
Planifiez dès maintenant votre prochaine aventure avec nos recommandations personnalisées.`;
          break;
        case "video-script":
          content = `SCRIPT VIDÉO - ${formData.title || "Titre de la vidéo"}

[INTRO - 0:00-0:15]
Salut ! Aujourd'hui, on va découvrir...

[DÉVELOPPEMENT - 0:15-2:30]
Les points clés à retenir...

[CONCLUSION - 2:30-3:00]
N'oubliez pas de vous abonner !`;
          break;
        case "social-post":
          content = `🌟 ${formData.title || "Votre prochaine destination vous attend !"}

Découvrez les secrets des voyageurs expérimentés pour économiser jusqu'à 40% sur vos billets.

#voyage #économies #astucevoyage #${formData.location || "france"}`;
          break;
        default:
          content = "Contenu généré avec succès !";
      }
      
      setGeneratedContent(content);
      setIsGenerating(false);
      toast.success("Contenu généré avec succès !");
    }, 1500);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success("Contenu copié dans le presse-papiers !");
  };

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 md:p-8 bg-background text-foreground min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Génération de contenu GEO</h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1">Créez du contenu optimisé pour votre audience géographique et vos personas IA</p>
        </div>
        <Badge variant="secondary" className="self-start sm:self-auto gap-1.5 py-1 px-3">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Moteur Génératif IA
        </Badge>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <StatsCard
          title="Score de localisation"
          value="85%"
          icon={Globe}
          description="Optimisation géographique"
        />
        <StatsCard
          title="Mots-clés régionaux"
          value="12"
          icon={Target}
          description="Mots-clés ciblés"
        />
        <StatsCard
          title="Optimisation mobile"
          value="Excellent"
          icon={Zap}
          description="Performance mobile"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulaires de génération */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="article" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto p-1 bg-muted">
              <TabsTrigger value="article" className="flex items-center gap-1.5 py-2 text-xs sm:text-sm">
                <FileText className="h-3.5 w-3.5" />
                Article
              </TabsTrigger>
              <TabsTrigger value="video-script" className="flex items-center gap-1.5 py-2 text-xs sm:text-sm">
                <Video className="h-3.5 w-3.5" />
                Script
              </TabsTrigger>
              <TabsTrigger value="video-desc" className="flex items-center gap-1.5 py-2 text-xs sm:text-sm">
                <Video className="h-3.5 w-3.5" />
                Desc.
              </TabsTrigger>
              <TabsTrigger value="social-post" className="flex items-center gap-1.5 py-2 text-xs sm:text-sm">
                <MessageSquare className="h-3.5 w-3.5" />
                Post
              </TabsTrigger>
              <TabsTrigger value="twitter" className="flex items-center gap-1.5 py-2 text-xs sm:text-sm">
                <Twitter className="h-3.5 w-3.5" />
                Tweet
              </TabsTrigger>
              <TabsTrigger value="reddit" className="flex items-center gap-1.5 py-2 text-xs sm:text-sm">
                <Users className="h-3.5 w-3.5" />
                Reddit
              </TabsTrigger>
            </TabsList>

            <TabsContent value="article">
              <Card className="border border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Génération d'article
                  </CardTitle>
                  <CardDescription>Créez un article de blog optimisé pour votre zone géographique</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="article-title">Titre de l'article</Label>
                      <Input 
                        id="article-title" 
                        placeholder="Ex: Guide voyage Paris 2024"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="article-location">Zone géographique</Label>
                      <Select defaultValue="france">
                        <SelectTrigger id="article-location">
                          <SelectValue placeholder="Sélectionner une région" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="france">France</SelectItem>
                          <SelectItem value="europe">Europe</SelectItem>
                          <SelectItem value="mondial">Mondial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="article-keywords">Mots-clés cibles</Label>
                    <Input 
                      id="article-keywords" 
                      placeholder="voyage, paris, guide, 2024"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="article-length">Longueur souhaitée</Label>
                    <Select defaultValue="moyen">
                      <SelectTrigger id="article-length">
                        <SelectValue placeholder="Sélectionner la longueur" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="court">Court (300-500 mots)</SelectItem>
                        <SelectItem value="moyen">Moyen (500-1000 mots)</SelectItem>
                        <SelectItem value="long">Long (1000+ mots)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={() => handleGenerate("article", { 
                      title: (document.getElementById("article-title") as HTMLInputElement)?.value,
                      keywords: (document.getElementById("article-keywords") as HTMLInputElement)?.value
                    })}
                    disabled={isGenerating}
                    className="w-full gap-2"
                  >
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {isGenerating ? "Génération en cours..." : "Générer l'article"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="video-script">
              <Card className="border border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Video className="h-5 w-5 text-primary" />
                    Script de vidéo
                  </CardTitle>
                  <CardDescription>Créez un script engageant pour vos vidéos YouTube ou TikTok</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="video-title">Titre de la vidéo</Label>
                      <Input 
                        id="video-title" 
                        placeholder="Ex: Top 5 destinations été 2024"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="video-duration">Durée souhaitée</Label>
                      <Select defaultValue="court">
                        <SelectTrigger id="video-duration">
                          <SelectValue placeholder="Durée" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="court">Court (1-3 min)</SelectItem>
                          <SelectItem value="moyen">Moyen (3-7 min)</SelectItem>
                          <SelectItem value="long">Long (7+ min)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="video-audience">Public cible</Label>
                    <Input 
                      id="video-audience" 
                      placeholder="Ex: Jeunes voyageurs français"
                    />
                  </div>
                  <Button 
                    onClick={() => handleGenerate("video-script", { 
                      title: (document.getElementById("video-title") as HTMLInputElement)?.value 
                    })}
                    disabled={isGenerating}
                    className="w-full gap-2"
                  >
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {isGenerating ? "Génération en cours..." : "Générer le script"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="video-desc">
              <Card className="border border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Video className="h-5 w-5 text-primary" />
                    Description de vidéo
                  </CardTitle>
                  <CardDescription>Optimisez vos descriptions avec timestamps et mots-clés</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="video-desc-title">Titre de la vidéo</Label>
                    <Input 
                      id="video-desc-title" 
                      placeholder="Titre de la vidéo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="video-desc-points">Points clés à mentionner</Label>
                    <Textarea 
                      id="video-desc-points" 
                      placeholder="Points clés à mentionner..."
                      className="min-h-[100px]"
                    />
                  </div>
                  <Button 
                    onClick={() => handleGenerate("video-desc", {})}
                    disabled={isGenerating}
                    className="w-full gap-2"
                  >
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {isGenerating ? "Génération en cours..." : "Générer la description"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="social-post">
              <Card className="border border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Publication sociale
                  </CardTitle>
                  <CardDescription>Créez des posts optimisés pour vos réseaux sociaux</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="social-platform">Plateforme</Label>
                      <Select defaultValue="linkedin">
                        <SelectTrigger id="social-platform">
                          <SelectValue placeholder="Choisir la plateforme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="social-location">Localisation</Label>
                      <Input 
                        id="social-location" 
                        placeholder="Ex: France, Paris"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="social-topic">Sujet</Label>
                    <Input 
                      id="social-topic" 
                      placeholder="Ex: Offres spéciales été"
                    />
                  </div>
                  <Button 
                    onClick={() => handleGenerate("social-post", { 
                      title: (document.getElementById("social-topic") as HTMLInputElement)?.value,
                      location: (document.getElementById("social-location") as HTMLInputElement)?.value
                    })}
                    disabled={isGenerating}
                    className="w-full gap-2"
                  >
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {isGenerating ? "Génération en cours..." : "Générer le post"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="twitter">
              <Card className="border border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Twitter className="h-5 w-5 text-primary" />
                    Post X (Twitter)
                  </CardTitle>
                  <CardDescription>Créez des threads et tweets percutants</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="twitter-topic">Sujet du post</Label>
                    <Input 
                      id="twitter-topic" 
                      placeholder="Ex: 3 astuces pour voyager moins cher"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter-hashtags">Hashtags cibles</Label>
                    <Input 
                      id="twitter-hashtags" 
                      placeholder="#voyage #astuce #bonplan"
                    />
                  </div>
                  <Button 
                    onClick={() => handleGenerate("twitter", {})}
                    disabled={isGenerating}
                    className="w-full gap-2"
                  >
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {isGenerating ? "Génération en cours..." : "Générer le post"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reddit">
              <Card className="border border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Post Reddit
                  </CardTitle>
                  <CardDescription>Créez des posts adaptés aux codes des communautés Reddit</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reddit-subreddit">Subreddit cible</Label>
                    <Input 
                      id="reddit-subreddit" 
                      placeholder="r/voyage, r/france"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reddit-title">Titre du post</Label>
                    <Input 
                      id="reddit-title" 
                      placeholder="Titre accrocheur et informatif"
                    />
                  </div>
                  <Button 
                    onClick={() => handleGenerate("reddit", {})}
                    disabled={isGenerating}
                    className="w-full gap-2"
                  >
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {isGenerating ? "Génération en cours..." : "Générer le post Reddit"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Aperçu du contenu généré */}
        <div className="space-y-6">
          <Card className="border border-border bg-card shadow-sm sticky top-20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Contenu généré
              </CardTitle>
              <CardDescription>Aperçu et copie en un clic</CardDescription>
            </CardHeader>
            <CardContent>
              {generatedContent ? (
                <div className="space-y-4">
                  <div className="bg-muted/40 p-4 rounded-xl max-h-[420px] overflow-y-auto border border-border">
                    <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">{generatedContent}</pre>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={copyToClipboard}
                      className="gap-1.5 flex-1"
                    >
                      <Copy className="h-4 w-4" />
                      Copier
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="gap-1.5"
                    >
                      <Download className="h-4 w-4" />
                      Exporter
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12 px-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">Aucun contenu généré</p>
                  <p className="text-xs text-muted-foreground">Sélectionnez un format et remplissez le formulaire pour générer votre premier texte.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Content;
