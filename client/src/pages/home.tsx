import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

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

  const handleRoleSelection = async (role: 'customer' | 'freelancer' | 'admin') => {
    try {
      await apiRequest('POST', '/api/auth/select-role', { role });
      
      // Navigate to appropriate dashboard based on role
      switch (role) {
        case 'customer':
          setLocation('/customer');
          break;
        case 'freelancer':
          setLocation('/freelancer');
          break;
        case 'admin':
          setLocation('/admin');
          break;
      }
    } catch (error: any) {
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
        description: "Failed to select role. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  // If user already has a role, redirect to appropriate dashboard
  if (user?.role && user.role !== 'customer') {
    switch (user.role) {
      case 'freelancer':
        setLocation('/freelancer');
        break;
      case 'admin':
        setLocation('/admin');
        break;
      default:
        setLocation('/customer');
        break;
    }
    return null;
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

      {/* Hero Section */}
      <div className="bg-gradient-purple text-white p-6 pb-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-handshake text-2xl"></i>
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome back!</h1>
          <p className="text-purple-100 text-sm">
            Hello, {user?.firstName || user?.email || 'User'}
          </p>
        </div>
      </div>

      {/* Role Selection Cards */}
      <div className="p-6 -mt-4">
        <h2 className="text-lg font-semibold text-on-surface mb-4">Choose your role</h2>
        
        <div className="space-y-4">
          <Card 
            className="bg-white rounded-2xl shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-shadow card-hover"
            onClick={() => handleRoleSelection('customer')}
            data-testid="card-customer-role"
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <i className="fas fa-user text-blue-600 text-xl"></i>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-on-surface">I'm a Customer</h3>
                  <p className="text-gray-600 text-sm">Find local service providers</p>
                </div>
                <i className="fas fa-chevron-right text-gray-400"></i>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-white rounded-2xl shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-shadow card-hover"
            onClick={() => handleRoleSelection('freelancer')}
            data-testid="card-freelancer-role"
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <i className="fas fa-hammer text-green-600 text-xl"></i>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-on-surface">I'm a Freelancer</h3>
                  <p className="text-gray-600 text-sm">Offer your services locally</p>
                </div>
                <i className="fas fa-chevron-right text-gray-400"></i>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-white rounded-2xl shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-shadow card-hover"
            onClick={() => handleRoleSelection('admin')}
            data-testid="card-admin-role"
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <i className="fas fa-cog text-primary text-xl"></i>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-on-surface">Admin Portal</h3>
                  <p className="text-gray-600 text-sm">Manage platform operations</p>
                </div>
                <i className="fas fa-chevron-right text-gray-400"></i>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="w-full"
            data-testid="button-logout"
          >
            <i className="fas fa-sign-out-alt mr-2"></i>
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
