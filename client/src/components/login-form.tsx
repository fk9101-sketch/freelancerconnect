import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { signInWithEmail, signOutUser } from '@/lib/firebase';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

interface LoginFormProps {
  role: 'customer' | 'freelancer';
  onBack: () => void;
}

export function LoginForm({ role, onBack }: LoginFormProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Debug logging
  console.log('LoginForm rendered with role:', role);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
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
      // Sign in with Firebase Auth only
      const firebaseUser = await signInWithEmail(formData.email, formData.password);
      
      if (!firebaseUser) {
        throw new Error('Failed to sign in');
      }

      // Get user data from backend using Firebase UID (not re-authenticating)
      const response = await apiRequest('GET', `/api/auth/user/${firebaseUser.uid}`);
      
      if (response.ok) {
        const responseData = await response.json();
        
        if (responseData.success) {
          // Verify that the user's actual role matches the selected role
          const actualUserRole = responseData.user.role;
          
          if (actualUserRole !== role) {
            // Role mismatch - show error and redirect to appropriate login
            toast({
              title: "Role Mismatch",
              description: `This account is registered as a ${actualUserRole}. Please use the ${actualUserRole} login instead.`,
              variant: "destructive",
            });
            
            // Sign out from Firebase since role doesn't match
            await signOutUser();
            
            // Redirect to the correct role selection
            setTimeout(() => {
              window.location.href = `/?role=${actualUserRole}&mode=login`;
            }, 2000);
            return;
          }
          
          // Store the verified role
          localStorage.setItem('selectedRole', actualUserRole);
          
          toast({
            title: "Welcome Back!",
            description: `Successfully signed in as ${actualUserRole}`,
          });

          // Redirect based on the verified role
          if (actualUserRole === 'customer') {
            setLocation('/customer');
          } else if (actualUserRole === 'freelancer') {
            setLocation('/freelancer');
          } else if (actualUserRole === 'admin') {
            setLocation('/admin');
          }
        } else {
          throw new Error(responseData.message || 'Failed to get user data');
        }
      } else {
        // If user doesn't exist in backend, create them
        const createResponse = await apiRequest('POST', '/api/auth/create-user', {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: role,
          firstName: firebaseUser.displayName?.split(' ')[0] || '',
          lastName: firebaseUser.displayName?.slice(1).join(' ') || '',
        });
        
        if (createResponse.ok) {
          const createData = await createResponse.json();
          
          // Store the role
          localStorage.setItem('selectedRole', role);
          
          toast({
            title: "Welcome!",
            description: `Account created successfully as ${role}`,
          });

          // Redirect based on the role
          if (role === 'customer') {
            setLocation('/customer');
          } else if (role === 'freelancer') {
            setLocation('/freelancer');
          }
        } else {
          throw new Error('Failed to create user account');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'Failed to sign in. Please try again.';
      
      // Handle Firebase-specific errors
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Login Failed",
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
            {role === 'customer' ? 'Customer' : 'Freelancer'} Login
          </h2>
          <p className="text-gray-600 text-sm">
            Sign in to your account
          </p>
        </div>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm rounded-2xl shadow-xl border border-border">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl font-bold text-card-foreground">
            Welcome Back
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Sign in to your {role} account
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {/* Password */}
            <div>
              <Label htmlFor="password" className="text-sm font-semibold text-card-foreground mb-2 block">
                Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter your password"
                  className={`bg-background border-border text-foreground rounded-2xl pr-10 ${
                    errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''
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
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
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
                  <span>Signing In...</span>
                </div>
              ) : (
                `Sign In as ${role === 'customer' ? 'Customer' : 'Freelancer'}`
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground mb-3">
              Don't have an account?
            </p>
            <Button
              onClick={() => {
                // Switch to signup mode using the current form's role
                window.location.href = `/?role=${role}&mode=signup`;
              }}
              className="w-full bg-gradient-purple text-white py-4 rounded-2xl font-semibold hover:scale-105 transition-all duration-200 shadow-lg"
            >
              <div className="flex items-center justify-center space-x-3">
                <i className="fas fa-user-plus text-white"></i>
                <span>Sign Up with Email</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
