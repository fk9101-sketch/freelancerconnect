import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { hasAdminAccess } from "@/lib/roleUtils";
import { useEffect } from "react";
import React from "react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import CustomerDashboard from "@/pages/customer-dashboard";
import FreelancerDashboard from "@/pages/freelancer-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import JobPosting from "@/pages/job-posting";
import SubscriptionPlans from "@/pages/subscription-plans";
import MyPlans from "@/pages/my-plans";
import Profile from "@/pages/profile";
import FreelancerProfile from "@/pages/freelancer-profile";
import FreelancerMessages from "@/pages/freelancer-messages";
import FreelancerLeads from "@/pages/freelancer-leads";
import PhoneAuth from "@/pages/phone-auth";
import CustomerSearch from "@/pages/customer-search";
import CustomerRequests from "@/pages/customer-requests";
import OurServices from "@/pages/our-services";
import RewardsOffers from "@/pages/rewards-offers";
import PaymentSuccess from "@/pages/payment-success";
import PaymentFailed from "@/pages/payment-failed";
import TestInquiry from "@/pages/test-inquiry";
import FreelancerReviews from "@/pages/freelancer-reviews";

// Protected component for admin routes - only admins can access
function ProtectedAdminRoute({ component: Component, fallbackRoute = "/customer" }: { component: React.ComponentType, fallbackRoute?: string }) {
  const { userProfile } = useUserProfile();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (!hasAdminAccess(userProfile)) {
      setLocation(fallbackRoute);
    }
  }, [userProfile, setLocation, fallbackRoute]);
  
  if (!hasAdminAccess(userProfile)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <button 
            onClick={() => setLocation(fallbackRoute)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return <Component />;
}

// Protected component for subscription plans - only freelancers can access
function ProtectedSubscriptionPlans() {
  const { isAuthenticated, isLoading } = useFirebaseAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
      return;
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  // Only check authentication, let the SubscriptionPlans component handle role checking
  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return <SubscriptionPlans />;
}

// Role-based route protection component
function ProtectedRoute({ 
  component: Component, 
  allowedRoles, 
  fallbackRoute 
}: { 
  component: React.ComponentType; 
  allowedRoles: string[]; 
  fallbackRoute: string;
}) {
  const { isAuthenticated, isLoading } = useFirebaseAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        setLocation('/');
        return;
      }

      const selectedRole = localStorage.getItem('selectedRole');
      if (!selectedRole || !allowedRoles.includes(selectedRole)) {
        // Redirect to appropriate dashboard based on role
        if (selectedRole === 'freelancer') {
          setLocation('/freelancer');
        } else if (selectedRole === 'admin') {
          setLocation('/admin');
        } else if (selectedRole === 'customer') {
          setLocation('/customer');
        } else {
          setLocation(fallbackRoute);
        }
        return;
      }
    }
  }, [isAuthenticated, isLoading, setLocation, allowedRoles, fallbackRoute]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  // Only render if user is authenticated and has the correct role
  const selectedRole = localStorage.getItem('selectedRole');
  if (!isAuthenticated || !selectedRole || !allowedRoles.includes(selectedRole)) {
    return null; // Will redirect in useEffect
  }

  return <Component />;
}

function Router() {
  const { user: firebaseUser, isLoading: firebaseLoading, isAuthenticated: firebaseAuth, error: authError } = useFirebaseAuth();

  console.log('Router auth state:', {
    firebaseUser: firebaseUser ? 'User exists' : 'No user',
    firebaseLoading,
    firebaseAuth,
    authError: authError ? 'Error exists' : 'No error'
  });

  if (firebaseLoading) {
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center min-h-screen">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (authError) {
    console.error('Firebase auth error:', authError);
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-500 mb-4">Authentication Error</h2>
            <p className="text-muted-foreground mb-4">
              There was an issue with authentication. Please refresh the page.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-primary text-white px-4 py-2 rounded-lg"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      <Switch>
        {!firebaseAuth ? (
          <>
            <Route path="/" component={Landing} />
            <Route path="/phone-auth" component={PhoneAuth} />
            <Route component={Landing} />
          </>
        ) : (
          <>
            <Route path="/" component={Home} />
            <Route path="/customer" component={() => <ProtectedRoute component={CustomerDashboard} allowedRoles={['customer']} fallbackRoute="/customer" />} />
            <Route path="/customer-dashboard" component={() => <ProtectedRoute component={CustomerDashboard} allowedRoles={['customer']} fallbackRoute="/customer" />} />
            <Route path="/customer/search" component={() => <ProtectedRoute component={CustomerSearch} allowedRoles={['customer']} fallbackRoute="/customer" />} />
            <Route path="/customer/requests" component={() => <ProtectedRoute component={CustomerRequests} allowedRoles={['customer']} fallbackRoute="/customer" />} />
            <Route path="/freelancer/reviews" component={() => <ProtectedRoute component={FreelancerReviews} allowedRoles={['customer']} fallbackRoute="/customer" />} />
            <Route path="/our-services" component={() => <ProtectedRoute component={OurServices} allowedRoles={['customer']} fallbackRoute="/customer" />} />
            <Route path="/rewards-offers" component={() => <ProtectedRoute component={RewardsOffers} allowedRoles={['customer']} fallbackRoute="/customer" />} />
            <Route path="/freelancer" component={() => <ProtectedRoute component={FreelancerDashboard} allowedRoles={['freelancer']} fallbackRoute="/freelancer" />} />
            <Route path="/freelancer/leads" component={() => <ProtectedRoute component={FreelancerLeads} allowedRoles={['freelancer']} fallbackRoute="/freelancer" />} />
            <Route path="/freelancer/messages" component={() => <ProtectedRoute component={FreelancerMessages} allowedRoles={['freelancer']} fallbackRoute="/freelancer" />} />
            <Route path="/admin" component={() => <ProtectedAdminRoute component={AdminDashboard} fallbackRoute="/customer" />} />
            <Route path="/post-job" component={() => <ProtectedRoute component={JobPosting} allowedRoles={['customer']} fallbackRoute="/customer" />} />
            <Route path="/plans" component={ProtectedSubscriptionPlans} />
            <Route path="/my-plans" component={() => <ProtectedRoute component={MyPlans} allowedRoles={['freelancer']} fallbackRoute="/freelancer" />} />
            <Route path="/payment-success" component={PaymentSuccess} />
            <Route path="/payment-failed" component={PaymentFailed} />
            <Route path="/profile" component={Profile} />
            <Route path="/customer/profile" component={() => <ProtectedRoute component={Profile} allowedRoles={['customer']} fallbackRoute="/customer" />} />
            <Route path="/freelancer/profile" component={() => <ProtectedRoute component={FreelancerProfile} allowedRoles={['freelancer']} fallbackRoute="/freelancer" />} />
            <Route path="/admin/profile" component={() => <ProtectedAdminRoute component={Profile} fallbackRoute="/customer" />} />
            <Route path="/admin/*" component={() => <ProtectedAdminRoute component={AdminDashboard} fallbackRoute="/customer" />} />
            <Route path="/test-inquiry" component={TestInquiry} />
            <Route component={Home} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <ErrorBoundary>
          <Router />
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mobile-container">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="text-center">
              <h2 className="text-xl font-bold text-red-500 mb-4">Something went wrong</h2>
              <p className="text-muted-foreground mb-4">
                The application encountered an error. Please refresh the page.
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-primary text-white px-4 py-2 rounded-lg"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default App;
