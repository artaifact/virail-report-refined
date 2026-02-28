import React, { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, Check, X, AlertTriangle, Info } from 'lucide-react';
import { validatePassword, PasswordValidationResult } from '@/utils/passwordValidation';
import { cn } from '@/lib/utils';

// Liste des mots de passe courants à éviter (pour affichage)
const COMMON_PASSWORDS_DISPLAY = [
  'password', 'password123', '123456', '12345678', 'qwerty',
  'admin', 'admin123', 'letmein', 'welcome', 'abc123',
];

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  username?: string;
  email?: string;
  label?: string;
  placeholder?: string;
  showStrength?: boolean;
  showValidation?: boolean;
  /** Mode simplifié: affiche juste un message + liste des mots de passe à éviter */
  simpleMode?: boolean;
  onValidationChange?: (result: PasswordValidationResult) => void;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  className?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  username,
  email,
  label = 'Mot de passe',
  placeholder = 'Votre mot de passe',
  showStrength = true,
  showValidation = true,
  simpleMode = false,
  onValidationChange,
  disabled = false,
  required = true,
  id = 'password',
  name = 'password',
  className,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [validation, setValidation] = useState<PasswordValidationResult | null>(null);
  const [isTouched, setIsTouched] = useState(false);

  // Valider le mot de passe à chaque changement
  useEffect(() => {
    if (!value) {
      setValidation(null);
      return;
    }

    const result = validatePassword(value, username, email);
    setValidation(result);
    onValidationChange?.(result);
  }, [value, username, email, onValidationChange]);

  const getStrengthColor = useCallback((level: string) => {
    switch (level) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
      case 'very_strong': return 'bg-emerald-600';
      default: return 'bg-gray-300';
    }
  }, []);

  const getStrengthTextColor = useCallback((level: string) => {
    switch (level) {
      case 'weak': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'strong': return 'text-green-600';
      case 'very_strong': return 'text-emerald-600';
      default: return 'text-gray-500';
    }
  }, []);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-[11px] uppercase tracking-wide font-bold text-[#1b1b1f] mb-2 ml-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <input
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setIsTouched(true)}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          autoComplete="new-password"
          className={cn(
            'w-full bg-[#f7f8fc] rounded-xl px-4 py-3.5 pr-20 text-sm md:text-[15px] text-[#1b1b1f] placeholder:text-slate-300 border border-transparent focus:bg-white focus:border-[#9cb5ff] focus:ring-0 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed',
            isTouched && validation && !validation.isValid && 'border-red-300 focus:border-red-500',
            className
          )}
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          className="absolute inset-y-0 right-3 flex items-center text-[11px] text-[#6e6e73] hover:text-[#1b1b1f] transition-colors disabled:cursor-not-allowed"
          tabIndex={-1}
        >
          {showPassword ? (
            <>
              <EyeOff className="w-4 h-4 mr-1" />
              Masquer
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-1" />
              Afficher
            </>
          )}
        </button>
      </div>

      {/* Mode simple */}
      {simpleMode && (
        <div className="mt-1.5">
          {value && validation ? (
            validation.isValid ? (
              <p className="text-[11px] flex items-center gap-1 text-green-600">
                <Check className="w-3 h-3" />
                Mot de passe valide
              </p>
            ) : (
              <p className="text-[11px] text-red-500">
                {validation.errors[0]}
              </p>
            )
          ) : (
            <p className="text-[11px] text-gray-400">
              Min. 12 caractères, majuscule, minuscule, chiffre et caractère spécial.
            </p>
          )}
        </div>
      )}

      {/* Mode avancé: Indicateur de force */}
      {!simpleMode && showStrength && value && validation && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-300',
                  getStrengthColor(validation.strength.level)
                )}
                style={{ width: `${validation.strength.score}%` }}
              />
            </div>
            <span className={cn('text-xs font-medium min-w-[60px] text-right', getStrengthTextColor(validation.strength.level))}>
              {validation.strength.label}
            </span>
          </div>
        </div>
      )}

      {/* Mode avancé: Liste des erreurs */}
      {!simpleMode && showValidation && isTouched && validation && validation.errors.length > 0 && (
        <ul className="space-y-1 mt-2">
          {validation.errors.map((error, index) => (
            <li key={index} className="flex items-start gap-1.5 text-xs text-red-600">
              <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Mode avancé: Message de succès */}
      {!simpleMode && showValidation && isTouched && validation && validation.isValid && (
        <div className="flex items-center gap-1.5 text-xs text-green-600 mt-2">
          <Check className="w-4 h-4" />
          <span>Mot de passe valide</span>
        </div>
      )}
    </div>
  );
};

export default PasswordInput;
