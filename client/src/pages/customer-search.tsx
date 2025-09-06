import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/navigation";
import { sortFreelancersWithPaidMembersFirst } from "@/lib/utils";
import type { Category, FreelancerWithRelations } from "@shared/schema";

export default function CustomerSearch() {
  const { isAuthenticated, isLoading, user } = useFirebaseAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customerArea, setCustomerArea] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [areas, setAreas] = useState<string[]>([]);

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
      return;
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Get customer's area from profile
  useEffect(() => {
    const fetchCustomerArea = async () => {
      try {
        const response = await fetch('/api/customer/profile', {
                  headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`,
          'X-Firebase-User-ID': user?.uid || ''
        }
        });
        if (response.ok) {
          const userData = await response.json();
          if (userData.area) {
            setCustomerArea(userData.area);
          } else {
            // Default area if not set
            setCustomerArea("Vaishali Nagar");
          }
        }
      } catch (error) {
        console.error('Error fetching customer area:', error);
        // Fallback to default area
        setCustomerArea("Vaishali Nagar");
      }
    };

    if (user?.uid) {
      fetchCustomerArea();
    }
  }, [user?.uid]);

  // Fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    retry: false,
  });

  // Fetch all areas for dropdown
  const { data: allAreas = [] } = useQuery<string[]>({
    queryKey: ['/api/areas/all'],
    queryFn: async () => {
      const response = await fetch('/api/areas/all');
      if (!response.ok) {
        throw new Error('Failed to fetch areas');
      }
      return response.json();
    },
    retry: false,
  });

  // Fetch all freelancers without area restrictions
  const { data: freelancers = [], isLoading: freelancersLoading } = useQuery<FreelancerWithRelations[]>({
    queryKey: ['/api/customer/available-freelancers'],
    queryFn: async () => {
      const response = await fetch('/api/customer/available-freelancers');
      if (!response.ok) {
        throw new Error('Failed to fetch freelancers');
      }
      const data = await response.json();
      // Apply paid member sorting: paid members first with rotation, then free listings
      return sortFreelancersWithPaidMembersFirst(data, customerArea);
    },
    retry: false,
  });

  const filteredFreelancers = freelancers.filter(freelancer => {
    const matchesSearch = !searchQuery || 
      freelancer.user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      freelancer.user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      freelancer.bio?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || freelancer.categoryId === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Use filtered freelancers directly (no area filtering)
  const areaFilteredFreelancers = filteredFreelancers;

  const currentArea = selectedArea || customerArea;

  const handleContact = (freelancer: FreelancerWithRelations) => {
    // In a real app, this would open a chat or call interface
    alert(`Contacting ${freelancer.user.firstName} ${freelancer.user.lastName} - ${freelancer.category.name}`);
  };

  const handleViewProfile = (freelancer: FreelancerWithRelations) => {
    // In a real app, this would navigate to the freelancer's profile page
    alert(`Viewing profile of ${freelancer.user.firstName} ${freelancer.user.lastName}`);
  };

  if (isLoading || freelancersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Company Logo/Header */}
      <div className="bg-gradient-purple py-4 px-6">
        <h1 className="text-3xl font-bold text-white text-center tracking-tight">
          Freelancer Connect
        </h1>
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
          <div className="flex items-center text-sm text-purple-100">
            <i className="fas fa-map-marker-alt mr-1"></i>
            {currentArea}
            <button
              onClick={() => setLocation('/customer/profile')}
              className="ml-2 text-purple-200 hover:text-white"
              title="Update your area in profile"
            >
              <i className="fas fa-edit text-xs"></i>
            </button>
          </div>
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

        {/* Area Filter Dropdown */}
        <div className="mb-4">
          <Select value={selectedArea} onValueChange={setSelectedArea}>
            <SelectTrigger className="w-full bg-white bg-opacity-90 text-gray-800 border-0 rounded-xl">
              <SelectValue placeholder="Select area to filter freelancers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Jaipur">All Jaipur</SelectItem>
              {allAreas.map((area) => (
                <SelectItem key={area} value={area}>
                  {area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

      {/* Results */}
      <div className="p-4">
        {areaFilteredFreelancers.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-search text-4xl text-gray-400 mb-4"></i>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {selectedArea && selectedArea !== "All Jaipur" 
                ? `No available freelancer in ${selectedArea}` 
                : "No freelancers found"}
            </h3>
            <p className="text-gray-500">
              {selectedArea && selectedArea !== "All Jaipur"
                ? "Try selecting a different area or 'All Jaipur' to see all available freelancers"
                : "Try adjusting your search criteria or area selection"}
            </p>
          </div>
        ) : (
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Available Freelancers {selectedArea && selectedArea !== "All Jaipur" ? `in ${selectedArea}` : "in Jaipur"}
            </h2>
            <p className="text-sm text-gray-600">
              {areaFilteredFreelancers.length} freelancer{areaFilteredFreelancers.length !== 1 ? 's' : ''} found
            </p>
          </div>
        )}

        {areaFilteredFreelancers.length > 0 && (
          <div className="space-y-4">
            {areaFilteredFreelancers.map((freelancer) => (
              <div
                key={freelancer.id}
                className="bg-card rounded-xl p-4 shadow-sm border border-gray-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-purple rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {freelancer.fullName?.[0] || '?'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {freelancer.fullName}
                      </h3>
                      <p className="text-sm text-gray-600">{freelancer.category.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setLocation(`/freelancer/reviews?id=${freelancer.id}`)}
                    className="flex items-center space-x-1 hover:text-gray-800 transition-colors cursor-pointer"
                  >
                    <i className="fas fa-star text-yellow-400 text-sm"></i>
                    <span className="text-sm text-gray-600">4.8</span>
                  </button>
                </div>

                {freelancer.bio && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {freelancer.bio}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <i className="fas fa-clock mr-1"></i>
                      {freelancer.experience} years
                    </span>
                    <span className="flex items-center">
                      <i className="fas fa-dollar-sign mr-1"></i>
                      {freelancer.hourlyRate}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewProfile(freelancer)}
                      className="text-xs"
                    >
                      View Profile
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleContact(freelancer)}
                      className="text-xs bg-purple-600 hover:bg-purple-700"
                    >
                      Contact
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Navigation currentPage="search" userRole="customer" />
    </div>
  );
}