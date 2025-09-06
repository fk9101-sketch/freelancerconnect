import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaAutoSuggest } from '@/components/AreaAutoSuggest';
import { CategoryAutoSuggest } from '@/components/CategoryAutoSuggest';
import { PasswordInput } from '@/components/PasswordInput';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { signUpWithEmail, signInWithEmail } from '@/lib/firebase';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { isPasswordAcceptable } from '@/lib/passwordUtils';

interface SignupFormProps {
  role: 'customer' | 'freelancer';
  onBack: () => void;
}

export function SignupForm({ role, onBack }: SignupFormProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    area: '',
    category: '',
    password: '',
    confirmPassword: '',
  });

  // Category selection state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<string>('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.area.trim()) {
      newErrors.area = 'Area is required';
    }

    // Category validation for freelancers
    if (role === 'freelancer') {
      if (!selectedCategoryId && !customCategory.trim()) {
        newErrors.category = 'Please select a service category';
      }
      if (customCategory.trim() && customCategory.trim().length < 3) {
        newErrors.category = 'Custom category must be at least 3 characters long';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!isPasswordValid) {
      newErrors.password = 'Password does not meet security requirements';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Prepare signup data
      const signupData: any = {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        area: formData.area,
        role,
        phone: formData.phone,
      };

      // Add category data for freelancers
      if (role === 'freelancer') {
        if (selectedCategoryId) {
          signupData.categoryId = selectedCategoryId;
        }
        if (customCategory.trim()) {
          signupData.customCategory = customCategory.trim();
        }
      }

      // Create user in backend first (server will handle Firebase Auth)
      const response = await apiRequest('POST', '/api/auth/signup', signupData);

      // Parse the response JSON
      const responseData = await response.json();

      if (responseData.success) {
        toast({
          title: "Account Created Successfully!",
          description: "Your account has been created. Please login to continue.",
        });

        // Store the selected role
        localStorage.setItem('selectedRole', role);
        
        // Redirect to login screen with the same role
        setLocation(`/?role=${role}&mode=login`);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
      let errorMessage = 'Failed to create account. Please try again.';
      
      // Try to extract error message from server response
      if (error.message) {
        // Check if it's a server error response (format: "400: {"message": "..."}")
        const serverErrorMatch = error.message.match(/^\d+:\s*\{.*"message":\s*"([^"]+)".*\}$/);
        if (serverErrorMatch) {
          errorMessage = serverErrorMatch[1];
        } else if (error.message.includes('email-already-in-use')) {
          errorMessage = 'An account with this email already exists.';
        } else if (error.message.includes('weak-password')) {
          errorMessage = 'Password is too weak. Please choose a stronger password.';
        } else if (error.message.includes('invalid-email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (error.message.includes('User with this email already exists')) {
          errorMessage = 'An account with this email already exists.';
        } else if (error.message.includes('Password must be at least 6 characters long')) {
          errorMessage = 'Password must be at least 6 characters long.';
        } else if (error.message.includes('Invalid email format')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (error.message.includes('All fields are required')) {
          errorMessage = 'Please fill in all required fields.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Signup Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCategorySelect = (categoryId: string, categoryName: string) => {
    setSelectedCategoryId(categoryId);
    setCustomCategory('');
    handleInputChange('category', categoryName);
    setErrors(prev => ({ ...prev, category: '' }));
  };

  const handleCustomCategoryChange = (customCategoryValue: string) => {
    setCustomCategory(customCategoryValue);
    setSelectedCategoryId('');
    handleInputChange('category', customCategoryValue);
    setErrors(prev => ({ ...prev, category: '' }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <i className="fas fa-arrow-left text-gray-600"></i>
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-800">
            {role === 'customer' ? 'Customer' : 'Freelancer'} Sign Up
          </h2>
          <p className="text-gray-600 text-sm">
            Create your account to get started
          </p>
        </div>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm rounded-2xl shadow-xl border border-border">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl font-bold text-card-foreground">
            Create Your Account
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Join Freelancer Connect as a {role}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <Label htmlFor="fullName" className="text-sm font-semibold text-card-foreground mb-2 block">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Enter your full name"
                className={`bg-background border-border text-foreground rounded-2xl ${
                  errors.fullName ? 'border-red-500 focus-visible:ring-red-500' : ''
                }`}
              />
              {errors.fullName && (
                <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-sm font-semibold text-card-foreground mb-2 block">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email address"
                className={`bg-background border-border text-foreground rounded-2xl ${
                  errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone" className="text-sm font-semibold text-card-foreground mb-2 block">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter your phone number"
                className={`bg-background border-border text-foreground rounded-2xl ${
                  errors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''
                }`}
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Area Selection */}
            <div>
              <AreaAutoSuggest
                value={formData.area}
                onChange={(value) => handleInputChange('area', value)}
                placeholder="Type your area (e.g. Vaishali Nagar, Sirsi Road)"
                error={!!errors.area}
                required
              />
              {errors.area && (
                <p className="text-red-500 text-xs mt-1">{errors.area}</p>
              )}
            </div>

                         {/* Category Selection (for Freelancers) */}
             {role === 'freelancer' && (
               <div>
                 <CategoryAutoSuggest
                   value={formData.category}
                   onChange={(categoryId) => {
                     if (categoryId) {
                       // If we got a category ID, find the category name
                       const category = categories.find(cat => cat.id === categoryId);
                       if (category) {
                         handleInputChange('category', category.name);
                         setSelectedCategoryId(categoryId);
                         setCustomCategory('');
                       }
                     } else {
                       // If no category ID, treat as custom category
                       handleInputChange('category', '');
                     }
                   }}
                   onCategorySelect={handleCategorySelect}
                   onCustomCategoryChange={handleCustomCategoryChange}
                   placeholder="Type your service category (e.g. plumber, electrician)"
                   error={!!errors.category}
                   required
                 />
                 {errors.category && (
                   <p className="text-red-500 text-xs mt-1">{errors.category}</p>
                 )}
               </div>
             )}

            {/* Password */}
            <PasswordInput
              id="password"
              label="Password"
              value={formData.password}
              onChange={(value) => handleInputChange('password', value)}
              placeholder="Create a strong password"
              error={errors.password}
              required
              showStrengthMeter={true}
              showRequirements={true}
              email={formData.email}
              phone={formData.phone}
              username={formData.fullName}
              onValidationChange={setIsPasswordValid}
            />

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-card-foreground mb-2 block">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  className={`bg-background border-border text-foreground rounded-2xl pr-10 ${
                    errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''
                  }`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-purple text-white py-4 rounded-2xl font-semibold hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating Account...</span>
                </div>
              ) : (
                `Create ${role === 'customer' ? 'Customer' : 'Freelancer'} Account`
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground mb-3">
              Already have an account?
            </p>
            <Button
              onClick={() => {
                // Switch to login mode using the current form's role
                window.location.href = `/?role=${role}&mode=login`;
              }}
              className="w-full bg-gradient-purple text-white py-4 rounded-2xl font-semibold hover:scale-105 transition-all duration-200 shadow-lg mb-4"
            >
              <div className="flex items-center justify-center space-x-3">
                <i className="fas fa-sign-in-alt text-white"></i>
                <span>Sign In with Email</span>
              </div>
            </Button>
            <p className="text-xs text-muted-foreground">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
