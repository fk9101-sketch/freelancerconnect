import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/navigation";

export default function CustomerNews() {
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
      <div className="max-w-md mx-auto bg-background min-h-screen">
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
                New Features Coming to HireLocal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                We're excited to announce several new features that will enhance your experience on our platform...
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
                <Badge variant="outline" className="text-green-400 border-green-500/30">
                  Update
                </Badge>
                <span className="text-xs text-muted-foreground">1 day ago</span>
              </div>
              <CardTitle className="text-lg font-bold text-card-foreground">
                Improved Search Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Our search algorithm has been updated to provide more accurate results and faster response times...
              </p>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                  <i className="fas fa-search text-white text-sm"></i>
                </div>
                <span className="text-xs text-muted-foreground">Product Team</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card rounded-2xl shadow-xl border border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-orange-400 border-orange-500/30">
                  Tips
                </Badge>
                <span className="text-xs text-muted-foreground">3 days ago</span>
              </div>
              <CardTitle className="text-lg font-bold text-card-foreground">
                How to Get the Best Service Providers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Learn the best practices for finding and working with top-rated service providers in your area...
              </p>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  <i className="fas fa-lightbulb text-white text-sm"></i>
                </div>
                <span className="text-xs text-muted-foreground">Support Team</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card rounded-2xl shadow-xl border border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-purple-400 border-purple-500/30">
                  Community
                </Badge>
                <span className="text-xs text-muted-foreground">1 week ago</span>
              </div>
              <CardTitle className="text-lg font-bold text-card-foreground">
                Customer Success Stories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Read about how our customers have found amazing service providers and completed their projects...
              </p>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <i className="fas fa-heart text-white text-sm"></i>
                </div>
                <span className="text-xs text-muted-foreground">Community Team</span>
              </div>
            </CardContent>
          </Card>

          {/* Empty state for more news */}
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-newspaper text-muted-foreground text-xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Stay Updated</h3>
            <p className="text-sm text-muted-foreground">
              Check back regularly for the latest news and updates from HireLocal.
            </p>
          </div>
        </div>

        {/* Bottom Navigation */}
        <Navigation currentPage="news" userRole="customer" />
      </div>
    </div>
  );
}
