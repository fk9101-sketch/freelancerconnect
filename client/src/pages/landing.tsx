import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  const handleGoogleLogin = () => {
    window.location.href = "/api/login";
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
      <div className="bg-gradient-purple text-white p-6 pb-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-handshake text-2xl"></i>
          </div>
          <h1 className="text-2xl font-bold mb-2" data-testid="app-title">Freelancer Connect</h1>
          <p className="text-purple-100 text-sm">Connect with local service providers</p>
        </div>
      </div>

      {/* Role Selection Info */}
      <div className="p-6 -mt-4">
        <div className="space-y-4">
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
        <div className="mt-8 space-y-3">
          <Button 
            onClick={handleGoogleLogin}
            className="w-full bg-gradient-purple text-white py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
            data-testid="button-google-login"
          >
            <i className="fab fa-google mr-2"></i>
            Continue with Google
          </Button>
          <Button 
            variant="outline"
            onClick={handleGoogleLogin}
            className="w-full border border-gray-300 text-on-surface py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            data-testid="button-phone-login"
          >
            <i className="fas fa-phone mr-2"></i>
            Continue with Phone
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
