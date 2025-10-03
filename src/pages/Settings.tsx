import { useState, useEffect } from "react";
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Key, Globe, Clock, Save, Smartphone, Mail, Lock, Eye, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AuthService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";

interface UserProfile {
  email: string;
  username: string;
  id: number;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
  created_at: string;
}

const Settings = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Array<any>>([]);
  const { toast } = useToast();

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const profile = await AuthService.getUserProfile();
        setUserProfile(profile);
        // Charger les sessions actives
        const sess = await AuthService.getSessions();
        setSessions(sess || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement du profil';
        setError(errorMessage);
        toast({
          title: "Erreur",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [toast]);
  return (
    <div className="flex-1 min-h-screen bg-background">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden bg-card px-8 py-12 border-b border-border">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-muted/30"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                  <SettingsIcon className="w-6 h-6 text-foreground" />
                </div>
                <Badge className="bg-muted text-foreground border-border">
                  ⚙️ Configuration
                </Badge>
              </div>
              <h1 className="text-4xl font-bold text-foreground mb-3">
                Paramètres
              </h1>
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                Personnalisez votre expérience et gérez vos préférences.
              </p>
              <div className="flex items-center gap-4">
                <Button 
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg font-semibold px-6 py-3 h-auto"
                >
                  <Save className="h-5 w-5 mr-2" />
                  Sauvegarder tout
                </Button>
                <Button 
                  variant="outline"
                  className="border-border text-foreground hover:bg-muted px-6 py-3 h-auto"
                >
                  <Eye className="h-5 w-5 mr-2" />
                  Aperçu
                </Button>
              </div>
            </div>
            
            {/* Stats preview */}
            <div className="hidden lg:block">
              <div className="bg-muted rounded-2xl p-6 border border-border">
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground mb-1">4</div>
                  <div className="text-muted-foreground text-sm font-medium">Sections</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Shield className="w-4 h-4 text-foreground" />
                    <span className="text-muted-foreground text-sm">Sécurisé</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-8 space-y-8">
        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
          {/* User Profile */}
          <Card className="border border-border shadow-sm bg-card overflow-hidden">
            <CardHeader className="bg-muted border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-xl text-foreground">
                    <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                      <User className="h-5 w-5 text-foreground" />
                    </div>
                    Profil Utilisateur
                  </CardTitle>
                  <CardDescription className="mt-2 text-muted-foreground">
                    Gérez vos informations personnelles et préférences de compte
                  </CardDescription>
                </div>
                <Badge className="bg-muted text-foreground">
                  Profil
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-foreground" />
                  <span className="ml-2 text-muted-foreground">Chargement du profil...</span>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-8">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                  <span className="ml-2 text-destructive">{error}</span>
                </div>
              ) : userProfile ? (
                <>
                  <div className="space-y-3">
                    <Label htmlFor="username" className="text-sm font-semibold text-muted-foreground">Nom d'utilisateur</Label>
                    <Input 
                      id="username" 
                      value={userProfile.username || "Non défini"} 
                      disabled
                      className="border border-border bg-card h-11 text-foreground"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-sm font-semibold text-muted-foreground">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={userProfile.email || "Non défini"} 
                      disabled
                      className="border border-border bg-card h-11 text-foreground"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="id" className="text-sm font-semibold text-muted-foreground">ID Utilisateur</Label>
                    <Input 
                      id="id" 
                      value={userProfile.id.toString()} 
                      disabled
                      className="border border-border bg-card h-11 text-foreground"
                    />
                  </div>
                  
                  {/* Informations du compte */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h4 className="text-sm font-semibold text-foreground">Statut du compte</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">Actif</span>
                        <Badge variant={userProfile.is_active ? "default" : "destructive"}>
                          {userProfile.is_active ? "Oui" : "Non"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">Vérifié</span>
                        <Badge variant={userProfile.is_verified ? "default" : "secondary"}>
                          {userProfile.is_verified ? "Oui" : "Non"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">Administrateur</span>
                        <Badge variant={userProfile.is_admin ? "default" : "outline"}>
                          {userProfile.is_admin ? "Oui" : "Non"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">Créé le</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(userProfile.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 font-semibold"
                    disabled
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Modifications non disponibles
                  </Button>
                </>
              ) : null}
            </CardContent>
          </Card>
          
          {/* Notifications */}
          <Card className="border border-border shadow-sm bg-card overflow-hidden">
            <CardHeader className="bg-muted border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-xl text-foreground">
                    <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                      <Bell className="h-5 w-5 text-foreground" />
                    </div>
                    Notifications
                  </CardTitle>
                  <CardDescription className="mt-2 text-muted-foreground">
                    Configurez vos préférences de notifications
                  </CardDescription>
                </div>
                <Badge className="bg-muted text-foreground">
                  3 Actives
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                    <Mail className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <Label htmlFor="email-notifications" className="font-semibold text-foreground">Notifications par email</Label>
                    <p className="text-sm text-muted-foreground">Recevoir les rapports hebdomadaires</p>
                  </div>
                </div>
                <Switch id="email-notifications" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                    <Smartphone className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <Label htmlFor="push-notifications" className="font-semibold text-foreground">Notifications push</Label>
                    <p className="text-sm text-muted-foreground">Alertes en temps réel</p>
                  </div>
                </div>
                <Switch id="push-notifications" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                    <Bell className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <Label htmlFor="marketing-emails" className="font-semibold text-foreground">Emails marketing</Label>
                    <p className="text-sm text-muted-foreground">Conseils et nouvelles fonctionnalités</p>
                  </div>
                </div>
                <Switch id="marketing-emails" />
              </div>
            </CardContent>
          </Card>
          
          {/* Security */}
          <Card className="border border-border shadow-sm bg-card overflow-hidden">
            <CardHeader className="bg-muted border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-xl text-foreground">
                    <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                      <Shield className="h-5 w-5 text-foreground" />
                    </div>
                    Sécurité et Confidentialité
                  </CardTitle>
                  <CardDescription className="mt-2 text-muted-foreground">
                    Gérez la sécurité de votre compte
                  </CardDescription>
                </div>
                <Badge className="bg-muted text-foreground">
                  <Lock className="w-3 h-3 mr-1" />
                  Sécurisé
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-muted-foreground">Mot de passe</Label>
                <Button variant="outline" className="w-full justify-start h-11 border border-border hover:bg-muted">
                  <Key className="h-4 w-4 mr-2 text-foreground" />
                  Changer le mot de passe
                </Button>
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-muted-foreground">Authentification à deux facteurs</Label>
                <div className="flex items-center justify-between p-4 bg-muted rounded-xl border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                      <Shield className="h-4 w-4 text-foreground" />
                    </div>
                    <div>
                      <Label htmlFor="2fa" className="font-semibold text-foreground">Activer 2FA</Label>
                      <p className="text-sm text-muted-foreground">Protection supplémentaire</p>
                    </div>
                  </div>
                  <Switch id="2fa" />
                </div>
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-muted-foreground">Sessions actives</Label>
                <div className="rounded-xl border border-border bg-card">
                  {sessions && sessions.length > 0 ? (
                    <div className="divide-y divide-border">
                      {sessions.map((s, idx) => (
                        <div key={idx} className="p-3 flex items-center justify-between">
                          <div className="min-w-0">
                            <div className="text-sm text-foreground font-medium truncate">
                              {s.user_agent || 'Session'} {s.current ? '(courante)' : ''}
                            </div>
                          <div className="text-xs text-muted-foreground truncate">
                              Dernière activité: {s.last_active_at ? new Date(s.last_active_at).toLocaleString('fr-FR') : '—'}
                            </div>
                          </div>
                          <Badge variant={s.current ? 'default' : 'secondary'} className="text-xs">
                            {s.current ? 'Active' : 'Ouverte'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-sm text-muted-foreground flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Aucune session active trouvée
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Display Preferences */}
          <Card className="border border-border shadow-sm bg-card overflow-hidden">
            <CardHeader className="bg-muted border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-xl text-foreground">
                    <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                      <Palette className="h-5 w-5 text-foreground" />
                    </div>
                    Préférences d'Affichage
                  </CardTitle>
                  <CardDescription className="mt-2 text-muted-foreground">
                    Personnalisez l'apparence de l'application
                  </CardDescription>
                </div>
                <Badge className="bg-muted text-foreground">
                  <Palette className="w-3 h-3 mr-1" />
                  Thème
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-muted-foreground">Thème</Label>
                <div className="flex justify-center">
                  <ThemeToggle />
                </div>
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-muted-foreground">Langue</Label>
                <Button variant="outline" className="w-full justify-start h-11 border border-border hover:bg-muted">
                  <Globe className="h-4 w-4 mr-2 text-foreground" />
                  Français 🇫🇷
                </Button>
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-muted-foreground">Fuseau horaire</Label>
                <Button variant="outline" className="w-full justify-start h-11 border border-border hover:bg-muted">
                  <Clock className="h-4 w-4 mr-2 text-foreground" />
                  Europe/Paris (UTC+1)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;