import { useEffect, useState } from "react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Navigation from "@/components/navigation";
import { signOutUser } from "@/lib/firebase";

export default function AdminDashboard() {
  const { user: firebaseUser, isAuthenticated, isLoading } = useFirebaseAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
      return;
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Role verification is now handled by ProtectedRoute in App.tsx

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOutUser();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your admin account.",
      });
      setLocation('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  // Mock data for admin dashboard with freelancer payment analytics
  const stats = {
    totalUsers: 1250,
    totalFreelancers: 450,
    totalLeads: 89,
    pendingVerifications: 12,
    // New freelancer payment analytics
    paidFreelancers: 320,
    nonPaidFreelancers: 130,
    totalEarnings: 245000,
    averageEarnings: 765
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-purple text-white p-6 pb-8">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1"></div>
          <div className="text-center flex-1">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-crown text-2xl"></i>
            </div>
            <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-purple-100 text-sm">
              Welcome, {firebaseUser?.displayName || firebaseUser?.email || 'Admin'}!
            </p>
          </div>
          <div className="flex-1 flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-white bg-opacity-10 border-white border-opacity-20 text-white hover:bg-white hover:bg-opacity-20"
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Logging out...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sign-out-alt mr-2"></i>
                      Logout
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to logout from your admin account? You will need to sign in again to access the admin dashboard.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-6 -mt-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-card rounded-2xl shadow-lg border border-gray-100">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{stats.totalUsers}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card rounded-2xl shadow-lg border border-gray-100">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{stats.totalFreelancers}</div>
              <div className="text-sm text-gray-600">Freelancers</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card rounded-2xl shadow-lg border border-gray-100">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">{stats.totalLeads}</div>
              <div className="text-sm text-gray-600">Active Leads</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card rounded-2xl shadow-lg border border-gray-100">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600 mb-1">{stats.pendingVerifications}</div>
              <div className="text-sm text-gray-600">Pending Verifications</div>
            </CardContent>
          </Card>
        </div>

        {/* Freelancer Payment Analytics */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4" data-testid="text-payment-analytics-title">
            Freelancer Payment Analytics
          </h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Paid Freelancers */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg border border-green-200">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <i className="fas fa-money-bill-wave text-green-600 text-xl mr-2"></i>
                  <div className="text-2xl font-bold text-green-700" data-testid="text-paid-freelancers">
                    {stats.paidFreelancers}
                  </div>
                </div>
                <div className="text-sm text-green-600 font-medium">Paid Freelancers</div>
                <div className="text-xs text-green-500 mt-1">
                  {((stats.paidFreelancers / stats.totalFreelancers) * 100).toFixed(1)}% of total
                </div>
              </CardContent>
            </Card>

            {/* Non-Paid Freelancers */}
            <Card className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl shadow-lg border border-red-200">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <i className="fas fa-exclamation-triangle text-red-600 text-xl mr-2"></i>
                  <div className="text-2xl font-bold text-red-700" data-testid="text-unpaid-freelancers">
                    {stats.nonPaidFreelancers}
                  </div>
                </div>
                <div className="text-sm text-red-600 font-medium">Non-Paid Freelancers</div>
                <div className="text-xs text-red-500 mt-1">
                  {((stats.nonPaidFreelancers / stats.totalFreelancers) * 100).toFixed(1)}% of total
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-lg border border-purple-200">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <i className="fas fa-chart-line text-purple-600 text-xl mr-2"></i>
                  <div className="text-2xl font-bold text-purple-700" data-testid="text-total-earnings">
                    ₹{stats.totalEarnings.toLocaleString()}
                  </div>
                </div>
                <div className="text-sm text-purple-600 font-medium">Total Earnings</div>
                <div className="text-xs text-purple-500 mt-1">This month</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg border border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <i className="fas fa-calculator text-blue-600 text-xl mr-2"></i>
                  <div className="text-2xl font-bold text-blue-700" data-testid="text-average-earnings">
                    ₹{stats.averageEarnings}
                  </div>
                </div>
                <div className="text-sm text-blue-600 font-medium">Avg. per Freelancer</div>
                <div className="text-xs text-blue-500 mt-1">Paid freelancers only</div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Status Visual */}
          <Card className="bg-card rounded-2xl shadow-lg border border-gray-100 mt-4">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-pie-chart text-purple-600 mr-2"></i>
                Payment Status Distribution
              </h3>
              
              {/* Progress Bar */}
              <div className="relative mb-4">
                <div className="flex h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${(stats.paidFreelancers / stats.totalFreelancers) * 100}%` }}
                    data-testid="progress-paid"
                  >
                    {((stats.paidFreelancers / stats.totalFreelancers) * 100).toFixed(0)}%
                  </div>
                  <div 
                    className="bg-gradient-to-r from-red-400 to-red-500 flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${(stats.nonPaidFreelancers / stats.totalFreelancers) * 100}%` }}
                    data-testid="progress-unpaid"
                  >
                    {((stats.nonPaidFreelancers / stats.totalFreelancers) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex justify-between text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-gray-600">Paid ({stats.paidFreelancers})</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-gray-600">Non-Paid ({stats.nonPaidFreelancers})</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3 mb-6">
          <h2 className="text-lg font-semibold text-on-surface">Quick Actions</h2>
          
          <Card className="bg-card rounded-2xl shadow-lg border border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <i className="fas fa-users text-purple-600 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-on-surface">Manage Users</h3>
                    <p className="text-gray-600 text-sm">View and manage all users</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" data-testid="button-manage-users">
                  View All
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment Analytics Quick Action */}
          <Card className="bg-card rounded-2xl shadow-lg border border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <i className="fas fa-money-bill-wave text-green-600 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-on-surface">Payment Analytics</h3>
                    <p className="text-gray-600 text-sm">View detailed payment reports</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" data-testid="button-payment-analytics">
                  View Report
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card rounded-2xl shadow-lg border border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <i className="fas fa-clipboard-list text-orange-600 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-on-surface">Review Leads</h3>
                    <p className="text-gray-600 text-sm">Monitor all leads and transactions</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Review
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card rounded-2xl shadow-lg border border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <i className="fas fa-certificate text-green-600 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-on-surface">Verifications</h3>
                    <p className="text-gray-600 text-sm">Approve freelancer verifications</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  {stats.pendingVerifications}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Navigation currentPage="dashboard" userRole="admin" />
    </div>
  );
}