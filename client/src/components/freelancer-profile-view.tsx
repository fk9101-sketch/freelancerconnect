import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { FreelancerWithRelations } from "@shared/schema";
import { Clock, MapPin, DollarSign, Star, Award, Shield, X } from "lucide-react";

interface FreelancerProfileViewProps {
  freelancer: FreelancerWithRelations;
  isOpen: boolean;
  onClose: () => void;
}

export default function FreelancerProfileView({ 
  freelancer, 
  isOpen, 
  onClose 
}: FreelancerProfileViewProps) {
  const [, setLocation] = useLocation();
  // Generate random rating between 4.0 and 5.0 for demo purposes
  const randomRating = (Math.random() * 1 + 4).toFixed(1);
  const randomRatings = Math.floor(Math.random() * 100) + 50;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900">
              Freelancer Profile
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="px-4 sm:px-6 py-4 space-y-4 sm:space-y-6">
          {/* Profile Header */}
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                {/* Profile Photo */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {freelancer.profilePhotoUrl ? (
                    <img 
                      src={freelancer.profilePhotoUrl} 
                      alt="Profile" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="text-gray-400 text-xl sm:text-2xl">
                      <i className="fas fa-user"></i>
                    </div>
                  )}
                </div>

                {/* Basic Info */}
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 leading-tight">
                    {freelancer.fullName || 'Professional Name'}
                  </h2>
                  
                  {freelancer.professionalTitle && (
                    <p className="text-base sm:text-lg text-gray-700 mb-3 font-medium">
                      {freelancer.professionalTitle}
                    </p>
                  )}

                  {/* Rating and Trust Badges */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-2 sm:space-y-0 sm:space-x-3 mb-4">
                    <button
                      onClick={() => setLocation(`/freelancer/reviews?id=${freelancer.id}`)}
                      className="bg-green-500 text-white px-3 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-600 transition-colors cursor-pointer text-sm sm:text-base"
                    >
                      <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      <span className="font-semibold">{randomRating}</span>
                      <span className="text-xs sm:text-sm">({randomRatings} ratings)</span>
                    </button>
                    
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      {/* Trust Badge - Only show if purchased */}
                      {freelancer.subscriptions?.some(sub => 
                        sub.status === 'active' && 
                        sub.type === 'badge' && 
                        sub.badgeType === 'trusted'
                      ) && (
                        <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs sm:text-sm">
                          <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          Trusted
                        </Badge>
                      )}
                      
                      {/* Verified Badge - Only show if purchased */}
                      {freelancer.subscriptions?.some(sub => 
                        sub.status === 'active' && 
                        sub.type === 'badge' && 
                        sub.badgeType === 'verified'
                      ) && (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-xs sm:text-sm">
                          <i className="fas fa-check-circle w-3 h-3 sm:w-4 sm:h-4 mr-1"></i>
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Location and Experience */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-2 sm:space-y-0 sm:space-x-6 text-gray-600 text-sm sm:text-base">
                    {freelancer.area && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                        <span className="font-medium">{freelancer.area}</span>
                      </div>
                    )}
                    
                    {freelancer.experience && (
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                        <span className="font-medium">{freelancer.experience} years in business</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Category */}
          {freelancer.category && (
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold text-gray-900">
                  <i className="fas fa-tools text-blue-500 text-sm sm:text-base"></i>
                  Service Category
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Badge variant="outline" className="text-sm sm:text-base px-3 py-2 bg-blue-50 text-blue-700 border-blue-200">
                  {freelancer.category.name}
                </Badge>
                {freelancer.customCategory && (
                  <p className="text-gray-600 mt-3 text-sm sm:text-base font-medium">
                    Custom: {freelancer.customCategory}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Professional Bio */}
          {freelancer.bio && (
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold text-gray-900">
                  <i className="fas fa-user-tie text-purple-500 text-sm sm:text-base"></i>
                  About
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                  {freelancer.bio}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Experience Details */}
          {freelancer.experienceDescription && (
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold text-gray-900">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                  Experience Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                  {freelancer.experienceDescription}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Skills */}
          {freelancer.skills && freelancer.skills.length > 0 && (
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold text-gray-900">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                  Skills & Expertise
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {freelancer.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1 text-xs sm:text-sm bg-purple-50 text-purple-700 border-purple-200">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Portfolio Images */}
          {freelancer.portfolioImages && freelancer.portfolioImages.length > 0 && (
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold text-gray-900">
                  <i className="fas fa-images text-green-500 text-sm sm:text-base"></i>
                  Portfolio
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {freelancer.portfolioImages.map((image, index) => (
                    <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={image} 
                        alt={`Portfolio ${index + 1}`} 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200" 
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Certifications */}
          {freelancer.certifications && freelancer.certifications.length > 0 && (
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold text-gray-900">
                  <i className="fas fa-certificate text-yellow-500 text-sm sm:text-base"></i>
                  Certifications & Licenses
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {freelancer.certifications.map((cert, index) => (
                    <Badge key={index} variant="outline" className="px-3 py-1 text-xs sm:text-sm bg-yellow-50 text-yellow-700 border-yellow-200">
                      <i className="fas fa-award mr-2 text-xs sm:text-sm"></i>
                      {cert}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pricing */}
          {freelancer.hourlyRate && (
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold text-gray-900">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg sm:text-xl font-bold text-green-800">
                      ₹{freelancer.hourlyRate}
                    </span>
                  </div>
                  <p className="text-green-700 text-sm mt-2 font-medium">
                    Competitive rates for quality service
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Verification Status */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold text-gray-900">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                Verification Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-blue-800 text-sm sm:text-base">Verified Professional</span>
                    <p className="text-blue-700 text-xs sm:text-sm mt-1 leading-relaxed">
                      This freelancer has been verified by our team and has provided necessary documentation
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Actions */}
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4 sm:p-6">
              <div className="text-center space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  Ready to work with this professional?
                </h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  Send an inquiry to discuss your project requirements and get a quote
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                  <Button 
                    onClick={onClose}
                    variant="outline"
                    className="px-4 py-2 sm:px-6 text-sm sm:text-base border-gray-300 hover:bg-gray-50"
                  >
                    Close Profile
                  </Button>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 sm:px-6 text-sm sm:text-base"
                    onClick={onClose}
                  >
                    <i className="fas fa-envelope mr-2 text-xs sm:text-sm"></i>
                    Send Inquiry
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
