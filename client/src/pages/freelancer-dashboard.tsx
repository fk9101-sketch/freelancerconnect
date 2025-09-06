import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useFreelancerProfile } from "@/hooks/useFreelancerProfile";
import { useToast } from "@/hooks/use-toast";
import { useInquiryNotifications } from "@/hooks/useInquiryNotifications";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { signOutUser } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LeadCard from "@/components/lead-card";
import AcceptedJobCard from "@/components/accepted-job-card";
import Navigation from "@/components/navigation";
import LeadNotification from "@/components/lead-notification";
import InquiryNotification from "@/components/inquiry-notification";
import { useLeadNotifications } from "@/hooks/useLeadNotifications";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationDropdown from "@/components/notification-dropdown";
import type { FreelancerProfile, LeadWithRelations, Subscription } from "@shared/schema";

export default function FreelancerDashboard() {
  const { user: firebaseUser, isAuthenticated, isLoading } = useFirebaseAuth();
  const { freelancerProfile, isLoading: profileLoading, refetch } = useFreelancerProfile();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const notificationTriggerRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  
  // Lead notifications
  const { 
    currentNotification, 
    hasLeadPlan, 
    acceptLead, 
    dismissNotification
  } = useLeadNotifications();

  // General notifications
  const {
    unreadCount,
    isDropdownOpen,
    toggleDropdown,
    closeDropdown,
    refreshNotifications
  } = useNotifications();

  // Inquiry notifications
  const { 
    currentNotification: inquiryNotification, 
    dismissNotification: dismissInquiryNotification, 
    viewInquiry,
    hasNewInquiries 
  } = useInquiryNotifications();

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
      return;
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Role verification is now handled by ProtectedRoute in App.tsx

  // Get freelancer name for welcome message
  const getFreelancerName = () => {
    if (freelancerProfile?.fullName) {
      return freelancerProfile.fullName;
    }
    if (firebaseUser?.displayName) {
      return firebaseUser.displayName;
    }
    if (firebaseUser?.email) {
      return firebaseUser.email.split('@')[0];
    }
    return 'Freelancer';
  };

  // Fetch subscriptions - use the same query key as useLeadNotifications for consistency
  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useQuery<Subscription[]>({
    queryKey: ['/api/freelancer/subscriptions'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/freelancer/subscriptions');
        console.log('Subscriptions API response:', response);
        
        // Parse the response to get the JSON data
        const jsonData = await response.json();
        console.log('Parsed subscriptions data:', jsonData);
        
        // Ensure we return an array
        if (Array.isArray(jsonData)) {
          return jsonData;
        } else {
          console.warn('Unexpected subscriptions response format:', jsonData);
          return [];
        }
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
        return [];
      }
    },
    enabled: isAuthenticated && !!freelancerProfile,
    retry: 2,
  });

  // Fetch available leads (both free and paid freelancers can see leads)
  const { data: availableLeads = [], isLoading: availableLeadsLoading } = useQuery<LeadWithRelations[]>({
    queryKey: ['/api/freelancer/leads/notifications'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/freelancer/leads/notifications');
        console.log('Available leads API response:', response);
        
        // Parse the response to get the JSON data
        const jsonData = await response.json();
        console.log('Parsed available leads data:', jsonData);
        
        // Ensure we return an array
        if (Array.isArray(jsonData)) {
          return jsonData;
        } else {
          console.warn('Unexpected available leads response format:', jsonData);
          return [];
        }
      } catch (error) {
        console.error('Error fetching available leads:', error);
        return [];
      }
    },
    enabled: isAuthenticated && !!freelancerProfile,
    retry: 2,
  });

  // Fetch accepted leads
  const { data: acceptedLeads = [], isLoading: acceptedLeadsLoading } = useQuery<LeadWithRelations[]>({
    queryKey: ['/api/freelancer/leads/accepted'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/freelancer/leads/accepted');
        console.log('Accepted leads API response:', response);
        
        // Parse the response to get the JSON data
        const jsonData = await response.json();
        console.log('Parsed accepted leads data:', jsonData);
        
        // Ensure we return an array
        if (Array.isArray(jsonData)) {
          return jsonData;
        } else {
          console.warn('Unexpected accepted leads response format:', jsonData);
          return [];
        }
      } catch (error) {
        console.error('Error fetching accepted leads:', error);
        return [];
      }
    },
    enabled: isAuthenticated && !!freelancerProfile,
    retry: 2,
  });

  // Update new leads count when available leads change
  useEffect(() => {
    if (availableLeads && Array.isArray(availableLeads)) {
      setNewLeadsCount(availableLeads.length);
    } else {
      setNewLeadsCount(0);
    }
  }, [availableLeads]);

  // Accept lead mutation
  const acceptLeadMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const response = await apiRequest('POST', `/api/freelancer/leads/${leadId}/accept`);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Success",
          description: "Lead accepted successfully!",
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/freelancer/leads/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/freelancer/leads/accepted'] });
      queryClient.invalidateQueries({ queryKey: ['freelancer-lead-plan'] });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      } else if (error.status === 403) {
        toast({
          title: "Lead Plan Required",
          description: "Upgrade to Lead Plan to accept leads instantly.",
          variant: "destructive",
        });
        setTimeout(() => {
          setLocation('/subscription-plans');
        }, 2000);
      } else {
        toast({
          title: "Error",
          description: "Failed to accept lead. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const handleAcceptLead = (leadId: string) => {
    acceptLeadMutation.mutate(leadId);
  };

  const handleViewPlans = () => {
    setLocation('/subscription-plans');
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      localStorage.removeItem('selectedRole');
      setLocation('/');
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const hasActiveLeadPlan = () => {
    // Calculate hasLeadPlan from subscriptions data with proper validation
    const hasPlan = subscriptions.some((sub: any) => 
      sub && 
      sub.status === 'active' && 
      sub.type === 'lead' && 
      sub.endDate && 
      new Date(sub.endDate) > new Date()
    );
    
    console.log('🔍 Checking lead plan status:', {
      subscriptions: subscriptions.length,
      hasPlan,
      subscriptionDetails: subscriptions.filter((sub: any) => sub && sub.type === 'lead').map((sub: any) => ({
        id: sub.id,
        type: sub.type,
        status: sub.status,
        endDate: sub.endDate,
        isActive: sub.status === 'active' && new Date(sub.endDate) > new Date()
      }))
    });
    
    return hasPlan;
  };

  const getActivePositionPlans = () => {
    return subscriptions.filter((sub: any) => 
      sub && 
      sub.status === 'active' && 
      sub.type === 'position' && 
      sub.endDate && 
      new Date(sub.endDate) > new Date()
    );
  };

  const getPositionLabel = (position: number) => {
    switch (position) {
      case 1: return 'I';
      case 2: return 'II';
      case 3: return 'III';
      default: return position.toString();
    }
  };

  if (isLoading || profileLoading || subscriptionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-background text-foreground">
      {/* Company Logo/Header */}
      <div className="bg-gradient-purple py-4 px-6">
        <h1 className="text-3xl font-bold text-white text-center tracking-tight">
          Freelancer Connect
        </h1>
      </div>
      
      {/* Header */}
      <div className="bg-gradient-purple text-white p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold mb-1" data-testid="text-freelancer-greeting">
              Welcome, {getFreelancerName()}!
            </h2>
            <div className="flex items-center space-x-3">
              <span className="text-purple-100">
                {freelancerProfile?.professionalTitle || 'Professional Freelancer'}
              </span>
              <div className="flex items-center space-x-2">
                <span className="bg-green-400 w-2 h-2 rounded-full"></span>
                <span className="text-xs text-purple-200">
                  {freelancerProfile?.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {freelancerProfile?.verificationStatus === 'approved' && (
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                <i className="fas fa-check-circle mr-1"></i>
                VERIFIED
              </Badge>
            )}
            <div className="relative" ref={notificationTriggerRef}>
              <button
                onClick={toggleDropdown}
                className="relative p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                <i className="fas fa-bell text-xl opacity-80"></i>
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse" data-testid="notification-badge">
                    {unreadCount}
                  </span>
                )}
                {hasNewInquiries && (
                  <span className="absolute -top-2 -right-8 bg-green-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center animate-pulse"></span>
                )}
              </button>
              
              {/* Notification Dropdown */}
              <NotificationDropdown
                isOpen={isDropdownOpen}
                onClose={closeDropdown}
                triggerRef={notificationTriggerRef}
              />
            </div>
            
            {/* Profile Picture with Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30 hover:border-white/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                {firebaseUser?.photoURL ? (
                  <img
                    src={firebaseUser.photoURL}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-white/20 flex items-center justify-center">
                    <i className="fas fa-user text-white text-lg"></i>
                  </div>
                )}
              </button>
              
              {/* Profile Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setLocation('/freelancer/profile');
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-3"
                    >
                      <i className="fas fa-user text-gray-600 w-5"></i>
                      <span className="text-gray-800 font-medium">My Profile</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setLocation('/freelancer/messages');
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-3"
                    >
                      <i className="fas fa-envelope text-gray-600 w-5"></i>
                      <span className="text-gray-800 font-medium">My Leads</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setLocation('/my-plans');
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-3"
                    >
                      <i className="fas fa-credit-card text-gray-600 w-5"></i>
                      <span className="text-gray-800 font-medium">My Plans</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setLocation('/rewards-offers');
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-3"
                    >
                      <i className="fas fa-gift text-gray-600 w-5"></i>
                      <span className="text-gray-800 font-medium">Reward</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setLocation('/freelancer/more');
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-3"
                    >
                      <i className="fas fa-headset text-gray-600 w-5"></i>
                      <span className="text-gray-800 font-medium">Help & Support</span>
                    </button>
                    
                    <div className="border-t border-gray-100 my-1"></div>
                    
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors duration-150 flex items-center space-x-3"
                    >
                      <i className="fas fa-sign-out-alt text-red-500 w-5"></i>
                      <span className="text-red-600 font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white bg-opacity-20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold" data-testid="text-new-leads-count">
              {Array.isArray(availableLeads) ? availableLeads.length : 0}
            </p>
            <p className="text-xs text-purple-100">New Leads</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">₹0</p>
            <p className="text-xs text-purple-100">This Month</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{freelancerProfile?.rating || '0'}</p>
            <p className="text-xs text-purple-100">Rating</p>
          </div>
        </div>
      </div>

      {/* Subscription Status */}
      <div className="p-4">
        {hasActiveLeadPlan() ? (
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Lead Plan Active</h3>
                <p className="text-sm text-green-100">
                  Expires on {(() => {
                    if (!subscriptions || !Array.isArray(subscriptions)) return 'Unknown';
                    const leadPlan = subscriptions.find(s => s && typeof s === 'object' && s.type === 'lead');
                    return leadPlan?.endDate ? new Date(leadPlan.endDate).toLocaleDateString() : 'Unknown';
                  })()}
                </p>
              </div>
              <i className="fas fa-crown text-xl"></i>
            </div>
          </div>
        ) : (
          <Card className="bg-yellow-50 border-yellow-200 mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-yellow-800">Upgrade to Lead Plan</h3>
                  <p className="text-sm text-yellow-600">Accept leads and get customer details</p>
                </div>
                <Button 
                  onClick={handleViewPlans}
                  size="sm"
                  className="bg-yellow-500 hover:bg-yellow-600"
                  data-testid="button-view-plans"
                >
                  View Plans
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Position Plan Status */}
        {(() => {
          const activePositionPlans = getActivePositionPlans();
          return activePositionPlans.length > 0 ? (
            <div className="space-y-3 mb-4">
              {activePositionPlans.map((plan: any) => (
                <div key={plan.id} className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Position {getPositionLabel(plan.position)} Plan Active</h3>
                      <p className="text-sm text-yellow-100">
                        {plan.area} • Expires on {new Date(plan.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="bg-yellow-400 text-yellow-800 px-3 py-1 rounded-full font-bold text-lg">
                        {getPositionLabel(plan.position)}
                      </div>
                      <i className="fas fa-crown text-xl"></i>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null;
        })()}

        {/* New Leads */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground text-lg">New Leads</h3>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation('/freelancer/leads')}
              >
                View All
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation('/freelancer/messages')}
                className={hasNewInquiries ? "border-green-500 text-green-600" : ""}
              >
                {hasNewInquiries && <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>}
                Inquiries
              </Button>
            </div>
          </div>
          
          {availableLeadsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="spinner"></div>
            </div>
          ) : Array.isArray(availableLeads) && availableLeads.length > 0 ? (
            <div className="space-y-3">
              {availableLeads.slice(0, 3).map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  canAccept={hasActiveLeadPlan()}
                  onAccept={() => handleAcceptLead(lead.id)}
                  isAccepting={acceptLeadMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-6 text-center">
                <i className="fas fa-inbox text-3xl text-gray-400 mb-3"></i>
                <h4 className="font-semibold text-gray-600 mb-2">No New Leads</h4>
                <p className="text-sm text-gray-500">Check back later for new opportunities</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Accepted Leads */}
        <div className="mb-6">
          <h3 className="font-bold text-foreground text-lg mb-4">Accepted Leads</h3>
          
          {acceptedLeadsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="spinner"></div>
            </div>
          ) : Array.isArray(acceptedLeads) && acceptedLeads.length > 0 ? (
            <div className="space-y-3">
              {acceptedLeads.map((lead) => (
                <AcceptedJobCard
                  key={lead.id}
                  lead={lead}
                />
              ))}
            </div>
          ) : (
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-6 text-center">
                <i className="fas fa-handshake text-3xl text-gray-400 mb-3"></i>
                <h4 className="font-semibold text-gray-600 mb-2">No Accepted Leads</h4>
                <p className="text-sm text-gray-500">Accept leads to see them here</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Navigation currentPage="dashboard" userRole="freelancer" />
      
      {/* Lead Ring Notification */}
      {currentNotification && (
        <LeadNotification
          leadData={currentNotification}
          onAccept={acceptLead}
          onDismiss={dismissNotification}
          hasLeadPlan={hasActiveLeadPlan()}
        />
      )}

      {/* Inquiry Notification */}
      {inquiryNotification && (
        <InquiryNotification
          notification={inquiryNotification}
          onDismiss={dismissInquiryNotification}
          onView={viewInquiry}
        />
      )}
    </div>
  );
}
