import { Star, TrendingUp, Lightbulb, CheckCircle, Target, Zap, Award, Brain, Sparkles, ChevronRight, Clock, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const Recommendations = () => {
  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 px-8 py-12">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  💡 IA Recommendations
                </Badge>
              </div>
              <h1 className="text-4xl font-bold text-white mb-3">
                Recommandations IA
              </h1>
              <p className="text-xl text-emerald-100 mb-6 leading-relaxed">
                Optimisez vos performances avec des conseils personnalisés générés par IA.
              </p>
              <div className="flex items-center gap-4">
                <Button 
                  className="bg-white text-emerald-600 hover:bg-white/90 shadow-lg font-semibold px-6 py-3 h-auto"
                >
                  <Target className="h-5 w-5 mr-2" />
                  Appliquer tout
                </Button>
                <Button 
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm px-6 py-3 h-auto"
                >
                  <Brain className="h-5 w-5 mr-2" />
                  Analyse approfondie
                </Button>
              </div>
            </div>
            
            {/* Stats preview */}
            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">87</div>
                  <div className="text-emerald-200 text-sm font-medium">Score Performance</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Star className="w-4 h-4 text-yellow-300" />
                    <span className="text-yellow-300 text-sm">Excellent</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-8 space-y-8">
        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3">
          {/* Priority Recommendations */}
          <Card className="lg:col-span-2 border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-emerald-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                      <Star className="h-5 w-5 text-white" />
                    </div>
                    Recommandations Prioritaires
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Actions recommandées pour améliorer votre performance LLMO
                  </CardDescription>
                </div>
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                  <Sparkles className="w-3 h-3 mr-1" />
                  3 Actions
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Recommendation 1 */}
              <div className="group border-0 rounded-xl p-6 bg-gradient-to-r from-green-50 to-emerald-50 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-lg mb-2">Optimisez vos titres pour l'IA</h4>
                      <p className="text-gray-700 mb-3 leading-relaxed">
                        Vos titres avec des mots-clés spécifiques obtiennent 35% plus de recommandations IA. 
                        Utilisez des termes techniques précis et des questions directes.
                      </p>
                      <div className="flex items-center gap-3 mb-4">
                        <Badge className="bg-green-100 text-green-800 font-semibold">Performance</Badge>
                        <Badge variant="outline" className="border-green-200 text-green-700">+35% recommandations</Badge>
                        <Badge variant="outline" className="border-blue-200 text-blue-700">Haute priorité</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>Impact immédiat • 15 min d'implémentation</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Appliquer
                  </Button>
                </div>
              </div>
              
              {/* Recommendation 2 */}
              <div className="group border-0 rounded-xl p-6 bg-gradient-to-r from-blue-50 to-indigo-50 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Lightbulb className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-lg mb-2">Structurez vos contenus en sections</h4>
                      <p className="text-gray-700 mb-3 leading-relaxed">
                        Les contenus avec des sous-titres clairs et des listes à puces génèrent 2x plus d'engagement IA. 
                        Organisez vos informations de manière hiérarchique.
                      </p>
                      <div className="flex items-center gap-3 mb-4">
                        <Badge className="bg-blue-100 text-blue-800 font-semibold">Structure</Badge>
                        <Badge variant="outline" className="border-blue-200 text-blue-700">+200% engagement</Badge>
                        <Badge variant="outline" className="border-yellow-200 text-yellow-700">Priorité moyenne</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>Améliore la compréhension IA • 30 min d'implémentation</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-blue-200 text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Appliquer
                  </Button>
                </div>
              </div>
              
              {/* Recommendation 3 */}
              <div className="group border-0 rounded-xl p-6 bg-gradient-to-r from-purple-50 to-pink-50 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Star className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-lg mb-2">Ajoutez du contexte métier</h4>
                      <p className="text-gray-700 mb-3 leading-relaxed">
                        Définir clairement votre secteur et expertise augmente la pertinence IA de 25%. 
                        Incluez des termes spécialisés et votre domaine d'activité.
                      </p>
                      <div className="flex items-center gap-3 mb-4">
                        <Badge className="bg-purple-100 text-purple-800 font-semibold">Contexte</Badge>
                        <Badge variant="outline" className="border-purple-200 text-purple-700">+25% pertinence</Badge>
                        <Badge variant="outline" className="border-gray-200 text-gray-700">Priorité faible</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Target className="h-4 w-4" />
                        <span>Optimise le ciblage IA • 45 min d'implémentation</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-purple-200 text-purple-600 hover:bg-purple-50 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Appliquer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Performance Score */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <Award className="h-5 w-5 text-white" />
                    </div>
                    Score Performance
                  </CardTitle>
                  <CardDescription className="mt-2">Votre score LLMO global ce mois</CardDescription>
                </div>
                <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">87</div>
                  <div className="text-lg text-gray-500">/100</div>
                </div>
                <p className="text-emerald-600 font-semibold">Performance Excellente</p>
                <p className="text-sm text-gray-500 mt-1">+5 points vs mois dernier</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Engagement IA</span>
                    <span className="text-sm font-bold text-emerald-600">92%</span>
                  </div>
                  <Progress value={92} className="h-3" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Consistance</span>
                    <span className="text-sm font-bold text-yellow-600">78%</span>
                  </div>
                  <Progress value={78} className="h-3" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Croissance</span>
                    <span className="text-sm font-bold text-blue-600">85%</span>
                  </div>
                  <Progress value={85} className="h-3" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Optimisation LLMO</span>
                    <span className="text-sm font-bold text-purple-600">91%</span>
                  </div>
                  <Progress value={91} className="h-3" />
                </div>
              </div>

              <Button className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                <Zap className="h-4 w-4 mr-2" />
                Améliorer le score
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Industry Trends */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-indigo-50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  Tendances IA du Secteur
                </CardTitle>
                <CardDescription className="mt-2">Ce qui fonctionne bien dans votre domaine avec l'IA</CardDescription>
              </div>
              <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                <Sparkles className="w-3 h-3 mr-1" />
                Insights IA
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="group border-0 rounded-xl p-6 bg-gradient-to-r from-green-50 to-emerald-50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <Lightbulb className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900">Contenu éducatif</h4>
                </div>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                  Les guides "Comment faire" génèrent 40% plus de recommandations IA dans votre secteur.
                </p>
                <div className="flex items-center justify-between">
                  <Badge className="bg-green-100 text-green-800 border-green-200">Tendance forte</Badge>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
              
              <div className="group border-0 rounded-xl p-6 bg-gradient-to-r from-blue-50 to-indigo-50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900">Contenu interactif</h4>
                </div>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                  Les Q&A et FAQ augmentent l'engagement IA de 60% grâce à leur format conversationnel.
                </p>
                <div className="flex items-center justify-between">
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">En hausse</Badge>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
              
              <div className="group border-0 rounded-xl p-6 bg-gradient-to-r from-purple-50 to-pink-50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900">Expertise technique</h4>
                </div>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                  Démontrer votre expertise avec des cas d'usage précis booste la crédibilité IA.
                </p>
                <div className="flex items-center justify-between">
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200">Opportunité</Badge>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Recommendations;