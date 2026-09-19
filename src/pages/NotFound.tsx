import { useLocation, Link } from "react-router-dom";
import { usePageTitle } from '@/hooks/usePageTitle';
import { Home, ArrowLeft, Search, Users, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const NotFound = () => {
  usePageTitle('Page non trouvée');
  const location = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      {/* Background glow elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10 text-center max-w-xl mx-auto w-full">
        <Card className="border border-border shadow-xl bg-card/80 backdrop-blur-sm rounded-2xl">
          <CardContent className="p-6 sm:p-10">
            <div className="inline-block text-7xl sm:text-8xl font-extrabold text-primary mb-2 tracking-tight">
              404
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 tracking-tight">
              Page introuvable
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 leading-relaxed">
              Oups ! Cette page n’existe pas ou a été déplacée. Vérifiez l’URL ou retournez à l’accueil.
            </p>
            
            {/* Current Path Info */}
            <div className="bg-muted/50 rounded-xl p-3 mb-6 border border-border">
              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground truncate">
                <Search className="h-4 w-4 shrink-0" />
                <span>Chemin demandé : <code className="bg-primary/10 text-primary px-2 py-0.5 rounded font-mono text-xs">{location.pathname}</code></span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <Button 
                asChild
                className="h-11 px-6 rounded-xl font-medium"
              >
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Retour à l’accueil
                </Link>
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.history.back()}
                className="h-11 px-6 rounded-xl font-medium"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Page précédente
              </Button>
            </div>

            {/* Quick Links */}
            <div className="pt-6 border-t border-border">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Raccourcis utiles
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                <Link 
                  to="/analyses" 
                  className="group p-3 bg-muted/40 hover:bg-muted/80 rounded-xl border border-border transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Search className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">Analyses</div>
                      <div className="text-[11px] text-muted-foreground">Rapports GEO</div>
                    </div>
                  </div>
                </Link>

                <Link 
                  to="/competition" 
                  className="group p-3 bg-muted/40 hover:bg-muted/80 rounded-xl border border-border transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">Concurrence</div>
                      <div className="text-[11px] text-muted-foreground">Benchmark IA</div>
                    </div>
                  </div>
                </Link>

                <Link 
                  to="/help" 
                  className="group p-3 bg-muted/40 hover:bg-muted/80 rounded-xl border border-border transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <HelpCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">Aide</div>
                      <div className="text-[11px] text-muted-foreground">FAQ & Guides</div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Message */}
        <p className="text-xs text-muted-foreground mt-6">
          Besoin d’assistance ? N’hésitez pas à{" "}
          <Link to="/help" className="text-primary hover:underline font-medium">
            consulter le centre d’aide
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export default NotFound;