import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Video, MessageSquare, Twitter, Users, Copy, Download, Sparkles, Globe, Target, Zap } from "lucide-react";
import { toast } from "sonner";
import { StatsCard } from "@/components/ui/stats-card";

const Content = () => {
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
    }, 2000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success("Contenu copié dans le presse-papiers !");
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Génération de contenu GEO</h2>
          <p className="text-muted-foreground">Créez du contenu optimisé pour votre audience géographique</p>
        </div>
        <Badge variant="outline" className="bg-primary-50 text-primary-700 border-primary-200">
          <Sparkles className="h-3 w-3 mr-1" />
          IA Optimisée
        </Badge>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Score de localisation"
          value="85%"
          icon={Globe}
          variant="success"
          description="Optimisation géographique"
        />
        <StatsCard
          title="Mots-clés régionaux"
          value="12"
          icon={Target}
          variant="info"
          description="Mots-clés ciblés"
        />
        <StatsCard
          title="Optimisation mobile"
          value="Excellent"
          icon={Zap}
          variant="success"
          description="Performance mobile"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulaires de génération */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="article" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="article" className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Article
              </TabsTrigger>
              <TabsTrigger value="video-script" className="flex items-center gap-1">
                <Video className="h-3 w-3" />
                Script
              </TabsTrigger>
              <TabsTrigger value="video-desc" className="flex items-center gap-1">
                <Video className="h-3 w-3" />
                Desc. vidéo
              </TabsTrigger>
              <TabsTrigger value="social-post" className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                Post
              </TabsTrigger>
              <TabsTrigger value="twitter" className="flex items-center gap-1">
                <Twitter className="h-3 w-3" />
                Tweet
              </TabsTrigger>
              <TabsTrigger value="reddit" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Reddit
              </TabsTrigger>
            </TabsList>

            <TabsContent value="article">
              <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary-600" />
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
                        className="border-neutral-200 focus:border-primary-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="article-location">Zone géographique</Label>
                      <Select>
                        <SelectTrigger className="border-neutral-200 focus:border-primary-500">
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
                      className="border-neutral-200 focus:border-primary-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="article-length">Longueur souhaitée</Label>
                    <Select>
                      <SelectTrigger className="border-neutral-200 focus:border-primary-500">
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
                    className="w-full bg-primary-600 hover:bg-primary-700"
                  >
                    {isGenerating ? "Génération en cours..." : "Générer l'article"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="video-script">
              <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-primary-600" />
                    Script de vidéo
                  </CardTitle>
                  <CardDescription>Créez un script engageant pour vos vidéos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="video-title">Titre de la vidéo</Label>
                      <Input 
                        id="video-title" 
                        placeholder="Ex: Top 5 destinations été 2024"
                        className="border-neutral-200 focus:border-primary-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="video-duration">Durée souhaitée</Label>
                      <Select>
                        <SelectTrigger className="border-neutral-200 focus:border-primary-500">
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
                      className="border-neutral-200 focus:border-primary-500"
                    />
                  </div>
                  <Button 
                    onClick={() => handleGenerate("video-script", { 
                      title: (document.getElementById("video-title") as HTMLInputElement)?.value 
                    })}
                    disabled={isGenerating}
                    className="w-full bg-primary-600 hover:bg-primary-700"
                  >
                    {isGenerating ? "Génération en cours..." : "Générer le script"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="video-desc">
              <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-primary-600" />
                    Description de vidéo
                  </CardTitle>
                  <CardDescription>Optimisez vos descriptions YouTube</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="video-desc-title">Titre de la vidéo</Label>
                    <Input 
                      id="video-desc-title" 
                      placeholder="Titre de la vidéo"
                      className="border-neutral-200 focus:border-primary-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="video-desc-points">Points clés à mentionner</Label>
                    <Textarea 
                      id="video-desc-points" 
                      placeholder="Points clés à mentionner"
                      className="border-neutral-200 focus:border-primary-500"
                    />
                  </div>
                  <Button 
                    onClick={() => handleGenerate("video-desc", {})}
                    disabled={isGenerating}
                    className="w-full bg-primary-600 hover:bg-primary-700"
                  >
                    {isGenerating ? "Génération en cours..." : "Générer la description"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="social-post">
              <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary-600" />
                    Publication sociale
                  </CardTitle>
                  <CardDescription>Créez des posts optimisés pour vos réseaux sociaux</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="social-platform">Plateforme</Label>
                      <Select>
                        <SelectTrigger className="border-neutral-200 focus:border-primary-500">
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
                        className="border-neutral-200 focus:border-primary-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="social-topic">Sujet</Label>
                    <Input 
                      id="social-topic" 
                      placeholder="Ex: Offres spéciales été"
                      className="border-neutral-200 focus:border-primary-500"
                    />
                  </div>
                  <Button 
                    onClick={() => handleGenerate("social-post", { 
                      title: (document.getElementById("social-topic") as HTMLInputElement)?.value,
                      location: (document.getElementById("social-location") as HTMLInputElement)?.value
                    })}
                    disabled={isGenerating}
                    className="w-full bg-primary-600 hover:bg-primary-700"
                  >
                    {isGenerating ? "Génération en cours..." : "Générer le post"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="twitter">
              <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Twitter className="h-5 w-5 text-primary-600" />
                    Tweet optimisé
                  </CardTitle>
                  <CardDescription>Créez des tweets engageants</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="twitter-topic">Sujet du tweet</Label>
                    <Input 
                      id="twitter-topic" 
                      placeholder="Sujet du tweet"
                      className="border-neutral-200 focus:border-primary-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter-hashtags">Hashtags cibles</Label>
                    <Input 
                      id="twitter-hashtags" 
                      placeholder="Hashtags cibles"
                      className="border-neutral-200 focus:border-primary-500"
                    />
                  </div>
                  <Button 
                    onClick={() => handleGenerate("twitter", {})}
                    disabled={isGenerating}
                    className="w-full bg-primary-600 hover:bg-primary-700"
                  >
                    {isGenerating ? "Génération en cours..." : "Générer le tweet"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reddit">
              <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary-600" />
                    Post Reddit
                  </CardTitle>
                  <CardDescription>Créez des posts pour les communautés Reddit</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reddit-subreddit">Subreddit cible</Label>
                    <Input 
                      id="reddit-subreddit" 
                      placeholder="Subreddit cible"
                      className="border-neutral-200 focus:border-primary-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reddit-title">Titre du post</Label>
                    <Input 
                      id="reddit-title" 
                      placeholder="Titre du post"
                      className="border-neutral-200 focus:border-primary-500"
                    />
                  </div>
                  <Button 
                    onClick={() => handleGenerate("reddit", {})}
                    disabled={isGenerating}
                    className="w-full bg-primary-600 hover:bg-primary-700"
                  >
                    {isGenerating ? "Génération en cours..." : "Générer le post Reddit"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Aperçu du contenu généré */}
        <div className="space-y-6">
          <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary-600" />
                Contenu généré
              </CardTitle>
              <CardDescription>Aperçu et actions</CardDescription>
            </CardHeader>
            <CardContent>
              {generatedContent ? (
                <div className="space-y-4">
                  <div className="bg-neutral-50 p-4 rounded-lg max-h-96 overflow-y-auto border border-neutral-200">
                    <pre className="whitespace-pre-wrap text-sm text-neutral-700">{generatedContent}</pre>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={copyToClipboard}
                      className="bg-primary-600 hover:bg-primary-700"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copier
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-neutral-200 hover:bg-neutral-50"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Exporter
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-neutral-500 py-8">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                  <p>Sélectionnez un type de contenu et cliquez sur "Générer" pour voir le résultat ici.</p>
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
