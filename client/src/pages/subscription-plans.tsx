import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Subscription } from "@shared/schema";

export default function SubscriptionPlans() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  // Fetch current subscriptions
  const { data: subscriptions, isLoading: subscriptionsLoading } = useQuery<Subscription[]>({
    queryKey: ['/api/freelancer/subscriptions'],
    retry: false,
    enabled: isAuthenticated,
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
      await apiRequest('POST', '/api/freelancer/subscriptions', subscriptionData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subscription activated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/freelancer/subscriptions'] });
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
        description: error.message || "Failed to subscribe",
        variant: "destructive",
      });
    },
  });

  const handleGoBack = () => {
    setLocation('/freelancer');
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

  const handlePositionSubscribe = (position: number, amount: number) => {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // Position plans are monthly

    subscribeMutation.mutate({
      type: 'position',
      amount,
      endDate: endDate.toISOString(),
      position,
    });
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

  const hasActiveSubscription = (type: string) => {
    return subscriptions?.some(
      sub => sub.type === type && sub.status === 'active' && new Date(sub.endDate) > new Date()
    );
  };

  if (isLoading || subscriptionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
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
      <div className="bg-gradient-purple text-white p-4 flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGoBack}
          className="mr-4 text-white hover:bg-white/10"
          data-testid="button-go-back"
        >
          <i className="fas fa-arrow-left text-lg"></i>
        </Button>
        <h2 className="text-lg font-semibold">Subscription Plans</h2>
      </div>

      {/* Plans Content */}
      <div className="p-4 pb-20">
        {/* Lead Plan */}
        <Card className="bg-white rounded-2xl shadow-lg p-6 mb-4 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-on-surface">Lead Plan</h3>
              <p className="text-gray-600 text-sm">Accept unlimited leads</p>
            </div>
            <div className="flex items-center space-x-2">
              <i className="fas fa-bolt text-primary text-2xl"></i>
              {hasActiveSubscription('lead') && (
                <Badge className="badge-verified">ACTIVE</Badge>
              )}
            </div>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-3">
              <i className="fas fa-check text-success"></i>
              <span className="text-sm text-gray-700">Accept leads instantly</span>
            </div>
            <div className="flex items-center space-x-3">
              <i className="fas fa-check text-success"></i>
              <span className="text-sm text-gray-700">Get customer contact details</span>
            </div>
            <div className="flex items-center space-x-3">
              <i className="fas fa-check text-success"></i>
              <span className="text-sm text-gray-700">Real-time notifications</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-3 border border-gray-200 rounded-xl">
              <p className="font-bold text-primary">₹299</p>
              <p className="text-xs text-gray-500">Monthly</p>
            </div>
            <div className="text-center p-3 border-2 border-primary rounded-xl bg-primary bg-opacity-10">
              <p className="font-bold text-primary">₹599</p>
              <p className="text-xs text-gray-500">Quarterly</p>
            </div>
            <div className="text-center p-3 border border-gray-200 rounded-xl">
              <p className="font-bold text-primary">₹999</p>
              <p className="text-xs text-gray-500">Yearly</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => handleSubscribe('lead', 299, 'monthly')}
              disabled={subscribeMutation.isPending || hasActiveSubscription('lead')}
              variant="outline"
              size="sm"
              data-testid="button-subscribe-lead-monthly"
            >
              {subscribeMutation.isPending ? <div className="spinner"></div> : 'Monthly'}
            </Button>
            <Button
              onClick={() => handleSubscribe('lead', 599, 'quarterly')}
              disabled={subscribeMutation.isPending || hasActiveSubscription('lead')}
              className="bg-gradient-purple text-white"
              size="sm"
              data-testid="button-subscribe-lead-quarterly"
            >
              {subscribeMutation.isPending ? <div className="spinner"></div> : 'Quarterly'}
            </Button>
            <Button
              onClick={() => handleSubscribe('lead', 999, 'yearly')}
              disabled={subscribeMutation.isPending || hasActiveSubscription('lead')}
              variant="outline"
              size="sm"
              data-testid="button-subscribe-lead-yearly"
            >
              {subscribeMutation.isPending ? <div className="spinner"></div> : 'Yearly'}
            </Button>
          </div>
        </Card>

        {/* Position Plan */}
        <Card className="bg-white rounded-2xl shadow-lg p-6 mb-4 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-on-surface">Position Plan</h3>
              <p className="text-gray-600 text-sm">Top ranking in search results</p>
            </div>
            <div className="flex items-center space-x-2">
              <i className="fas fa-crown text-warning text-2xl"></i>
              {hasActiveSubscription('position') && (
                <Badge className="badge-trusted">ACTIVE</Badge>
              )}
            </div>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-3">
              <i className="fas fa-check text-success"></i>
              <span className="text-sm text-gray-700">Top 3 position guarantee</span>
            </div>
            <div className="flex items-center space-x-3">
              <i className="fas fa-check text-success"></i>
              <span className="text-sm text-gray-700">Category & area specific</span>
            </div>
            <div className="flex items-center space-x-3">
              <i className="fas fa-check text-success"></i>
              <span className="text-sm text-gray-700">Priority lead notifications</span>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center p-3 border border-gray-200 rounded-xl">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">#1 Position</span>
                <Badge className="bg-yellow-500 text-white text-xs">BEST</Badge>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-primary">₹1,999</span>
                <Button
                  onClick={() => handlePositionSubscribe(1, 1999)}
                  disabled={subscribeMutation.isPending}
                  size="sm"
                  data-testid="button-subscribe-position-1"
                >
                  {subscribeMutation.isPending ? <div className="spinner"></div> : 'Subscribe'}
                </Button>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 border border-gray-200 rounded-xl">
              <span className="text-sm font-medium">#2 Position</span>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-primary">₹999</span>
                <Button
                  onClick={() => handlePositionSubscribe(2, 999)}
                  disabled={subscribeMutation.isPending}
                  size="sm"
                  data-testid="button-subscribe-position-2"
                >
                  {subscribeMutation.isPending ? <div className="spinner"></div> : 'Subscribe'}
                </Button>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 border border-gray-200 rounded-xl">
              <span className="text-sm font-medium">#3 Position</span>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-primary">₹699</span>
                <Button
                  onClick={() => handlePositionSubscribe(3, 699)}
                  disabled={subscribeMutation.isPending}
                  size="sm"
                  data-testid="button-subscribe-position-3"
                >
                  {subscribeMutation.isPending ? <div className="spinner"></div> : 'Subscribe'}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Badge Plan */}
        <Card className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-on-surface">Badge Plan</h3>
              <p className="text-gray-600 text-sm">Build trust with verification</p>
            </div>
            <div className="flex items-center space-x-2">
              <i className="fas fa-shield-alt text-success text-2xl"></i>
              {hasActiveSubscription('badge') && (
                <Badge className="badge-verified">ACTIVE</Badge>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-4 border border-gray-200 rounded-xl">
              <i className="fas fa-check-circle text-blue-500 text-2xl mb-2"></i>
              <h4 className="font-semibold text-sm">Verified</h4>
              <p className="text-xs text-gray-500 mb-2">Basic verification badge</p>
              <p className="text-primary font-bold mt-2">₹299</p>
              <Button
                onClick={() => handleBadgeSubscribe('verified', 299)}
                disabled={subscribeMutation.isPending}
                size="sm"
                className="w-full mt-2"
                data-testid="button-subscribe-badge-verified"
              >
                {subscribeMutation.isPending ? <div className="spinner"></div> : 'Subscribe'}
              </Button>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-xl">
              <i className="fas fa-star text-warning text-2xl mb-2"></i>
              <h4 className="font-semibold text-sm">Trusted</h4>
              <p className="text-xs text-gray-500 mb-2">Premium trust badge</p>
              <p className="text-primary font-bold mt-2">₹999</p>
              <Button
                onClick={() => handleBadgeSubscribe('trusted', 999)}
                disabled={subscribeMutation.isPending}
                size="sm"
                className="w-full mt-2"
                data-testid="button-subscribe-badge-trusted"
              >
                {subscribeMutation.isPending ? <div className="spinner"></div> : 'Subscribe'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Current Subscriptions */}
        {subscriptions && subscriptions.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-on-surface mb-3">Your Active Subscriptions</h3>
            <div className="space-y-2">
              {subscriptions.map((subscription) => (
                <Card key={subscription.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm capitalize">
                        {subscription.type} Plan
                        {subscription.position && ` - Position #${subscription.position}`}
                        {subscription.badgeType && ` - ${subscription.badgeType}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        Expires: {new Date(subscription.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge 
                      className={subscription.status === 'active' ? 'badge-verified' : 'bg-gray-500'}
                    >
                      {subscription.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
