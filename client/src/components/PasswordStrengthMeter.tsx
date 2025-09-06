import React from 'react';
import { PasswordValidationResult, PasswordStrength } from '@/lib/passwordUtils';

interface PasswordStrengthMeterProps {
  validation: PasswordStrengthValidationResult;
  showRequirements?: boolean;
  className?: string;
}

interface PasswordStrengthValidationResult {
  isValid: boolean;
  errors: string[];
  strength: PasswordStrength;
  score: number;
}

export function PasswordStrengthMeter({ 
  validation, 
  showRequirements = true, 
  className = '' 
}: PasswordStrengthMeterProps) {
  const { strength, errors, isValid } = validation;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Password Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Password Strength:</span>
          <span 
            className={`font-medium ${
              strength.level === 'Very Weak' ? 'text-red-600' :
              strength.level === 'Weak' ? 'text-orange-600' :
              strength.level === 'Medium' ? 'text-yellow-600' :
              strength.level === 'Strong' ? 'text-blue-600' :
              'text-green-600'
            }`}
          >
            {strength.level}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${strength.color}`}
            style={{ width: `${strength.percentage}%` }}
          />
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, index) => (
            <p key={index} className="text-red-500 text-xs flex items-center gap-1">
              <span className="text-red-500">•</span>
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Success Message */}
      {isValid && strength.level !== 'Very Weak' && strength.level !== 'Weak' && (
        <p className="text-green-600 text-xs flex items-center gap-1">
          <span className="text-green-500">✓</span>
          Password meets security requirements
        </p>
      )}

      {/* Password Requirements */}
      {showRequirements && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-700 mb-2">Password Requirements:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${
                validation.score >= 20 ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              At least 8 characters long (10+ recommended)
            </li>
            <li className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${
                /[A-Z]/.test(validation.strength.level) || validation.score >= 35 ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              At least one uppercase letter (A-Z)
            </li>
            <li className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${
                /[a-z]/.test(validation.strength.level) || validation.score >= 50 ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              At least one lowercase letter (a-z)
            </li>
            <li className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${
                /[0-9]/.test(validation.strength.level) || validation.score >= 65 ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              At least one number (0-9)
            </li>
            <li className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${
                /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(validation.strength.level) || validation.score >= 80 ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              At least one special character (!@#$%^&* etc.)
            </li>
            <li className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${
                !errors.some(e => e.includes('common weak')) ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              Not a common weak password
            </li>
            <li className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${
                !errors.some(e => e.includes('personal information') || e.includes('email') || e.includes('phone') || e.includes('username')) ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              Does not contain personal information
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
