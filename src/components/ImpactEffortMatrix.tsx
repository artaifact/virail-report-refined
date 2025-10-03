import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Target, 
  Zap, 
  Clock, 
  TrendingUp, 
  Filter,
  Info,
  CheckCircle,
  AlertCircle,
  Star
} from 'lucide-react';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  impact_score: number; // 0-100
  effort_score: number; // 0-100
  priority: 'critical' | 'high' | 'medium' | 'low';
  category_type: 'quick_win' | 'major_project' | 'fill_in' | 'avoid';
  estimated_time: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  implementation_guide?: string;
}

interface ImpactEffortMatrixProps {
  recommendations: Recommendation[];
  onRecommendationSelect?: (recommendation: Recommendation) => void;
}

const ImpactEffortMatrix: React.FC<ImpactEffortMatrixProps> = ({ 
  recommendations, 
  onRecommendationSelect 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Filtrer les recommandations
  const filteredRecommendations = useMemo(() => {
    return recommendations.filter(rec => {
      const categoryMatch = selectedCategory === 'all' || rec.category === selectedCategory;
      const priorityMatch = selectedPriority === 'all' || rec.priority === selectedPriority;
      return categoryMatch && priorityMatch;
    });
  }, [recommendations, selectedCategory, selectedPriority]);

  // Obtenir les catégories uniques
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(recommendations.map(rec => rec.category))];
    return uniqueCategories;
  }, [recommendations]);

  // Convertir les scores en coordonnées pour la matrice
  const getMatrixPosition = (impact: number, effort: number) => {
    // Inverser l'effort pour que "faible effort" soit à droite
    const x = 100 - effort; // Effort inversé (0-100)
    const y = impact; // Impact direct (0-100)
    return { x, y };
  };

  // Déterminer le quadrant
  const getQuadrant = (impact: number, effort: number) => {
    if (impact >= 50 && effort <= 50) return 'quick_wins';
    if (impact >= 50 && effort > 50) return 'major_projects';
    if (impact < 50 && effort <= 50) return 'fill_ins';
    return 'avoid';
  };

  // Obtenir la couleur selon le quadrant
  const getQuadrantColor = (quadrant: string) => {
    switch (quadrant) {
      case 'quick_wins': return 'bg-green-100 border-green-300 text-green-800';
      case 'major_projects': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'fill_ins': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'avoid': return 'bg-red-100 border-red-300 text-red-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  // Obtenir l'icône selon le quadrant
  const getQuadrantIcon = (quadrant: string) => {
    switch (quadrant) {
      case 'quick_wins': return <Zap className="h-4 w-4" />;
      case 'major_projects': return <Target className="h-4 w-4" />;
      case 'fill_ins': return <Clock className="h-4 w-4" />;
      case 'avoid': return <AlertCircle className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  // Obtenir la taille du point selon la priorité
  const getPointSize = (priority: string) => {
    switch (priority) {
      case 'critical': return 'w-6 h-6';
      case 'high': return 'w-5 h-5';
      case 'medium': return 'w-4 h-4';
      case 'low': return 'w-3 h-3';
      default: return 'w-4 h-4';
    }
  };

  // Obtenir la couleur selon la priorité
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec filtres */}
      <Card className="bg-white border border-neutral-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Target className="h-6 w-6 text-neutral-700" />
                Matrice Impact / Effort
              </CardTitle>
              <p className="text-neutral-600 mt-1">
                Visualisez vos recommandations selon leur impact et l'effort requis
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-neutral-500" />
              <span className="text-sm text-neutral-600">Filtres</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Filtre par catégorie */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-neutral-700">Catégorie:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500"
              >
                <option value="all">Toutes</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Filtre par priorité */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-neutral-700">Priorité:</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-3 py-1 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500"
              >
                <option value="all">Toutes</option>
                <option value="critical">Critique</option>
                <option value="high">Élevée</option>
                <option value="medium">Moyenne</option>
                <option value="low">Faible</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matrice interactive */}
      <Card className="bg-white border border-neutral-200 shadow-sm">
        <CardContent className="p-6">
          <div className="relative">
            {/* Grille de fond avec carreaux */}
            <div className="relative w-full h-96 bg-white rounded-lg border-2 border-neutral-300 shadow-inner">
              {/* Grille de carreaux - en arrière-plan */}
              <div className="absolute inset-0 z-0">
                {/* Grille verticale (tous les 10%) */}
                {Array.from({ length: 9 }, (_, i) => (
                  <div
                    key={`v-${i}`}
                    className="absolute top-0 bottom-0 w-px bg-neutral-200"
                    style={{ left: `${(i + 1) * 10}%` }}
                  />
                ))}
                
                {/* Grille horizontale (tous les 10%) */}
                {Array.from({ length: 9 }, (_, i) => (
                  <div
                    key={`h-${i}`}
                    className="absolute left-0 right-0 h-px bg-neutral-200"
                    style={{ top: `${(i + 1) * 10}%` }}
                  />
                ))}
                
                {/* Grille fine (tous les 5%) */}
                {Array.from({ length: 19 }, (_, i) => {
                  if ((i + 1) % 2 === 0) return null; // Skip les lignes déjà dessinées
                  return (
                    <div
                      key={`vf-${i}`}
                      className="absolute top-0 bottom-0 w-px bg-neutral-100"
                      style={{ left: `${(i + 1) * 5}%` }}
                    />
                  );
                })}
                {Array.from({ length: 19 }, (_, i) => {
                  if ((i + 1) % 2 === 0) return null; // Skip les lignes déjà dessinées
                  return (
                    <div
                      key={`hf-${i}`}
                      className="absolute left-0 right-0 h-px bg-neutral-100"
                      style={{ top: `${(i + 1) * 5}%` }}
                    />
                  );
                })}
              </div>
              
              {/* Axes principaux */}
              <div className="absolute inset-0 z-10">
                {/* Axe Y (Impact) - ligne verticale principale */}
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-neutral-600"></div>
                <div className="absolute left-3 top-2 text-xs font-bold text-neutral-700">Impact Élevé</div>
                <div className="absolute left-3 bottom-2 text-xs font-bold text-neutral-700">Impact Faible</div>
                
                {/* Axe X (Effort) - ligne horizontale principale */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-600"></div>
                <div className="absolute left-2 bottom-3 text-xs font-bold text-neutral-700">Effort Faible</div>
                <div className="absolute right-2 bottom-3 text-xs font-bold text-neutral-700">Effort Élevé</div>
                
                {/* Ligne médiane verticale (50%) */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-neutral-500 border-dashed"></div>
                
                {/* Ligne médiane horizontale (50%) */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-neutral-500 border-dashed"></div>
                
                {/* Labels des axes avec valeurs */}
                <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-neutral-600 font-medium">
                  <div className="absolute top-0 left-4 bg-white px-1 rounded">100</div>
                  <div className="absolute top-1/4 left-4 bg-white px-1 rounded">75</div>
                  <div className="absolute top-1/2 left-4 bg-white px-1 rounded">50</div>
                  <div className="absolute top-3/4 left-4 bg-white px-1 rounded">25</div>
                  <div className="absolute bottom-0 left-4 bg-white px-1 rounded">0</div>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-neutral-600 font-medium">
                  <div className="absolute bottom-4 left-0 bg-white px-1 rounded">0</div>
                  <div className="absolute bottom-4 left-1/4 bg-white px-1 rounded">25</div>
                  <div className="absolute bottom-4 left-1/2 bg-white px-1 rounded">50</div>
                  <div className="absolute bottom-4 left-3/4 bg-white px-1 rounded">75</div>
                  <div className="absolute bottom-4 right-0 bg-white px-1 rounded">100</div>
                </div>
              </div>

              {/* Quadrants */}
              <div className="absolute inset-0 z-20">
                {/* Quick Wins (Impact élevé, Effort faible) */}
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-green-50 border border-green-200 rounded-tl-lg">
                  <div className="absolute top-2 right-2 flex items-center gap-1 text-green-700 text-xs font-medium">
                    <Zap className="h-3 w-3" />
                    Quick Wins
                  </div>
                </div>
                
                {/* Major Projects (Impact élevé, Effort élevé) */}
                <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-blue-50 border border-blue-200 rounded-tr-lg">
                  <div className="absolute top-2 left-2 flex items-center gap-1 text-blue-700 text-xs font-medium">
                    <Target className="h-3 w-3" />
                    Projets Majeurs
                  </div>
                </div>
                
                {/* Fill-ins (Impact faible, Effort faible) */}
                <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-yellow-50 border border-yellow-200 rounded-bl-lg">
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 text-yellow-700 text-xs font-medium">
                    <Clock className="h-3 w-3" />
                    Fill-ins
                  </div>
                </div>
                
                {/* Avoid (Impact faible, Effort élevé) */}
                <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-red-50 border border-red-200 rounded-br-lg">
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 text-red-700 text-xs font-medium">
                    <AlertCircle className="h-3 w-3" />
                    À Éviter
                  </div>
                </div>
              </div>

              {/* Points des recommandations */}
              {filteredRecommendations.map((rec) => {
                const position = getMatrixPosition(rec.impact_score, rec.effort_score);
                const quadrant = getQuadrant(rec.impact_score, rec.effort_score);
                const isHovered = hoveredItem === rec.id;
                
                return (
                  <div
                    key={rec.id}
                    className={`absolute cursor-pointer transition-all duration-200 ${
                      isHovered ? 'z-50' : 'z-30'
                    }`}
                    style={{
                      left: `${position.x}%`,
                      top: `${100 - position.y}%`, // Inverser Y pour que 0 soit en bas
                      transform: 'translate(-50%, -50%)'
                    }}
                    onMouseEnter={() => setHoveredItem(rec.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    onClick={() => onRecommendationSelect?.(rec)}
                  >
                    {/* Point principal */}
                    <div
                      className={`${getPointSize(rec.priority)} ${getPriorityColor(rec.priority)} rounded-full border-2 border-white shadow-lg transition-all duration-200 ${
                        isHovered ? 'scale-125 shadow-xl' : 'hover:scale-110'
                      }`}
                    />
                    
                    {/* Tooltip au survol */}
                    {isHovered && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white border border-neutral-200 rounded-lg shadow-xl p-3 z-60">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-neutral-900 text-sm">{rec.title}</h4>
                          <Badge className={`${getQuadrantColor(quadrant)} text-xs`}>
                            {getQuadrantIcon(quadrant)}
                          </Badge>
                        </div>
                        <p className="text-xs text-neutral-600 mb-2">{rec.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-green-600" />
                            <span>Impact: {rec.impact_score}/100</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-blue-600" />
                            <span>Effort: {rec.effort_score}/100</span>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {rec.priority}
                          </Badge>
                          <span className="text-xs text-neutral-500">{rec.estimated_time}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Légende */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Zap className="h-4 w-4 text-green-600" />
                <div>
                  <div className="text-sm font-medium text-green-800">Quick Wins</div>
                  <div className="text-xs text-green-600">Impact élevé, Effort faible</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Target className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-sm font-medium text-blue-800">Projets Majeurs</div>
                  <div className="text-xs text-blue-600">Impact élevé, Effort élevé</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Clock className="h-4 w-4 text-yellow-600" />
                <div>
                  <div className="text-sm font-medium text-yellow-800">Fill-ins</div>
                  <div className="text-xs text-yellow-600">Impact faible, Effort faible</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <div>
                  <div className="text-sm font-medium text-red-800">À Éviter</div>
                  <div className="text-xs text-red-600">Impact faible, Effort élevé</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-green-50 border border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-lg font-semibold text-green-800">
                  {filteredRecommendations.filter(rec => getQuadrant(rec.impact_score, rec.effort_score) === 'quick_wins').length}
                </div>
                <div className="text-sm text-green-600">Quick Wins</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-lg font-semibold text-blue-800">
                  {filteredRecommendations.filter(rec => getQuadrant(rec.impact_score, rec.effort_score) === 'major_projects').length}
                </div>
                <div className="text-sm text-blue-600">Projets Majeurs</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-lg font-semibold text-yellow-800">
                  {filteredRecommendations.filter(rec => getQuadrant(rec.impact_score, rec.effort_score) === 'fill_ins').length}
                </div>
                <div className="text-sm text-yellow-600">Fill-ins</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-lg font-semibold text-red-800">
                  {filteredRecommendations.filter(rec => getQuadrant(rec.impact_score, rec.effort_score) === 'avoid').length}
                </div>
                <div className="text-sm text-red-600">À Éviter</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImpactEffortMatrix;
