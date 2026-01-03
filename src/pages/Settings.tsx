import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AuthService } from "@/services/authService";
import { Settings as SettingsIcon, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";

import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState('Herby');
  const [lastName, setLastName] = useState('Nerilus');

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profile = await AuthService.getUserProfile();
        setUserProfile(profile);
        // Extraire le prénom et nom depuis le username si disponible
        if (profile.username) {
          const nameParts = profile.username.split(' ');
          if (nameParts.length >= 2) {
            setFirstName(nameParts[0]);
            setLastName(nameParts.slice(1).join(' '));
          }
        }
      } catch (err) {
        console.error('Erreur lors du chargement du profil:', err);
      }
    };

    loadUserProfile();
  }, []);

  // Obtenir l'initiale pour l'avatar
  const getInitial = () => {
    if (firstName && lastName) {
      return firstName[0].toUpperCase();
    }
    if (userProfile?.username) {
      return userProfile.username[0].toUpperCase();
    }
    return 'U';
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Informations personnelles</h2>
            
            {/* Avatar */}
            <div className="mb-8">
              <div className="w-20 h-20 rounded-full bg-amber-800 flex items-center justify-center shadow-md">
                <span className="text-3xl font-semibold text-white">{getInitial()}</span>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                  Prénom
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                  Nom
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Current Usage Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Utilisation actuelle</h2>
              <Button variant="outline" size="sm" className="flex items-center gap-2 text-sm">
                <SettingsIcon size={14} />
                Définir des limites
              </Button>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="mb-3">
                <span className="text-sm font-medium text-gray-700">Inclus dans le forfait</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: '0%' }}></div>
                </div>
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">0/75 000 tâches utilisées</span>
              </div>
            </div>
            
            <p className="mt-4 text-sm text-gray-600">
              Les <span className="underline cursor-pointer hover:text-gray-900">tâches</span> seront réinitialisées dans 6 jours (01 déc. 01:00 hs).
            </p>
          </div>

          {/* Plan Details Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Détails du forfait</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center">
                <span className="text-sm text-gray-600 w-32">Forfait :</span>
                <span className="text-sm font-medium text-gray-900">Pro</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 w-32">Statut :</span>
                <span className="text-sm font-medium text-amber-600">Essai en cours</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 w-32">L'essai se termine le :</span>
                <span className="text-sm font-medium text-gray-900">5 déc. 2025</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <Button 
                onClick={() => navigate('/pricing')}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm"
              >
                <Sparkles size={14} />
                Améliorer le forfait
              </Button>
              <Button 
                onClick={() => navigate('/pricing')}
                variant="outline" 
                className="flex items-center gap-2 text-sm"
              >
                <SettingsIcon size={14} />
                Gérer le forfait
              </Button>
            </div>
          </div>

          {/* Invoices Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Factures</h2>
            
            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeft size={18} />
              </button>
              
              <div className="flex-1 border border-gray-200 rounded-lg p-5 bg-gray-50">
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">21 nov. 2025</div>
                  <div className="text-base font-semibold text-gray-900">0,00 $</div>
                  <div>
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                      payée
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-3">Période d'essai pour Virail Pro</div>
                </div>
              </div>
              
              <button className="p-2 text-gray-300 hover:text-gray-400 hover:bg-gray-100 rounded-lg transition-colors opacity-50 pointer-events-none">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
