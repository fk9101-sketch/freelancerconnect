import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/navigation";
import type { User, LeadWithRelations, FreelancerWithRelations } from "@shared/schema";

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect to role selection if not authenticated or not admin
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

  // Fetch users
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Fetch leads
  const { data: leads, isLoading: leadsLoading } = useQuery<LeadWithRelations[]>({
    queryKey: ['/api/admin/leads'],
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Fetch pending verifications
  const { data: pendingVerifications, isLoading: verificationsLoading } = useQuery<FreelancerWithRelations[]>({
    queryKey: ['/api/admin/verifications/pending'],
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Update verification status mutation
  const updateVerificationMutation = useMutation({
    mutationFn: async ({ freelancerId, status }: { freelancerId: string; status: 'approved' | 'rejected' }) => {
      await apiRequest('POST', `/api/admin/verifications/${freelancerId}/${status}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Verification status updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/verifications/pending'] });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
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
      
      toast({
        title: "Error",
        description: error.message || "Failed to update verification status",
        variant: "destructive",
      });
    },
  });

  const handleApproveVerification = (freelancerId: string) => {
    updateVerificationMutation.mutate({ freelancerId, status: 'approved' });
  };

  const handleRejectVerification = (freelancerId: string) => {
    updateVerificationMutation.mutate({ freelancerId, status: 'rejected' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  // Check admin access
  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <i className="fas fa-lock text-4xl text-gray-400 mb-4"></i>
          <h2 className="text-xl font-semibold text-gray-700">Access Denied</h2>
          <p className="text-gray-500">Admin access required</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalUsers = users?.length || 0;
  const totalFreelancers = users?.filter(u => u.role === 'freelancer').length || 0;
  const activeLeads = leads?.filter(l => l.status === 'pending').length || 0;

  return (
    <div className="min-h-screen pb-20">
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
          <div>
            <h2 className="text-lg font-semibold" data-testid="text-admin-title">Admin Dashboard</h2>
            <p className="text-purple-100 text-sm">Platform Management</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <i className="fas fa-bell text-sm"></i>
            </div>
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <i className="fas fa-user text-sm"></i>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white bg-opacity-20 rounded-lg p-2 text-center">
            <p className="text-lg font-bold" data-testid="text-total-users">{totalUsers}</p>
            <p className="text-xs text-purple-100">Users</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-2 text-center">
            <p className="text-lg font-bold" data-testid="text-total-freelancers">{totalFreelancers}</p>
            <p className="text-xs text-purple-100">Freelancers</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-2 text-center">
            <p className="text-lg font-bold" data-testid="text-active-leads">{activeLeads}</p>
            <p className="text-xs text-purple-100">Active Leads</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-2 text-center">
            <p className="text-lg font-bold">₹0</p>
            <p className="text-xs text-purple-100">Revenue</p>
          </div>
        </div>
      </div>

      {/* Management Sections */}
      <div className="p-4 pb-20">
        {/* Pending Verifications */}
        <div className="mb-6">
          <h3 className="font-semibold text-on-surface mb-3">Pending Verifications</h3>
          {verificationsLoading ? (
            <div className="flex justify-center py-4">
              <div className="spinner"></div>
            </div>
          ) : (
            <Card className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {pendingVerifications && pendingVerifications.length > 0 ? (
                pendingVerifications.map((freelancer, index) => (
                  <div 
                    key={freelancer.id} 
                    className={`p-4 ${index > 0 ? 'border-t border-gray-100' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <i className="fas fa-user text-gray-600"></i>
                        </div>
                        <div>
                          <p className="font-medium text-sm" data-testid={`text-freelancer-name-${freelancer.id}`}>
                            {freelancer.user.firstName} {freelancer.user.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {freelancer.category.name} • Applied {new Date(freelancer.createdAt!).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveVerification(freelancer.id)}
                          disabled={updateVerificationMutation.isPending}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-medium"
                          data-testid={`button-approve-${freelancer.id}`}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleRejectVerification(freelancer.id)}
                          disabled={updateVerificationMutation.isPending}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-medium"
                          data-testid={`button-reject-${freelancer.id}`}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No pending verifications
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button
            variant="outline"
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow h-auto flex-col"
            data-testid="button-manage-users"
          >
            <i className="fas fa-users text-primary text-2xl mb-2"></i>
            <p className="font-medium text-sm text-gray-700">Manage Users</p>
            <p className="text-xs text-gray-500">{totalUsers} total</p>
          </Button>
          <Button
            variant="outline"
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow h-auto flex-col"
            data-testid="button-lead-assignment"
          >
            <i className="fas fa-tasks text-primary text-2xl mb-2"></i>
            <p className="font-medium text-sm text-gray-700">Lead Assignment</p>
            <p className="text-xs text-gray-500">{activeLeads} pending</p>
          </Button>
          <Button
            variant="outline"
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow h-auto flex-col"
            data-testid="button-subscriptions"
          >
            <i className="fas fa-crown text-primary text-2xl mb-2"></i>
            <p className="font-medium text-sm text-gray-700">Subscriptions</p>
            <p className="text-xs text-gray-500">View plans</p>
          </Button>
          <Button
            variant="outline"
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow h-auto flex-col"
            data-testid="button-analytics"
          >
            <i className="fas fa-chart-bar text-primary text-2xl mb-2"></i>
            <p className="font-medium text-sm text-gray-700">Analytics</p>
            <p className="text-xs text-gray-500">View reports</p>
          </Button>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="font-semibold text-on-surface mb-3">Recent Activity</h3>
          <div className="space-y-3">
            <Card className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-check text-green-600 text-xs"></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">System initialized</p>
                  <p className="text-xs text-gray-500">Admin dashboard ready</p>
                </div>
                <span className="text-xs text-gray-400">Just now</span>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <Navigation currentPage="dashboard" userRole="admin" />
    </div>
  );
}
