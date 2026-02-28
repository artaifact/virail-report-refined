import React, { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info, Download, Edit, Plus, ChevronDown, ChevronUp, Search, BarChart3, MoreVertical, X, Trash2 } from "lucide-react";
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
      purple: type === 'indicator' ? 'bg-[#7C3AED]' : 'bg-[#7C3AED]',
      green: type === 'indicator' ? 'bg-[#10B981]' : 'bg-[#10B981]',
      orange: type === 'indicator' ? 'bg-[#F97316]' : 'bg-[#F97316]',
      teal: type === 'indicator' ? 'bg-[#14B8A6]' : 'bg-[#14B8A6]'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-[#F5F6F7] p-6">
      <div className="mx-auto space-y-6" style={{ maxWidth: '1700px' }}>
        {/* Header avec titre et filtres */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Prompts.</h1>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[180px] border-gray-300 bg-white hover:bg-gray-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15 nov - 21 nov">15 nov - 21 nov</SelectItem>
                    <SelectItem value="8 nov - 14 nov">8 nov - 14 nov</SelectItem>
                    <SelectItem value="1 nov - 7 nov">1 nov - 7 nov</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative">
                <Select value={regionFilter} onValueChange={setRegionFilter}>
                  <SelectTrigger className="w-[180px] border-gray-300 bg-white hover:bg-gray-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="France">France</SelectItem>
                    <SelectItem value="États-Unis">États-Unis</SelectItem>
                    <SelectItem value="Royaume-Uni">Royaume-Uni</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" className="border-gray-300 bg-white hover:bg-gray-50">
                <Search className="h-4 w-4 mr-2" />
                Ajouter un filtre
              </Button>
            </div>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            Explorez les sujets et prompts qui génèrent la visibilité dans les moteurs de réponse, avec des insights sur la pertinence de la marque et les performances.
          </p>
        </div>

        {/* Section principale avec Topics et Brand Relevance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Panel Topics */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">Sujets</CardTitle>
                <Info className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sujet</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">% du total</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prompts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topics.map((topic, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 ${getColorClass(topic.color)}`} style={{ borderRadius: '2px' }}></span>
                            <span className="text-sm text-gray-900">{topic.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">{topic.percentage}%</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{topic.prompts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Panel Brand Relevance */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">Pertinence de la Marque</CardTitle>
                <Info className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tag</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">% du total</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prompts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brandRelevance.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 ${getColorClass(item.color)}`} style={{ borderRadius: '2px' }}></span>
                            <span className="text-sm text-gray-900">{item.tag}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">{item.percentage}%</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{item.prompts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section Prompts */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Prompts</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="border-gray-300">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter CSV
                </Button>
                <Button variant="outline" size="sm" className="border-gray-300" onClick={handleOpenEditTopics}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier les Sujets
                </Button>
                <Button size="sm" className="bg-black text-white hover:bg-gray-900">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un Prompt
                </Button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher des Prompts"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-300"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sujets/Prompts</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Mot-clé Associé</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Volume de Prompt</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Visibilité</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Citation</th>
                  </tr>
                </thead>
                <tbody>
                  {promptsData.map((prompt, index) => (
                    <React.Fragment key={index}>
                      {/* Ligne du topic principal */}
                      <tr 
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => toggleTopic(prompt.topic)}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${getColorClass(prompt.color, 'dot')}`}></span>
                            <span className="text-sm font-medium text-gray-900">{prompt.topic}</span>
                            <span className="text-sm text-gray-500 ml-1">{prompt.prompts} Prompts</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500">{prompt.relatedKeyword || '-'}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-gray-300 rounded-full" style={{ width: `${prompt.volume}%` }}></div>
                            </div>
                            <span className="text-sm text-gray-700 min-w-[35px]">{prompt.volume}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-gray-300 rounded-full" style={{ width: `${prompt.visibility}%` }}></div>
                            </div>
                            <span className="text-sm text-gray-700 min-w-[35px]">{prompt.visibility}%</span>
                            {expandedTopic === prompt.topic ? (
                              <ChevronUp className="h-3 w-3 text-gray-400 cursor-pointer" />
                            ) : (
                              <ChevronDown className="h-3 w-3 text-gray-400 cursor-pointer" />
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-gray-300 rounded-full" style={{ width: `${prompt.citation}%` }}></div>
                            </div>
                            <span className="text-sm text-gray-700 min-w-[35px]">{prompt.citation}%</span>
                            <ChevronDown className="h-3 w-3 text-gray-400 cursor-pointer" />
                          </div>
                        </td>
                      </tr>
                      
                      {/* Lignes des prompts individuels (affichées si le topic est expandé) */}
                      {expandedTopic === prompt.topic && (
                        <>
                          {/* Header du topic expandé */}
                          <tr className="bg-white border-b border-gray-200">
                            <td colSpan={5} className="py-4 px-4">
                              <div className="space-y-1">
                                <h3 className="text-sm font-semibold text-gray-900 mb-2">Sujets/Prompts</h3>
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${getColorClass(prompt.color, 'dot')}`}></span>
                                  <span className="text-sm font-medium text-gray-900">{prompt.topic}</span>
                                </div>
                                <span className="text-sm text-gray-500 ml-4">{prompt.prompts} Prompts</span>
                              </div>
                            </td>
                          </tr>
                          
                          {/* Prompts individuels */}
                          {prompt.individualPrompts?.map((individualPrompt, promptIndex) => (
                            <tr key={promptIndex} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                  <Checkbox className="border-gray-300" />
                                  <span 
                                    className="text-sm text-gray-900 cursor-pointer hover:text-blue-600"
                                    onClick={() => handlePromptClick(individualPrompt.text, individualPrompt.keyword, prompt.topic)}
                                  >
                                    {individualPrompt.text}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-700">{individualPrompt.keyword}</span>
                                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    <span className="text-xs text-gray-600 font-medium">Lié à la Catégorie</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <BarChart3 className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-700">{individualPrompt.volume}%</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-gray-300 rounded-full" style={{ width: `${individualPrompt.visibility}%` }}></div>
                                  </div>
                                  <span className="text-sm text-gray-700 min-w-[35px]">{individualPrompt.visibility}%</span>
                                  {promptIndex === 0 ? (
                                    <ChevronUp className="h-3 w-3 text-gray-400 cursor-pointer" />
                                  ) : (
                                    <MoreVertical className="h-3 w-3 text-gray-400 cursor-pointer" />
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-gray-300 rounded-full" style={{ width: `${individualPrompt.citation}%` }}></div>
                                  </div>
                                  <span className="text-sm text-gray-700 min-w-[35px]">{individualPrompt.citation}%</span>
                                  <MoreVertical className="h-3 w-3 text-gray-400 cursor-pointer" />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog pour la vue détaillée du prompt */}
      <Dialog open={selectedPrompt !== null} onOpenChange={() => setSelectedPrompt(null)}>
        <DialogContent className="max-w-[1700px] w-full max-h-[90vh] overflow-y-auto p-0" hideCloseButton={true}>
          {selectedPrompt && (
            <div className="bg-white">
              {/* Header */}
              <div className="border-b border-gray-200 p-6 bg-white relative">
                {/* Bouton de fermeture optimisé - positionné en haut à droite */}
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setSelectedPrompt(null)}
                  className="absolute top-4 right-4 h-9 w-9 rounded-full hover:bg-gray-100 hover:scale-110 transition-all duration-200 z-10"
                  aria-label="Fermer"
                >
                  <X className="h-5 w-5 text-gray-600 hover:text-gray-900" />
                </Button>
                
                <div className="flex items-start justify-between pr-12">
                  <div className="flex-1 pr-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">{selectedPrompt.text}</h2>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm text-gray-600">Mot-clé Associé :</span>
                      <div className="px-3 py-1.5 bg-gray-100 rounded-full">
                        <span className="text-sm text-gray-700">{selectedPrompt.keyword}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        <span className="text-xs text-gray-600 font-medium">Category Related</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="border-gray-300 bg-white hover:bg-gray-50">
                      {regionFilter}
                    </Button>
                    <Button variant="outline" size="sm" className="border-gray-300 bg-white hover:bg-gray-50">
                      {dateFilter}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Prompt Visibility */}
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">Visibilité du Prompt</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-white border border-gray-200 rounded-lg flex items-center justify-center relative">
                      <div className="absolute bottom-4 right-4 flex items-center gap-2">
                        <div className="text-2xl font-bold text-gray-400">0%</div>
                        <div className="text-sm text-gray-500">21 nov</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Leaderboard & Mention Rate */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Leaderboard */}
                  <Card className="border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-900">Classement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sujet</th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Mentions</th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Visibilité</th>
                            </tr>
                          </thead>
                          <tbody>
                            {leaderboardData.map((item, index) => (
                              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">📊</span>
                                    <span className="text-sm text-gray-900">{item.topic}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-700">{item.mentions}</td>
                                <td className="py-3 px-4 text-sm text-gray-700">{item.visibility}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Mention Rate by Platform */}
                  <Card className="border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-900">Taux de Mention par Plateforme</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Plateforme</th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Taux de Mention</th>
                            </tr>
                          </thead>
                          <tbody>
                            {platformData.map((item, index) => (
                              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{item.logo}</span>
                                    <span className="text-sm text-gray-900">{item.platform}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-700">{item.mentionRate}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Answer History */}
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">Historique des Réponses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Plateforme</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Aperçu de la Réponse</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Mentionné</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Concurrents</th>
                          </tr>
                        </thead>
                        <tbody>
                          {answerHistory.map((answer, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-4 text-sm text-gray-700">{answer.date}</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{answer.logo}</span>
                                  <span className="text-sm text-gray-900">{answer.platform}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 max-w-md">
                                <p className="text-sm text-gray-900 leading-relaxed">{answer.answerPreview}</p>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center justify-center">
                                  {answer.mentioned ? (
                                    <span className="text-green-500">✓</span>
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                      <X className="h-3 w-3 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center justify-center">
                                  {answer.competitors ? (
                                    <span className="text-green-500">✓</span>
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                      <X className="h-3 w-3 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog pour modifier les sujets */}
      <Dialog open={isEditTopicsOpen} onOpenChange={setIsEditTopicsOpen}>
        <DialogContent className="max-w-2xl w-full p-0" hideCloseButton={true}>
          <div className="bg-white">
            {/* Header */}
            <div className="border-b border-gray-200 p-6 relative">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsEditTopicsOpen(false)}
                className="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-gray-100"
                aria-label="Fermer"
              >
                <X className="h-4 w-4 text-gray-600" />
              </Button>
              
              <h2 className="text-xl font-bold text-gray-900 mb-2">Modifier les Sujets</h2>
              <p className="text-sm text-gray-600">
                Nous avons importé vos prompts et sujets, vérifiez votre import ...
              </p>
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Sujets</h3>
              <div className="space-y-3 mb-6">
                {editableTopics.map((topic, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <span className={`w-3 h-3 rounded-full ${getColorClass(topic.color, 'dot')}`}></span>
                    <Input
                      value={topic.name}
                      onChange={(e) => {
                        const updated = [...editableTopics];
                        updated[index] = { ...updated[index], name: e.target.value };
                        setEditableTopics(updated);
                      }}
                      className="flex-1 text-sm border-gray-300 bg-white"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTopic(index)}
                      className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-gray-100"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-6 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handleAddTopic}
                className="border-gray-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un Sujet
              </Button>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsEditTopicsOpen(false)}
                  className="border-gray-300 bg-white"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSaveTopics}
                  className="bg-black text-white hover:bg-gray-900"
                >
                  Enregistrer
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OptimizationAgent;
