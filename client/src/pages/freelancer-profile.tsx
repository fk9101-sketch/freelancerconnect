import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { signOutUser } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/navigation";

import { SimpleFileUploader } from "@/components/SimpleFileUploader";
import { ProfilePhotoUploader } from "@/components/ProfilePhotoUploader";
import { AreaAutoSuggest } from "@/components/AreaAutoSuggest";
import { CategoryAutoSuggest } from "@/components/CategoryAutoSuggest";
import { insertFreelancerProfileSchema, type InsertFreelancerProfileForm } from "@shared/schema";

import { Clock, MapPin, DollarSign, Star, Upload, Camera, FileText, Award, Shield } from "lucide-react";

export default function FreelancerProfile() {
  const { user: firebaseUser, isAuthenticated, isLoading } = useFirebaseAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [idProofUrl, setIdProofUrl] = useState<string>("");

  const [customCategory, setCustomCategory] = useState<string>("");
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("");
  
  // State for categories - moved to top to avoid initialization error
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
      return;
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Load freelancer profile on component mount
  useEffect(() => {
    if (firebaseUser?.uid) {
      fetchFreelancerProfile();
    }
  }, [firebaseUser?.uid, categories]); // Add categories dependency

  const fetchFreelancerProfile = async () => {
    try {
      const response = await fetch('/api/freelancer/profile', {
        headers: {
          'Authorization': `Bearer ${await firebaseUser?.getIdToken()}`,
          'X-Firebase-User-ID': firebaseUser?.uid || ''
        }
      });
      if (response.ok) {
        const profileData = await response.json();

        // Update other profile fields if needed
        if (profileData.fullName) {
          form.setValue('fullName', profileData.fullName);
        }
        if (profileData.professionalTitle) {
          form.setValue('professionalTitle', profileData.professionalTitle);
        }
        if (profileData.area) {
          form.setValue('area', profileData.area);
        }
        if (profileData.bio) {
          form.setValue('bio', profileData.bio);
        }
        if (profileData.experience) {
          form.setValue('experience', profileData.experience);
        }
        if (profileData.hourlyRate) {
          form.setValue('hourlyRate', profileData.hourlyRate);
        }

        if (profileData.skills) {
          form.setValue('skills', profileData.skills);
        }
        if (profileData.certifications) {
          form.setValue('certifications', profileData.certifications);
        }
        if (profileData.profilePhotoUrl) {
          setProfilePhoto(profileData.profilePhotoUrl);
          form.setValue('profilePhotoUrl', profileData.profilePhotoUrl);
        }
        if (profileData.categoryId) {
          setSelectedCategoryId(profileData.categoryId);
          // Use the category name from the joined query if available
          if (profileData.category) {
            setSelectedCategoryName(profileData.category.name);
          } else {
            // Fallback to finding the category name from the categories list
            const category = categories.find(cat => cat.id === profileData.categoryId);
            if (category) {
              setSelectedCategoryName(category.name);
            }
          }
          // Also set the input value for display
          form.setValue('categoryId', profileData.categoryId);
          // Clear custom category when using predefined category
          setCustomCategory('');
        }
        if (profileData.customCategory) {
          setCustomCategory(profileData.customCategory);
          // Clear any selected category when using custom
          setSelectedCategoryId('');
          setSelectedCategoryName('');
          // Clear the form value for categoryId
          form.setValue('categoryId', '');
        }
      } else if (response.status === 404) {
        console.log('Profile not found, this is normal for new users');
        // Don't show error for 404, as new users won't have a profile yet
      } else {
        console.error('Error fetching freelancer profile:', response.status, response.statusText);
        toast({
          title: "Error",
          description: "Failed to load profile. Please try refreshing the page.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching freelancer profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile. Please try refreshing the page.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      localStorage.removeItem('selectedRole');
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      setLocation('/');
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getUserRole = () => {
    return localStorage.getItem('selectedRole') || 'customer';
  };

  const getUserName = () => {
    if (firebaseUser?.displayName) {
      return firebaseUser.displayName;
    }
    if (firebaseUser?.email) {
      return firebaseUser.email.split('@')[0];
    }
    return 'User';
  };



  // Category selection handlers
  const handleCategorySelect = (categoryId: string, categoryName: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedCategoryName(categoryName);
    setCustomCategory(''); // Clear custom category when selecting predefined one
  };

  const handleCustomCategoryChange = (customCategoryName: string) => {
    setCustomCategory(customCategoryName);
    setSelectedCategoryId(''); // Clear selected category when using custom
    setSelectedCategoryName(''); // Clear selected category name
  };

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const categoriesData = await response.json();
          setCategories(categoriesData);
          // Set the first category as default
          if (categoriesData.length > 0) {
            setSelectedCategoryId(categoriesData[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Mock profile data for demonstration
  const mockProfile: InsertFreelancerProfileForm = {
    userId: firebaseUser?.uid || '',
    categoryId: selectedCategoryId || '',
    fullName: getUserName(), // Use the user's name from Firebase or email
    professionalTitle: 'Senior Electrician',
    profilePhotoUrl: profilePhoto,
    area: '', // Single area field
    bio: 'Experienced electrician with 8+ years of expertise in residential and commercial electrical work.',
    experience: '8',
    experienceDescription: 'Started as an apprentice and worked my way up to handling complex electrical installations, maintenance, and repairs for both residential and commercial properties.',
    skills: ['Electrical Installation', 'Circuit Repair', 'LED Installation', 'Panel Upgrades', 'Troubleshooting'],
    portfolioImages: portfolioImages,
    certifications: ['Licensed Electrician', 'Safety Training Certificate'],
    idProofUrl: idProofUrl,
    hourlyRate: '₹500-800',
    customCategory: customCategory, // For custom service categories
    verificationStatus: 'approved',
    isAvailable: true,
    verificationDocs: []
  };

  // Form setup
  const form = useForm<InsertFreelancerProfileForm>({
    resolver: zodResolver(insertFreelancerProfileSchema),
    defaultValues: mockProfile,
  });



  // Field completion status
  const getFieldStatus = (fieldName: keyof InsertFreelancerProfileForm) => {
    const value = form.watch(fieldName);
    return value && (Array.isArray(value) ? value.length > 0 : value.toString().trim());
  };

  // Upload handlers
  const handleProfilePhotoUpload = (fileUrl: string) => {
    setProfilePhoto(fileUrl);
    form.setValue('profilePhotoUrl', fileUrl);
  };

  const handlePortfolioUpload = (fileUrl: string) => {
    const updatedImages = [...portfolioImages, fileUrl];
    setPortfolioImages(updatedImages);
    form.setValue('portfolioImages', updatedImages);
  };

  const handleIdProofUpload = (fileUrl: string) => {
    setIdProofUrl(fileUrl);
    form.setValue('idProofUrl', fileUrl);
  };

  const onSubmit = async (data: InsertFreelancerProfileForm) => {
    try {
      // Validate category is selected or custom category is entered
      if (!selectedCategoryId && !customCategory.trim()) {
        toast({
          title: "Category Required",
          description: "Please select your service category or enter a custom one",
          variant: "destructive",
        });
        return;
      }

      // Validate custom category length if using custom
      if (customCategory.trim() && customCategory.trim().length < 3) {
        toast({
          title: "Invalid Category",
          description: "Custom category must be at least 3 characters long",
          variant: "destructive",
        });
        return;
      }

      // Prepare profile data with category (exclude userId since it's handled by auth)
      const { userId: _, ...profileDataWithoutUserId } = data;
      const profileData = {
        ...profileDataWithoutUserId,
        categoryId: selectedCategoryId || null, // Use the selected category or null for custom
        customCategory: customCategory.trim() || null, // Include custom category if entered
        area: data.area // Use the area from the form data
      };

      console.log('Saving profile with category data:', {
        categoryId: selectedCategoryId,
        customCategory: customCategory.trim(),
        selectedCategoryName
      });

      // Try to save profile with retry logic
      let response;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          // First try to update existing profile
          response = await fetch('/api/freelancer/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await firebaseUser?.getIdToken()}`,
              'X-Firebase-User-ID': firebaseUser?.uid || ''
            },
            body: JSON.stringify(profileData)
          });

          // If profile doesn't exist (404), try to create it
          if (response.status === 404) {
            console.log('Profile not found, creating new profile...');
            response = await fetch('/api/freelancer/profile', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await firebaseUser?.getIdToken()}`,
                'X-Firebase-User-ID': firebaseUser?.uid || ''
              },
              body: JSON.stringify(profileData)
            });
          }
          
          // If successful, break out of retry loop
          if (response.ok) {
            break;
          }
          
          // If it's a user linking error, retry after a delay
          const errorData = await response.json().catch(() => ({}));
          if (errorData.message && errorData.message.includes('user account could not be linked')) {
            retryCount++;
            if (retryCount < maxRetries) {
              console.log(`Retrying profile save (attempt ${retryCount}/${maxRetries})...`);
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
              continue;
            }
          }
          
          // For other errors, don't retry
          break;
        } catch (fetchError) {
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`Network error, retrying profile save (attempt ${retryCount}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            continue;
          }
          throw fetchError;
        }
      }

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Profile saved",
          description: "Your freelancer profile has been saved successfully.",
        });
        console.log('Profile saved successfully:', result);
      } else {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = errorData.message || 'Failed to save profile';
        
        // If it's an area validation error, show available areas
        if (errorData.availableAreas && Array.isArray(errorData.availableAreas)) {
          errorMessage += `\n\nAvailable areas include: ${errorData.availableAreas.join(', ')}`;
        }
        
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const goBack = () => {
    setLocation('/freelancer');
  };

  return (
    <div className="min-h-screen pb-24 bg-background text-foreground profile-page">
      {/* Header */}
      <div className="bg-gradient-purple text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <button 
              onClick={goBack}
              className="text-white hover:text-purple-200 transition-colors"
              data-testid="button-back"
            >
              <i className="fas fa-arrow-left text-lg"></i>
            </button>
            <h1 className="text-xl font-semibold">Freelancer Profile</h1>
          </div>
          <button 
            onClick={handleLogout}
            className="text-white hover:text-purple-200 transition-colors"
            data-testid="button-logout"
          >
            <i className="fas fa-sign-out-alt text-lg"></i>
          </button>
        </div>


      </div>

      {/* Profile Content */}
      <div className="p-6 space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Basic Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Basic Information
                  {getFieldStatus('fullName') && getFieldStatus('professionalTitle') && getFieldStatus('bio') && (
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                      <i className="fas fa-check w-3 h-3 mr-1"></i>
                      Complete
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Profile Photo */}
                <ProfilePhotoUploader
                  currentPhotoUrl={profilePhoto}
                  onPhotoUploaded={handleProfilePhotoUpload}
                  onPhotoRemoved={() => {
                    setProfilePhoto('');
                    form.setValue('profilePhotoUrl', '');
                  }}
                  buttonClassName="w-full"
                >
                  Upload Photo
                </ProfilePhotoUploader>

                {/* Full Name */}
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Full Name *
                        {getFieldStatus('fullName') && (
                          <i className="fas fa-check text-green-400 text-sm"></i>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Professional Title */}
                <FormField
                  control={form.control}
                  name="professionalTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Professional Title *
                        {getFieldStatus('professionalTitle') && (
                          <i className="fas fa-check text-green-400 text-sm"></i>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Senior Electrician, Plumber, Carpenter" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Category Selection */}
                <div>
                  <label className="flex items-center gap-2 mb-2 text-sm font-medium">
                    Service Category *
                    {(selectedCategoryId || customCategory.trim()) && (
                      <i className="fas fa-check text-green-400 text-sm"></i>
                    )}
                  </label>
                  <CategoryAutoSuggest
                    value={selectedCategoryName || customCategory}
                    onChange={(categoryId) => {
                      if (categoryId) {
                        // If we got a category ID, find the category name
                        const category = categories.find(cat => cat.id === categoryId);
                        if (category) {
                          setSelectedCategoryName(category.name);
                          setSelectedCategoryId(categoryId);
                          setCustomCategory('');
                        }
                      } else {
                        // If no category ID, treat as custom category
                        setCustomCategory('');
                      }
                    }}
                    onCategorySelect={handleCategorySelect}
                    onCustomCategoryChange={handleCustomCategoryChange}
                    placeholder="Type your service category (e.g. plumber, electrician)"
                    required={true}
                    showCustomOption={true}
                  />
                  {/* Display selected category info */}
                  {selectedCategoryId && selectedCategoryName && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-check-circle text-green-500"></i>
                        <span className="text-sm text-green-700">
                          Selected category: <strong>{selectedCategoryName}</strong>
                        </span>
                      </div>
                    </div>
                  )}
                  {customCategory.trim() && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-edit text-blue-500"></i>
                        <span className="text-sm text-blue-700">
                          Custom category: <strong>{customCategory}</strong>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                                {/* Bio */}
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Professional Bio *
                        {getFieldStatus('bio') && (
                          <i className="fas fa-check text-green-400 text-sm"></i>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell potential customers about your expertise and experience..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Area */}
                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Working Area *
                        {getFieldStatus('area') && (
                          <i className="fas fa-check text-green-400 text-sm"></i>
                        )}
                      </FormLabel>
                      <FormControl>
                        <AreaAutoSuggest
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Type your working area (e.g. Vaishali Nagar, Sirsi Road)"
                          required={true}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

 
              </CardContent>
            </Card>

            {/* Experience Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Work Experience
                  {getFieldStatus('experience') && (
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                      <i className="fas fa-check w-3 h-3 mr-1"></i>
                      Complete
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Years of Experience *
                        {getFieldStatus('experience') && (
                          <i className="fas fa-check text-green-400 text-sm"></i>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="experienceDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Experience Description
                        {getFieldStatus('experienceDescription') && (
                          <i className="fas fa-check text-green-400 text-sm"></i>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your work experience, key projects, and achievements..."
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Skills & Portfolio Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-500" />
                  Skills & Portfolio
                  {getFieldStatus('skills') && getFieldStatus('portfolioImages') && (
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                      <i className="fas fa-check w-3 h-3 mr-1"></i>
                      Complete
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 mb-2 text-sm font-medium">
                    Skills
                    {getFieldStatus('skills') && (
                      <i className="fas fa-check text-green-400 text-sm"></i>
                    )}
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.watch('skills')?.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                        <button
                          type="button"
                          onClick={() => {
                            const newSkills = form.watch('skills')?.filter((_, i) => i !== index) || [];
                            form.setValue('skills', newSkills);
                          }}
                          className="ml-2 text-red-400 hover:text-red-600"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Add a skill and press Enter..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        const skill = input.value.trim();
                        if (skill && !form.watch('skills')?.includes(skill)) {
                          const newSkills = [...(form.watch('skills') || []), skill];
                          form.setValue('skills', newSkills);
                          input.value = '';
                        }
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 mb-2 text-sm font-medium">
                    Portfolio Images
                    {getFieldStatus('portfolioImages') && (
                      <i className="fas fa-check text-green-400 text-sm"></i>
                    )}
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {portfolioImages.map((image, index) => (
                      <div key={index} className="aspect-square bg-muted rounded-lg overflow-hidden relative">
                        <img src={image} alt={`Portfolio ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = portfolioImages.filter((_, i) => i !== index);
                            setPortfolioImages(newImages);
                            form.setValue('portfolioImages', newImages);
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <SimpleFileUploader
                    maxFileSize={5485760} // 5MB
                    acceptedFileTypes={['image/*']}
                    onUploadComplete={handlePortfolioUpload}
                    buttonClassName="w-full"
                    multiple={true}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Add Portfolio Images
                  </SimpleFileUploader>
                </div>
              </CardContent>
            </Card>

            {/* Pricing & Availability Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  Pricing & Availability
                  {getFieldStatus('hourlyRate') && (
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                      <i className="fas fa-check w-3 h-3 mr-1"></i>
                      Complete
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="hourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Hourly Rate / Pricing *
                        {getFieldStatus('hourlyRate') && (
                          <i className="fas fa-check text-green-400 text-sm"></i>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., ₹500-800 per hour" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />


              </CardContent>
            </Card>

            {/* Verification & Documents Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-500" />
                  Verification & Documents
                  {getFieldStatus('idProofUrl') && getFieldStatus('certifications') && (
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                      <i className="fas fa-check w-3 h-3 mr-1"></i>
                      Complete
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 mb-2 text-sm font-medium">
                    Certifications & Licenses
                    {getFieldStatus('certifications') && (
                      <i className="fas fa-check text-green-400 text-sm"></i>
                    )}
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.watch('certifications')?.map((cert, index) => (
                      <Badge key={index} variant="outline">
                        <FileText className="w-3 h-3 mr-1" />
                        {cert}
                        <button
                          type="button"
                          onClick={() => {
                            const newCerts = form.watch('certifications')?.filter((_, i) => i !== index) || [];
                            form.setValue('certifications', newCerts);
                          }}
                          className="ml-2 text-red-400 hover:text-red-600"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Add certification and press Enter..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        const cert = input.value.trim();
                        if (cert && !form.watch('certifications')?.includes(cert)) {
                          const newCerts = [...(form.watch('certifications') || []), cert];
                          form.setValue('certifications', newCerts);
                          input.value = '';
                        }
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 mb-2 text-sm font-medium">
                    ID Proof Document
                    {getFieldStatus('idProofUrl') && (
                      <i className="fas fa-check text-green-400 text-sm"></i>
                    )}
                  </label>
                  {idProofUrl ? (
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <span className="flex-1 text-sm">ID document uploaded</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIdProofUrl('');
                          form.setValue('idProofUrl', '');
                        }}
                        className="text-red-400 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <SimpleFileUploader
                      maxFileSize={10485760} // 10MB
                      acceptedFileTypes={['image/*', 'application/pdf']}
                      onUploadComplete={handleIdProofUpload}
                      buttonClassName="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload ID Proof
                    </SimpleFileUploader>
                  )}
                </div>

                {/* Verification Status */}
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-green-500" />
                    <span className="font-medium">Verification Status</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                      <i className="fas fa-check-circle mr-1"></i>
                      Verified
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Your profile has been verified by our team
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>



            {/* Save Button */}
            <div className="flex gap-4 pt-6">
              <Button 
                type="submit" 
                className="flex-1 bg-gradient-purple hover:opacity-90"
                data-testid="button-save-profile"
              >
                Save Profile
              </Button>
              <Button 
                type="button"
                variant="outline" 
                onClick={goBack}
                className="flex-1"
                data-testid="button-cancel"
              >
                Back to Dashboard
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <Navigation currentPage="profile" userRole="freelancer" />
    </div>
  );
}