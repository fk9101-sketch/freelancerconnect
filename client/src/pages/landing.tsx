import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { signInWithGoogle } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Landing() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleGoogleLogin = async (role: string) => {
    try {
      const user = await signInWithGoogle();
      console.log("User signed in:", user);
      
      // Store the selected role for later use
      localStorage.setItem('selectedRole', role);
      
      toast({
        title: "Welcome!",
        description: `Successfully signed in as ${role}`,
      });
      // Redirect to role selection after successful login
      setLocation('/');
    } catch (error) {
      console.error("Login error:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast({
          title: "Login Cancelled",
          description: "You closed the sign-in window. Please try again.",
          variant: "default",
        });
      } else {
        toast({
          title: "Login Failed",
          description: "Failed to sign in with Google. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handlePhoneLogin = (role: string) => {
    // Store the selected role for later use
    localStorage.setItem('selectedRole', role);
    setLocation('/phone-auth');
  };

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
  };

  const goBack = () => {
    setSelectedRole(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
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
      <div className="bg-gradient-purple text-white p-8 pb-16">
        <div className="text-center">
          <div className="w-24 h-24 bg-white bg-opacity-20 rounded-3xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm">
            <i className="fas fa-handshake text-4xl"></i>
          </div>
          <h1 className="text-3xl font-bold mb-3" data-testid="app-title">Freelancer Connect</h1>
          <p className="text-purple-100 text-base">Connect with local service providers</p>
          <p className="text-purple-200 text-sm mt-2">Find trusted professionals in your area</p>
        </div>
      </div>

      {/* Role Selection or Login */}
      <div className="p-6 -mt-8">
        <div className="bg-card rounded-t-3xl shadow-2xl p-8 border border-border">
          {!selectedRole ? (
            /* Role Selection Screen */
            <div className="space-y-4">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-card-foreground mb-3">Choose Your Role</h2>
                <p className="text-muted-foreground">Select how you want to use our platform</p>
              </div>

              <Card 
                className="bg-card/50 backdrop-blur-sm rounded-2xl shadow-lg border border-border cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-200"
                onClick={() => handleRoleSelect('customer')}
                data-testid="card-customer-role"
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                      <i className="fas fa-search text-blue-400 text-2xl"></i>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-card-foreground text-lg">For Customers</h3>
                      <p className="text-muted-foreground text-sm">Find local service providers</p>
                    </div>
                    <i className="fas fa-chevron-right text-primary"></i>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="bg-card/50 backdrop-blur-sm rounded-2xl shadow-lg border border-border cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-200"
                onClick={() => handleRoleSelect('freelancer')}
                data-testid="card-freelancer-role"
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center">
                      <i className="fas fa-hammer text-green-400 text-2xl"></i>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-card-foreground text-lg">For Freelancers</h3>
                      <p className="text-muted-foreground text-sm">Offer your services locally</p>
                    </div>
                    <i className="fas fa-chevron-right text-primary"></i>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="bg-card/50 backdrop-blur-sm rounded-2xl shadow-lg border border-border cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-200"
                onClick={() => handleRoleSelect('admin')}
                data-testid="card-admin-role"
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center">
                      <i className="fas fa-cog text-purple-400 text-2xl"></i>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-card-foreground text-lg">Admin Portal</h3>
                      <p className="text-muted-foreground text-sm">Manage platform operations</p>
                    </div>
                    <i className="fas fa-chevron-right text-primary"></i>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Login Options for Selected Role */
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goBack}
                  className="p-2 rounded-full hover:bg-gray-100"
                  data-testid="button-back-to-roles"
                >
                  <i className="fas fa-arrow-left text-gray-600"></i>
                </Button>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {selectedRole === 'customer' && 'Customer Login'}
                    {selectedRole === 'freelancer' && 'Freelancer Login'}
                    {selectedRole === 'admin' && 'Admin Login'}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {selectedRole === 'customer' && 'Find and hire local service providers'}
                    {selectedRole === 'freelancer' && 'Start offering your services locally'}
                    {selectedRole === 'admin' && 'Access platform management tools'}
                  </p>
                </div>
              </div>

              {/* Role-specific login card */}
              <Card className="bg-card/50 backdrop-blur-sm rounded-2xl shadow-xl border border-border">
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
                      selectedRole === 'customer' ? 'bg-blue-500/20' :
                      selectedRole === 'freelancer' ? 'bg-green-500/20' : 'bg-purple-500/20'
                    }`}>
                      <i className={`text-3xl ${
                        selectedRole === 'customer' ? 'fas fa-search text-blue-400' :
                        selectedRole === 'freelancer' ? 'fas fa-hammer text-green-400' : 'fas fa-cog text-purple-400'
                      }`}></i>
                    </div>
                    <h3 className="text-xl font-bold text-card-foreground mb-3">Welcome!</h3>
                    <p className="text-muted-foreground">Choose your preferred sign-in method</p>
                  </div>

                  <div className="space-y-5">
                    <Button 
                      onClick={() => handleGoogleLogin(selectedRole)}
                      className="w-full bg-gradient-purple text-white py-4 rounded-2xl font-semibold hover:scale-105 transition-all duration-200 shadow-lg"
                      data-testid="button-google-login"
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span>Continue with Google</span>
                      </div>
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => handlePhoneLogin(selectedRole)}
                      className="w-full border-2 border-border bg-card text-card-foreground py-4 rounded-2xl font-semibold hover:scale-105 hover:shadow-lg transition-all duration-200"
                      data-testid="button-phone-login"
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <i className="fas fa-phone text-primary"></i>
                        <span>Continue with Phone</span>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center mt-6">
                <p className="text-xs text-muted-foreground">
                  By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
