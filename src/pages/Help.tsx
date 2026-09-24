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
import { InfoTooltip } from "@/components/ui/InfoTooltip";

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
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 w-full max-w-[1700px] mx-auto space-y-6 font-sans">
      {/* Top Header Épuré */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <span>Centre d'aide & Documentation</span>
          <InfoTooltip
            title="Aide & Documentation"
            content="Guides pratiques, FAQ interactive et support pour maximiser votre impact GEO."
          />
        </h1>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input 
            placeholder="Rechercher une question..." 
            className="pl-9 h-9 text-xs rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* 3 Cartes de Ressources Rapides */}
      <div className="grid gap-5 grid-cols-1 md:grid-cols-3">
        <Card className="flex flex-col justify-between rounded-xl border border-border/70 bg-card shadow-xs">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Book className="h-4.5 w-4.5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-foreground">Documentation</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Guides & démarrage rapide</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-between text-xs rounded-xl shadow-xs" asChild>
              <a href="/methodologie" target="_blank" rel="noopener noreferrer">
                <span>Guide méthodologique</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-between text-xs rounded-xl shadow-xs" asChild>
              <a href="/api-demo">
                <span>Documentation API</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-between text-xs rounded-xl shadow-xs" asChild>
              <a href="/optimisation/technique">
                <span>Bonnes pratiques techniques</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </a>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="flex flex-col justify-between rounded-xl border border-border/70 bg-card shadow-xs">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <MessageCircle className="h-4.5 w-4.5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-foreground">Support Client</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Une équipe à votre écoute</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full text-xs rounded-xl shadow-xs" asChild>
              <a href="mailto:support@viraill.com">
                <Mail className="h-4 w-4 mr-2" />
                Contacter le support
              </a>
            </Button>
            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
              <p className="font-semibold text-foreground">Disponibilité :</p>
              <p>Du lundi au vendredi : 9h00 - 18h00 CET</p>
              <p>Temps de réponse moyen : moins de 24h</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="flex flex-col justify-between rounded-xl border border-border/70 bg-card shadow-xs">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <LifeBuoy className="h-4.5 w-4.5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-foreground">Statut du Service</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">État opérationnel de la plateforme</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/70">
              <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Systèmes opérationnels
              </span>
              <Badge variant="outline" className="text-[10px] border-border/70 font-mono">99.9% Uptime</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Les scrapers IA et moteurs d'analyse fonctionnent à plein régime.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Questions Fréquentes avec Accordion */}
      <Card className="rounded-xl border border-border/70 bg-card shadow-xs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <FileQuestion className="h-4.5 w-4.5 text-primary" />
            Questions fréquemment posées
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {filteredFaqs.length} réponse{filteredFaqs.length > 1 ? 's' : ''} disponible{filteredFaqs.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredFaqs.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {filteredFaqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id} className="border-border">
                  <AccordionTrigger className="text-left text-sm font-semibold text-foreground hover:text-primary transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-xs">
              Aucune question ne correspond à votre recherche "{searchQuery}".
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Tutoriels Vidéo */}
      <Card className="rounded-xl border border-border/70 bg-card shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-bold text-foreground">Tutoriels vidéo</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Formations pas-à-pas pour maîtriser le Generative Engine Optimization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {TUTORIALS.map((tutorial, index) => (
              <div key={index} className="group border border-border/70 rounded-xl p-4 bg-muted/20 hover:border-primary/50 transition-all shadow-xs">
                <div className="relative bg-muted/60 rounded-lg h-36 mb-3 flex items-center justify-center overflow-hidden">
                  <div className="w-11 h-11 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    <Play className="h-4.5 w-4.5 fill-current ml-0.5" />
                  </div>
                  <Badge variant="secondary" className="absolute top-2 right-2 text-[10px] font-semibold">
                    {tutorial.category}
                  </Badge>
                </div>
                <h4 className="font-semibold text-xs text-foreground mb-1 group-hover:text-primary transition-colors">
                  {tutorial.title}
                </h4>
                <p className="text-[11px] text-muted-foreground mb-3 line-clamp-2">
                  {tutorial.description}
                </p>
                <div className="flex items-center text-[11px] text-muted-foreground font-mono gap-1 pt-2 border-t border-border/60">
                  <Clock className="h-3 w-3" />
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
