import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export default function GoogleCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Traitement de votre connexion Google...');
  const { handleGoogleCallback } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    const processGoogleCallback = async () => {
      try {
        setStatus('loading');
        setMessage('Vérification de votre authentification Google...');
        
        await handleGoogleCallback();
        
        setStatus('success');
        setMessage('Connexion Google réussie ! Redirection en cours...');
        
        // Redirection vers la page d'accueil après 2 secondes
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);
        
      } catch (error) {
        console.error('Erreur lors du callback Google:', error);
        setStatus('error');
        setMessage('Erreur lors de la connexion Google. Redirection vers la page de connexion...');
        
        // Redirection vers la page de connexion après 3 secondes
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    processGoogleCallback();
  }, [handleGoogleCallback, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <Card className="w-full max-w-md shadow-sm border border-neutral-200 bg-white">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-neutral-200 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-neutral-700" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Virail Studio</h1>
          </div>

          {status === 'loading' && (
            <div className="space-y-4">
              <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-800 rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-600 font-medium">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-red-600 font-medium">{message}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
