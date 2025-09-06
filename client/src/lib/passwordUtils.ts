/**
 * Password validation utilities and strength meter
 * Implements strong password policy with real-time validation
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: PasswordStrength;
  score: number;
}

export interface PasswordStrength {
  level: 'Very Weak' | 'Weak' | 'Medium' | 'Strong' | 'Very Strong';
  color: string;
  percentage: number;
}

// Common weak passwords to prevent
const COMMON_WEAK_PASSWORDS = [
  '123456', 'password', 'qwerty', 'abc123', 'password123', '123456789',
  '12345678', '12345', '1234567', '1234567890', 'admin', 'letmein',
  'welcome', 'monkey', '1234', 'dragon', 'master', 'hello', 'login',
  'princess', 'qwertyuiop', 'solo', 'passw0rd', 'starwars', 'freedom',
  'whatever', 'trustno1', 'jordan', 'harley', 'ranger', 'hunter',
  'buster', 'soccer', 'hockey', 'killer', 'george', 'sexy', 'andrew',
  'charlie', 'superman', 'asshole', 'fuckyou', 'dallas', 'jessica',
  'panties', 'pepper', '1234', 'zxcvbn', '000000', '111111', 'aaaaaa'
];

// Password policy configuration
export const PASSWORD_POLICY = {
  minLength: 8,
  recommendedLength: 10,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventPersonalInfo: true
};

/**
 * Validates password against strong password policy
 */
export function validatePassword(
  password: string,
  email?: string,
  phone?: string,
  username?: string
): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  // Length validation
  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters long`);
  } else {
    score += 20;
  }

  if (password.length >= PASSWORD_POLICY.recommendedLength) {
    score += 10;
  }

  // Character type validation
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);

  if (PASSWORD_POLICY.requireUppercase && !hasUppercase) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  } else if (hasUppercase) {
    score += 15;
  }

  if (PASSWORD_POLICY.requireLowercase && !hasLowercase) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
  } else if (hasLowercase) {
    score += 15;
  }

  if (PASSWORD_POLICY.requireNumbers && !hasNumbers) {
    errors.push('Password must contain at least one number (0-9)');
  } else if (hasNumbers) {
    score += 15;
  }

  if (PASSWORD_POLICY.requireSpecialChars && !hasSpecialChars) {
    errors.push('Password must contain at least one special character (!@#$%^&* etc.)');
  } else if (hasSpecialChars) {
    score += 15;
  }

  // Prevent common weak passwords
  if (PASSWORD_POLICY.preventCommonPasswords) {
    const lowerPassword = password.toLowerCase();
    if (COMMON_WEAK_PASSWORDS.some(weak => lowerPassword === weak.toLowerCase())) {
      errors.push('Password contains common weak patterns. Please choose a more unique password.');
      score -= 20;
    }
  }

  // Prevent personal information
  if (PASSWORD_POLICY.preventPersonalInfo) {
    if (email && password.toLowerCase().includes(email.split('@')[0].toLowerCase())) {
      errors.push('Password should not contain your email username');
      score -= 10;
    }
    
    if (phone && password.includes(phone.replace(/\D/g, ''))) {
      errors.push('Password should not contain your phone number');
      score -= 10;
    }
    
    if (username && password.toLowerCase().includes(username.toLowerCase())) {
      errors.push('Password should not contain your username');
      score -= 10;
    }
  }

  // Additional complexity scoring
  if (password.length >= 12) score += 10;
  if (hasUppercase && hasLowercase && hasNumbers && hasSpecialChars) score += 10;
  
  // Penalize repeated characters
  const repeatedChars = /(.)\1{2,}/.test(password);
  if (repeatedChars) {
    score -= 5;
  }

  // Penalize sequential characters
  const sequentialChars = /(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|123|234|345|456|567|678|789|890)/i.test(password);
  if (sequentialChars) {
    score -= 5;
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  const strength = calculatePasswordStrength(score);
  
  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score
  };
}

/**
 * Calculates password strength based on score
 */
export function calculatePasswordStrength(score: number): PasswordStrength {
  if (score < 30) {
    return {
      level: 'Very Weak',
      color: 'bg-red-500',
      percentage: score
    };
  } else if (score < 50) {
    return {
      level: 'Weak',
      color: 'bg-orange-500',
      percentage: score
    };
  } else if (score < 70) {
    return {
      level: 'Medium',
      color: 'bg-yellow-500',
      percentage: score
    };
  } else if (score < 85) {
    return {
      level: 'Strong',
      color: 'bg-blue-500',
      percentage: score
    };
  } else {
    return {
      level: 'Very Strong',
      color: 'bg-green-500',
      percentage: score
    };
  }
}

/**
 * Generates password requirements text for display
 */
export function getPasswordRequirements(): string[] {
  return [
    `At least ${PASSWORD_POLICY.minLength} characters long (${PASSWORD_POLICY.recommendedLength}+ recommended)`,
    'At least one uppercase letter (A-Z)',
    'At least one lowercase letter (a-z)',
    'At least one number (0-9)',
    'At least one special character (!@#$%^&* etc.)',
    'Not a common weak password',
    'Does not contain personal information'
  ];
}

/**
 * Checks if password meets minimum requirements for submission
 */
export function isPasswordAcceptable(validation: PasswordValidationResult): boolean {
  return validation.isValid && validation.strength.level !== 'Very Weak' && validation.strength.level !== 'Weak';
}
