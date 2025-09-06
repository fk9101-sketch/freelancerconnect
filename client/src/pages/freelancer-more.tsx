import { useLocation } from "wouter";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/navigation";

export default function FreelancerMore() {
  const { user: firebaseUser, isAuthenticated, isLoading } = useFirebaseAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to access more options</h2>
        </div>
      </div>
    );
  }

  const handleNavigation = (path: string) => {
    setLocation(path);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto bg-background min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-xl font-bold text-foreground">More</h1>
            <div className="w-8 h-8"></div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Business Section */}
          <Card className="bg-card rounded-2xl shadow-xl border border-border">
            <CardContent className="p-6">
              <h3 className="font-bold text-card-foreground mb-4">Business</h3>
              <div className="space-y-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left p-4 h-auto hover:bg-card/50 rounded-2xl"
                  onClick={() => handleNavigation('/plans')}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                      <i className="fas fa-credit-card text-blue-400"></i>
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
                  onClick={() => handleNavigation('/freelancer/reviews')}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center">
                      <i className="fas fa-star text-yellow-400"></i>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-card-foreground">Reviews & Ratings</div>
                      <div className="text-sm text-muted-foreground">View customer feedback</div>
                    </div>
                    <i className="fas fa-chevron-right text-muted-foreground"></i>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Support Section */}
          <Card className="bg-card rounded-2xl shadow-xl border border-border">
            <CardContent className="p-6">
              <h3 className="font-bold text-card-foreground mb-4">Support</h3>
              <div className="space-y-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left p-4 h-auto hover:bg-card/50 rounded-2xl"
                  onClick={() => {
                    // You can implement contact support functionality here
                    console.log('Contact support clicked');
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center">
                      <i className="fas fa-headset text-purple-400"></i>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-card-foreground">Contact Support</div>
                      <div className="text-sm text-muted-foreground">Get help and support</div>
                    </div>
                    <i className="fas fa-chevron-right text-muted-foreground"></i>
                  </div>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start text-left p-4 h-auto hover:bg-card/50 rounded-2xl"
                  onClick={() => {
                    // You can implement FAQ functionality here
                    console.log('FAQ clicked');
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center">
                      <i className="fas fa-question-circle text-orange-400"></i>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-card-foreground">FAQ</div>
                      <div className="text-sm text-muted-foreground">Frequently asked questions</div>
                    </div>
                    <i className="fas fa-chevron-right text-muted-foreground"></i>
                  </div>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start text-left p-4 h-auto hover:bg-card/50 rounded-2xl"
                  onClick={() => {
                    // You can implement business tips functionality here
                    console.log('Business tips clicked');
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center">
                      <i className="fas fa-lightbulb text-green-400"></i>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-card-foreground">Business Tips</div>
                      <div className="text-sm text-muted-foreground">Tips to grow your business</div>
                    </div>
                    <i className="fas fa-chevron-right text-muted-foreground"></i>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Section */}
          <Card className="bg-card rounded-2xl shadow-xl border border-border">
            <CardContent className="p-6">
              <h3 className="font-bold text-card-foreground mb-4">Account</h3>
              <div className="space-y-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left p-4 h-auto hover:bg-card/50 rounded-2xl"
                  onClick={() => handleNavigation('/freelancer/profile')}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center">
                      <i className="fas fa-user text-indigo-400"></i>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-card-foreground">Profile Settings</div>
                      <div className="text-sm text-muted-foreground">Manage your profile</div>
                    </div>
                    <i className="fas fa-chevron-right text-muted-foreground"></i>
                  </div>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start text-left p-4 h-auto hover:bg-card/50 rounded-2xl"
                  onClick={() => {
                    // You can implement privacy settings functionality here
                    console.log('Privacy settings clicked');
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-teal-500/20 rounded-2xl flex items-center justify-center">
                      <i className="fas fa-shield-alt text-teal-400"></i>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-card-foreground">Privacy Settings</div>
                      <div className="text-sm text-muted-foreground">Manage your privacy</div>
                    </div>
                    <i className="fas fa-chevron-right text-muted-foreground"></i>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* App Info Section */}
          <Card className="bg-card rounded-2xl shadow-xl border border-border">
            <CardContent className="p-6">
              <h3 className="font-bold text-card-foreground mb-4">About</h3>
              <div className="space-y-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left p-4 h-auto hover:bg-card/50 rounded-2xl"
                  onClick={() => {
                    // You can implement about app functionality here
                    console.log('About app clicked');
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-500/20 rounded-2xl flex items-center justify-center">
                      <i className="fas fa-info-circle text-gray-400"></i>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-card-foreground">About HireLocal</div>
                      <div className="text-sm text-muted-foreground">Learn more about our app</div>
                    </div>
                    <i className="fas fa-chevron-right text-muted-foreground"></i>
                  </div>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start text-left p-4 h-auto hover:bg-card/50 rounded-2xl"
                  onClick={() => {
                    // You can implement terms and conditions functionality here
                    console.log('Terms and conditions clicked');
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center">
                      <i className="fas fa-file-contract text-red-400"></i>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-card-foreground">Terms & Conditions</div>
                      <div className="text-sm text-muted-foreground">Read our terms of service</div>
                    </div>
                    <i className="fas fa-chevron-right text-muted-foreground"></i>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Navigation */}
        <Navigation currentPage="more" userRole="freelancer" />
      </div>
    </div>
  );
}
