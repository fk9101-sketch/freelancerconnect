import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CategoryGrid from "@/components/category-grid";
import Navigation from "@/components/navigation";
import type { Category, LeadWithRelations } from "@shared/schema";

export default function CustomerDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  // Redirect to role selection if not authenticated
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

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    retry: false,
  });

  // Fetch customer's leads
  const { data: leads, isLoading: leadsLoading } = useQuery<LeadWithRelations[]>({
    queryKey: ['/api/customer/leads'],
    retry: false,
    enabled: isAuthenticated,
  });

  const handleCategorySelect = (categoryId: string) => {
    // Navigate to freelancer search or post job with category pre-selected
    setLocation(`/post-job?category=${categoryId}`);
  };

  const handlePostJob = () => {
    setLocation('/post-job');
  };

  if (isLoading || categoriesLoading) {
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
          <div>
            <h2 className="text-lg font-semibold" data-testid="text-greeting">
              Hello, {(user && 'firstName' in user && user.firstName) || 'Customer'}!
            </h2>
            <p className="text-purple-100 text-sm">What service do you need?</p>
          </div>
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <i className="fas fa-bell text-lg"></i>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Search for services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white bg-opacity-90 text-gray-800 px-4 py-3 pl-10 rounded-xl placeholder-gray-500 border-0"
            data-testid="input-search-services"
          />
          <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="p-4">
        <h3 className="font-semibold text-on-surface mb-4">Popular Services</h3>
        <CategoryGrid 
          categories={categories || []} 
          onCategorySelect={handleCategorySelect}
        />

        {/* Recent Activity */}
        {leads && leads.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-on-surface mb-4">Your Recent Requests</h3>
            <div className="space-y-3">
              {leads.slice(0, 3).map((lead) => (
                <div key={lead.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 lead-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm" data-testid={`text-lead-title-${lead.id}`}>
                      {lead.title}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      lead.status === 'completed' ? 'bg-green-100 text-green-700' :
                      lead.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {lead.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-xs mb-2">{lead.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(lead.createdAt!).toLocaleDateString()}</span>
                    <span>
                      ₹{lead.budgetMin}-{lead.budgetMax}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <Button
        onClick={handlePostJob}
        className="fab"
        data-testid="button-post-job-fab"
      >
        <i className="fas fa-plus text-xl"></i>
      </Button>

      {/* Bottom Navigation */}
      <Navigation currentPage="home" userRole="customer" />
    </div>
  );
}
