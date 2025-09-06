import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/navigation";
import type { Subscription } from "@shared/schema";

export default function MyPlans() {
  const { user: firebaseUser, isAuthenticated, isLoading } = useFirebaseAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Get user role from localStorage
  const getUserRole = () => {
    return localStorage.getItem('selectedRole') || 'customer';
  };

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to view your plans.",
        variant: "destructive",
      });
      setLocation('/');
      return;
    }
  }, [isAuthenticated, isLoading, setLocation, toast]);

  // Check if user is freelancer, if not redirect to appropriate dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const userRole = getUserRole();
      if (userRole !== 'freelancer') {
        if (userRole === 'customer') {
          toast({
            title: "Freelancer Access Required",
            description: "Only freelancers can view subscription plans.",
            variant: "destructive",
          });
          setLocation('/customer');
        } else {
          toast({
            title: "Freelancer Access Required",
            description: "Please log in as a freelancer to view your plans.",
            variant: "destructive",
          });
          setLocation('/');
        }
        return;
      }
    }
  }, [isAuthenticated, isLoading, setLocation, toast]);

  // Fetch current subscriptions
  const { 
    data: subscriptions = [], 
    isLoading: subscriptionsLoading, 
    error: subscriptionsError,
    refetch: refetchSubscriptions
  } = useQuery<Subscription[]>({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/freelancer/subscriptions');
      return response.json();
    },
    retry: 2,
    enabled: isAuthenticated && getUserRole() === 'freelancer',
  });

  const handleGoBack = () => {
    setLocation('/freelancer');
  };

  const handleRetry = () => {
    refetchSubscriptions();
  };

  const handleRefresh = () => {
    refetchSubscriptions();
    toast({
      title: "Refreshing...",
      description: "Fetching latest subscription data.",
    });
  };

  const handleBuyNewPlans = () => {
    setLocation('/subscription-plans');
  };

  // Helper function to format date
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to get plan display name
  const getPlanDisplayName = (subscription: Subscription) => {
    switch (subscription.type) {
      case 'lead':
        return 'Lead Plan';
      case 'position':
        return `Position Plan #${subscription.position}`;
      case 'badge':
        return `${subscription.badgeType?.charAt(0).toUpperCase()}${subscription.badgeType?.slice(1)} Badge`;
      default:
        return 'Unknown Plan';
    }
  };

  // Helper function to get plan icon
  const getPlanIcon = (subscription: Subscription) => {
    switch (subscription.type) {
      case 'lead':
        return 'fas fa-bolt';
      case 'position':
        return 'fas fa-crown';
      case 'badge':
        return subscription.badgeType === 'verified' ? 'fas fa-check-circle' : 'fas fa-star';
      default:
        return 'fas fa-credit-card';
    }
  };

  // Helper function to get plan color
  const getPlanColor = (subscription: Subscription) => {
    switch (subscription.type) {
      case 'lead':
        return 'bg-gradient-purple';
      case 'position':
        return 'bg-warning/20';
      case 'badge':
        return subscription.badgeType === 'verified' ? 'bg-blue-500/20' : 'bg-warning/20';
      default:
        return 'bg-gray-500/20';
    }
  };

  // Helper function to get status badge
  const getStatusBadge = (subscription: Subscription) => {
    const isExpired = new Date(subscription.endDate) < new Date();
    const isActive = subscription.status === 'active' && !isExpired;
    
    if (isActive) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <i className="fas fa-check-circle mr-1"></i>
          Active
        </Badge>
      );
    } else if (isExpired) {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <i className="fas fa-times-circle mr-1"></i>
          Expired
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-100 text-gray-800 border-gray-200">
          <i className="fas fa-pause-circle mr-1"></i>
          Cancelled
        </Badge>
      );
    }
  };

  if (isLoading || subscriptionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="flex flex-col items-center space-y-4">
          <div className="spinner"></div>
          <p className="text-muted-foreground">Loading your plans...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's a subscription fetch error
  if (subscriptionsError) {
    return (
      <div className="min-h-screen bg-surface">
        {/* Header */}
        <div className="bg-gradient-purple text-white p-4 flex items-center shadow-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="mr-4 text-white hover:bg-white/10 transition-all duration-200"
          >
            <i className="fas fa-arrow-left text-lg"></i>
          </Button>
          <h2 className="text-lg font-semibold">My Plans</h2>
        </div>

        {/* Error Content */}
        <div className="p-6">
          <div className="text-center py-12">
            <div className="bg-card rounded-2xl p-8 shadow-xl border border-border">
              <i className="fas fa-exclamation-triangle text-5xl text-warning mb-6"></i>
              <h3 className="text-xl font-bold text-on-surface mb-3">Unable to Load Plans</h3>
              <p className="text-muted-foreground mb-6">There was an issue loading your subscription information.</p>
              <Button 
                onClick={handleRetry} 
                className="bg-gradient-purple text-white hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <i className="fas fa-refresh mr-2"></i>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-gradient-purple text-white p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="mr-4 text-white hover:bg-white/10 transition-all duration-200"
          >
            <i className="fas fa-arrow-left text-lg"></i>
          </Button>
          <h2 className="text-lg font-semibold">My Plans</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="text-white hover:bg-white/10 transition-all duration-200"
          disabled={subscriptionsLoading}
        >
          <i className={`fas fa-refresh text-lg ${subscriptionsLoading ? 'animate-spin' : ''}`}></i>
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 pb-24">
        {/* Page Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-on-surface mb-2">Your Subscription Plans</h1>
          <p className="text-muted-foreground">View all your purchased plans and their status</p>
        </div>

        {/* Plans List */}
        {subscriptions && subscriptions.length > 0 ? (
          <div className="space-y-4">
            {subscriptions.map((subscription) => (
              <Card key={subscription.id} className="bg-card rounded-2xl shadow-lg border border-border hover:shadow-xl transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 ${getPlanColor(subscription)} rounded-2xl flex items-center justify-center`}>
                        <i className={`${getPlanIcon(subscription)} text-white text-xl`}></i>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-on-surface">{getPlanDisplayName(subscription)}</h3>
                        <p className="text-muted-foreground text-sm">₹{subscription.amount}</p>
                      </div>
                    </div>
                    {getStatusBadge(subscription)}
                  </div>
                  
                                     <div className="grid grid-cols-2 gap-4">
                     <div className="bg-gray-50 rounded-xl p-3">
                       <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                       <p className="text-sm font-semibold text-gray-900">{formatDate(subscription.startDate)}</p>
                     </div>
                     <div className="bg-gray-50 rounded-xl p-3">
                       <p className="text-xs text-muted-foreground mb-1">Expiry Date</p>
                       <p className="text-sm font-semibold text-gray-900">{formatDate(subscription.endDate)}</p>
                     </div>
                   </div>

                  {/* Additional details for specific plan types */}
                  {subscription.type === 'position' && subscription.categoryId && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-yellow-50 rounded-lg p-3">
                          <p className="text-xs text-yellow-600 mb-1">Position</p>
                          <p className="text-sm font-semibold text-yellow-800">
                            {subscription.position === 1 ? '1st' : subscription.position === 2 ? '2nd' : '3rd'} Position
                          </p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs text-blue-600 mb-1">Area</p>
                          <p className="text-sm font-semibold text-blue-800">{subscription.area}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        This position plan gives you priority ranking in search results for this specific category and area.
                      </p>
                    </div>
                  )}
                  
                  {subscription.type === 'badge' && subscription.badgeType && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        {subscription.badgeType === 'verified' ? 'Basic verification badge' : 'Premium trust badge'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <div className="bg-card rounded-2xl p-8 shadow-xl border border-border">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-credit-card text-3xl text-gray-400"></i>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-3">No Plans Found</h3>
              <p className="text-muted-foreground mb-6">You haven't purchased any subscription plans yet.</p>
              <Button 
                onClick={handleBuyNewPlans}
                className="bg-gradient-purple text-white hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <i className="fas fa-plus mr-2"></i>
                Buy New Plans
              </Button>
            </div>
          </div>
        )}

        {/* Buy New Plans Button - Show when user has plans */}
        {subscriptions && subscriptions.length > 0 && (
          <div className="mt-8 text-center">
            <Button 
              onClick={handleBuyNewPlans}
              variant="outline"
              className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all duration-200"
            >
              <i className="fas fa-plus mr-2"></i>
              Buy More Plans
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <Navigation currentPage="plans" userRole="freelancer" />
    </div>
  );
}
