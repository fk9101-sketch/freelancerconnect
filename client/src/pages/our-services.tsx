import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Home, Car, Laptop, Palette, Heart, Briefcase, Star, Shield, Clock, ArrowRight } from "lucide-react";
import Navigation from "@/components/navigation";

export default function OurServices() {
  const { isAuthenticated, isLoading } = useFirebaseAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
      return;
    }
  }, [isAuthenticated, isLoading, setLocation]);

  const handleGoBack = () => {
    setLocation('/customer-dashboard');
  };

  // Service data with modern icons and descriptions
  const services = [
    {
      id: 1,
      name: "Home Services",
      description: "Professional cleaning, repairs, maintenance, and renovation services for your home",
      icon: Home,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
      hoverColor: "hover:border-blue-200",
      action: "Find Providers"
    },
    {
      id: 2,
      name: "Automotive Services",
      description: "Expert car maintenance, repairs, detailing, and roadside assistance",
      icon: Car,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-100",
      hoverColor: "hover:border-green-200",
      action: "Get Quote"
    },
    {
      id: 3,
      name: "Technology Support",
      description: "IT support, device repair, software installation, and tech consulting",
      icon: Laptop,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-100",
      hoverColor: "hover:border-purple-200",
      action: "Book Service"
    },
    {
      id: 4,
      name: "Creative Services",
      description: "Professional design, photography, videography, and creative consulting",
      icon: Palette,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      borderColor: "border-pink-100",
      hoverColor: "hover:border-pink-200",
      action: "View Portfolio"
    },
    {
      id: 5,
      name: "Health & Wellness",
      description: "Personal training, massage therapy, nutrition consulting, and wellness services",
      icon: Heart,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-100",
      hoverColor: "hover:border-red-200",
      action: "Book Session"
    },
    {
      id: 6,
      name: "Business Services",
      description: "Accounting, legal services, marketing, and business consulting",
      icon: Briefcase,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-100",
      hoverColor: "hover:border-indigo-200",
      action: "Get Consultation"
    }
  ];

  // Filter services based on search query
  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Status Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center text-sm text-gray-600">
        <span>9:41 AM</span>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleGoBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowRight className="w-5 h-5 text-gray-600 rotate-180" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Our Services</h1>
              <p className="text-gray-500 text-sm">Discover what we offer</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white px-6 py-4 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-3 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 transition-all duration-200 rounded-xl"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl mb-4 shadow-lg">
            <Star className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Comprehensive Local Services</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Connect with verified local professionals for all your service needs. 
            Quality, reliability, and convenience at your fingertips.
          </p>
        </div>

        {/* Services Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Service Categories</h3>
              <p className="text-sm text-gray-600 mt-1">
                {filteredServices.length} services available
              </p>
            </div>
          </div>

          {/* Responsive Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Card 
                  key={service.id}
                  className={`
                    group bg-white border-2 border-gray-100 rounded-2xl transition-all duration-300 ease-in-out
                    hover:shadow-xl hover:-translate-y-2 cursor-pointer overflow-hidden
                    ${service.hoverColor}
                  `}
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    animation: 'fadeInUp 0.6s ease-out forwards',
                    opacity: 0
                  }}
                >
                  <CardHeader className="pb-4 pt-6">
                    <div className={`service-icon inline-flex items-center justify-center w-16 h-16 ${service.bgColor} rounded-2xl mb-4 transition-transform duration-300 group-hover:scale-110`}>
                      <IconComponent className={`w-8 h-8 ${service.color}`} />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                      {service.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pb-6">
                    <p className="text-gray-600 leading-relaxed text-sm">
                      {service.description}
                    </p>
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105 border-0"
                      onClick={() => console.log(`Clicked ${service.name}`)}
                    >
                      <span className="mr-2">{service.action}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* No results message */}
          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
              <p className="text-gray-500">Try adjusting your search terms</p>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
          <div className="text-center space-y-8">
            <h3 className="text-2xl font-bold text-gray-900">Why Choose Our Services?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-2xl">
                  <Shield className="w-7 h-7 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-800 text-lg">Verified Professionals</h4>
                <p className="text-sm text-gray-600 leading-relaxed">All service providers are thoroughly vetted and verified for your safety</p>
              </div>
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-2xl">
                  <Clock className="w-7 h-7 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-800 text-lg">Quick Response</h4>
                <p className="text-sm text-gray-600 leading-relaxed">Get responses within hours, not days. Fast service when you need it most</p>
              </div>
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-100 rounded-2xl">
                  <Star className="w-7 h-7 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-800 text-lg">Quality Guaranteed</h4>
                <p className="text-sm text-gray-600 leading-relaxed">Satisfaction guaranteed or your money back. We stand by our quality</p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center space-y-6 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900">Ready to Get Started?</h3>
          <p className="text-gray-600 text-lg">Find the perfect service provider for your needs today</p>
          <Button 
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium py-4 px-8 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105 border-0 text-lg"
            onClick={() => setLocation('/customer-search')}
          >
            <Search className="w-5 h-5 mr-2" />
            Search Services
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <Navigation userRole="customer" />
    </div>
  );
}
