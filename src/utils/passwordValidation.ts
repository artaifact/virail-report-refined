export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: {
    score: number;
    level: 'weak' | 'medium' | 'strong' | 'very_strong';
    label: string;
  };
}

// Liste des mots de passe communs à éviter
const COMMON_PASSWORDS = new Set([
  'password', 'password123', '123456', '12345678', 'qwerty',
  'admin', 'admin123', 'letmein', 'welcome', 'monkey',
  'dragon', 'master', 'abc123', '111111', '123123',
  'iloveyou', 'sunshine', 'princess', 'football', 'baseball',
  'password1', 'azerty', 'trustno1', '000000', 'passw0rd',
  'virail', 'virail123', 'test', 'test123', '123456789',
  'qwerty123', 'admin1234', 'root', 'toor', 'changeme',
]);

// Séquences à détecter
const SEQUENTIAL_PATTERNS = [
  '012345', '123456', '234567', '345678', '456789',
  '567890', 'abcdef', 'bcdefg', 'cdefgh', 'qwerty',
  'asdfgh', 'zxcvbn', 'azertyui',
];

/**
 * Valide un mot de passe selon les règles de sécurité définies
 * @param password - Le mot de passe à valider
 * @param username - Le nom d'utilisateur (optionnel, pour vérifier qu'il n'est pas inclus)
 * @param email - L'email (optionnel, pour vérifier qu'il n'est pas inclus)
 * @returns Le résultat de la validation avec erreurs et score de force
 */
export function validatePassword(
  password: string,
  username?: string,
  email?: string
): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;
  const passwordLower = password.toLowerCase();

  // Règle 1: Longueur minimale (12 caractères)
  if (password.length < 12) {
    errors.push('Le mot de passe doit contenir au moins 12 caractères');
  } else {
    score += 25;
    if (password.length >= 16) score += 10;
    if (password.length >= 20) score += 5;
  }

  // Règle 2: Au moins une majuscule
  if (!/[A-Z]/.test(password)) {
    errors.push('Doit contenir au moins une majuscule');
  } else {
    score += 15;
  }

  // Règle 3: Au moins une minuscule
  if (!/[a-z]/.test(password)) {
    errors.push('Doit contenir au moins une minuscule');
  } else {
    score += 10;
  }

  // Règle 4: Au moins un chiffre
  if (!/[0-9]/.test(password)) {
    errors.push('Doit contenir au moins un chiffre');
  } else {
    score += 15;
  }

  // Règle 5: Au moins un caractère spécial
  if (!/[!@#$%^&*(),.?":{}|<>\-_=+\[\]\\;'`~]/.test(password)) {
    errors.push('Doit contenir au moins un caractère spécial (!@#$%^&*...)');
  } else {
    score += 20;
  }

  // Règle 6: Pas de mot de passe commun
  if (COMMON_PASSWORDS.has(passwordLower)) {
    errors.push('Ce mot de passe est trop commun et facile à deviner');
    score -= 50;
  }

  // Règle 7: Pas de séquences simples
  for (const pattern of SEQUENTIAL_PATTERNS) {
    if (passwordLower.includes(pattern)) {
      errors.push('Ne doit pas contenir de séquences simples (123456, abcdef, etc.)');
      score -= 20;
      break;
    }
  }

  // Règle 8: Pas de répétitions excessives
  if (/(.)\1{3,}/.test(password)) {
    errors.push('Ne doit pas contenir plus de 3 caractères identiques consécutifs');
    score -= 15;
  }

  // Règle 9: Ne pas contenir le nom d'utilisateur
  if (username && username.length >= 3) {
    if (passwordLower.includes(username.toLowerCase())) {
      errors.push("Ne doit pas contenir votre nom d'utilisateur");
      score -= 20;
    }
  }

  // Règle 10: Ne pas contenir l'email
  if (email) {
    const emailPart = email.split('@')[0].toLowerCase();
    if (emailPart.length >= 3 && passwordLower.includes(emailPart)) {
      errors.push('Ne doit pas contenir votre adresse email');
      score -= 20;
    }
  }

  // Bonus pour diversité de caractères
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= 10) {
    score += 5;
  }

  // Normaliser le score
  score = Math.max(0, Math.min(100, score));

  // Déterminer le niveau
  let level: PasswordValidationResult['strength']['level'];
  let label: string;

  if (score < 30) {
    level = 'weak';
    label = 'Faible';
  } else if (score < 50) {
    level = 'medium';
    label = 'Moyen';
  } else if (score < 75) {
    level = 'strong';
    label = 'Fort';
  } else {
    level = 'very_strong';
    label = 'Très fort';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: { score, level, label },
  };
}

/**
 * Génère un mot de passe aléatoire sécurisé
 * @param length - Longueur du mot de passe (défaut: 16)
 * @returns Un mot de passe aléatoire sécurisé
 */
export function generateSecurePassword(length: number = 16): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*()-_=+[]{}|;:,.<>?';
  const all = lowercase + uppercase + numbers + special;

  let password = '';

  // Garantir au moins un caractère de chaque type
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Remplir le reste avec des caractères aléatoires
  for (let i = 4; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Mélanger le mot de passe
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}
