import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";
import { hasAdminAccess } from "@/lib/roleUtils";
import { apiRequest } from "@/lib/queryClient";
import { sortFreelancersWithPaidMembersFirst } from "@/lib/utils";
import { fallbackCategories } from '@/lib/fallbackData';
import { fullCategoriesData } from '@/lib/fullCategoriesData';

// Helper function to apply correct sorting logic based on filter requirements
function applyCorrectSortingLogic(
  freelancers: FreelancerWithRelations[], 
  selectedCategoryId: string, 
  targetArea: string
): FreelancerWithRelations[] {
  if (freelancers.length === 0) return freelancers;
  
  // Helper function to check if freelancer has active position plan
  const hasActivePositionPlan = (freelancer: FreelancerWithRelations, categoryId: string, area: string) => {
    return freelancer.subscriptions?.some(sub => 
      sub.status === 'active' && 
      sub.type === 'position' && 
      sub.categoryId === categoryId &&
      sub.area === area &&
      new Date(sub.endDate) > new Date()
    );
  };
  
  // Helper function to check if freelancer has active paid lead plan
  const hasActivePaidLeadPlan = (freelancer: FreelancerWithRelations) => {
    return freelancer.subscriptions?.some(sub => 
      sub.status === 'active' && 
      sub.type === 'lead' && 
      new Date(sub.endDate) > new Date()
    );
  };
  
  // Helper function to get position number for freelancer
  const getPositionNumber = (freelancer: FreelancerWithRelations, categoryId: string, area: string) => {
    const positionSub = freelancer.subscriptions?.find(sub => 
      sub.status === 'active' && 
      sub.type === 'position' && 
      sub.categoryId === categoryId &&
      sub.area === area &&
      new Date(sub.endDate) > new Date()
    );
    return positionSub?.position || 999;
  };
  
  // Helper function for round-robin rotation
  const rotateArray = (arr: any[], rotationKey: string) => {
    if (arr.length <= 1) return arr;
    const hash = Math.abs(rotationKey.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0));
    const rotationIndex = hash % arr.length;
    return [...arr.slice(rotationIndex), ...arr.slice(0, rotationIndex)];
  };
  
  // CASE 1: Only Category Selected (no area filter)
  if (selectedCategoryId && !targetArea) {
    console.log('🔄 Applying category-only filtering - showing only PAID freelancers rotationally');
    
    // Filter to show ONLY paid freelancers (lead plan holders) from that category
    const paidFreelancers = freelancers.filter(freelancer => 
      hasActivePaidLeadPlan(freelancer)
    );
    
    // Show paid freelancers from that category on a rotational basis
    const rotationKey = `category_${selectedCategoryId}_${Date.now()}`;
    return rotateArray(paidFreelancers, rotationKey);
  }
  
  // CASE 2: Both Category and Area Selected
  if (selectedCategoryId && targetArea) {
    console.log('🔄 Applying category + area filtering with position plan priority');
    
    // Separate freelancers by plan type - ONLY PAID freelancers
    const positionPlanHolders: FreelancerWithRelations[] = [];
    const paidLeadPlanHolders: FreelancerWithRelations[] = [];
    
    freelancers.forEach(freelancer => {
      if (hasActivePositionPlan(freelancer, selectedCategoryId, targetArea)) {
        positionPlanHolders.push(freelancer);
      } else if (hasActivePaidLeadPlan(freelancer)) {
        paidLeadPlanHolders.push(freelancer);
      }
      // Free freelancers are excluded from filtered results
    });
    
    // Sort position plan holders by position (1, 2, 3)
    positionPlanHolders.sort((a, b) => {
      const aPos = getPositionNumber(a, selectedCategoryId, targetArea);
      const bPos = getPositionNumber(b, selectedCategoryId, targetArea);
      return aPos - bPos;
    });
    
    // Sort paid lead plan holders rotationally
    const rotationKey = `paid_lead_${selectedCategoryId}_${targetArea}`;
    const rotatedPaidLeadHolders = rotateArray(paidLeadPlanHolders, rotationKey);
    
    // Combine: Position Plan holders first (1,2,3), then Paid Lead Plan holders rotationally
    // NO FREE FREELANCERS in filtered results
    return [...positionPlanHolders, ...rotatedPaidLeadHolders];
  }
  
  // CASE 3: Only Area Selected (no category) - show all paid freelancers in that area
  if (!selectedCategoryId && targetArea) {
    console.log('🔄 Applying area-only filtering - showing only PAID freelancers rotationally');
    
    // Filter to show ONLY paid freelancers in that area
    const paidFreelancers = freelancers.filter(freelancer => 
      hasActivePaidLeadPlan(freelancer)
    );
    
    // Show paid freelancers from that area on a rotational basis
    const rotationKey = `area_${targetArea}_${Date.now()}`;
    return rotateArray(paidFreelancers, rotationKey);
  }
  
  // CASE 4: No filters selected - show all PAID freelancers rotationally
  console.log('🔄 Applying default rotation for all PAID freelancers');
  const paidFreelancers = freelancers.filter(freelancer => 
    hasActivePaidLeadPlan(freelancer)
  );
  const rotationKey = `default_${Date.now()}`;
  return rotateArray(paidFreelancers, rotationKey);
}

// Form schema for requirement posting
import { insertLeadSchema } from "@shared/schema";
import type { User, FreelancerWithRelations, Category } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AreaAutoSuggest } from "@/components/AreaAutoSuggest";
import { CategoryAutoSuggest } from "@/components/CategoryAutoSuggest";
import Navigation from "@/components/navigation";
import FreelancerCard from "@/components/freelancer-card";

// Form schema for requirement posting
const requirementSchema = insertLeadSchema.omit({
  customerId: true, // We'll add this programmatically from the current user
}).extend({
  budget: z.coerce.number().min(1, "Budget is required"),
  mobileNumber: z.string()
    .min(1, "Mobile number is required")
    .regex(/^\+91[0-9]{10}$/, "Please enter a valid 10-digit mobile number"),
}).omit({
  budgetMin: true,
  budgetMax: true,
  pincode: true,
  preferredTime: true,
  photos: true,
});



type RequirementForm = z.infer<typeof requirementSchema>;

export default function CustomerDashboard() {
  const { user: firebaseUser, isAuthenticated, isLoading, signOut } = useFirebaseAuth();
  const { userProfile, isLoading: profileLoading } = useUserProfile();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Filter states for real-time search
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Form setup for requirement posting
  const form = useForm<RequirementForm>({
    resolver: zodResolver(requirementSchema),
    defaultValues: {
      title: "",
      description: "",
      budget: 0,
      location: userProfile?.area || "",
      categoryId: "",
      mobileNumber: "+91",
    },
  });



  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
      return;
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Initialize area filter with user's area when profile loads
  useEffect(() => {
    if (userProfile?.area) {
      setSelectedArea(userProfile.area);
      form.setValue("location", userProfile.area);
    }
  }, [userProfile, form]);

  // Update form when user profile loads
  useEffect(() => {
    if (userProfile?.area) {
      form.setValue("location", userProfile.area);
    }
  }, [userProfile, form]);

  // Handle body scroll lock when menu is open
  useEffect(() => {
    if (typeof document !== 'undefined' && document.body) {
      if (isMenuOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (typeof document !== 'undefined' && document.body) {
        document.body.style.overflow = 'unset';
      }
    };
  }, [isMenuOpen]);

  // Handle escape key to close menu
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

  // Fetch categories with fallback
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('Failed to fetch categories');
        return response.json();
      } catch (error) {
        console.log('Using full categories data from database');
        // Return full categories data from database (177 categories)
        return fullCategoriesData;
      }
    },
    retry: false,
  });

  // Fetch real freelancers from database - NO MOCK DATA
  const { data: allFreelancers = [], isLoading: freelancersLoading, error: freelancersError } = useQuery<FreelancerWithRelations[]>({
    queryKey: ['/api/customer/available-freelancers', userProfile?.area],
    queryFn: async () => {
      console.log('🔍 Fetching REAL freelancers from database...');
      try {
        const response = await apiRequest('GET', '/api/customer/available-freelancers');
        console.log('📡 API Response status:', response.status);
        console.log('📡 API Response headers:', response.headers);
        
        if (!response.ok) {
          console.error('❌ API response not ok:', response.status, response.statusText);
          throw new Error('Failed to fetch freelancers from database');
        }
        
        const data = await response.json();
        console.log(`✅ Found ${data.length} REAL freelancers from database`, data);
        console.log('📊 Data type:', typeof data);
        console.log('📊 Data is array:', Array.isArray(data));
        
        // Return real data from database - no mock data
        return data;
      } catch (error) {
        console.error('❌ Error in fetch:', error);
        throw error;
      }
    },
    retry: 3,
    refetchInterval: 30000, // Refresh every 30 seconds to get latest data
  });

  // Filter freelancers according to the specified logic requirements
  const filteredFreelancers = useMemo(() => {
    let filtered = allFreelancers || [];
    
    // Remove duplicates based on freelancer ID to ensure no duplicate cards
    const uniqueFreelancers = filtered.filter((freelancer, index, self) => 
      index === self.findIndex(f => f.id === freelancer.id)
    );
    filtered = uniqueFreelancers;
    console.log(`🔍 Deduplication: ${allFreelancers?.length || 0} total -> ${filtered.length} after removing duplicates`);
    
    // Apply name search filter if search query exists - show ALL freelancers regardless of plan
    if (searchQuery.trim()) {
      filtered = filtered.filter(freelancer => 
        freelancer.fullName && freelancer.fullName.toLowerCase().includes(searchQuery.toLowerCase().trim())
      );
      console.log(`🔍 Name search filtering: ${filtered.length} freelancers after name search (showing all regardless of plan)`);
      
      // If name search is active, return all matching freelancers without further filtering
      return filtered;
    }
    
    // PRIMARY FILTER: Category Selection
    if (selectedCategoryId) {
      filtered = filtered.filter(freelancer => 
        freelancer.categoryId === selectedCategoryId
      );
      console.log(`🔍 Category filtering: ${allFreelancers?.length || 0} total -> ${filtered.length} after category filter`);
    }
    
    // SECONDARY FILTER: Area Selection
    const targetArea = selectedArea || userProfile?.area;
    if (targetArea) {
      filtered = filtered.filter(freelancer => 
        freelancer.area && freelancer.area.toLowerCase() === targetArea.toLowerCase()
      );
      console.log(`🔍 Area filtering: ${filtered.length} freelancers after area filter (${targetArea})`);
    }
    
    // Apply the correct sorting logic based on filter combination
    const sortedFiltered = applyCorrectSortingLogic(filtered, selectedCategoryId, targetArea);
    
    console.log(`🔍 Final sorting: ${filtered.length} filtered -> ${sortedFiltered.length} sorted`);
    
    return sortedFiltered;
  }, [allFreelancers, userProfile?.area, selectedCategoryId, selectedArea, searchQuery]);

  // Log filtering results for debugging
  console.log(`🔍 Filtering: ${allFreelancers?.length || 0} total freelancers -> ${filteredFreelancers.length} after filtering`);
  console.log(`🔍 Selected filters: category="${selectedCategory}", area="${selectedArea}", categoryId="${selectedCategoryId}"`);
  console.log(`🔍 Freelancers error:`, freelancersError);
  console.log(`🔍 Freelancers loading:`, freelancersLoading);

  // Handle category selection from autosuggest
  const handleCategorySelect = (categoryId: string, categoryName: string) => {
    setSelectedCategory(categoryName);
    setSelectedCategoryId(categoryId);
  };

  // Handle area selection from autosuggest
  const handleAreaSelect = (area: string) => {
    setSelectedArea(area);
  };

  // Clear filters
  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedArea(userProfile?.area || "");
    setSelectedCategoryId("");
    setSearchQuery("");
  };

  // Create requirement mutation
  const createRequirementMutation = useMutation({
    mutationFn: async (data: RequirementForm) => {
      if (!firebaseUser?.uid) {
        throw new Error('User not authenticated');
      }
      await apiRequest('POST', '/api/customer/leads', {
        ...data,
        customerId: firebaseUser.uid,
        budgetMin: data.budget,
        budgetMax: data.budget,
        pincode: "",
        preferredTime: "",
        photos: [],
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Requirement posted successfully! Freelancers will be notified.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/customer/leads'] });
      form.reset();
      if (userProfile?.area) {
        form.setValue("location", userProfile.area);
      }
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post requirement",
        variant: "destructive",
      });
    },
  });

  const onSubmitRequirement = async (data: RequirementForm) => {
    // Log form data to console for debugging
    console.log('🚀 Form submitted with data:', {
      title: data.title,
      description: data.description,
      budget: data.budget,
      location: data.location,
      categoryId: data.categoryId,
      mobileNumber: data.mobileNumber,
      categoryName: categories.find(cat => cat.id === data.categoryId)?.name,
      userId: firebaseUser?.uid,
      timestamp: new Date().toISOString()
    });

    if (!firebaseUser || !firebaseUser.uid) {
      toast({
        title: "Authentication Error",
        description: "Please log in to post a requirement",
        variant: "destructive",
      });
      return;
    }
    
    // Validate data manually
    try {
      requirementSchema.parse(data);
      console.log('✅ Form validation passed');
    } catch (error) {
      console.error('❌ Form validation failed:', error);
      toast({
        title: "Validation Error",
        description: "Please check your form data and try again",
        variant: "destructive",
      });
      return;
    }
    
    console.log('📤 Submitting requirement to API...');
    createRequirementMutation.mutate(data);
  };

  const handleContactFreelancer = (freelancer: FreelancerWithRelations) => {
    toast({
      title: "Contact Freelancer",
      description: `Contacting ${freelancer.fullName} - ${freelancer.category?.name}`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white pb-24">
      {/* Company Logo/Header */}
      <div className="bg-gradient-purple py-4 px-6 relative">
        <h1 className="text-3xl font-bold text-white text-center tracking-tight">
          Freelancer Connect
        </h1>
        {/* Hamburger Menu Icon - Top Right Corner */}
        <div className="absolute top-4 right-6">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="text-white hover:text-gray-200 transition-all duration-200 p-2 hover:scale-105 active:scale-95"
            aria-label="Open menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Sliding Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Sliding Menu */}
          <div className={`absolute left-0 top-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            {/* Menu Header */}
            <div className="bg-gradient-purple p-6 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Menu</h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="text-white hover:text-gray-200 transition-colors duration-200 p-2 hover:scale-105 active:scale-95"
                  aria-label="Close menu"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            

            {/* Menu Content */}
            <div className="p-6 space-y-2 max-h-[70vh] overflow-y-auto">
              {(() => {
                const baseMenuItems = [
                  {
                    id: 'profile',
                    label: 'My Profile',
                    icon: 'fas fa-user',
                    description: 'Profile Picture, Name, Email, Phone, Address',
                    path: '/customer/profile',
                    badge: null
                  },
                  {
                    id: 'requests',
                    label: 'My Requests / Bookings',
                    icon: 'fas fa-list-alt',
                    description: 'Ongoing & Past Requests, Re-book Options',
                    path: '/customer/requests',
                    badge: null
                  },
                  {
                    id: 'rewards',
                    label: 'Rewards & Offers',
                    icon: 'fas fa-gift',
                    description: 'Cashback Points, Discount Coupons, Referrals',
                    path: '/customer/rewards',
                    badge: 'New'
                  },
                  {
                    id: 'saved',
                    label: 'Saved Freelancers',
                    icon: 'fas fa-heart',
                    description: 'Favorite Freelancers, Quick Re-book',
                    path: '/customer/saved',
                    badge: null
                  },
                  {
                    id: 'notifications',
                    label: 'Notifications & Alerts',
                    icon: 'fas fa-bell',
                    description: 'New Offers, Booking Updates, Reminders',
                    path: '/customer/notifications',
                    badge: null
                  },
                  {
                    id: 'help',
                    label: 'Help & Support',
                    icon: 'fas fa-question-circle',
                    description: 'FAQs, Chat Support, Complaints',
                    path: '/customer/help',
                    badge: null
                  },
                  {
                    id: 'settings',
                    label: 'Settings',
                    icon: 'fas fa-cog',
                    description: 'Language, Location, Notifications',
                    path: '/customer/settings',
                    badge: null
                  },
                  {
                    id: 'security',
                    label: 'Account Security',
                    icon: 'fas fa-shield-alt',
                    description: 'Change Password, Linked Accounts',
                    path: '/customer/security',
                    badge: null
                  }
                ];

                // Add admin portal link only if user has admin access
                if (hasAdminAccess(userProfile)) {
                  baseMenuItems.push({
                    id: 'admin',
                    label: 'Admin Portal',
                    icon: 'fas fa-cogs',
                    description: 'Administrative Dashboard and Controls',
                    path: '/admin',
                    badge: null
                  });
                }

                return baseMenuItems;
              })().map((item, index) => (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setLocation(item.path);
                    }}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-start space-x-3"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <i className={`${item.icon} text-gray-600 text-sm`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">{item.label}</h4>
                        {item.badge && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
                    </div>
                  </button>
                  
                  {/* Add separator after certain items */}
                  {(index === 1 || index === 3 || index === 5) && (
                    <div className="border-t border-gray-100 my-2"></div>
                  )}
                </div>
              ))}
            </div>

            {/* Logout Section */}
            <div className="border-t border-gray-100 p-6">
              <button
                onClick={async () => {
                  setIsMenuOpen(false);
                  try {
                    await signOut();
                    setLocation('/');
                  } catch (error) {
                    console.error('Logout error:', error);
                  }
                }}
                className="w-full text-left p-3 rounded-lg hover:bg-red-50 transition-colors duration-200 flex items-center space-x-3 text-red-600"
              >
                <div className="flex-shrink-0">
                  <i className="fas fa-sign-out-alt text-red-500 text-sm"></i>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium">Logout</h4>
                  <p className="text-xs text-red-400">Sign out of your account</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Main Content */}
        <div className="p-6 space-y-6">
          {/* Post Your Requirement Button */}
          <div className="flex justify-center">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-purple text-white py-4 px-8 rounded-xl font-bold text-lg hover:scale-105 transition-all duration-200 shadow-lg">
                  <i className="fas fa-plus-circle mr-2"></i>
                  Post Your Requirement
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white text-gray-900">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-gray-900 mb-4">Post Your Requirement</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitRequirement)} className="space-y-4">

                    {/* Title */}
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Title</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter requirement title..."
                              className="w-full border-gray-300 focus:border-purple-500 focus:ring-purple-500 bg-white text-gray-900"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Service Category */}
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Service Category</FormLabel>
                          <FormControl>
                            <CategoryAutoSuggest
                              value={categories.find(cat => cat.id === field.value)?.name || ""}
                              onChange={(categoryId) => {
                                field.onChange(categoryId);
                              }}
                              onCategorySelect={(categoryId, categoryName) => {
                                field.onChange(categoryId);
                              }}
                              placeholder="Type to search categories..."
                              className="h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500 bg-white text-gray-900 rounded-lg"
                              showCustomOption={false}
                              isFilter={true}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Description */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Description</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={3}
                              placeholder="Describe your requirements in detail..."
                              className="w-full border-gray-300 focus:border-purple-500 focus:ring-purple-500 bg-white text-gray-900"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Budget */}
                    <FormField
                      control={form.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Budget (₹)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              placeholder="Enter your budget"
                              className="w-full border-gray-300 focus:border-purple-500 focus:ring-purple-500 bg-white text-gray-900"
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(value === "" ? 0 : Number(value));
                              }}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Location/Area */}
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Location/Area</FormLabel>
                          <FormControl>
                            <AreaAutoSuggest
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Type to search areas..."
                              className="h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500 bg-white text-gray-900 rounded-lg"
                              isFilter={true}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Mobile Number */}
                    <FormField
                      control={form.control}
                      name="mobileNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Mobile Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 text-sm font-medium">+91</span>
                              </div>
                              <Input
                                {...field}
                                type="tel"
                                placeholder="Enter 10-digit mobile number"
                                className="w-full pl-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500 bg-white text-gray-900"
                                onChange={(e) => {
                                  const value = e.target.value;
                                  // Only allow numeric digits
                                  const numericValue = value.replace(/[^0-9]/g, '');
                                  // Limit to 10 digits
                                  const limitedValue = numericValue.slice(0, 10);
                                  field.onChange(`+91${limitedValue}`);
                                }}
                                value={field.value.replace('+91', '')}
                                maxLength={10}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={createRequirementMutation.isPending}
                      className="w-full bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white py-4 px-8 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-purple-500/25 hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-60 disabled:scale-100 disabled:cursor-not-allowed border-0 relative overflow-hidden group"
                      style={{
                        background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 25%, #4c1d95 50%, #3730a3 75%, #1e40af 100%)',
                        boxShadow: '0 20px 40px rgba(124, 58, 237, 0.3), 0 8px 16px rgba(124, 58, 237, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:animate-shimmer"></div>
                      {createRequirementMutation.isPending ? (
                        <div className="flex items-center justify-center relative z-10">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                          <span className="tracking-wide">Posting...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center relative z-10">
                          <i className="fas fa-paper-plane mr-3 text-lg"></i>
                          <span className="tracking-wide">Post Your Requirement</span>
                        </div>
                      )}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Enhanced Freelancer Search Filters */}
          <div className="bg-card rounded-xl p-6 shadow-sm border">
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-white mb-2">
                  Find Your Perfect Freelancer
                </h2>
                <p className="text-white/70 text-sm">
                  {userProfile?.area 
                    ? `Freelancers are automatically filtered to show those in ${userProfile.area}. Use additional filters below to narrow your search.`
                    : 'Use the filters below to find freelancers in your area'
                  }
                </p>

              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Service Category Filter with Autosuggest */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">
                    Service Category <span className="text-xs text-white/60">(Paid freelancers only)</span>
                  </label>
                  <div className="flex gap-2">
                    <CategoryAutoSuggest
                      value={selectedCategory}
                      onChange={(categoryId) => {
                        const category = categories.find(cat => cat.id === categoryId);
                        setSelectedCategory(category?.name || "");
                        setSelectedCategoryId(categoryId);
                      }}
                      onCategorySelect={handleCategorySelect}
                      placeholder="Type to search categories..."
                      className="flex-1"
                      isFilter={true}
                    />
                    {selectedCategory && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCategory("");
                          setSelectedCategoryId("");
                        }}
                        className="px-2 text-xs"
                        title="Clear category filter"
                      >
                        <i className="fas fa-times"></i>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Area/Location Filter with Autosuggest */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">
                    Area/Location
                  </label>
                  <div className="flex gap-2">
                    <AreaAutoSuggest
                      value={selectedArea}
                      onChange={handleAreaSelect}
                      placeholder="Type to search areas..."
                      className="flex-1"
                      isFilter={true}
                    />
                    {selectedArea && selectedArea !== userProfile?.area && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedArea(userProfile?.area || "")}
                        className="px-2 text-xs"
                        title="Clear area filter"
                      >
                        <i className="fas fa-times"></i>
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Name Search Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">
                  Search by Name <span className="text-xs text-white/60">(All freelancers)</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter freelancer name to search..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSearchQuery(searchQuery)}
                    className="px-4"
                  >
                    Search
                  </Button>
                  {searchQuery && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchQuery("")}
                      className="px-2 text-xs"
                      title="Clear search query"
                    >
                      <i className="fas fa-times"></i>
                    </Button>
                  )}
                </div>
              </div>

              {/* Clear Filters Button */}
              {(selectedCategory || selectedArea || searchQuery) && (
                <div className="flex flex-col items-center pt-2 space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearFilters}
                    className="text-sm px-6 py-2 border-dashed border-2 hover:border-solid hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all duration-200 bg-white/5 text-white border-white/30"
                  >
                    <i className="fas fa-times-circle mr-2"></i>
                    Clear All Filters
                  </Button>
                  <p className="text-xs text-white/50 text-center">
                    This will reset all filters and show freelancers in your default area
                  </p>
                </div>
              )}

              {/* Active Filters Display */}
              {(selectedCategory || selectedArea || userProfile?.area || searchQuery) && (
                <div className="flex items-center justify-between pt-4 border-t border-white/20">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/70">Active filters:</span>
                    {userProfile?.area && (
                      <Badge variant="secondary" className="text-xs">
                        Default: {userProfile.area}
                      </Badge>
                    )}
                    {selectedCategory && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedCategory}
                      </Badge>
                    )}
                    {selectedArea && selectedArea !== userProfile?.area && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedArea}
                      </Badge>
                    )}
                    {searchQuery && (
                      <Badge variant="secondary" className="text-xs">
                        Name: {searchQuery}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs"
                  >
                    Clear All
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Freelancer Listings Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Available Freelancers
                </h3>
                <p className="text-sm text-white/70 mt-1">
                  <i className="fas fa-users text-purple-500 mr-1"></i>
                  {userProfile?.area ? `Showing freelancers in ${userProfile.area}` : 'Showing all available freelancers'}
                  {selectedCategory && ` for ${selectedCategory}`}
                  {selectedArea && selectedArea !== userProfile?.area && ` in ${selectedArea}`}
                  {searchQuery && ` matching "${searchQuery}"`}
                  {selectedCategory && selectedArea && !searchQuery && ` (Position Plan holders first, then Paid Lead Plan holders rotationally)`}
                  {searchQuery && ` (all matching freelancers)`}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm text-white/70">
                  {filteredFreelancers.length} freelancer{filteredFreelancers.length !== 1 ? 's' : ''} found
                </p>
                {(selectedCategory || (selectedArea && selectedArea !== userProfile?.area) || searchQuery) && (
                  <Badge variant="outline" className="text-xs">
                    Filtered Results
                  </Badge>
                )}
                {selectedCategory && !selectedArea && !searchQuery && (
                  <Badge variant="secondary" className="text-xs">
                    Paid Freelancers Only
                  </Badge>
                )}
                {selectedCategory && selectedArea && !searchQuery && (
                  <Badge variant="secondary" className="text-xs">
                    Position Plan Priority
                  </Badge>
                )}
                {userProfile?.area && !selectedArea && (
                  <Badge variant="secondary" className="text-xs">
                    Area: {userProfile.area}
                  </Badge>
                )}
              </div>
            </div>

            {/* Show only real freelancers from database */}
            <div className="space-y-4">
              {filteredFreelancers.map((freelancer) => (
                <FreelancerCard
                  key={freelancer.id}
                  freelancer={freelancer}
                  onContact={() => handleContactFreelancer(freelancer)}
                />
              ))}
            </div>

            {/* Show message if no real freelancers found in database */}
            {filteredFreelancers.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="text-white/40 mb-4">
                    <i className="fas fa-search text-6xl"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-white/80 mb-2">
                    {userProfile?.area ? `No freelancers found in ${userProfile.area}` : 'No freelancers found'}
                    {searchQuery && ` matching "${searchQuery}"`}
                  </h3>
                  <p className="text-white/60 mb-4">
                    {userProfile?.area 
                      ? `There are currently no freelancers available in your area (${userProfile.area})${searchQuery ? ` with names matching "${searchQuery}"` : ''}. Try expanding your search or check back later.`
                      : `No freelancers are currently available${searchQuery ? ` with names matching "${searchQuery}"` : ''}. Please check back later or try adjusting your filters.`
                    }
                    {selectedCategory && !selectedArea && !searchQuery && ` Note: Category filtering shows only paid freelancers rotationally. Free freelancers are not visible in filtered results.`}
                    {selectedCategory && selectedArea && !searchQuery && ` Note: Area + Category filtering shows Position Plan holders first (1,2,3), then Paid Lead Plan holders rotationally. Free freelancers are not visible in filtered results.`}
                  </p>
                  {userProfile?.area && (
                    <div className="space-y-2">
                      <p className="text-sm text-white/50">
                        Current area filter: <span className="font-medium">{userProfile.area}</span>
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        className="text-xs"
                      >
                        Clear Area Filter
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <Navigation currentPage="home" userRole="customer" />
    </div>
  );
}