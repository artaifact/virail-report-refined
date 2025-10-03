import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft, Search, Users, AlertTriangle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]" style={{ fontFamily: 'Inter, Poppins, system-ui, sans-serif' }}>
      {/* Background decorative elements - Meetmind.ai */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#1A3AFF]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#2E4CFF]/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 text-center max-w-2xl mx-auto px-8">
        {/* Branding & 404 Icon */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 bg-[#1A3AFF] rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-semibold text-[#2E2E3E]">Meetmind.ai</h1>
              <p className="text-[#C8C9CC] text-sm font-medium">Page introuvable</p>
            </div>
          </div>
          <div className="w-32 h-32 bg-[#2E2E3E] rounded-full flex items-center justify-center mx-auto shadow-[0px_4px_12px_rgba(0,0,0,0.25)]">
            <AlertTriangle className="h-16 w-16 text-[#C8C9CC]" />
          </div>
        </div>

        {/* Main Content */}
        <Card className="border-0 shadow-[0px_4px_12px_rgba(0,0,0,0.25)] bg-[#0C0F1A] rounded-2xl">
          <CardContent className="p-8">
            <h1 className="text-8xl font-bold text-[#1A3AFF] mb-4">
              404
            </h1>
            <h2 className="text-3xl font-bold text-white mb-4">
              Page introuvable
            </h2>
            <p className="text-xl text-[#C8C9CC] mb-8 leading-relaxed font-normal">
              Oops ! Cette page semble être en réunion ailleurs. 
              Elle a peut-être été déplacée, supprimée ou n'a jamais existé.
            </p>
            
            {/* Current Path Info */}
            <div className="bg-[#2E2E3E] rounded-xl p-4 mb-8 border border-[#3A3A3A]">
              <div className="flex items-center justify-center gap-2 text-sm text-[#C8C9CC]">
                <Search className="h-4 w-4" />
                <span>Chemin recherché : <code className="bg-[#1A3AFF]/20 px-2 py-1 rounded font-mono text-[#2E4CFF]">{location.pathname}</code></span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild
                className="bg-[#1A3AFF] hover:bg-[#2E4CFF] text-white shadow-lg font-medium px-8 py-3 h-12 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-[0px_6px_16px_rgba(0,0,0,0.35)]"
              >
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Retour à l'accueil
                </Link>
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.history.back()}
                className="border-2 border-[#3A3A3A] bg-[#2E2E3E] text-[#C8C9CC] hover:bg-[#3A3A3A] hover:text-white font-medium px-8 py-3 h-12 rounded-xl transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Page précédente
              </Button>
            </div>

            {/* Quick Links */}
            <div className="mt-12 pt-8 border-t border-[#2E2E3E]">
              <h3 className="text-lg font-semibold text-white mb-6">
                Pages populaires
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link 
                  to="/analyses" 
                  className="group p-4 bg-[#1A3AFF]/10 rounded-xl border border-[#1A3AFF]/20 hover:shadow-lg transition-all duration-200 hover:scale-105"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#1A3AFF] rounded-xl flex items-center justify-center">
                      <Search className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-white group-hover:text-[#2E4CFF]">Réunions</div>
                      <div className="text-xs text-[#C8C9CC]">Organiser</div>
                    </div>
                  </div>
                </Link>

                <Link 
                  to="/competition" 
                  className="group p-4 bg-[#2E4CFF]/10 rounded-xl border border-[#2E4CFF]/20 hover:shadow-lg transition-all duration-200 hover:scale-105"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#2E4CFF] rounded-xl flex items-center justify-center">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-white group-hover:text-[#1A3AFF]">Équipes</div>
                      <div className="text-xs text-[#C8C9CC]">Collaboration</div>
                    </div>
                  </div>
                </Link>

                <Link 
                  to="/help" 
                  className="group p-4 bg-[#4CAF50]/10 rounded-xl border border-[#4CAF50]/20 hover:shadow-lg transition-all duration-200 hover:scale-105"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#4CAF50] rounded-xl flex items-center justify-center">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-white group-hover:text-[#4CAF50]">Aide</div>
                      <div className="text-xs text-[#C8C9CC]">Support</div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Message */}
        <p className="text-[#C8C9CC] text-sm mt-8">
          Si vous pensez qu'il s'agit d'une erreur, n'hésitez pas à{" "}
          <Link to="/help" className="text-[#1A3AFF] hover:text-[#2E4CFF] underline font-medium transition-colors duration-200">
            nous contacter
          </Link>
        </p>
      </div>
    </div>
  );
};

export default NotFound;