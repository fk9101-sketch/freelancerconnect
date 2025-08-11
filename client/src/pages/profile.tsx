import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { signOutUser } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";

export default function Profile() {
  const { user: firebaseUser, isAuthenticated, isLoading } = useFirebaseAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
      return;
    }
  }, [isAuthenticated, isLoading, setLocation]);

  const handleLogout = async () => {
    try {
      await signOutUser();
      localStorage.removeItem('selectedRole');
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      setLocation('/');
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getUserRole = () => {
    return localStorage.getItem('selectedRole') || 'customer';
  };

  const getUserName = () => {
    if (firebaseUser?.displayName) {
      return firebaseUser.displayName;
    }
    if (firebaseUser?.email) {
      return firebaseUser.email.split('@')[0];
    }
    return 'User';
  };

  const getUserEmail = () => {
    return firebaseUser?.email || '';
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
    <div className="min-h-screen bg-background pb-20">
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
      <div className="bg-gradient-purple text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={goBack}
            className="w-12 h-12 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center hover:bg-white/30 transition-colors"
            data-testid="button-back"
          >
            <i className="fas fa-arrow-left text-lg"></i>
          </button>
          <h1 className="text-xl font-bold">Profile</h1>
          <div className="w-12 h-12"></div> {/* Spacer for alignment */}
        </div>
      </div>

      {/* Profile Content */}
      <div className="p-6 -mt-4">
        <Card className="bg-card rounded-2xl shadow-xl border border-border mb-6">
          <CardContent className="p-8">
            {/* Profile Picture */}
            <div className="flex items-center space-x-6 mb-8">
              <div className="w-24 h-24 bg-gradient-purple rounded-2xl flex items-center justify-center">
                {firebaseUser?.photoURL ? (
                  <img 
                    src={firebaseUser.photoURL} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-2xl object-cover"
                  />
                ) : (
                  <i className="fas fa-user text-white text-3xl"></i>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-card-foreground mb-1" data-testid="text-user-name">
                  {getUserName()}
                </h2>
                <p className="text-muted-foreground capitalize mb-3" data-testid="text-user-role">
                  {getUserRole()}
                </p>
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant="outline"
                  size="sm"
                  className="border-border hover:bg-card/50"
                  data-testid="button-edit-profile"
                >
                  <i className="fas fa-edit mr-2"></i>
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
              </div>
            </div>

            {/* Profile Details */}
            <div className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-sm font-semibold text-card-foreground mb-2 block">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={getUserEmail()}
                  disabled={!isEditing}
                  className="bg-background border-border text-foreground rounded-2xl"
                  data-testid="input-email"
                />
              </div>

              <div>
                <Label htmlFor="firstName" className="text-sm font-semibold text-card-foreground mb-2 block">Full Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={getUserName()}
                  disabled={!isEditing}
                  className="bg-background border-border text-foreground rounded-2xl"
                  data-testid="input-first-name"
                />
              </div>

              <div>
                <Label htmlFor="role" className="text-sm font-semibold text-card-foreground mb-2 block">Role</Label>
                <Input
                  id="role"
                  type="text"
                  value={getUserRole()}
                  disabled
                  className="bg-muted border-border text-muted-foreground rounded-2xl capitalize"
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
        <Card className="bg-card rounded-2xl shadow-xl border border-border mb-6">
          <CardContent className="p-8">
            <h3 className="font-bold text-card-foreground mb-6">Account Settings</h3>
            
            <div className="space-y-4">
              <Button
                variant="ghost"
                className="w-full justify-start text-left p-4 h-auto hover:bg-card/50 rounded-2xl"
                onClick={() => setLocation('/plans')}
                data-testid="button-subscription-plans"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                    <i className="fas fa-crown text-blue-400"></i>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-card-foreground">Subscription Plans</div>
                    <div className="text-sm text-muted-foreground">Manage your subscription</div>
                  </div>
                  <i className="fas fa-chevron-right text-muted-foreground"></i>
                </div>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start text-left p-4 h-auto hover:bg-card/50 rounded-2xl"
                data-testid="button-notifications"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center">
                    <i className="fas fa-bell text-green-400"></i>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-card-foreground">Notifications</div>
                    <div className="text-sm text-muted-foreground">Manage notification preferences</div>
                  </div>
                  <i className="fas fa-chevron-right text-muted-foreground"></i>
                </div>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start text-left p-4 h-auto hover:bg-card/50 rounded-2xl"
                data-testid="button-privacy"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center">
                    <i className="fas fa-shield-alt text-purple-400"></i>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-card-foreground">Privacy & Security</div>
                    <div className="text-sm text-muted-foreground">Manage privacy settings</div>
                  </div>
                  <i className="fas fa-chevron-right text-muted-foreground"></i>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card className="bg-card rounded-2xl shadow-xl border border-border">
          <CardContent className="p-8">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-left p-4 h-auto text-red-400 hover:bg-red-500/20 rounded-2xl"
              data-testid="button-logout"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center">
                  <i className="fas fa-sign-out-alt text-red-400"></i>
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Logout</div>
                  <div className="text-sm text-muted-foreground">Sign out of your account</div>
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <Navigation currentPage="profile" userRole={getUserRole()} />
    </div>
  );
}