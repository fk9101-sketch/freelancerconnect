import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { signOutUser } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Navigation from "@/components/navigation";

import { ObjectUploader } from "@/components/ObjectUploader";
import { AreaAutoSuggest } from "@/components/AreaAutoSuggest";
import { insertFreelancerProfileSchema, type InsertFreelancerProfileForm } from "@shared/schema";
import type { UploadResult } from "@uppy/core";
import { Clock, MapPin, DollarSign, Star, Upload, Camera, FileText, Award, Shield, CheckCircle } from "lucide-react";

export default function Profile() {
  const { user: firebaseUser, isAuthenticated, isLoading } = useFirebaseAuth();
  const { userProfile } = useUserProfile();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [idProofUrl, setIdProofUrl] = useState<string>("");
  const [customerArea, setCustomerArea] = useState<string>("");
  const [customerFirstName, setCustomerFirstName] = useState<string>("");
  const [customerLastName, setCustomerLastName] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("+91");
  const [phoneNumberSaved, setPhoneNumberSaved] = useState<boolean>(false);
  const [phoneInputValue, setPhoneInputValue] = useState<string>("");
  const [showSuccessPopup, setShowSuccessPopup] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const phoneInputRef = useRef<HTMLInputElement>(null);

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

  const getUserEmail = () => {
    return firebaseUser?.email || '';
  };

  // Load customer area on component mount
  useEffect(() => {
    if (getUserRole() === 'customer' && firebaseUser?.uid) {
      fetchCustomerProfile();
    }
  }, [firebaseUser?.uid]);

  const fetchCustomerProfile = async () => {
    try {
      console.log('Fetching customer profile for user:', firebaseUser?.uid);
      const response = await fetch('/api/customer/profile', {
        headers: {
          'Authorization': `Bearer ${await firebaseUser?.getIdToken()}`,
          'X-Firebase-User-ID': firebaseUser?.uid || ''
        }
      });
      if (response.ok) {
        const userData = await response.json();
        console.log('Received user data:', userData);
        setCustomerArea(userData.area || '');
        setCustomerFirstName(userData.firstName || '');
        setCustomerLastName(userData.lastName || '');
        setCustomerEmail(userData.email || '');
        
        // Handle phone number properly
        if (userData.phone && userData.phone.length > 3) {
          setCustomerPhone(userData.phone);
          const phoneDigits = userData.phone.replace('+91', '');
          setPhoneInputValue(phoneDigits);
          setPhoneNumberSaved(true);
          console.log('Phone number loaded:', { 
            phone: userData.phone, 
            phoneDigits,
            isPhoneSaved: true
          });
        } else {
          setCustomerPhone('+91');
          setPhoneInputValue('');
          setPhoneNumberSaved(false);
          console.log('No phone number found, setting defaults');
        }
      } else {
        console.error('Failed to fetch profile:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching customer profile:', error);
    }
  };

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (getUserRole() === 'customer' && isEditing && !phoneNumberSaved) {
      const value = e.target.value;
      
      // Only allow digits and prevent any non-numeric characters
      const digitsOnly = value.replace(/[^0-9]/g, '');
      
      // Limit to 10 characters
      const phoneDigits = digitsOnly.substring(0, 10);
      
      // Update state only if the value is valid
      if (phoneDigits === digitsOnly || phoneDigits.length <= 10) {
        setPhoneInputValue(phoneDigits);
        setCustomerPhone('+91' + phoneDigits);
      }
    }
  };

  const handlePhoneInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, and navigation keys
    if ([8, 9, 27, 13, 46, 37, 38, 39, 40].includes(e.keyCode) ||
        // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true)) {
      return;
    }
    
    // Allow numeric keys (0-9) from both main keyboard and numpad
    if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) {
      return;
    }
    
    // Prevent all other keys
    e.preventDefault();
  };

  const handlePhoneInputPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (getUserRole() === 'customer' && isEditing && !phoneNumberSaved) {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      const digitsOnly = pastedText.replace(/[^0-9]/g, '');
      const phoneDigits = digitsOnly.substring(0, 10);
      setPhoneInputValue(phoneDigits);
      setCustomerPhone('+91' + phoneDigits);
    }
  };

  const handlePhoneInputFocus = () => {
    if (getUserRole() === 'customer' && isEditing && !phoneNumberSaved && phoneInputRef.current) {
      // Ensure cursor is at the end of the input
      const length = phoneInputValue.length;
      phoneInputRef.current.setSelectionRange(length, length);
    }
  };

  const handlePhoneInputBlur = () => {
    if (getUserRole() === 'customer' && isEditing && !phoneNumberSaved) {
      // Ensure the phone number is properly formatted
      const cleanDigits = phoneInputValue.replace(/[^0-9]/g, '');
      if (cleanDigits !== phoneInputValue) {
        setPhoneInputValue(cleanDigits);
        setCustomerPhone('+91' + cleanDigits);
      }
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (getUserRole() === 'customer') {
        // Validate required fields for customers
        if (!customerArea.trim()) {
          toast({
            title: "Area Required",
            description: "Please select your area/location",
            variant: "destructive",
          });
          return;
        }

        if (!customerFirstName.trim()) {
          toast({
            title: "First Name Required",
            description: "Please enter your first name",
            variant: "destructive",
          });
          return;
        }

        if (!customerEmail.trim()) {
          toast({
            title: "Email Required",
            description: "Please enter your email address",
            variant: "destructive",
          });
          return;
        }

        // Validate phone number (only if not already saved)
        if (!phoneNumberSaved) {
          if (!customerPhone.trim() || customerPhone.trim().length <= 3) {
            toast({
              title: "Phone Number Required",
              description: "Please enter your phone number",
              variant: "destructive",
            });
            return;
          }

          // Validate phone number format (should be +91 followed by exactly 10 digits)
          const phoneRegex = /^\+91\d{10}$/;
          if (!phoneRegex.test(customerPhone.trim())) {
            toast({
              title: "Invalid Phone Number",
              description: "Phone number must be in format: +91XXXXXXXXXX (10 digits after +91)",
              variant: "destructive",
            });
            return;
          }
        }

        // Save customer profile with all fields
        const requestBody = { 
          firstName: customerFirstName.trim(),
          lastName: customerLastName.trim(),
          email: customerEmail.trim(),
          area: customerArea.trim(),
          phone: customerPhone.trim()
        };
        console.log('Saving profile with data:', requestBody);
        console.log('Phone number details:', {
          customerPhone: customerPhone.trim(),
          phoneNumberSaved,
          phoneInputValue,
          phoneLength: customerPhone.trim().length
        });
        
        const response = await fetch('/api/customer/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await firebaseUser?.getIdToken()}`,
            'X-Firebase-User-ID': firebaseUser?.uid || ''
          },
          body: JSON.stringify(requestBody)
        });

        console.log('Save response status:', response.status);
        if (response.ok) {
          const responseData = await response.json();
          console.log('Save response data:', responseData);
          
          // If phone number was saved for the first time, mark it as saved
          if (!phoneNumberSaved && customerPhone.trim().length > 3) {
            setPhoneNumberSaved(true);
            console.log('Phone number marked as saved');
            console.log('Current phone state after save:', {
              customerPhone: customerPhone.trim(),
              phoneInputValue,
              phoneNumberSaved: true
            });
            
            // Show success popup for phone number
            setSuccessMessage("Phone number has been saved successfully and cannot be changed.");
            setShowSuccessPopup(true);
          } else {
            // Show success popup for general profile update
            setSuccessMessage("Your profile has been updated successfully.");
            setShowSuccessPopup(true);
          }
          
          setIsEditing(false);
          
          // Refetch profile to ensure all data is up to date
          console.log('Refetching profile after save...');
          await fetchCustomerProfile();
        } else {
          const errorData = await response.json();
          console.error('Save failed:', errorData);
          throw new Error(errorData.message || 'Failed to update profile');
        }
      } else {
        // Handle freelancer profile save (existing logic)
        setSuccessMessage("Your profile has been updated successfully.");
        setShowSuccessPopup(true);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Mock profile data for demonstration
  const mockProfile: InsertFreelancerProfileForm = {
    userId: firebaseUser?.uid || '',
    categoryId: '1',
    fullName: getUserName(),
    professionalTitle: 'Senior Electrician',
    profilePhotoUrl: profilePhoto,

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
      setIsEditing(false);
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
    const role = getUserRole();
    switch (role) {
      case 'freelancer':
        setLocation('/freelancer');
        break;
      case 'admin':
        setLocation('/admin');
        break;
      case 'customer':
      default:
        setLocation('/customer');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 profile-page">
      {/* Header */}
      <div className="bg-gradient-purple text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={goBack}
            className="w-12 h-12 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center hover:bg-white/30 transition-colors"
            data-testid="button-back"
          >
            <i className="fas fa-arrow-left text-lg"></i>
          </button>
          <h1 className="text-xl font-bold">Profile</h1>
          <div className="w-12 h-12"></div> {/* Spacer for alignment */}
        </div>
      </div>

      {/* Profile Content */}
      <div className="p-6 -mt-4">
        <Card className="bg-card rounded-2xl shadow-xl border border-border mb-6">
          <CardContent className="p-8">
            {/* Profile Picture */}
            <div className="flex items-center space-x-6 mb-8">
              <div className="w-24 h-24 bg-gradient-purple rounded-2xl flex items-center justify-center">
                {userProfile?.profileImageUrl ? (
                  <img 
                    src={userProfile.profileImageUrl.startsWith('http') ? userProfile.profileImageUrl : `${window.location.protocol}//${window.location.hostname}:5001${userProfile.profileImageUrl}`} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-2xl object-cover object-center"
                    style={{
                      objectFit: 'cover',
                      objectPosition: 'center',
                      borderRadius: '1rem',
                      width: '100%',
                      height: '100%'
                    }}
                  />
                ) : firebaseUser?.photoURL ? (
                  <img 
                    src={firebaseUser.photoURL} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-2xl object-cover object-center"
                    style={{
                      objectFit: 'cover',
                      objectPosition: 'center',
                      borderRadius: '1rem',
                      width: '100%',
                      height: '100%'
                    }}
                  />
                ) : (
                  <i className="fas fa-user text-white text-3xl"></i>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-card-foreground mb-1" data-testid="text-user-name">
                  {getUserRole() === 'customer' && customerFirstName && customerLastName 
                    ? `${customerFirstName} ${customerLastName}` 
                    : getUserRole() === 'customer' && customerFirstName 
                    ? customerFirstName 
                    : getUserName()}
                </h2>
                <p className="text-muted-foreground capitalize mb-3" data-testid="text-user-role">
                  {getUserRole()}
                </p>
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant="outline"
                  size="sm"
                  className="border-border hover:bg-card/50"
                  data-testid="button-edit-profile"
                >
                  <i className="fas fa-edit mr-2"></i>
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
              </div>
            </div>

            {/* Profile Details */}
            <div className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-sm font-semibold text-card-foreground mb-2 block">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={getUserRole() === 'customer' ? customerEmail : getUserEmail()}
                  onChange={(e) => getUserRole() === 'customer' ? setCustomerEmail(e.target.value) : undefined}
                  disabled={!isEditing}
                  className="bg-background border-border text-foreground rounded-2xl"
                  data-testid="input-email"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-sm font-semibold text-card-foreground mb-2 block">
                  Phone Number {phoneNumberSaved && <span className="text-green-600">✓</span>}
                </Label>
                {phoneNumberSaved && phoneInputValue ? (
                  // Display saved phone number (read-only)
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-card-foreground font-medium">
                      +91
                    </div>
                    <Input
                      id="phone"
                      type="text"
                      value={phoneInputValue}
                      readOnly
                      className="bg-muted border-border text-card-foreground rounded-2xl pl-12 opacity-75 cursor-not-allowed"
                      data-testid="input-phone"
                    />
                  </div>
                ) : (
                  // Editable phone number input
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-card-foreground font-medium">
                      +91
                    </div>
                    <Input
                      ref={phoneInputRef}
                      id="phone"
                      type="text"
                      value={phoneInputValue}
                      onChange={handlePhoneInputChange}
                      onKeyDown={handlePhoneInputKeyDown}
                      onPaste={handlePhoneInputPaste}
                      onFocus={handlePhoneInputFocus}
                      onBlur={handlePhoneInputBlur}
                      disabled={!isEditing}
                      className="bg-background border-border text-card-foreground rounded-2xl pl-12"
                      placeholder="XXXXXXXXXX"
                      data-testid="input-phone"
                      maxLength={10}
                      inputMode="numeric"
                    />
                  </div>
                )}
                {getUserRole() === 'customer' && isEditing && !phoneNumberSaved && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter exactly 10 digits after +91 (e.g., 9876543210)
                  </p>
                )}
                {getUserRole() === 'customer' && !isEditing && !phoneNumberSaved && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Click "Edit Profile" to add your phone number
                  </p>
                )}
                {getUserRole() === 'customer' && phoneNumberSaved && phoneInputValue && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600">✓</span>
                      <span className="text-sm text-green-700 font-medium">
                        Phone number saved
                      </span>
                    </div>
                    <p className="text-sm text-card-foreground font-medium mt-2">
                      +91{phoneInputValue}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Phone number has been saved and cannot be changed
                    </p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="firstName" className="text-sm font-semibold text-card-foreground mb-2 block">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={getUserRole() === 'customer' ? customerFirstName : getUserName()}
                  onChange={(e) => getUserRole() === 'customer' ? setCustomerFirstName(e.target.value) : undefined}
                  disabled={!isEditing}
                  className="bg-background border-border text-foreground rounded-2xl"
                  data-testid="input-first-name"
                />
              </div>

              <div>
                <Label htmlFor="lastName" className="text-sm font-semibold text-card-foreground mb-2 block">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={getUserRole() === 'customer' ? customerLastName : ''}
                  onChange={(e) => getUserRole() === 'customer' ? setCustomerLastName(e.target.value) : undefined}
                  disabled={!isEditing}
                  className="bg-background border-border text-foreground rounded-2xl"
                  data-testid="input-last-name"
                />
              </div>

              <div>
                <Label htmlFor="role" className="text-sm font-semibold text-card-foreground mb-2 block">Role</Label>
                <Input
                  id="role"
                  type="text"
                  value={getUserRole()}
                  disabled
                  className="bg-muted border-border text-muted-foreground rounded-2xl capitalize"
                  data-testid="input-role"
                />
              </div>

              {/* Area field for customers */}
              {getUserRole() === 'customer' && (
                <div>
                  <AreaAutoSuggest
                    value={customerArea}
                    onChange={setCustomerArea}
                    disabled={!isEditing}
                    required={true}
                    data-testid="input-area"
                  />
                </div>
              )}
            </div>

            {isEditing && (
              <div className="mt-6 flex space-x-3">
                <Button 
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  data-testid="button-save-profile"
                  onClick={handleSaveProfile}
                >
                  <i className="fas fa-save mr-2"></i>
                  Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="bg-card rounded-2xl shadow-xl border border-border mb-6">
          <CardContent className="p-8">
            <h3 className="font-bold text-card-foreground mb-6">Account Settings</h3>
            
            <div className="space-y-4">
              {getUserRole() === 'freelancer' && (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left p-4 h-auto hover:bg-card/50 rounded-2xl"
                  onClick={() => setLocation('/plans')}
                  data-testid="button-subscription-plans"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                      <i className="fas fa-crown text-blue-400"></i>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-card-foreground">Subscription Plans</div>
                      <div className="text-sm text-muted-foreground">Manage your subscription</div>
                    </div>
                    <i className="fas fa-chevron-right text-muted-foreground"></i>
                  </div>
                </Button>
              )}

              <Button
                variant="ghost"
                className="w-full justify-start text-left p-4 h-auto hover:bg-card/50 rounded-2xl"
                data-testid="button-notifications"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center">
                    <i className="fas fa-bell text-green-400"></i>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-card-foreground">Notifications</div>
                    <div className="text-sm text-muted-foreground">Manage notification preferences</div>
                  </div>
                  <i className="fas fa-chevron-right text-muted-foreground"></i>
                </div>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start text-left p-4 h-auto hover:bg-card/50 rounded-2xl"
                data-testid="button-privacy"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center">
                    <i className="fas fa-shield-alt text-purple-400"></i>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-card-foreground">Privacy & Security</div>
                    <div className="text-sm text-muted-foreground">Manage privacy settings</div>
                  </div>
                  <i className="fas fa-chevron-right text-muted-foreground"></i>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card className="bg-card rounded-2xl shadow-xl border border-border">
          <CardContent className="p-8">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-left p-4 h-auto text-red-400 hover:bg-red-500/20 rounded-2xl"
              data-testid="button-logout"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center">
                  <i className="fas fa-sign-out-alt text-red-400"></i>
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Logout</div>
                  <div className="text-sm text-muted-foreground">Sign out of your account</div>
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <Navigation currentPage="profile" userRole={getUserRole() as 'customer' | 'freelancer' | 'admin'} />

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowSuccessPopup(false)} />
          <div className="relative bg-card border border-border rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-card-foreground mb-2">Success!</h3>
              <p className="text-card-foreground text-sm mb-6">{successMessage}</p>
              <Button
                onClick={() => setShowSuccessPopup(false)}
                className="w-full bg-primary hover:bg-primary-dark text-primary-foreground"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}