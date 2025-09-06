import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';
import { validatePassword, PasswordValidationResult, isPasswordAcceptable } from '@/lib/passwordUtils';

interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  showStrengthMeter?: boolean;
  showRequirements?: boolean;
  email?: string;
  phone?: string;
  username?: string;
  className?: string;
  onValidationChange?: (isValid: boolean) => void;
}

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder = "Enter your password",
  error,
  required = false,
  showStrengthMeter = true,
  showRequirements = true,
  email,
  phone,
  username,
  className = "",
  onValidationChange
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [validation, setValidation] = useState<PasswordValidationResult>({
    isValid: false,
    errors: [],
    strength: { level: 'Very Weak', color: 'bg-red-500', percentage: 0 },
    score: 0
  });

  // Validate password whenever it changes
  useEffect(() => {
    if (value) {
      const result = validatePassword(value, email, phone, username);
      setValidation(result);
      onValidationChange?.(isPasswordAcceptable(result));
    } else {
      setValidation({
        isValid: false,
        errors: [],
        strength: { level: 'Very Weak', color: 'bg-red-500', percentage: 0 },
        score: 0
      });
      onValidationChange?.(false);
    }
  }, [value, email, phone, username, onValidationChange]);

  const hasError = error || (!validation.isValid && value.length > 0);

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id} className="text-sm font-semibold text-card-foreground mb-2 block">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`bg-background border-border text-foreground rounded-2xl pr-10 ${
            hasError ? 'border-red-500 focus-visible:ring-red-500' : ''
          }`}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}

      {/* Password Strength Meter */}
      {showStrengthMeter && value && (
        <PasswordStrengthMeter 
          validation={validation} 
          showRequirements={showRequirements}
        />
      )}
    </div>
  );
}
