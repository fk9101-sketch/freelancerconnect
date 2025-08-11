import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import CustomerDashboard from "@/pages/customer-dashboard";
import FreelancerDashboard from "@/pages/freelancer-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import JobPosting from "@/pages/job-posting";
import SubscriptionPlans from "@/pages/subscription-plans";
import Profile from "@/pages/profile";
import FreelancerProfile from "@/pages/freelancer-profile";
import PhoneAuth from "@/pages/phone-auth";
import CustomerSearch from "@/pages/customer-search";
import CustomerRequests from "@/pages/customer-requests";

function Router() {
  // Use Firebase auth for authentication state
  const { user: firebaseUser, isLoading: firebaseLoading, isAuthenticated: firebaseAuth } = useFirebaseAuth();

  if (firebaseLoading) {
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center min-h-screen">
          <div className="spinner"></div>
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
          </>
        ) : (
          <>
            <Route path="/" component={Home} />
            <Route path="/customer" component={CustomerDashboard} />
            <Route path="/customer/search" component={CustomerSearch} />
            <Route path="/customer/requests" component={CustomerRequests} />
            <Route path="/freelancer" component={FreelancerDashboard} />
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/post-job" component={JobPosting} />
            <Route path="/plans" component={SubscriptionPlans} />
            <Route path="/profile" component={Profile} />
            <Route path="/customer/profile" component={Profile} />
            <Route path="/freelancer/profile" component={FreelancerProfile} />
            <Route path="/admin/profile" component={Profile} />
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
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
