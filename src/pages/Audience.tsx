
import { Users, UserPlus, Target, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Audience = () => {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Audience</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total abonnés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24,157</div>
            <p className="text-xs text-muted-foreground">+12.4% ce mois</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nouveaux cette semaine</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">573</div>
            <p className="text-xs text-muted-foreground">+18.7% vs semaine dernière</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'engagement</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.9%</div>
            <p className="text-xs text-muted-foreground">+2.1% ce mois</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portée globale</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156K</div>
            <p className="text-xs text-muted-foreground">+7.3% ce mois</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Démographie de l'audience</CardTitle>
            <CardDescription>Répartition par âge et localisation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Répartition par âge</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-16 text-sm">18-24</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mx-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '35%' }}></div>
                    </div>
                    <div className="w-10 text-sm text-right">35%</div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-16 text-sm">25-34</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mx-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '42%' }}></div>
                    </div>
                    <div className="w-10 text-sm text-right">42%</div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-16 text-sm">35-44</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mx-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '18%' }}></div>
                    </div>
                    <div className="w-10 text-sm text-right">18%</div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-16 text-sm">45+</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mx-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '5%' }}></div>
                    </div>
                    <div className="w-10 text-sm text-right">5%</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top pays</CardTitle>
            <CardDescription>Répartition géographique</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">France</span>
                <span className="text-sm font-medium">45.2%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Canada</span>
                <span className="text-sm font-medium">23.1%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Belgique</span>
                <span className="text-sm font-medium">12.8%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Suisse</span>
                <span className="text-sm font-medium">8.4%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Autres</span>
                <span className="text-sm font-medium">10.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Audience;
