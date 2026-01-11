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
import { startCustomAnalysis } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Globe, Search, ShieldCheck, Zap, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NewAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewAnalysisModal({ open, onOpenChange }: NewAnalysisModalProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleStartAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    try {
      setIsLoading(true);
      const result = await startCustomAnalysis({
        url: formattedUrl,
        min_score: 0.3,
        min_mentions: 1,
        include_raw: false,
        include_competitor_analysis: true
      });

      if (result) {
        toast({
          title: "Analyse lancée",
          description: `L'analyse de ${formattedUrl} a été démarrée avec succès.`,
        });
        onOpenChange(false);
        setUrl('');
        if (result.reportId) {
          navigate(`/?reportId=${result.reportId}`);
        }
      } else {
        throw new Error("Erreur lors du lancement de l'analyse");
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de lancer l'analyse. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
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

            <div className="grid grid-cols-1 gap-3 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 transition-colors hover:bg-slate-100/50">
                <div className="mt-0.5 p-1.5 bg-blue-100 rounded-md">
                  <Search className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Analyse GEO</h4>
                  <p className="text-xs text-slate-600 mt-0.5">Vérification sur GPT-5, et Gemini.</p>
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
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-blue-600" />
                  Analyse en cours...
                </>
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

