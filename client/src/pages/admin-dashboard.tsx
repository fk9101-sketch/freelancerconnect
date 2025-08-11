import { useEffect } from "react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/navigation";

export default function AdminDashboard() {
  const { user: firebaseUser, isAuthenticated, isLoading } = useFirebaseAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
      return;
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  // Mock data for admin dashboard
  const stats = {
    totalUsers: 1250,
    totalFreelancers: 450,
    totalLeads: 89,
    pendingVerifications: 12
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

      {/* Header */}
      <div className="bg-gradient-purple text-white p-6 pb-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-crown text-2xl"></i>
          </div>
          <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-purple-100 text-sm">
            Welcome, {firebaseUser?.displayName || firebaseUser?.email || 'Admin'}!
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-6 -mt-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{stats.totalUsers}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{stats.totalFreelancers}</div>
              <div className="text-sm text-gray-600">Freelancers</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">{stats.totalLeads}</div>
              <div className="text-sm text-gray-600">Active Leads</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600 mb-1">{stats.pendingVerifications}</div>
              <div className="text-sm text-gray-600">Pending Verifications</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3 mb-6">
          <h2 className="text-lg font-semibold text-on-surface">Quick Actions</h2>
          
          <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
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
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
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

          <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
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

      <Navigation />
    </div>
  );
}