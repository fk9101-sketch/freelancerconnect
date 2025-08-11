import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/navigation";
import type { LeadWithRelations } from "@shared/schema";

export default function CustomerRequests() {
  const { isAuthenticated, isLoading, user } = useFirebaseAuth();
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'completed' | 'cancelled'>('all');

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
      return;
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Fetch user's requests/leads
  const { data: leads, isLoading: leadsLoading } = useQuery<LeadWithRelations[]>({
    queryKey: ['/api/customer/leads'],
    retry: false,
    enabled: !!user,
  });

  const filteredLeads = leads?.filter(lead => 
    filter === 'all' || lead.status === filter
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'accepted':
        return 'bg-blue-100 text-blue-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'fas fa-check-circle';
      case 'accepted':
        return 'fas fa-clock';
      case 'cancelled':
        return 'fas fa-times-circle';
      default:
        return 'fas fa-hourglass-half';
    }
  };

  if (isLoading || leadsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

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
          <button 
            onClick={() => setLocation('/customer')}
            className="text-white"
            data-testid="button-back"
          >
            <i className="fas fa-arrow-left text-lg"></i>
          </button>
          <h1 className="text-lg font-semibold">My Requests</h1>
          <button 
            onClick={() => setLocation('/post-job')}
            className="text-white"
            data-testid="button-add-request"
          >
            <i className="fas fa-plus text-lg"></i>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {['all', 'pending', 'accepted', 'completed', 'cancelled'].map((status) => (
            <Button
              key={status}
              onClick={() => setFilter(status as any)}
              variant={filter === status ? "secondary" : "ghost"}
              size="sm"
              className="whitespace-nowrap text-white border-white/20 capitalize"
              data-testid={`filter-${status}`}
            >
              {status === 'all' ? 'All' : status}
            </Button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="p-4">
        {filteredLeads.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-clipboard-list text-4xl text-gray-300 mb-4"></i>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {filter === 'all' ? 'No Requests Yet' : `No ${filter} Requests`}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {filter === 'all' 
                ? "Post your first job requirement to get started" 
                : `You don't have any ${filter} requests`}
            </p>
            <Button
              onClick={() => setLocation('/post-job')}
              className="bg-gradient-purple hover:opacity-90"
              data-testid="button-post-first-job"
            >
              <i className="fas fa-plus mr-2"></i>
              Post Your First Request
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLeads.map((lead) => (
              <div key={lead.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1" data-testid={`text-lead-title-${lead.id}`}>
                      {lead.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">{lead.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                    <i className={`${getStatusIcon(lead.status)} mr-1`}></i>
                    {lead.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3 text-sm text-gray-600">
                  <div>
                    <i className="fas fa-map-marker-alt mr-1 text-gray-400"></i>
                    {lead.location}
                  </div>
                  <div>
                    <i className="fas fa-rupee-sign mr-1 text-gray-400"></i>
                    ₹{lead.budgetMin}-{lead.budgetMax}
                  </div>
                  <div>
                    <i className="fas fa-tag mr-1 text-gray-400"></i>
                    {lead.category.name}
                  </div>
                  <div>
                    <i className="fas fa-clock mr-1 text-gray-400"></i>
                    {new Date(lead.createdAt!).toLocaleDateString()}
                  </div>
                </div>

                {lead.acceptedByFreelancer && (
                  <div className="bg-blue-50 rounded-lg p-3 mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-purple rounded-full flex items-center justify-center text-white font-semibold">
                        {lead.acceptedByFreelancer.user.firstName?.[0] || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          Accepted by {lead.acceptedByFreelancer.user.firstName} {lead.acceptedByFreelancer.user.lastName}
                        </p>
                        <p className="text-xs text-gray-600">
                          {lead.acceptedByFreelancer.user.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    {lead.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        data-testid={`button-cancel-${lead.id}`}
                      >
                        <i className="fas fa-times mr-1"></i>
                        Cancel
                      </Button>
                    )}
                    {lead.status === 'accepted' && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        data-testid={`button-complete-${lead.id}`}
                      >
                        <i className="fas fa-check mr-1"></i>
                        Mark Complete
                      </Button>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-purple-600"
                    data-testid={`button-view-details-${lead.id}`}
                  >
                    View Details
                    <i className="fas fa-chevron-right ml-1"></i>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <Navigation currentPage="requests" userRole="customer" />
    </div>
  );
}