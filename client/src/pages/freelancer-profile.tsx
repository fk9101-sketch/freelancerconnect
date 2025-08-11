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
import Navigation from "@/components/navigation";
import { CircularProgress } from "@/components/CircularProgress";
import { ObjectUploader } from "@/components/ObjectUploader";
import { insertFreelancerProfileSchema, type InsertFreelancerProfileForm } from "@shared/schema";
import type { UploadResult } from "@uppy/core";
import { Clock, MapPin, DollarSign, Star, Upload, Camera, FileText, Award, Shield } from "lucide-react";

export default function FreelancerProfile() {
  const { user: firebaseUser, isAuthenticated, isLoading } = useFirebaseAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [idProofUrl, setIdProofUrl] = useState<string>("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
      return;
    }
  }, [isAuthenticated, isLoading, setLocation]);

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

  // Mock profile data for demonstration
  const mockProfile: InsertFreelancerProfileForm = {
    userId: firebaseUser?.uid || '',
    categoryId: '1',
    professionalTitle: 'Senior Electrician',
    profilePhotoUrl: profilePhoto,
    workingAreas: ['Mumbai', 'Navi Mumbai', 'Thane'],
    bio: 'Experienced electrician with 8+ years of expertise in residential and commercial electrical work.',
    experience: '8',
    experienceDescription: 'Started as an apprentice and worked my way up to handling complex electrical installations, maintenance, and repairs for both residential and commercial properties.',
    skills: ['Electrical Installation', 'Circuit Repair', 'LED Installation', 'Panel Upgrades', 'Troubleshooting'],
    portfolioImages: portfolioImages,
    certifications: ['Licensed Electrician', 'Safety Training Certificate'],
    idProofUrl: idProofUrl,
    hourlyRate: '₹500-800',
    verificationStatus: 'approved',
    isAvailable: true,
    availabilitySchedule: {
      monday: { available: true, hours: '9:00 AM - 6:00 PM' },
      tuesday: { available: true, hours: '9:00 AM - 6:00 PM' },
      wednesday: { available: true, hours: '9:00 AM - 6:00 PM' },
      thursday: { available: true, hours: '9:00 AM - 6:00 PM' },
      friday: { available: true, hours: '9:00 AM - 6:00 PM' },
      saturday: { available: true, hours: '10:00 AM - 4:00 PM' },
      sunday: { available: false, hours: 'Closed' }
    },
    verificationDocs: []
  };

  // Form setup
  const form = useForm<InsertFreelancerProfileForm>({
    resolver: zodResolver(insertFreelancerProfileSchema),
    defaultValues: mockProfile,
  });

  // Calculate profile completion score
  const calculateProfileCompletion = (profile: InsertFreelancerProfileForm): number => {
    const requiredFields = [
      'professionalTitle',
      'bio', 
      'experience',
      'workingAreas',
      'hourlyRate'
    ];
    
    const optionalFields = [
      'profilePhotoUrl',
      'experienceDescription', 
      'skills',
      'portfolioImages',
      'certifications',
      'idProofUrl',
      'availabilitySchedule'
    ];

    let score = 0;

    // Required fields (70% weight)
    requiredFields.forEach(field => {
      const value = profile[field as keyof InsertFreelancerProfileForm];
      if (value && (Array.isArray(value) ? value.length > 0 : value.toString().trim())) {
        score += 70 / requiredFields.length;
      }
    });

    // Optional fields (30% weight) 
    optionalFields.forEach(field => {
      const value = profile[field as keyof InsertFreelancerProfileForm];
      if (value && (Array.isArray(value) ? value.length > 0 : value.toString().trim())) {
        score += 30 / optionalFields.length;
      }
    });

    return Math.round(score);
  };

  const currentProfile = form.watch();
  const completionScore = calculateProfileCompletion(currentProfile);

  // Field completion status
  const getFieldStatus = (fieldName: keyof InsertFreelancerProfileForm) => {
    const value = currentProfile[fieldName];
    return value && (Array.isArray(value) ? value.length > 0 : value.toString().trim());
  };

  // Upload handlers
  const handleGetUploadParameters = async () => {
    // Mock upload URL for demo - in real app this would call the backend
    return {
      method: 'PUT' as const,
      url: 'https://example.com/upload',
    };
  };

  const handleProfilePhotoUpload = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful[0]?.uploadURL) {
      const photoUrl = result.successful[0].uploadURL;
      setProfilePhoto(photoUrl);
      form.setValue('profilePhotoUrl', photoUrl);
      toast({
        title: "Profile photo uploaded",
        description: "Your profile photo has been updated successfully.",
      });
    }
  };

  const handlePortfolioUpload = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const newImages = result.successful.map(file => file.uploadURL || '').filter(Boolean);
      const updatedImages = [...portfolioImages, ...newImages];
      setPortfolioImages(updatedImages);
      form.setValue('portfolioImages', updatedImages);
      toast({
        title: "Portfolio images uploaded",
        description: `${newImages.length} image(s) added to your portfolio.`,
      });
    }
  };

  const handleIdProofUpload = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful[0]?.uploadURL) {
      const docUrl = result.successful[0].uploadURL;
      setIdProofUrl(docUrl);
      form.setValue('idProofUrl', docUrl);
      toast({
        title: "ID proof uploaded",
        description: "Your ID verification document has been uploaded successfully.",
      });
    }
  };

  const onSubmit = async (data: InsertFreelancerProfileForm) => {
    try {
      // In real app, this would save to the backend
      console.log('Profile data:', data);
      toast({
        title: "Profile updated",
        description: "Your freelancer profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
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
    <div className="min-h-screen pb-20 bg-background text-foreground">
      {/* Status Bar */}
      <div className="status-bar">
        <span>9:41 AM</span>
        <div className="flex space-x-1">
          <i className="fas fa-signal"></i>
          <i className="fas fa-wifi"></i>
          <i className="fas fa-battery-three-quarters"></i>
        </div>
      </div>

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

        {/* Profile Completion Score */}
        <div className="flex items-center justify-center mb-6">
          <div className="text-center">
            <CircularProgress 
              percentage={completionScore} 
              size={120}
              className="mb-3"
            />
            <h3 className="text-lg font-semibold mb-1">Profile Completion</h3>
            <p className="text-purple-200 text-sm">
              {completionScore < 100 ? 'Complete your profile to get more leads!' : 'Your profile is complete!'}
            </p>
          </div>
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
                  {getFieldStatus('professionalTitle') && getFieldStatus('bio') && (
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                      <i className="fas fa-check w-3 h-3 mr-1"></i>
                      Complete
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Profile Photo */}
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                    {profilePhoto ? (
                      <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">Profile Photo</h4>
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={5485760} // 5MB
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleProfilePhotoUpload}
                      buttonClassName="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photo
                    </ObjectUploader>
                  </div>
                </div>

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
                    {currentProfile.skills?.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                        <button
                          type="button"
                          onClick={() => {
                            const newSkills = currentProfile.skills?.filter((_, i) => i !== index) || [];
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
                        if (skill && !currentProfile.skills?.includes(skill)) {
                          const newSkills = [...(currentProfile.skills || []), skill];
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
                  <ObjectUploader
                    maxNumberOfFiles={5}
                    maxFileSize={5485760} // 5MB
                    onGetUploadParameters={handleGetUploadParameters}
                    onComplete={handlePortfolioUpload}
                    buttonClassName="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Add Portfolio Images
                  </ObjectUploader>
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

                <div>
                  <label className="flex items-center gap-2 mb-3 text-sm font-medium">
                    Availability Schedule
                    {getFieldStatus('availabilitySchedule') && (
                      <i className="fas fa-check text-green-400 text-sm"></i>
                    )}
                  </label>
                  <div className="space-y-2">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                      <div key={day} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="capitalize font-medium">{day}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            {(currentProfile.availabilitySchedule as any)?.[day]?.hours || 'Closed'}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              (currentProfile.availabilitySchedule as any)?.[day]?.available 
                                ? 'bg-green-400' : 'bg-red-400'
                            }`}></span>
                            <span className="text-sm">
                              {(currentProfile.availabilitySchedule as any)?.[day]?.available ? 'Available' : 'Closed'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
                    {currentProfile.certifications?.map((cert, index) => (
                      <Badge key={index} variant="outline">
                        <FileText className="w-3 h-3 mr-1" />
                        {cert}
                        <button
                          type="button"
                          onClick={() => {
                            const newCerts = currentProfile.certifications?.filter((_, i) => i !== index) || [];
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
                        if (cert && !currentProfile.certifications?.includes(cert)) {
                          const newCerts = [...(currentProfile.certifications || []), cert];
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
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={10485760} // 10MB
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleIdProofUpload}
                      buttonClassName="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload ID Proof
                    </ObjectUploader>
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

            {/* Service Areas Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-orange-500" />
                  Service Areas
                  {getFieldStatus('workingAreas') && (
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
                    Areas You Serve *
                    {getFieldStatus('workingAreas') && (
                      <i className="fas fa-check text-green-400 text-sm"></i>
                    )}
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {currentProfile.workingAreas?.map((area, index) => (
                      <Badge key={index} variant="outline">
                        <MapPin className="w-3 h-3 mr-1" />
                        {area}
                        <button
                          type="button"
                          onClick={() => {
                            const newAreas = currentProfile.workingAreas?.filter((_, i) => i !== index) || [];
                            form.setValue('workingAreas', newAreas);
                          }}
                          className="ml-2 text-red-400 hover:text-red-600"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Add service area and press Enter..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        const area = input.value.trim();
                        if (area && !currentProfile.workingAreas?.includes(area)) {
                          const newAreas = [...(currentProfile.workingAreas || []), area];
                          form.setValue('workingAreas', newAreas);
                          input.value = '';
                        }
                      }
                    }}
                  />
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

      <Navigation />
    </div>
  );
}