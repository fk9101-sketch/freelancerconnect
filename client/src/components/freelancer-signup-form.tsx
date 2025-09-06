import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AreaAutoSuggest } from '@/components/AreaAutoSuggest';
import { CategoryAutoSuggest } from '@/components/CategoryAutoSuggest';
import { PasswordInput } from '@/components/PasswordInput';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { Eye, EyeOff, Loader2, X, Plus } from 'lucide-react';
import { isPasswordAcceptable } from '@/lib/passwordUtils';

interface FreelancerSignupFormProps {
  onBack: () => void;
}

export function FreelancerSignupForm({ onBack }: FreelancerSignupFormProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  
  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    },
  });
  
  // Form data state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    professionalTitle: '',
    bio: '',
    experience: '',
    experienceDescription: '',
    hourlyRate: '',
    area: '',
    category: '',
  });

  // Additional state for complex fields
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState<string>('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Experience options
  const experienceOptions = [
    { value: '0-1', label: '0-1 years' },
    { value: '1-3', label: '1-3 years' },
    { value: '3-5', label: '3-5 years' },
    { value: '5-10', label: '5-10 years' },
    { value: '10+', label: '10+ years' },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Basic required fields
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

    if (!formData.area.trim()) {
      newErrors.area = 'Area is required';
    }

    // Freelancer-specific validations
    if (!selectedCategoryId && !customCategory.trim()) {
      newErrors.category = 'Please select a service category';
    }
    if (customCategory.trim() && customCategory.trim().length < 3) {
      newErrors.category = 'Custom category must be at least 3 characters long';
    }

    if (!formData.professionalTitle.trim()) {
      newErrors.professionalTitle = 'Professional title is required';
    }

    if (!formData.bio.trim()) {
      newErrors.bio = 'Bio is required';
    } else if (formData.bio.trim().length < 50) {
      newErrors.bio = 'Bio must be at least 50 characters long';
    }

    if (!formData.experience) {
      newErrors.experience = 'Years of experience is required';
    }

    if (!formData.hourlyRate.trim()) {
      newErrors.hourlyRate = 'Hourly rate is required';
    }

    if (skills.length === 0) {
      newErrors.skills = 'At least one skill is required';
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
        phone: formData.phone,
        role: 'freelancer',
        // Freelancer profile data
        professionalTitle: formData.professionalTitle,
        bio: formData.bio,
        experience: formData.experience,
        experienceDescription: formData.experienceDescription,
        hourlyRate: formData.hourlyRate,
        area: formData.area,
        skills: skills,
        categoryId: selectedCategoryId || null,
        customCategory: customCategory || null,
      };

      // Create user and profile in backend
      const response = await apiRequest('POST', '/api/auth/freelancer-signup', signupData);
      const responseData = await response.json();

      if (responseData.success) {
        toast({
          title: "Account Created Successfully!",
          description: "Your freelancer account has been created. Please log in to complete your profile.",
        });

        // Store the selected role
        localStorage.setItem('selectedRole', 'freelancer');
        
        // Redirect to login page instead of profile page to avoid session issues
        setLocation('/?role=freelancer&mode=login');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (error.message) {
        const serverErrorMatch = error.message.match(/^\d+:\s*\{.*"message":\s*"([^"]+)".*\}$/);
        if (serverErrorMatch) {
          errorMessage = serverErrorMatch[1];
        } else if (error.message.includes('email-already-in-use')) {
          errorMessage = 'An account with this email already exists.';
        } else if (error.message.includes('weak-password')) {
          errorMessage = 'Password is too weak. Please choose a stronger password.';
        } else if (error.message.includes('invalid-email')) {
          errorMessage = 'Please enter a valid email address.';
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

  // Skills management
  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills(prev => [...prev, newSkill.trim()]);
      setNewSkill('');
      setErrors(prev => ({ ...prev, skills: '' }));
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(prev => prev.filter(skill => skill !== skillToRemove));
  };

  const handleSkillKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
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
            Freelancer Sign Up
          </h2>
          <p className="text-gray-600 text-sm">
            Create your freelancer account and showcase your skills
          </p>
        </div>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm rounded-2xl shadow-xl border border-border">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl font-bold text-card-foreground">
            Create Your Freelancer Account
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Join Freelancer Connect and start offering your services
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-card-foreground border-b pb-2">
                Basic Information
              </h3>
              
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
            </div>

            {/* Professional Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-card-foreground border-b pb-2">
                Professional Information
              </h3>

              {/* Professional Title */}
              <div>
                <Label htmlFor="professionalTitle" className="text-sm font-semibold text-card-foreground mb-2 block">
                  Professional Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="professionalTitle"
                  type="text"
                  value={formData.professionalTitle}
                  onChange={(e) => handleInputChange('professionalTitle', e.target.value)}
                  placeholder="e.g. Senior Electrician, Expert Plumber"
                  className={`bg-background border-border text-foreground rounded-2xl ${
                    errors.professionalTitle ? 'border-red-500 focus-visible:ring-red-500' : ''
                  }`}
                />
                {errors.professionalTitle && (
                  <p className="text-red-500 text-xs mt-1">{errors.professionalTitle}</p>
                )}
              </div>

              {/* Category Selection */}
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

              {/* Years of Experience */}
              <div>
                <Label htmlFor="experience" className="text-sm font-semibold text-card-foreground mb-2 block">
                  Years of Experience <span className="text-red-500">*</span>
                </Label>
                <select
                  id="experience"
                  value={formData.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                  className={`w-full bg-background border border-border text-foreground rounded-2xl px-3 py-2 ${
                    errors.experience ? 'border-red-500 focus-visible:ring-red-500' : ''
                  }`}
                >
                  <option value="">Select experience level</option>
                  {experienceOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.experience && (
                  <p className="text-red-500 text-xs mt-1">{errors.experience}</p>
                )}
              </div>

              {/* Hourly Rate */}
              <div>
                <Label htmlFor="hourlyRate" className="text-sm font-semibold text-card-foreground mb-2 block">
                  Hourly Rate <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="hourlyRate"
                  type="text"
                  value={formData.hourlyRate}
                  onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                  placeholder="e.g. ₹500-800, ₹300-500"
                  className={`bg-background border-border text-foreground rounded-2xl ${
                    errors.hourlyRate ? 'border-red-500 focus-visible:ring-red-500' : ''
                  }`}
                />
                {errors.hourlyRate && (
                  <p className="text-red-500 text-xs mt-1">{errors.hourlyRate}</p>
                )}
              </div>

              {/* Skills */}
              <div>
                <Label className="text-sm font-semibold text-card-foreground mb-2 block">
                  Skills <span className="text-red-500">*</span>
                </Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={handleSkillKeyPress}
                      placeholder="Add a skill (e.g. Electrical Installation)"
                      className="bg-background border-border text-foreground rounded-2xl"
                    />
                    <Button
                      type="button"
                      onClick={addSkill}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-2xl"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {skill}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSkill(skill)}
                            className="h-4 w-4 p-0 hover:bg-transparent"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                {errors.skills && (
                  <p className="text-red-500 text-xs mt-1">{errors.skills}</p>
                )}
              </div>

              {/* Bio */}
              <div>
                <Label htmlFor="bio" className="text-sm font-semibold text-card-foreground mb-2 block">
                  Bio / About Me <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell customers about your experience, expertise, and what makes you unique..."
                  rows={4}
                  className={`bg-background border-border text-foreground rounded-2xl ${
                    errors.bio ? 'border-red-500 focus-visible:ring-red-500' : ''
                  }`}
                />
                {errors.bio && (
                  <p className="text-red-500 text-xs mt-1">{errors.bio}</p>
                )}
              </div>

              {/* Experience Description */}
              <div>
                <Label htmlFor="experienceDescription" className="text-sm font-semibold text-card-foreground mb-2 block">
                  Experience Description
                </Label>
                <Textarea
                  id="experienceDescription"
                  value={formData.experienceDescription}
                  onChange={(e) => handleInputChange('experienceDescription', e.target.value)}
                  placeholder="Describe your journey, achievements, and notable projects..."
                  rows={3}
                  className="bg-background border-border text-foreground rounded-2xl"
                />
              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-card-foreground border-b pb-2">
                Location
              </h3>

              {/* Primary Area */}
              <div>
                <Label className="text-sm font-semibold text-card-foreground mb-2 block">
                  Primary Area <span className="text-red-500">*</span>
                </Label>
                <AreaAutoSuggest
                  value={formData.area}
                  onChange={(value) => handleInputChange('area', value)}
                  placeholder="Type your primary area (e.g. Vaishali Nagar, Sirsi Road)"
                  error={!!errors.area}
                  required
                />
                {errors.area && (
                  <p className="text-red-500 text-xs mt-1">{errors.area}</p>
                )}
              </div>
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
                'Create Freelancer Account'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground mb-3">
              Already have an account?
            </p>
            <Button
              onClick={() => {
                window.location.href = '/?role=freelancer&mode=login';
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
