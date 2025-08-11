import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CategoryGrid from "@/components/category-grid";
import Navigation from "@/components/navigation";
import type { Category, LeadWithRelations } from "@shared/schema";

export default function CustomerDashboard() {
  const { user: firebaseUser, isAuthenticated, isLoading } = useFirebaseAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
      return;
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Mock data for now since backend API is using different auth
  const categories: Category[] = [
    { id: '1', name: 'Electrical', description: 'Electrical services', icon: 'fas fa-bolt' },
    { id: '2', name: 'Plumbing', description: 'Plumbing services', icon: 'fas fa-wrench' },
    { id: '3', name: 'Carpentry', description: 'Carpentry services', icon: 'fas fa-hammer' },
    { id: '4', name: 'Cleaning', description: 'Cleaning services', icon: 'fas fa-broom' },
    { id: '5', name: 'Painting', description: 'Painting services', icon: 'fas fa-paint-brush' },
    { id: '6', name: 'Gardening', description: 'Gardening services', icon: 'fas fa-leaf' },
  ];
  
  const leads: LeadWithRelations[] = [];
  const categoriesLoading = false;
  const leadsLoading = false;

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
    <div className="min-h-screen pb-20 bg-background text-foreground">
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
      <div className="bg-gradient-purple text-white p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold mb-1" data-testid="text-greeting">
              Hello, {firebaseUser?.displayName || firebaseUser?.email || 'Customer'}!
            </h2>
            <p className="text-purple-100 text-sm opacity-90">What service do you need today?</p>
          </div>
          <div className="w-12 h-12 bg-white bg-opacity-15 rounded-2xl flex items-center justify-center backdrop-blur-sm">
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
            className="w-full bg-card/50 backdrop-blur-sm text-white px-4 py-4 pl-12 rounded-2xl placeholder-white/60 border border-white/10 focus:border-white/30"
            data-testid="input-search-services"
          />
          <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60"></i>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="p-6 bg-background">
        <h3 className="font-bold text-foreground mb-6 text-lg">Popular Services</h3>
        <CategoryGrid 
          categories={categories || []} 
          onCategorySelect={handleCategorySelect}
        />

        {/* Recent Activity */}
        {leads && leads.length > 0 && (
          <div className="mt-8">
            <h3 className="font-bold text-foreground mb-6 text-lg">Your Recent Requests</h3>
            <div className="space-y-4">
              {leads.slice(0, 3).map((lead) => (
                <div key={lead.id} className="bg-card rounded-2xl p-5 shadow-lg border border-border lead-card hover:shadow-xl transition-all duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-card-foreground" data-testid={`text-lead-title-${lead.id}`}>
                      {lead.title}
                    </span>
                    <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                      lead.status === 'completed' ? 'bg-success/20 text-success' :
                      lead.status === 'accepted' ? 'bg-primary/20 text-primary' :
                      'bg-warning/20 text-warning'
                    }`}>
                      {lead.status}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm mb-3">{lead.description}</p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{new Date(lead.createdAt!).toLocaleDateString()}</span>
                    <span className="font-medium text-primary">
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
        className="fab hover:scale-105 transition-transform duration-200"
        data-testid="button-post-job-fab"
      >
        <i className="fas fa-plus text-xl"></i>
      </Button>

      {/* Bottom Navigation */}
      <Navigation currentPage="home" userRole="customer" />
    </div>
  );
}
