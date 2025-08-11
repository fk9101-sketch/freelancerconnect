import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

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

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getUserRole = () => {
    if (user && 'role' in user && user.role) {
      return user.role;
    }
    return 'customer';
  };

  const getUserName = () => {
    if (user && 'firstName' in user && user.firstName) {
      return user.firstName;
    }
    if (user && 'email' in user && user.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const getUserEmail = () => {
    if (user && 'email' in user && user.email) {
      return user.email;
    }
    return '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  const goBack = () => {
    const role = getUserRole();
    switch (role) {
      case 'freelancer':
        setLocation('/freelancer');
        break;
      case 'admin':
        setLocation('/admin');
        break;
      case 'customer':
      default:
        setLocation('/customer');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
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
          <button 
            onClick={() => setLocation('/')}
            className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center"
            data-testid="button-back"
          >
            <i className="fas fa-arrow-left text-lg"></i>
          </button>
          <h1 className="text-xl font-semibold">Profile</h1>
          <div className="w-10 h-10"></div> {/* Spacer for alignment */}
        </div>
      </div>

      {/* Profile Content */}
      <div className="p-4 -mt-4">
        <Card className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6">
          <CardContent className="p-6">
            {/* Profile Picture */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-20 h-20 bg-gradient-purple rounded-full flex items-center justify-center">
                {user && 'profileImageUrl' in user && user.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt="Profile" 
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <i className="fas fa-user text-white text-2xl"></i>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-on-surface" data-testid="text-user-name">
                  {getUserName()}
                </h2>
                <p className="text-gray-600 capitalize" data-testid="text-user-role">
                  {getUserRole()}
                </p>
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  data-testid="button-edit-profile"
                >
                  <i className="fas fa-edit mr-2"></i>
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
              </div>
            </div>

            {/* Profile Details */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={getUserEmail()}
                  disabled={!isEditing}
                  className="mt-1"
                  data-testid="input-email"
                />
              </div>

              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={getUserName()}
                  disabled={!isEditing}
                  className="mt-1"
                  data-testid="input-first-name"
                />
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  type="text"
                  value={getUserRole()}
                  disabled
                  className="mt-1 capitalize"
                  data-testid="input-role"
                />
              </div>
            </div>

            {isEditing && (
              <div className="mt-6 flex space-x-3">
                <Button 
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  data-testid="button-save-profile"
                >
                  <i className="fas fa-save mr-2"></i>
                  Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold text-on-surface mb-4">Account Settings</h3>
            
            <div className="space-y-3">
              <Button
                variant="ghost"
                className="w-full justify-start text-left p-3 h-auto"
                onClick={() => setLocation('/plans')}
                data-testid="button-subscription-plans"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-crown text-blue-600"></i>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Subscription Plans</div>
                    <div className="text-sm text-gray-600">Manage your subscription</div>
                  </div>
                  <i className="fas fa-chevron-right text-gray-400"></i>
                </div>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start text-left p-3 h-auto"
                data-testid="button-notifications"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-bell text-green-600"></i>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Notifications</div>
                    <div className="text-sm text-gray-600">Manage notification preferences</div>
                  </div>
                  <i className="fas fa-chevron-right text-gray-400"></i>
                </div>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start text-left p-3 h-auto"
                data-testid="button-privacy"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-shield-alt text-purple-600"></i>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Privacy & Security</div>
                    <div className="text-sm text-gray-600">Manage privacy settings</div>
                  </div>
                  <i className="fas fa-chevron-right text-gray-400"></i>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <CardContent className="p-6">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-left p-3 h-auto text-red-600 hover:bg-red-50"
              data-testid="button-logout"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-sign-out-alt text-red-600"></i>
                </div>
                <div className="flex-1">
                  <div className="font-medium">Logout</div>
                  <div className="text-sm text-gray-600">Sign out of your account</div>
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200">
        <div className="flex items-center justify-around py-2">
          <button 
            onClick={() => setLocation('/')}
            className="flex flex-col items-center space-y-1 py-2 px-4"
            data-testid="nav-home"
          >
            <i className="fas fa-home text-gray-400 text-xl"></i>
            <span className="text-xs text-gray-400">Home</span>
          </button>
          
          <button 
            className="flex flex-col items-center space-y-1 py-2 px-4"
            data-testid="nav-search"
          >
            <i className="fas fa-search text-gray-400 text-xl"></i>
            <span className="text-xs text-gray-400">Search</span>
          </button>
          
          <button 
            className="flex flex-col items-center space-y-1 py-2 px-4"
            data-testid="nav-requests"
          >
            <i className="fas fa-list text-gray-400 text-xl"></i>
            <span className="text-xs text-gray-400">Requests</span>
          </button>
          
          <button 
            className="flex flex-col items-center space-y-1 py-2 px-4"
            data-testid="nav-profile"
          >
            <i className="fas fa-user text-purple-600 text-xl"></i>
            <span className="text-xs text-purple-600">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}