import React, { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Info, 
  Download, 
  Edit, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  BarChart3, 
  MoreVertical, 
  X, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Sparkles
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const OptimizationAgent = () => {
  usePageTitle('Agent d\'optimisation');
  // Données Topics initiales
  const initialTopics = [
    { name: 'Obéissance & Comportement Canin', percentage: 36, prompts: 9, color: 'purple' },
    { name: 'Éducation des Chiots', percentage: 32, prompts: 8, color: 'green' },
    { name: 'Formation & Coaching en Ligne', percentage: 32, prompts: 8, color: 'orange' }
  ];
  
  const [dateFilter, setDateFilter] = useState('15 nov - 21 nov');
  const [regionFilter, setRegionFilter] = useState('France');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<{text: string, keyword: string, topic: string} | null>(null);
  const [isEditTopicsOpen, setIsEditTopicsOpen] = useState(false);
  const [topics, setTopics] = useState(initialTopics);
  const [editableTopics, setEditableTopics] = useState(initialTopics);
  
  const handleOpenEditTopics = () => {
    setEditableTopics([...topics]);
    setIsEditTopicsOpen(true);
  };
  
  const handleSaveTopics = () => {
    setTopics([...editableTopics]);
    setIsEditTopicsOpen(false);
  };
  
  const handleDeleteTopic = (index: number) => {
    setEditableTopics(editableTopics.filter((_, i) => i !== index));
  };
  
  const handleAddTopic = () => {
    const colors = ['purple', 'green', 'orange', 'teal', 'blue'];
    const randomColor = colors[editableTopics.length % colors.length];
    setEditableTopics([
      ...editableTopics,
      { name: 'Nouveau Sujet', percentage: 0, prompts: 0, color: randomColor }
    ]);
  };

  // Données Brand Relevance
  const brandRelevance = [
    { tag: 'Lié à la Catégorie', percentage: 100, prompts: 25, color: 'teal' },
    { tag: 'Lié à la Marque', percentage: 0, prompts: 0, color: 'purple' }
  ];

  // Données Prompts
  const promptsData = [
    { 
      topic: 'Éducation des Chiots', 
      prompts: 8, 
      color: 'green', 
      relatedKeyword: '', 
      volume: 0, 
      visibility: 0, 
      citation: 0,
      individualPrompts: [
        { text: 'Quelles sont les meilleures méthodes pour éduquer un chiot à la cage ?', keyword: 'éducation chiot cage', volume: 0, visibility: 0, citation: 0 },
        { text: 'Comment apprendre la propreté à mon chiot ?', keyword: 'propreté chiot', volume: 0, visibility: 0, citation: 0 },
        { text: 'Quel est le meilleur cours en ligne pour chiot ?', keyword: 'cours chiot en ligne', volume: 0, visibility: 0, citation: 0 },
        { text: 'Comment socialiser un chiot ?', keyword: 'socialisation chiot', volume: 0, visibility: 0, citation: 0 },
        { text: 'Quand dois-je commencer l\'éducation de mon chiot ?', keyword: 'âge éducation chiot', volume: 0, visibility: 0, citation: 0 },
        { text: 'Quelles friandises sont les meilleures pour l\'éducation d\'un chiot ?', keyword: 'friandises éducation chiot', volume: 0, visibility: 0, citation: 0 },
        { text: 'Comment empêcher un chiot de mordre ?', keyword: 'chiot morsure éducation', volume: 0, visibility: 0, citation: 0 },
        { text: 'Recommandations pour un planning d\'éducation de chiot', keyword: 'planning éducation chiot', volume: 0, visibility: 0, citation: 0 }
      ]
    },
    { 
      topic: 'Obéissance & Comportement Canin', 
      prompts: 9, 
      color: 'purple', 
      relatedKeyword: '', 
      volume: 0, 
      visibility: 0, 
      citation: 0,
      individualPrompts: [
        { text: 'Comment apprendre à un chien à s\'asseoir ?', keyword: 'chien assis éducation', volume: 0, visibility: 0, citation: 0 },
        { text: 'Meilleure façon d\'arrêter les aboiements d\'un chien ?', keyword: 'arrêter aboiements chien', volume: 0, visibility: 0, citation: 0 },
        { text: 'Techniques d\'éducation à la laisse', keyword: 'éducation laisse chien', volume: 0, visibility: 0, citation: 0 },
        { text: 'Comment apprendre à un chien à rester ?', keyword: 'chien rester commande', volume: 0, visibility: 0, citation: 0 },
        { text: 'Solutions aux problèmes de comportement canin', keyword: 'problèmes comportement chien', volume: 0, visibility: 0, citation: 0 },
        { text: 'Méthodes d\'éducation pour chien agressif', keyword: 'éducation chien agressif', volume: 0, visibility: 0, citation: 0 },
        { text: 'Comment apprendre à un chien à revenir quand on l\'appelle ?', keyword: 'rappel chien éducation', volume: 0, visibility: 0, citation: 0 },
        { text: 'Cours d\'obéissance canine près de chez moi', keyword: 'cours obéissance chien', volume: 0, visibility: 0, citation: 0 },
        { text: 'Meilleures commandes d\'éducation canine', keyword: 'commandes éducation chien', volume: 0, visibility: 0, citation: 0 }
      ]
    },
    { 
      topic: 'Formation & Coaching en Ligne', 
      prompts: 8, 
      color: 'orange', 
      relatedKeyword: '', 
      volume: 0, 
      visibility: 0, 
      citation: 0,
      individualPrompts: [
        { text: 'Meilleurs programmes d\'éducation canine en ligne ?', keyword: 'éducation chien en ligne', volume: 0, visibility: 0, citation: 0 },
        { text: 'Sessions d\'éducation canine virtuelles', keyword: 'éducation chien virtuelle', volume: 0, visibility: 0, citation: 0 },
        { text: 'Cours vidéo d\'éducation canine', keyword: 'vidéos éducation chien', volume: 0, visibility: 0, citation: 0 },
        { text: 'Cours d\'éducation pour chiot en ligne', keyword: 'cours chiot en ligne', volume: 0, visibility: 0, citation: 0 },
        { text: 'Recommandations d\'applications d\'éducation canine', keyword: 'application éducation chien', volume: 0, visibility: 0, citation: 0 },
        { text: 'Consultation comportementale canine à distance', keyword: 'éducation chien à distance', volume: 0, visibility: 0, citation: 0 },
        { text: 'Meilleures chaînes YouTube d\'éducation canine', keyword: 'youtube éducation chien', volume: 0, visibility: 0, citation: 0 },
        { text: 'Certification d\'éducation canine en ligne', keyword: 'certification éducation chien', volume: 0, visibility: 0, citation: 0 }
      ]
    }
  ];

  const toggleTopic = (topic: string) => {
    setExpandedTopic(expandedTopic === topic ? null : topic);
  };

  const handlePromptClick = (promptText: string, keyword: string, topic: string) => {
    setSelectedPrompt({ text: promptText, keyword, topic });
  };

  // Données pour la vue détaillée
  const leaderboardData = [
    { topic: 'Lauradogs', mentions: 0, visibility: 0 },
    { topic: 'Ruffwear', mentions: 0, visibility: 0 },
    { topic: 'Wild One', mentions: 0, visibility: 0 },
    { topic: 'Mungoandmaud', mentions: 0, visibility: 0 },
    { topic: 'Hurtta', mentions: 0, visibility: 0 }
  ];

  const platformData = [
    { platform: 'ChatGPT', mentionRate: 0, logo: '🤖' },
    { platform: 'Gemini', mentionRate: 0, logo: '💎' },
    { platform: 'Perplexity', mentionRate: 0, logo: '🔍' },
    { platform: 'Mode IA', mentionRate: 0, logo: '✨' }
  ];

  const answerHistory = [
    {
      date: '21 nov 2025',
      platform: 'ChatGPT',
      logo: '🤖',
      answerPreview: "Voici un guide complet et joyeux pour l'éducation à la cage de votre chiot—pensez à une tanière confortable avec un peu d'esprit canin et zéro stress : **1. Choisissez la bonne...",
      mentioned: false,
      competitors: false
    }
  ];

  const getColorClass = (color: string, type: 'indicator' | 'dot' = 'indicator') => {
    const colors = {
      purple: 'bg-purple-500',
      green: 'bg-emerald-500',
      orange: 'bg-amber-500',
      teal: 'bg-teal-500',
      blue: 'bg-blue-500'
    };
    return colors[color as keyof typeof colors] || 'bg-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header avec titre et filtres */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Prompts & Sujets</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Explorez les sujets et prompts qui génèrent la visibilité dans les moteurs de réponse et agents IA.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15 nov - 21 nov">15 nov - 21 nov</SelectItem>
                  <SelectItem value="8 nov - 14 nov">8 nov - 14 nov</SelectItem>
                  <SelectItem value="1 nov - 7 nov">1 nov - 7 nov</SelectItem>
                </SelectContent>
              </Select>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="France">France</SelectItem>
                  <SelectItem value="États-Unis">États-Unis</SelectItem>
                  <SelectItem value="Royaume-Uni">Royaume-Uni</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Section principale avec Topics et Brand Relevance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Panel Topics */}
          <Card className="border border-border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-foreground">Sujets Principaux</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Sujet</TableHead>
                    <TableHead className="text-right">% du total</TableHead>
                    <TableHead className="text-right">Prompts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topics.map((topic, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${getColorClass(topic.color)}`}></span>
                          <span className="text-sm font-medium text-foreground">{topic.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{topic.percentage}%</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">{topic.prompts}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Panel Brand Relevance */}
          <Card className="border border-border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-foreground">Pertinence de la Marque</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Tag</TableHead>
                    <TableHead className="text-right">% du total</TableHead>
                    <TableHead className="text-right">Prompts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brandRelevance.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${getColorClass(item.color)}`}></span>
                          <span className="text-sm font-medium text-foreground">{item.tag}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{item.percentage}%</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">{item.prompts}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Section Prompts */}
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
              <CardTitle className="text-lg font-semibold text-foreground">Détail des Prompts</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Exporter CSV
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={handleOpenEditTopics}>
                  <Edit className="h-4 w-4" />
                  Modifier les Sujets
                </Button>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ajouter un Prompt
                </Button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher des prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Sujets / Prompts</TableHead>
                    <TableHead>Mot-clé Associé</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Visibilité</TableHead>
                    <TableHead>Citation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promptsData.map((prompt, index) => (
                    <React.Fragment key={index}>
                      {/* Ligne du topic principal */}
                      <TableRow 
                        className="cursor-pointer hover:bg-muted/50 transition-colors font-medium"
                        onClick={() => toggleTopic(prompt.topic)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${getColorClass(prompt.color)}`}></span>
                            <span className="text-foreground">{prompt.topic}</span>
                            <Badge variant="secondary" className="ml-1 text-xs">
                              {prompt.prompts} prompts
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{prompt.relatedKeyword || '—'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={prompt.volume} className="w-24 h-2" />
                            <span className="text-xs font-mono text-muted-foreground">{prompt.volume}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={prompt.visibility} className="w-24 h-2" />
                            <span className="text-xs font-mono text-muted-foreground">{prompt.visibility}%</span>
                            {expandedTopic === prompt.topic ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground ml-1" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={prompt.citation} className="w-24 h-2" />
                            <span className="text-xs font-mono text-muted-foreground">{prompt.citation}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {/* Lignes des prompts individuels si le topic est expandé */}
                      {expandedTopic === prompt.topic && prompt.individualPrompts?.map((individualPrompt, promptIndex) => (
                        <TableRow key={promptIndex} className="bg-muted/20 hover:bg-muted/40 transition-colors border-l-2 border-l-primary">
                          <TableCell className="pl-8">
                            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                              <Checkbox />
                              <span 
                                className="text-sm text-foreground cursor-pointer hover:text-primary transition-colors font-normal"
                                onClick={() => handlePromptClick(individualPrompt.text, individualPrompt.keyword, prompt.topic)}
                              >
                                {individualPrompt.text}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono text-muted-foreground">{individualPrompt.keyword}</span>
                              <Badge variant="outline" className="text-xs">
                                Catégorie
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm font-mono text-muted-foreground">
                              <BarChart3 className="h-3.5 w-3.5" />
                              <span>{individualPrompt.volume}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={individualPrompt.visibility} className="w-24 h-2" />
                              <span className="text-xs font-mono text-muted-foreground">{individualPrompt.visibility}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={individualPrompt.citation} className="w-24 h-2" />
                              <span className="text-xs font-mono text-muted-foreground">{individualPrompt.citation}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog pour la vue détaillée du prompt */}
      <Dialog open={selectedPrompt !== null} onOpenChange={() => setSelectedPrompt(null)}>
        <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto p-0 bg-card border border-border text-foreground" hideCloseButton={true}>
          {selectedPrompt && (
            <div>
              {/* Header */}
              <div className="border-b border-border p-4 sm:p-6 bg-muted/20 relative">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setSelectedPrompt(null)}
                  className="absolute top-4 right-4 h-8 w-8 rounded-full"
                  aria-label="Fermer"
                >
                  <X className="h-4 w-4" />
                </Button>
                
                <div className="flex flex-col sm:flex-row items-start justify-between pr-12 gap-3">
                  <div className="flex-1 sm:pr-6">
                    <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2">{selectedPrompt.text}</h2>
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="text-muted-foreground">Mot-clé Associé :</span>
                      <Badge variant="secondary" className="font-mono">
                        {selectedPrompt.keyword}
                      </Badge>
                      <Badge variant="outline" className="border-primary/30 text-primary">
                        Catégorie Liée
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-normal">
                      {regionFilter}
                    </Badge>
                    <Badge variant="outline" className="text-xs font-normal">
                      {dateFilter}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-6">
                {/* Leaderboard & Mention Rate */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Leaderboard */}
                  <Card className="border border-border bg-card shadow-sm">
                    <CardHeader className="pb-3 border-b border-border">
                      <CardTitle className="text-base font-semibold text-foreground">Classement des Marques</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead>Sujet</TableHead>
                            <TableHead className="text-right">Mentions</TableHead>
                            <TableHead className="text-right">Visibilité</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leaderboardData.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium text-foreground">{item.topic}</TableCell>
                              <TableCell className="text-right font-mono">{item.mentions}</TableCell>
                              <TableCell className="text-right font-mono font-semibold">{item.visibility}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {/* Mention Rate by Platform */}
                  <Card className="border border-border bg-card shadow-sm">
                    <CardHeader className="pb-3 border-b border-border">
                      <CardTitle className="text-base font-semibold text-foreground">Taux de Mention par Moteur IA</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead>Plateforme</TableHead>
                            <TableHead className="text-right">Taux de Mention</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {platformData.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span>{item.logo}</span>
                                  <span className="text-sm font-medium text-foreground">{item.platform}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-mono font-semibold">{item.mentionRate}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>

                {/* Answer History */}
                <Card className="border border-border bg-card shadow-sm">
                  <CardHeader className="pb-3 border-b border-border">
                    <CardTitle className="text-base font-semibold text-foreground">Historique des Réponses d'Agents</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Date</TableHead>
                          <TableHead>Plateforme</TableHead>
                          <TableHead className="w-[50%]">Aperçu de la Réponse</TableHead>
                          <TableHead className="text-center">Mentionné</TableHead>
                          <TableHead className="text-center">Concurrents</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {answerHistory.map((answer, index) => (
                          <TableRow key={index}>
                            <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">{answer.date}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 whitespace-nowrap">
                                <span>{answer.logo}</span>
                                <span className="text-xs font-medium text-foreground">{answer.platform}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{answer.answerPreview}</p>
                            </TableCell>
                            <TableCell className="text-center">
                              {answer.mentioned ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                              ) : (
                                <XCircle className="h-4 w-4 text-muted-foreground/50 mx-auto" />
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {answer.competitors ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                              ) : (
                                <XCircle className="h-4 w-4 text-muted-foreground/50 mx-auto" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog pour modifier les sujets */}
      <Dialog open={isEditTopicsOpen} onOpenChange={setIsEditTopicsOpen}>
        <DialogContent className="w-[95vw] max-w-lg p-0 bg-card border border-border text-foreground" hideCloseButton={true}>
          <div>
            {/* Header */}
            <div className="border-b border-border p-6 relative">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsEditTopicsOpen(false)}
                className="absolute top-4 right-4 h-8 w-8 rounded-full"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </Button>
              
              <h2 className="text-lg font-bold text-foreground mb-1">Modifier les Sujets</h2>
              <p className="text-xs text-muted-foreground">
                Gérez vos sujets et taxonomies pour le regroupement des prompts.
              </p>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-3 mb-4">
                {editableTopics.map((topic, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2.5 p-2 rounded-lg border border-border bg-muted/20"
                  >
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${getColorClass(topic.color)}`}></span>
                    <Input
                      value={topic.name}
                      onChange={(e) => {
                        const updated = [...editableTopics];
                        updated[index] = { ...updated[index], name: e.target.value };
                        setEditableTopics(updated);
                      }}
                      className="flex-1 text-sm h-8"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTopic(index)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddTopic}
                className="w-full gap-2 border-dashed"
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter un Sujet
              </Button>
            </div>

            {/* Footer */}
            <div className="border-t border-border p-4 flex items-center justify-end gap-2 bg-muted/20">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditTopicsOpen(false)}
              >
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={handleSaveTopics}
              >
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OptimizationAgent;
