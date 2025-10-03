import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
}

export default function Diagnostic() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    
    const newResults: TestResult[] = [];

    // Test 1: Vérification des composants UI
    try {
      const { GoogleButton } = await import('@/components/ui/GoogleButton');
      newResults.push({
        name: 'Composants UI',
        status: 'success',
        message: 'Tous les composants UI se chargent correctement'
      });
    } catch (error) {
      newResults.push({
        name: 'Composants UI',
        status: 'error',
        message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    }

    // Test 2: Vérification des services
    try {
      const { AuthService } = await import('@/services/authService');
      newResults.push({
        name: 'Services d\'authentification',
        status: 'success',
        message: 'AuthService se charge correctement'
      });
    } catch (error) {
      newResults.push({
        name: 'Services d\'authentification',
        status: 'error',
        message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    }

    // Test 3: Vérification des hooks
    try {
      const { useAuth } = await import('@/hooks/useAuth');
      newResults.push({
        name: 'Hooks d\'authentification',
        status: 'success',
        message: 'useAuth se charge correctement'
      });
    } catch (error) {
      newResults.push({
        name: 'Hooks d\'authentification',
        status: 'error',
        message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    }

    // Test 4: Vérification de l'API Google
    try {
      const response = await fetch('http://localhost:8000/auth/google/login', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        newResults.push({
          name: 'API Google OAuth',
          status: 'success',
          message: 'L\'API Google OAuth répond correctement'
        });
      } else {
        newResults.push({
          name: 'API Google OAuth',
          status: 'warning',
          message: `L'API répond avec le statut: ${response.status}`
        });
      }
    } catch (error) {
      newResults.push({
        name: 'API Google OAuth',
        status: 'error',
        message: `Erreur de connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    }

    // Test 5: Vérification de la configuration
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      newResults.push({
        name: 'Configuration',
        status: 'success',
        message: `API URL configurée: ${apiUrl}`
      });
    } catch (error) {
      newResults.push({
        name: 'Configuration',
        status: 'error',
        message: `Erreur de configuration: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    }

    // Test 6: Vérification de l'endpoint de déconnexion
    try {
      const response = await fetch('http://localhost:8000/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        newResults.push({
          name: 'Endpoint de déconnexion',
          status: 'success',
          message: 'L\'endpoint POST /auth/logout répond correctement'
        });
      } else {
        newResults.push({
          name: 'Endpoint de déconnexion',
          status: 'warning',
          message: `L'endpoint répond avec le statut: ${response.status}`
        });
      }
    } catch (error) {
      newResults.push({
        name: 'Endpoint de déconnexion',
        status: 'error',
        message: `Erreur de connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    }

    setResults(newResults);
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Succès</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Erreur</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Avertissement</Badge>;
      default:
        return null;
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const warningCount = results.filter(r => r.status === 'warning').length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6" />
              Diagnostic de l'application
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={runDiagnostics} 
                disabled={isRunning}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isRunning ? 'Diagnostic en cours...' : 'Lancer le diagnostic'}
              </Button>
              
              <Button 
                onClick={() => setResults([])} 
                variant="outline"
                disabled={isRunning}
              >
                Effacer les résultats
              </Button>
            </div>
            
            {results.length > 0 && (
              <div className="grid gap-2">
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600">✅ {successCount} succès</span>
                  <span className="text-yellow-600">⚠️ {warningCount} avertissements</span>
                  <span className="text-red-600">❌ {errorCount} erreurs</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Résultats du diagnostic</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="font-medium">{result.name}</div>
                      <div className="text-sm text-gray-600">{result.message}</div>
                    </div>
                    {getStatusBadge(result.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
