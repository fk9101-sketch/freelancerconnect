import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/navigation";
import type { Category, FreelancerWithRelations } from "@shared/schema";

export default function CustomerSearch() {
  const { isAuthenticated, isLoading } = useFirebaseAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
      return;
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    retry: false,
  });

  // Mock freelancers data for now
  const freelancers: FreelancerWithRelations[] = [];

  const filteredFreelancers = freelancers.filter(freelancer => {
    const matchesSearch = !searchQuery || 
      freelancer.user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      freelancer.user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      freelancer.bio?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || freelancer.categoryId === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
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
          <h1 className="text-lg font-semibold">Search Freelancers</h1>
          <div></div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Input
            type="text"
            placeholder="Search freelancers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white bg-opacity-90 text-gray-800 px-4 py-3 pl-10 rounded-xl placeholder-gray-500 border-0"
            data-testid="input-search-freelancers"
          />
          <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto">
          <Button
            onClick={() => setSelectedCategory("")}
            variant={selectedCategory === "" ? "secondary" : "ghost"}
            size="sm"
            className="whitespace-nowrap text-white border-white/20"
            data-testid="filter-all"
          >
            All Categories
          </Button>
          {categories?.map((category) => (
            <Button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              variant={selectedCategory === category.id ? "secondary" : "ghost"}
              size="sm"
              className="whitespace-nowrap text-white border-white/20"
              data-testid={`filter-${category.id}`}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Freelancers List */}
      <div className="p-4">
        {filteredFreelancers.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-users text-4xl text-gray-300 mb-4"></i>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Freelancers Found</h3>
            <p className="text-gray-500 text-sm">
              {searchQuery || selectedCategory 
                ? "Try adjusting your search criteria" 
                : "Freelancers will appear here once they join the platform"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFreelancers.map((freelancer) => (
              <div key={freelancer.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-gradient-purple rounded-full flex items-center justify-center text-white font-semibold">
                    {freelancer.user.firstName?.[0] || freelancer.user.email?.[0] || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-gray-900" data-testid={`text-freelancer-name-${freelancer.id}`}>
                        {freelancer.user.firstName} {freelancer.user.lastName}
                      </h4>
                      <div className="flex items-center space-x-1">
                        <i className="fas fa-star text-yellow-400 text-xs"></i>
                        <span className="text-xs text-gray-600">{freelancer.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{freelancer.category.name}</p>
                    {freelancer.bio && (
                      <p className="text-xs text-gray-500 mb-2">{freelancer.bio}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {freelancer.totalJobs} jobs completed
                      </span>
                      <Button
                        size="sm"
                        className="bg-gradient-purple hover:opacity-90"
                        data-testid={`button-contact-${freelancer.id}`}
                      >
                        Contact
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <Navigation currentPage="search" userRole="customer" />
    </div>
  );
}