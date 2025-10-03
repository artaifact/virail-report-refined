
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Target, MapPin, Smartphone, CreditCard, Clock, UserCheck, Compass, Activity } from "lucide-react";

interface AudienceAnalysisProps {
  data: any;
}

const AudienceAnalysis = ({ data }: AudienceAnalysisProps) => {
  if (!data) return null;

  const demographics = [
    { label: "Âge", value: data.audience.primaryAge, icon: UserCheck },
    { label: "Profil", value: data.audience.profile, icon: Compass },
    { label: "Source", value: data.website.url, icon: Activity },
  ];

  const behaviors = [
    {
      behavior: "Recherche d'information",
      description: "Recherchent activement des informations pertinentes dans leur domaine"
    },
    {
      behavior: "Comparaison et évaluation", 
      description: "Comparent différentes options avant de prendre des décisions"
    },
    {
      behavior: "Optimisation des choix",
      description: "Privilégient les solutions qui répondent à leurs besoins spécifiques"
    },
    {
      behavior: "Engagement digital",
      description: "Utilisent activement les plateformes en ligne pour leurs recherches"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Demographics Overview */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Profil de l'Audience Cible
          </CardTitle>
          <CardDescription>
            Caractéristiques démographiques et comportementales principales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {demographics.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <item.icon className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-600">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Audience Segments */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Segments d'Audience</CardTitle>
          <CardDescription>Répartition et caractéristiques des groupes cibles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {data.audience.segments.map((segment: any, index: number) => (
            <div key={index} className="border rounded-lg p-4 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">{segment.title}</h3>
                <Badge className="bg-blue-100 text-blue-800">
                  {segment.percentage}%
                </Badge>
              </div>
              <p className="text-gray-600 mb-3">{segment.description}</p>
              <div className="flex flex-wrap gap-2">
                {segment.characteristics.map((char: string, charIndex: number) => (
                  <Badge key={charIndex} variant="outline" className="text-xs">
                    {char}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Behavioral Patterns */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Comportements Utilisateur</CardTitle>
          <CardDescription>Patterns d'usage et attentes identifiés</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {behaviors.map((item, index) => (
              <div key={index} className="flex items-start gap-3 p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{item.behavior}</h4>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Needs Addressed */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Besoins Adressés</CardTitle>
          <CardDescription>Solutions apportées par la plateforme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="bg-green-100 p-2 rounded-lg">
                <Target className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-green-900 mb-1">Information accessible</h4>
                <p className="text-sm text-green-700">
                  Accès facile aux informations recherchées dans un format structuré
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="bg-blue-100 p-2 rounded-lg">
                <CreditCard className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Comparaison efficace</h4>
                <p className="text-sm text-blue-700">
                  Facilite la comparaison et l'évaluation des différentes options disponibles
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-purple-900 mb-1">Expérience utilisateur</h4>
                <p className="text-sm text-purple-700">
                  Interface conçue pour répondre aux attentes et comportements de l'audience cible
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AudienceAnalysis;
