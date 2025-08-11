import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { signInWithGoogle } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Landing() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleGoogleLogin = async () => {
    try {
      const user = await signInWithGoogle();
      console.log("User signed in:", user);
      toast({
        title: "Welcome!",
        description: "Successfully signed in with Google",
      });
      // Redirect to role selection after successful login
      setLocation('/');
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: "Failed to sign in with Google. Please try again.",
        variant: "destructive",
      });
    }
  };

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
      <div className="bg-gradient-purple text-white p-6 pb-12">
        <div className="text-center">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-handshake text-3xl"></i>
          </div>
          <h1 className="text-3xl font-bold mb-3" data-testid="app-title">Freelancer Connect</h1>
          <p className="text-purple-100 text-base">Connect with local service providers</p>
          <p className="text-purple-200 text-sm mt-2">Find trusted professionals in your area</p>
        </div>
      </div>

      {/* Role Selection Info */}
      <div className="p-6 -mt-8">
        <div className="bg-white rounded-t-3xl shadow-lg p-6 space-y-4">
          <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <i className="fas fa-user text-blue-600 text-xl"></i>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-on-surface">For Customers</h3>
                  <p className="text-gray-600 text-sm">Find local service providers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <i className="fas fa-hammer text-green-600 text-xl"></i>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-on-surface">For Freelancers</h3>
                  <p className="text-gray-600 text-sm">Offer your services locally</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <i className="fas fa-cog text-primary text-xl"></i>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-on-surface">Admin Portal</h3>
                  <p className="text-gray-600 text-sm">Manage platform operations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

          {/* Login Options */}
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold text-center text-gray-800 mb-6">Get Started</h3>
            
            <Button 
              onClick={handleGoogleLogin}
              className="w-full bg-white text-gray-700 py-4 rounded-xl font-medium hover:bg-gray-50 transition-colors border border-gray-200 shadow-sm"
              data-testid="button-google-login"
            >
              <div className="flex items-center justify-center space-x-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </div>
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleGoogleLogin}
              className="w-full border border-gray-300 text-gray-700 py-4 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              data-testid="button-phone-login"
            >
              <div className="flex items-center justify-center space-x-3">
                <i className="fas fa-phone text-gray-600"></i>
                <span>Continue with Phone</span>
              </div>
            </Button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
  );
}
