import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/navigation";
import RazorpayPayment from "@/components/razorpay-payment";
import PositionPlanModal from "@/components/position-plan-modal";
import type { Subscription } from "@shared/schema";

export default function SubscriptionPlans() {
  const { user: firebaseUser, isAuthenticated, isLoading } = useFirebaseAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPayment, setShowPayment] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    amount: number;
    description: string;
    subscriptionId?: string;
    position?: number;
    categoryId?: string;
    area?: string;
  } | null>(null);
  const [showPositionModal, setShowPositionModal] = useState(false);

  // Get user role from localStorage
  const getUserRole = () => {
    return localStorage.getItem('selectedRole') || 'customer';
  };

  // Redirect to landing if not authenticated with proper login message
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to access subscription plans.",
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
        // Redirect customers to customer dashboard instead of showing error
        if (userRole === 'customer') {
          toast({
            title: "Freelancer Access Required",
            description: "Only freelancers can access subscription plans.",
            variant: "destructive",
          });
          setLocation('/customer');
        } else {
          toast({
            title: "Freelancer Access Required",
            description: "Please log in as a freelancer to access subscription plans.",
            variant: "destructive",
          });
          setLocation('/');
        }
        return;
      }
    }
  }, [isAuthenticated, isLoading, setLocation, toast]);

  // Fetch current subscriptions with proper error handling
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

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async (subscriptionData: {
      type: 'lead' | 'position' | 'badge';
      amount: number;
      endDate: string;
      position?: number;
      badgeType?: 'verified' | 'trusted';
    }) => {
      const response = await apiRequest('POST', '/api/freelancer/subscriptions', subscriptionData);
      return { ...subscriptionData, ...response };
    },
    onSuccess: (data) => {
      // Show payment modal instead of direct success
      setPaymentDetails({
        amount: data.amount,
        description: `Subscription for ${data.type} plan`,
        subscriptionId: data.subscriptionId || data.id
      });
      setShowPayment(true);
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Authentication Error",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        setLocation('/');
        return;
      }
      
      // Handle duplicate subscription error with enhanced messaging
      if (error.status === 409 || error.message?.includes('already have an active') || error.message?.includes('already taken this plan')) {
        let errorMessage = error.message || "You already have an active subscription of this type. Please wait for it to expire before purchasing a new one.";
        let errorTitle = "Subscription Already Active";
        
        // Handle specific duplicate plan error types
        if (error.errorType === 'DUPLICATE_PLAN' || error.errorType === 'DUPLICATE_POSITION_PLAN' || error.errorType === 'DUPLICATE_BADGE_PLAN') {
          errorTitle = "Plan Already Purchased";
          errorMessage = "You have already taken this plan.";
          
          // Add expiry information if available
          if (error.details && error.details.expiryDate) {
            const expiryDate = new Date(error.details.expiryDate).toLocaleDateString();
            const daysRemaining = error.details.daysRemaining;
            errorMessage += ` Your current plan expires on ${expiryDate} (${daysRemaining} days remaining).`;
          }
        }
        
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
    },
  });

  const handleGoBack = () => {
    setLocation('/freelancer');
  };

  const handleRetry = () => {
    refetchSubscriptions();
  };

  const handleSubscribe = (type: 'lead' | 'position' | 'badge', amount: number, duration: 'monthly' | 'quarterly' | 'yearly' = 'monthly') => {
    const durationMonths = duration === 'monthly' ? 1 : duration === 'quarterly' ? 3 : 12;
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + durationMonths);

    subscribeMutation.mutate({
      type,
      amount,
      endDate: endDate.toISOString(),
    });
  };



  const handlePaymentSuccess = (paymentId: string) => {
    setShowPayment(false);
    
    // Invalidate all subscription-related queries to refresh the data
    queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['/api/freelancer/subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['/api/customer/available-freelancers'] });
    queryClient.invalidateQueries({ queryKey: ['/api/freelancer/leads/notifications'] });
    
    // Show success message
    toast({
      title: "✅ Payment Successful!",
      description: "Your plan has been activated! Redirecting to My Plans...",
    });
    
    // Redirect to My Plans page after a short delay
    setTimeout(() => {
      setLocation('/my-plans');
    }, 2000);
    
    setPaymentDetails(null);
    console.log('Payment success callback called with payment ID:', paymentId);
  };

  const handlePaymentFailure = (error: string) => {
    setShowPayment(false);
    setPaymentDetails(null);
    
    // Show error message
    toast({
      title: "❌ Payment Failed",
      description: error || "Please try again.",
      variant: "destructive",
    });
    
    console.log('Payment failure callback called with error:', error);
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setPaymentDetails(null);
  };

  const handlePositionSubscribe = () => {
    setShowPositionModal(true);
  };

  const handlePositionPlanSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    toast({
      title: "Success!",
      description: "Position plan purchased successfully!",
    });
  };

  const handlePositionPlanPaymentRequired = (paymentDetails: {
    amount: number;
    description: string;
    position: number;
    categoryId: string;
    area: string;
  }) => {
    setPaymentDetails({
      amount: paymentDetails.amount,
      description: paymentDetails.description,
      position: paymentDetails.position,
      categoryId: paymentDetails.categoryId,
      area: paymentDetails.area,
    });
    setShowPayment(true);
  };

  const handleBadgeSubscribe = (badgeType: 'verified' | 'trusted', amount: number) => {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 12); // Badge plans are yearly

    subscribeMutation.mutate({
      type: 'badge',
      amount,
      endDate: endDate.toISOString(),
      badgeType,
    });
  };

  const hasActiveSubscription = (type: 'lead' | 'position' | 'badge') => {
    if (!subscriptions || !Array.isArray(subscriptions)) return false;
    
    return subscriptions.some(
      (sub: Subscription) => sub.type === type && sub.status === 'active' && new Date(sub.endDate) > new Date()
    );
  };

  const hasActiveBadgeSubscription = (badgeType: 'verified' | 'trusted') => {
    if (!subscriptions || !Array.isArray(subscriptions)) return false;
    
    return subscriptions.some(
      (sub: Subscription) => 
        sub.type === 'badge' && 
        sub.badgeType === badgeType && 
        sub.status === 'active' && 
        new Date(sub.endDate) > new Date()
    );
  };

  if (isLoading || subscriptionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="flex flex-col items-center space-y-4">
          <div className="spinner"></div>
          <p className="text-muted-foreground">Loading plans...</p>
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
            data-testid="button-go-back"
          >
            <i className="fas fa-arrow-left text-lg"></i>
          </Button>
          <h2 className="text-lg font-semibold">Subscription Plans</h2>
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
      <div className="bg-gradient-purple text-white p-4 flex items-center shadow-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGoBack}
          className="mr-4 text-white hover:bg-white/10 transition-all duration-200"
          data-testid="button-go-back"
        >
          <i className="fas fa-arrow-left text-lg"></i>
        </Button>
        <h2 className="text-lg font-semibold">Subscription Plans</h2>
      </div>

      {/* Plans Content */}
      <div className="p-4 pb-24 space-y-6">
        {/* Page Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-on-surface mb-2">Choose Your Plan</h1>
          <p className="text-muted-foreground">Unlock your potential with our premium plans</p>
        </div>

        {/* Lead Plan - Enhanced Card */}
        <Card className="bg-card rounded-3xl shadow-2xl border-0 overflow-hidden hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 plan-card">
          <div className="relative pt-8">
            {/* Recommended Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
              <Badge className="bg-gradient-purple text-white px-4 py-2 rounded-full text-xs font-semibold shadow-lg">
                <i className="fas fa-star mr-1"></i>
                MOST POPULAR
              </Badge>
            </div>
            
            <div className="p-6 pt-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-purple rounded-2xl flex items-center justify-center">
                    <i className="fas fa-bolt text-white text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-on-surface">Lead Plan</h3>
                    <p className="text-muted-foreground text-sm">Accept unlimited leads</p>
                  </div>
                </div>
                {hasActiveSubscription('lead') && (
                  <Badge className="badge-verified animate-pulse">
                    <i className="fas fa-check mr-1"></i>
                    ACTIVE
                  </Badge>
                )}
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-success/20 rounded-full flex items-center justify-center">
                    <i className="fas fa-check text-success text-xs"></i>
                  </div>
                  <span className="text-sm text-on-surface">Accept leads instantly</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-success/20 rounded-full flex items-center justify-center">
                    <i className="fas fa-check text-success text-xs"></i>
                  </div>
                  <span className="text-sm text-on-surface">Get customer contact details</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-success/20 rounded-full flex items-center justify-center">
                    <i className="fas fa-check text-success text-xs"></i>
                  </div>
                  <span className="text-sm text-on-surface">Real-time notifications</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <button
                  onClick={() => handleSubscribe('lead', 299, 'monthly')}
                  disabled={subscribeMutation.isPending || hasActiveSubscription('lead')}
                  className="pricing-card-button text-center p-4 border border-border rounded-2xl bg-card hover:bg-accent/50 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 hover:shadow-lg"
                  data-testid="button-subscribe-lead-monthly"
                >
                  <p className="font-bold text-primary text-lg">₹299</p>
                  <p className="text-xs text-muted-foreground">Monthly</p>
                  <p className="text-xs text-primary mt-1 font-medium">
                    {hasActiveSubscription('lead') ? 'Already Active' : 'Click to Subscribe'}
                  </p>
                </button>
                <button
                  onClick={() => handleSubscribe('lead', 599, 'quarterly')}
                  disabled={subscribeMutation.isPending || hasActiveSubscription('lead')}
                  className="pricing-card-button text-center p-4 border-2 border-primary rounded-2xl bg-primary/10 relative cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 hover:shadow-lg"
                  data-testid="button-subscribe-lead-quarterly"
                >
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-primary text-white text-xs px-2 py-1 rounded-full shadow-lg">
                      BEST VALUE
                    </Badge>
                  </div>
                  <p className="font-bold text-primary text-lg mt-2">₹599</p>
                  <p className="text-xs text-muted-foreground">Quarterly</p>
                  <p className="text-xs text-primary mt-1 font-medium">
                    {hasActiveSubscription('lead') ? 'Already Active' : 'Click to Subscribe'}
                  </p>
                </button>
                <button
                  onClick={() => handleSubscribe('lead', 999, 'yearly')}
                  disabled={subscribeMutation.isPending || hasActiveSubscription('lead')}
                  className="pricing-card-button text-center p-4 border border-border rounded-2xl bg-card hover:bg-accent/50 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 hover:shadow-lg"
                  data-testid="button-subscribe-lead-yearly"
                >
                  <p className="font-bold text-primary text-lg">₹999</p>
                  <p className="text-xs text-muted-foreground">Yearly</p>
                  <p className="text-xs text-primary mt-1 font-medium">
                    {hasActiveSubscription('lead') ? 'Already Active' : 'Click to Subscribe'}
                  </p>
                </button>
              </div>

              {/* Loading indicator for the entire card */}
              {subscribeMutation.isPending && (
                <div className="flex justify-center mt-4">
                  <div className="spinner"></div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Position Plan - Enhanced Card */}
        <Card className="bg-card rounded-3xl shadow-2xl border-0 overflow-hidden hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 plan-card">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-warning/20 rounded-2xl flex items-center justify-center">
                  <i className="fas fa-crown text-warning text-xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-on-surface">Position Plan</h3>
                  <p className="text-muted-foreground text-sm">Top ranking in search results</p>
                </div>
              </div>
              {hasActiveSubscription('position') && (
                <Badge className="badge-trusted animate-pulse">
                  <i className="fas fa-check mr-1"></i>
                  ACTIVE
                </Badge>
              )}
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-success/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-check text-success text-xs"></i>
                </div>
                <span className="text-sm text-on-surface">Top 3 position guarantee</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-success/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-check text-success text-xs"></i>
                </div>
                <span className="text-sm text-on-surface">Category & area specific</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-success/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-check text-success text-xs"></i>
                </div>
                <span className="text-sm text-on-surface">Priority lead notifications</span>
              </div>
            </div>

            <div className="text-center">
              <Button
                onClick={handlePositionSubscribe}
                className="bg-gradient-purple text-white hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 btn-enhanced w-full py-3"
                data-testid="button-subscribe-position"
              >
                <i className="fas fa-crown mr-2"></i>
                Choose Position Plan
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Select your category, area, and preferred position
              </p>
            </div>
          </div>
        </Card>

        {/* Badge Plan - Enhanced Card */}
        <Card className="bg-card rounded-3xl shadow-2xl border-0 overflow-hidden hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 plan-card">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-success/20 rounded-2xl flex items-center justify-center">
                  <i className="fas fa-shield-alt text-success text-xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-on-surface">Badge Plan</h3>
                  <p className="text-muted-foreground text-sm">Build trust with verification</p>
                </div>
              </div>
              {hasActiveSubscription('badge') && (
                <Badge className="badge-verified animate-pulse">
                  <i className="fas fa-check mr-1"></i>
                  ACTIVE
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-6 border border-border rounded-2xl bg-card hover:bg-accent/50 transition-all duration-200 group">
                <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                  <i className="fas fa-check-circle text-blue-500 text-xl"></i>
                </div>
                <h4 className="font-semibold text-on-surface mb-2">Verified</h4>
                <p className="text-xs text-muted-foreground mb-4">Basic verification badge</p>
                <p className="text-primary font-bold text-lg mb-4">₹299</p>
                <Button
                  onClick={() => handleBadgeSubscribe('verified', 299)}
                  disabled={subscribeMutation.isPending || hasActiveBadgeSubscription('verified')}
                  size="sm"
                  className="w-full bg-gradient-purple text-white hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 btn-enhanced disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-subscribe-badge-verified"
                >
                  {subscribeMutation.isPending ? (
                    <div className="spinner"></div>
                  ) : hasActiveBadgeSubscription('verified') ? (
                    'Already Active'
                  ) : (
                    'Subscribe'
                  )}
                </Button>
              </div>
              <div className="text-center p-6 border border-border rounded-2xl bg-card hover:bg-accent/50 transition-all duration-200 group">
                <div className="w-12 h-12 bg-warning/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                  <i className="fas fa-star text-warning text-xl"></i>
                </div>
                <h4 className="font-semibold text-on-surface mb-2">Trusted</h4>
                <p className="text-xs text-muted-foreground mb-4">Premium trust badge</p>
                <p className="text-primary font-bold text-lg mb-4">₹999</p>
                <Button
                  onClick={() => handleBadgeSubscribe('trusted', 999)}
                  disabled={subscribeMutation.isPending || hasActiveBadgeSubscription('trusted')}
                  size="sm"
                  className="w-full bg-gradient-purple text-white hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 btn-enhanced disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-subscribe-badge-trusted"
                >
                  {subscribeMutation.isPending ? (
                    <div className="spinner"></div>
                  ) : hasActiveBadgeSubscription('trusted') ? (
                    'Already Active'
                  ) : (
                    'Subscribe'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>


      </div>

      {/* Payment Modal */}
      {showPayment && paymentDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-3xl max-w-md w-full shadow-2xl border border-border modal-enter">
            <RazorpayPayment
              amount={paymentDetails.amount}
              description={paymentDetails.description}
              subscriptionId={paymentDetails.subscriptionId}
              paymentType={paymentDetails.position ? 'position' : 'lead'}
              positionPlanDetails={paymentDetails.position ? {
                position: paymentDetails.position,
                categoryId: paymentDetails.categoryId!,
                area: paymentDetails.area!
              } : undefined}
              onSuccess={handlePaymentSuccess}
              onFailure={handlePaymentFailure}
              onCancel={handlePaymentCancel}
            />
          </div>
        </div>
      )}

      {/* Position Plan Modal */}
      <PositionPlanModal
        isOpen={showPositionModal}
        onClose={() => setShowPositionModal(false)}
        onSuccess={handlePositionPlanSuccess}
        onPaymentRequired={handlePositionPlanPaymentRequired}
      />

      {/* Bottom Navigation */}
      <Navigation currentPage="plans" userRole="freelancer" />
    </div>
  );
}
