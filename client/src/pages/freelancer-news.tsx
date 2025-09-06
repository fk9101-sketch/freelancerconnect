import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/navigation";

export default function FreelancerNews() {
  const { user: firebaseUser, isAuthenticated, isLoading } = useFirebaseAuth();

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
          <h2 className="text-2xl font-bold mb-4">Please log in to view news</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-xl font-bold text-foreground">News</h1>
            <div className="w-8 h-8"></div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Featured News */}
          <Card className="bg-card rounded-2xl shadow-xl border border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  Featured
                </Badge>
                <span className="text-xs text-muted-foreground">2 hours ago</span>
              </div>
              <CardTitle className="text-lg font-bold text-card-foreground">
                New Features for Freelancers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                We're excited to announce several new features that will help you grow your business and connect with more customers...
              </p>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <i className="fas fa-rocket text-white text-sm"></i>
                </div>
                <span className="text-xs text-muted-foreground">HireLocal Team</span>
              </div>
            </CardContent>
          </Card>

          {/* News Items */}
          <Card className="bg-card rounded-2xl shadow-xl border border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Business Tips
                </Badge>
                <span className="text-xs text-muted-foreground">1 day ago</span>
              </div>
              <CardTitle className="text-lg font-bold text-card-foreground">
                How to Increase Your Lead Acceptance Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Learn proven strategies to improve your profile visibility and get more leads from customers in your area...
              </p>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                  <i className="fas fa-chart-line text-white text-sm"></i>
                </div>
                <span className="text-xs text-muted-foreground">Business Team</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card rounded-2xl shadow-xl border border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  Platform Update
                </Badge>
                <span className="text-xs text-muted-foreground">3 days ago</span>
              </div>
              <CardTitle className="text-lg font-bold text-card-foreground">
                Enhanced Lead Management System
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Our new lead management system makes it easier to track, respond to, and manage your incoming leads...
              </p>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  <i className="fas fa-tools text-white text-sm"></i>
                </div>
                <span className="text-xs text-muted-foreground">Product Team</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card rounded-2xl shadow-xl border border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-purple-600 border-purple-600">
                  Success Story
                </Badge>
                <span className="text-xs text-muted-foreground">1 week ago</span>
              </div>
              <CardTitle className="text-lg font-bold text-card-foreground">
                Freelancer Spotlight: Sarah's Success Story
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Meet Sarah, a home cleaning specialist who increased her monthly income by 300% using our platform...
              </p>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <i className="fas fa-star text-white text-sm"></i>
                </div>
                <span className="text-xs text-muted-foreground">Community Team</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card rounded-2xl shadow-xl border border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  Tips & Tricks
                </Badge>
                <span className="text-xs text-muted-foreground">2 weeks ago</span>
              </div>
              <CardTitle className="text-lg font-bold text-card-foreground">
                Best Practices for Customer Communication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Learn how to communicate effectively with customers to build trust and secure more repeat business...
              </p>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <i className="fas fa-comments text-white text-sm"></i>
                </div>
                <span className="text-xs text-muted-foreground">Support Team</span>
              </div>
            </CardContent>
          </Card>
        </div>

      {/* Bottom Navigation */}
      <Navigation currentPage="news" userRole="freelancer" />
    </div>
  );
}
