import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { CheckCircle2, XCircle, Sparkles } from 'lucide-react';

export default function GoogleCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Vérification en cours...');
  const [progress, setProgress] = useState(0);
  const { handleGoogleCallback } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    const processGoogleCallback = async () => {
      try {
        setStatus('loading');
        setMessage('Connexion avec Google...');

        // Animation de progression
        const progressInterval = setInterval(() => {
          setProgress(prev => Math.min(prev + 15, 90));
        }, 200);

        await handleGoogleCallback();

        clearInterval(progressInterval);
        setProgress(100);
        setStatus('success');
        setMessage('Bienvenue !');

        // Redirection après animation
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1800);

      } catch (error) {
        setStatus('error');
        setMessage('Une erreur est survenue');

        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2500);
      }
    };

    processGoogleCallback();
  }, [handleGoogleCallback, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Cercles décoratifs animés */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl animate-pulse delay-700" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-100/20 to-indigo-100/20 rounded-full blur-3xl" />

      {/* Confetti pour le succès */}
      {status === 'success' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#10B981'][Math.floor(Math.random() * 5)],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1.5 + Math.random()}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 shadow-2xl shadow-blue-500/10 border border-white/50">
          {/* Logo animé */}
          <div className="flex justify-center mb-8">
            <div className={`relative transition-all duration-700 ${status === 'success' ? 'scale-110' : ''}`}>
              {status === 'loading' && (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 animate-pulse">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
              )}

              {status === 'success' && (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-green-500/30 animate-bounce-once">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
              )}

              {status === 'error' && (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                  <XCircle className="w-10 h-10 text-white" />
                </div>
              )}

              {/* Anneau de progression pour loading */}
              {status === 'loading' && (
                <svg className="absolute -inset-2 w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="4"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={289}
                    strokeDashoffset={289 - (289 * progress) / 100}
                    className="transition-all duration-300"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#6366F1" />
                    </linearGradient>
                  </defs>
                </svg>
              )}
            </div>
          </div>

          {/* Texte */}
          <div className="text-center space-y-3">
            <h1 className={`text-2xl font-bold transition-all duration-500 ${
              status === 'success'
                ? 'text-emerald-600'
                : status === 'error'
                  ? 'text-red-600'
                  : 'text-slate-800'
            }`}>
              {message}
            </h1>

            <p className="text-slate-500 text-sm">
              {status === 'loading' && 'Veuillez patienter...'}
              {status === 'success' && 'Redirection vers votre espace...'}
              {status === 'error' && 'Retour à la page de connexion...'}
            </p>
          </div>

          {/* Barre de progression */}
          {status === 'loading' && (
            <div className="mt-8">
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Indicateur de succès animé */}
          {status === 'success' && (
            <div className="mt-8 flex justify-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Texte du bas */}
        <p className="text-center text-slate-400 text-xs mt-6">
          Sécurisé par Virail
        </p>
      </div>

      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes bounce-once {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        .animate-confetti {
          animation: confetti linear forwards;
        }

        .animate-bounce-once {
          animation: bounce-once 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
