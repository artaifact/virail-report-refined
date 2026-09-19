import React, { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { 
  HelpCircle, 
  Book, 
  MessageCircle, 
  Mail, 
  ExternalLink, 
  Search, 
  Play, 
  Clock, 
  FileQuestion,
  LifeBuoy
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    id: "item-1",
    question: "Comment analyser un nouveau contenu ou une nouvelle URL ?",
    answer: "Rendez-vous dans la section 'Analyses' ou 'Optimisation de sites', entrez l'URL ou le contenu souhaité, puis cliquez sur 'Lancer l'analyse'. Les moteurs IA crawleront et évalueront votre visibilité en temps réel."
  },
  {
    id: "item-2",
    question: "Que signifient les scores GEO et LLMO ?",
    answer: "Le score GEO (Generative Engine Optimization) mesure la probabilité que vos contenus soient cités et recommandés par les moteurs de recherche IA (ChatGPT, Perplexity, Gemini, Claude). Le score LLMO évalue la clarté sémantique et la pertinence pour les grands modèles de langage."
  },
  {
    id: "item-3",
    question: "Comment exporter mes rapports au format PDF ou CSV ?",
    answer: "Accédez à l'onglet 'Export' dans le menu latéral. Vous pouvez y générer un rapport PDF complet, configurer un lien de partage sécurisé ou programmer des envois automatiques par email."
  },
  {
    id: "item-4",
    question: "Quels sont les quotas inclus dans mon abonnement ?",
    answer: "Chaque plan comprend un volume mensuel d'analyses, de rapports et de requêtes concurrentes. Vous pouvez surveiller votre consommation en direct depuis l'onglet 'Tarifs' ou vos paramètres de compte."
  },
  {
    id: "item-5",
    question: "Comment intégrer l'API Viraill dans mes propres outils ?",
    answer: "Consultez l'onglet 'API Démo' pour tester les requêtes programmatiques et récupérer vos clés API dans la section Développeur de vos paramètres."
  }
];

const TUTORIALS = [
  {
    title: "Premiers pas avec Viraill",
    description: "Configuration initiale de votre projet et tour d'horizon des métriques clés.",
    duration: "5 min",
    category: "Débutant"
  },
  {
    title: "Optimiser vos contenus pour l'IA",
    description: "Méthodologie pour améliorer vos scores d'autorité et de citation générative.",
    duration: "8 min",
    category: "Contenu"
  },
  {
    title: "Interpréter les insights concurrents",
    description: "Comment analyser les sources citées par les IA pour dépasser vos concurrents.",
    duration: "12 min",
    category: "Stratégie"
  }
];

const Help: React.FC = () => {
  usePageTitle('Aide');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaqs = FAQS.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Centre d'aide & Documentation</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Guides pratiques, FAQ interactive et support pour maximiser votre impact GEO.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher une question..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* 3 Cartes de Ressources Rapides */}
      <div className="grid gap-5 grid-cols-1 md:grid-cols-3">
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Book className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base text-foreground">Documentation</CardTitle>
                <CardDescription>Guides & guides de démarrage</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-between" asChild>
              <a href="/methodologie" target="_blank" rel="noopener noreferrer">
                <span>Guide méthodologique</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-between" asChild>
              <a href="/api-demo">
                <span>Documentation API</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-between" asChild>
              <a href="/optimisation/technique">
                <span>Bonnes pratiques techniques</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base text-foreground">Support Client</CardTitle>
                <CardDescription>Une équipe à votre écoute</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" asChild>
              <a href="mailto:support@viraill.com">
                <Mail className="h-4 w-4 mr-2" />
                Contacter le support
              </a>
            </Button>
            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
              <p className="font-medium text-foreground">Disponibilité :</p>
              <p>Du lundi au vendredi : 9h00 - 18h00 CET</p>
              <p>Temps de réponse moyen : moins de 24h</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <LifeBuoy className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base text-foreground">Statut du Service</CardTitle>
                <CardDescription>État opérationnel de la plateforme</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Tous les systèmes opérationnels</span>
              <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400">99.9% Uptime</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Les scrapers IA et moteurs d'analyse fonctionnent à plein régime.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Questions Fréquentes avec Accordion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <FileQuestion className="h-5 w-5 text-primary" />
            Questions fréquemment posées
          </CardTitle>
          <CardDescription>
            {filteredFaqs.length} réponse{filteredFaqs.length > 1 ? 's' : ''} disponible{filteredFaqs.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredFaqs.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {filteredFaqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id} className="border-border">
                  <AccordionTrigger className="text-left text-sm font-medium hover:text-primary transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Aucune question ne correspond à votre recherche "{searchQuery}".
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Tutoriels Vidéo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Tutoriels vidéo</CardTitle>
          <CardDescription>Formations pas-à-pas pour maîtriser le Generative Engine Optimization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {TUTORIALS.map((tutorial, index) => (
              <div key={index} className="group border border-border rounded-xl p-4 bg-card hover:border-primary/50 transition-all">
                <div className="relative bg-muted/60 rounded-lg h-36 mb-3 flex items-center justify-center overflow-hidden">
                  <div className="w-12 h-12 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <Play className="h-5 w-5 fill-current ml-0.5" />
                  </div>
                  <Badge variant="secondary" className="absolute top-2 right-2 text-[10px]">
                    {tutorial.category}
                  </Badge>
                </div>
                <h4 className="font-semibold text-sm text-foreground mb-1 group-hover:text-primary transition-colors">
                  {tutorial.title}
                </h4>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {tutorial.description}
                </p>
                <div className="flex items-center text-xs text-muted-foreground gap-1 pt-2 border-t border-border">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Durée : {tutorial.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Help;
