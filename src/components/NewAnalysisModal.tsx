import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { startAnalysisStreamWithContext } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Globe, Search, BarChart3 } from "lucide-react";
import { modelLogos } from "@/components/ModelLogosCarousel";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ModelLogosCarousel } from "@/components/ModelLogosCarousel";
import { useStreaming } from "@/contexts/StreamingContext";
import { useQueryClient } from "@tanstack/react-query";

interface NewAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewAnalysisModal({ open, onOpenChange }: NewAnalysisModalProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const streaming = useStreaming();
  const queryClient = useQueryClient();

  const handleStartAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    try {
      setIsLoading(true);

      // Fermer le modal immédiatement pour montrer la notification de streaming
      onOpenChange(false);

      // Lancer l'analyse avec le contexte de streaming
      const result = await startAnalysisStreamWithContext(formattedUrl, streaming);

      if (result?.reportId) {
        toast({
          title: "Analyse terminée",
          description: `L'analyse de ${formattedUrl} est prête.`,
        });
        setUrl('');

        // Invalider le cache des rapports pour rafraîchir la liste
        queryClient.invalidateQueries({ queryKey: ['reports'] });
        queryClient.invalidateQueries({ queryKey: ['llmo-reports'] });

        // Naviguer vers la page d'accueil si on n'y est pas déjà
        if (location.pathname !== '/') {
          navigate('/');
        }
      } else {
        throw new Error("Erreur lors du lancement de l'analyse");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de lancer l'analyse. Veuillez réessayer.";
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
        <div className="bg-white px-6 py-8 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <DialogTitle className="text-2xl font-bold text-slate-900">Nouvelle Analyse</DialogTitle>
          </div>
          <DialogDescription className="text-slate-500 text-base leading-relaxed">
            Configurez votre stratégie de visibilité LLM en analysant votre domaine.
          </DialogDescription>
        </div>

        <form onSubmit={handleStartAnalysis} className="p-6 space-y-6 bg-white">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url" className="text-sm font-semibold text-slate-700">
                URL du site web
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Globe className="h-5 w-5" />
                </div>
                <Input
                  id="url"
                  placeholder="https://votre-site.com"
                  className="pl-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all rounded-xl"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <p className="text-xs text-slate-500 italic px-1">
                L'analyse peut prendre jusqu'à 10 minutes.
              </p>
            </div>

            {isLoading && (
              <ModelLogosCarousel className="rounded-xl bg-slate-50 border border-slate-200 overflow-hidden" />
            )}

            {!isLoading && (
              <div className="grid grid-cols-1 gap-3 pt-2">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 transition-colors hover:bg-slate-100/50">
                  <div className="mt-0.5 p-1.5 bg-blue-100 rounded-md">
                    <Search className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Analyse GEO</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-600">Vérification sur</span>
                      <div className="flex items-center gap-1.5">
                        <img src={modelLogos['openai']} alt="OpenAI" className="h-4 w-4 object-contain" />
                        <img src={modelLogos['gemini']} alt="Gemini" className="h-4 w-4 object-contain" />
                        <img src={modelLogos['claude']} alt="Claude" className="h-4 w-4 object-contain" />
                        <img src={modelLogos['perplexity']} alt="Perplexity" className="h-4 w-4 object-contain" />
                        <img src={modelLogos['mistral']} alt="Mistral" className="h-4 w-4 object-contain" />
                        <img src={modelLogos['deepseek']} alt="DeepSeek" className="h-4 w-4 object-contain" />
                        <img src={modelLogos['grok']} alt="Grok" className="h-4 w-4 object-contain" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 transition-colors hover:bg-slate-100/50">
                  <div className="mt-0.5 p-1.5 bg-indigo-100 rounded-md">
                    <BarChart3 className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Veille Concurrentielle</h4>
                    <p className="text-xs text-slate-600 mt-0.5">Identification automatique du Top 5 concurrents.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button 
              type="submit" 
              disabled={isLoading || !url}
              className={cn(
                "w-full h-12 text-base font-bold shadow-lg shadow-blue-500/20 transition-all rounded-xl",
                isLoading ? "bg-slate-100 text-slate-400" : "bg-blue-600 hover:bg-blue-700 text-white"
              )}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 overflow-hidden w-24">
                    <div className="flex gap-2 animate-[slide_2s_linear_infinite]">
                      {Object.entries(modelLogos).slice(0, 6).map(([key, src]) => (
                        <img key={key} src={src} alt={key} className="h-5 w-5 object-contain flex-shrink-0" />
                      ))}
                    </div>
                  </div>
                  <span>Analyse en cours...</span>
                </div>
              ) : (
                "Lancer l'analyse complète"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

