import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FreelancerCard from "@/components/freelancer-card";
import { sortFreelancersWithPaidMembersFirst } from "@/lib/utils";
import type { FreelancerWithRelations, Category } from "@shared/schema";

interface FreelancerListingSectionProps {
  customerArea: string;
  onContactFreelancer?: (freelancer: FreelancerWithRelations) => void;
}

export default function FreelancerListingSection({ 
  customerArea, 
  onContactFreelancer 
}: FreelancerListingSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedArea, setSelectedArea] = useState(customerArea);
  const [priceRange, setPriceRange] = useState("any");
  const [areas, setAreas] = useState<string[]>([]);

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
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

  // Filter freelancers based on search criteria
  const filteredFreelancers = freelancers.filter(freelancer => {
    const matchesSearch = !searchQuery || 
      freelancer.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      freelancer.category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      freelancer.bio?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || selectedCategory === 'all' || freelancer.categoryId === selectedCategory;
    
    const matchesPriceRange = !priceRange || priceRange === 'any' || (() => {
      const rate = parseInt(freelancer.hourlyRate || '0');
      switch (priceRange) {
        case 'low': return rate <= 300;
        case 'medium': return rate > 300 && rate <= 600;
        case 'high': return rate > 600;
        default: return true;
      }
    })();
    
    return matchesSearch && matchesCategory && matchesPriceRange;
  });

  const handleContact = (freelancer: FreelancerWithRelations) => {
    if (onContactFreelancer) {
      onContactFreelancer(freelancer);
    } else {
      // Default contact behavior
      alert(`Contacting ${freelancer.fullName} - ${freelancer.category.name}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Available Freelancers</h3>
          <p className="text-sm text-gray-600 mt-1">
            {filteredFreelancers.length} freelancer{filteredFreelancers.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <i className="fas fa-users text-purple-500 text-lg"></i>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
            <i className="fas fa-filter text-purple-500 mr-2"></i>
            Filter & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search freelancers by name, skill, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-purple-200 focus:border-purple-400 rounded-xl pl-10"
            />
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Area Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger className="w-full bg-white border-purple-200 focus:border-purple-400 rounded-xl">
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={customerArea}>My Area ({customerArea})</SelectItem>
                  <SelectItem value="All Jaipur">All Jaipur</SelectItem>
                  {allAreas.filter(area => area !== customerArea).map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full bg-white border-purple-200 focus:border-purple-400 rounded-xl">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="w-full bg-white border-purple-200 focus:border-purple-400 rounded-xl">
                  <SelectValue placeholder="Any price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Price</SelectItem>
                  <SelectItem value="low">Budget (₹0-300/hr)</SelectItem>
                  <SelectItem value="medium">Standard (₹300-600/hr)</SelectItem>
                  <SelectItem value="high">Premium (₹600+/hr)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchQuery || selectedCategory || priceRange || selectedArea !== customerArea) && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setPriceRange("any");
                  setSelectedArea(customerArea);
                }}
                className="text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                <i className="fas fa-times mr-2"></i>
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {freelancersLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="spinner mb-4"></div>
            <p className="text-gray-600">Loading freelancers...</p>
          </div>
        </div>
      ) : filteredFreelancers.length === 0 ? (
        <Card className="bg-card border-gray-200">
          <CardContent className="py-12 text-center">
            <div className="text-gray-400 mb-4">
              <i className="fas fa-search text-6xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {searchQuery || selectedCategory || priceRange || selectedArea !== customerArea
                ? "No freelancers match your criteria"
                : `No freelancers available in ${selectedArea || customerArea}`}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || selectedCategory || priceRange || selectedArea !== customerArea
                ? "Try adjusting your filters or search terms"
                : "Check back later or try a different area"}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setPriceRange("any");
                setSelectedArea(customerArea);
              }}
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              <i className="fas fa-refresh mr-2"></i>
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredFreelancers.map((freelancer) => (
            <FreelancerCard
              key={freelancer.id}
              freelancer={freelancer}
              onContact={() => handleContact(freelancer)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
