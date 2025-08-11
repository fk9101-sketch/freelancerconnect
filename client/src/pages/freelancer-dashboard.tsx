import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LeadCard from "@/components/lead-card";
import Navigation from "@/components/navigation";
import type { FreelancerProfile, LeadWithRelations, Subscription } from "@shared/schema";

export default function FreelancerDashboard() {
  const { user: firebaseUser, isAuthenticated, isLoading } = useFirebaseAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [newLeadsCount, setNewLeadsCount] = useState(0);

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
      return;
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Mock data for now since backend API is using different auth
  const profile: FreelancerProfile = {
    id: 'mock-freelancer-1',
    userId: firebaseUser?.uid || 'mock-user',
    businessName: 'Professional Services',
    bio: 'Experienced professional offering quality services',
    skills: ['Electrical', 'Plumbing', 'Carpentry'],
    location: 'Mumbai, India',
    rating: 4.8,
    totalJobs: 45,
    isVerified: true,
    phoneNumber: '+91 9876543210',
    portfolioImages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const subscriptions: Subscription[] = [];
  const availableLeads: LeadWithRelations[] = [
    {
      id: 'lead-1',
      title: 'Home Electrical Repair',
      description: 'Need to fix electrical issues in kitchen',
      budgetMin: 2000,
      budgetMax: 5000,
      location: 'Bandra, Mumbai',
      pincode: '400050',
      categoryId: '1',
      customerId: 'customer-1',
      status: 'posted',
      preferredTime: 'Morning',
      photos: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      customer: {
        id: 'customer-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phoneNumber: '+91 9876543210',
        role: 'customer' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      category: {
        id: '1',
        name: 'Electrical',
        description: 'Electrical services',
        icon: 'fas fa-bolt',
      },
    },
  ];
  const acceptedLeads: LeadWithRelations[] = [];
  
  const profileLoading = false;
  const subscriptionsLoading = false;
  const availableLeadsLoading = false;
  const acceptedLeadsLoading = false;

  // Accept lead mutation
  const acceptLeadMutation = useMutation({
    mutationFn: async (leadId: string) => {
      await apiRequest('POST', `/api/freelancer/leads/${leadId}/accept`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Lead accepted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/freelancer/leads/available'] });
      queryClient.invalidateQueries({ queryKey: ['/api/freelancer/leads/accepted'] });
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
        return;
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to accept lead",
        variant: "destructive",
      });
    },
  });

  // Express interest mutation
  const expressInterestMutation = useMutation({
    mutationFn: async (leadId: string) => {
      await apiRequest('POST', `/api/freelancer/leads/${leadId}/interest`);
    },
    onSuccess: () => {
      toast({
        title: "Interest Expressed",
        description: "Your interest has been recorded!",
      });
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
        return;
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to express interest",
        variant: "destructive",
      });
    },
  });

  const handleAcceptLead = (leadId: string) => {
    acceptLeadMutation.mutate(leadId);
  };

  const handleExpressInterest = (leadId: string) => {
    expressInterestMutation.mutate(leadId);
  };

  const handleViewPlans = () => {
    setLocation('/plans');
  };

  // Check if user has active lead plan
  const hasActiveLeadPlan = subscriptions?.some(
    sub => sub.type === 'lead' && sub.status === 'active' && new Date(sub.endDate) > new Date()
  );

  // Reset new leads count when viewing available leads
  useEffect(() => {
    if (availableLeads) {
      setNewLeadsCount(0);
    }
  }, [availableLeads]);

  if (isLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  // If no profile exists, redirect to profile creation
  if (!profile) {
    setLocation('/freelancer/profile-setup');
    return null;
  }

  return (
    <div className="min-h-screen pb-20">
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
      <div className="bg-gradient-purple text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold" data-testid="text-freelancer-greeting">
              Welcome, {user?.firstName || 'Freelancer'}!
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-purple-100 text-sm">{profile.category?.name || 'Freelancer'}</span>
              <div className="flex items-center space-x-1">
                <span className="bg-green-500 w-2 h-2 rounded-full"></span>
                <span className="text-xs text-purple-100">Online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {profile.verificationStatus === 'approved' && (
              <Badge className="badge-verified">VERIFIED</Badge>
            )}
            <div className="relative">
              <i className="fas fa-bell text-lg"></i>
              {newLeadsCount > 0 && (
                <span className="notification-dot" data-testid="notification-dot">
                  {newLeadsCount}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white bg-opacity-20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold" data-testid="text-new-leads-count">
              {availableLeads?.length || 0}
            </p>
            <p className="text-xs text-purple-100">New Leads</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">₹0</p>
            <p className="text-xs text-purple-100">This Month</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{profile.rating}</p>
            <p className="text-xs text-purple-100">Rating</p>
          </div>
        </div>
      </div>

      {/* Subscription Status */}
      <div className="p-4">
        {hasActiveLeadPlan ? (
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Lead Plan Active</h3>
                <p className="text-sm text-green-100">
                  Expires on {new Date(
                    subscriptions?.find(s => s.type === 'lead')?.endDate || ''
                  ).toLocaleDateString()}
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

        {/* New Leads */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-on-surface">New Leads</h3>
            <Button variant="ghost" size="sm" className="text-primary text-sm font-medium">
              View All
            </Button>
          </div>

          {availableLeadsLoading ? (
            <div className="flex justify-center py-8">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {availableLeads && availableLeads.length > 0 ? (
                availableLeads.slice(0, 3).map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    canAccept={hasActiveLeadPlan}
                    onAccept={() => handleAcceptLead(lead.id)}
                    onExpressInterest={() => handleExpressInterest(lead.id)}
                    isAccepting={acceptLeadMutation.isPending}
                    isExpressingInterest={expressInterestMutation.isPending}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <i className="fas fa-inbox text-4xl mb-4"></i>
                  <p>No new leads available</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-shadow h-auto flex-col"
            data-testid="button-analytics"
          >
            <i className="fas fa-chart-line text-primary text-xl mb-2"></i>
            <p className="text-sm font-medium text-gray-700">Analytics</p>
          </Button>
          <Button
            variant="outline"
            className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-shadow h-auto flex-col"
            data-testid="button-export-data"
          >
            <i className="fas fa-download text-primary text-xl mb-2"></i>
            <p className="text-sm font-medium text-gray-700">Export Data</p>
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <Navigation currentPage="dashboard" userRole="freelancer" />
    </div>
  );
}
