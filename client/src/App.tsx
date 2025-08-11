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

function Router() {
  // Use Firebase auth instead of Replit auth for Gmail login
  const { isAuthenticated: firebaseAuth, isLoading: firebaseLoading } = useFirebaseAuth();
  const { isAuthenticated, isLoading, user } = useAuth();
  
  // Prioritize Firebase auth for login state
  const isUserAuthenticated = firebaseAuth || isAuthenticated;
  const isUserLoading = firebaseLoading || isLoading;

  if (isUserLoading) {
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
        {!isUserAuthenticated ? (
          <Route path="/" component={Landing} />
        ) : (
          <>
            <Route path="/" component={Home} />
            <Route path="/customer" component={CustomerDashboard} />
            <Route path="/freelancer" component={FreelancerDashboard} />
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/post-job" component={JobPosting} />
            <Route path="/plans" component={SubscriptionPlans} />
            <Route path="/profile" component={Profile} />
            <Route path="/customer/profile" component={Profile} />
            <Route path="/freelancer/profile" component={Profile} />
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
