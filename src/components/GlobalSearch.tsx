
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowRight } from "lucide-react";

interface SearchResult {
  title: string;
  description: string;
  path: string;
  category: string;
}

const GlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const searchData: SearchResult[] = [
    { title: "CLS (Cumulative Layout Shift)", description: "Métrique Core Web Vitals", path: "/technical", category: "Performance" },
    { title: "Backlinks", description: "Analyse des liens entrants", path: "/competition", category: "Autorité" },
    { title: "E-E-A-T Score", description: "Expertise, Expérience, Autorité, Trust", path: "/eeat", category: "Confiance" },
    { title: "Score global", description: "Vue d'ensemble des performances SEO", path: "/", category: "Dashboard" },
    { title: "Quick Wins", description: "Actions rapides à impact immédiat", path: "/", category: "Actions" },
    { title: "Tâches Kanban", description: "Suivi des recommandations", path: "/tasks", category: "Suivi" }
  ];

  const filteredResults = query 
    ? searchData.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery("");
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
      <Card className="w-full max-w-2xl mx-4">
        <CardContent className="p-0">
          <div className="flex items-center gap-3 p-4 border-b border-gray-200">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Rechercher métriques, pages, actions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 focus:ring-0 text-lg"
              autoFocus
            />
            <kbd className="px-2 py-1 text-xs text-gray-500 bg-gray-100 rounded">Esc</kbd>
          </div>

          {query && (
            <div className="max-h-96 overflow-y-auto">
              {filteredResults.length > 0 ? (
                <div className="space-y-1 p-2">
                  {filteredResults.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer group"
                      onClick={() => {
                        window.location.href = result.path;
                        setIsOpen(false);
                        setQuery("");
                      }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{result.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {result.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{result.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Search className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                  <p>Aucun résultat pour "{query}"</p>
                </div>
              )}
            </div>
          )}

          {!query && (
            <div className="p-4 text-sm text-gray-500">
              <p className="mb-2">Recherche rapide :</p>
              <div className="flex flex-wrap gap-2">
                {["CLS", "E-E-A-T", "Backlinks", "Quick Wins"].map(term => (
                  <Badge 
                    key={term}
                    variant="outline" 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => setQuery(term)}
                  >
                    {term}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GlobalSearch;
