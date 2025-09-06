import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Star, Send, MapPin, Briefcase, Shield, CheckCircle } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  reviewText: string;
  createdAt: string;
  customer: {
    firstName: string;
    lastName: string;
  };
}

interface FreelancerData {
  id: string;
  fullName: string;
  professionalTitle?: string;
  area?: string;
  profilePicture?: string;
  category?: {
    name: string;
  };
  hasTrustBadge?: boolean;
  hasVerifiedBadge?: boolean;
}

export default function FreelancerReviews() {
  const [, setLocation] = useLocation();
  const { user: firebaseUser, isAuthenticated } = useFirebaseAuth();
  const { toast } = useToast();
  
  const [freelancer, setFreelancer] = useState<FreelancerData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [freelancerLoading, setFreelancerLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    reviewText: ""
  });

  // Get freelancer ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const freelancerId = urlParams.get('id');

  useEffect(() => {
    if (!freelancerId) {
      setLocation('/customer');
      return;
    }

    fetchFreelancerData();
    fetchReviews();
  }, [freelancerId]);

  const fetchFreelancerData = async () => {
    try {
      const response = await fetch(`/api/freelancers/${freelancerId}`);
      if (response.ok) {
        const data = await response.json();
        
        // Transform snake_case to camelCase to match frontend interface
        const transformedData: FreelancerData = {
          id: data.id,
          fullName: data.full_name || data.fullName || 'Unknown Freelancer',
          professionalTitle: data.professional_title || data.professionalTitle,
          area: data.area,
          profilePicture: data.profile_photo_url || data.profilePicture,
          category: data.category ? {
            name: data.category.name
          } : undefined,
          hasTrustBadge: data.subscriptions?.some((sub: any) => sub.type === 'badge' && sub.badge_type === 'trusted') || false,
          hasVerifiedBadge: data.subscriptions?.some((sub: any) => sub.type === 'badge' && sub.badge_type === 'verified') || false,
        };
        
        console.log('Transformed freelancer data:', transformedData);
        setFreelancer(transformedData);
      } else {
        console.error('Failed to fetch freelancer data:', response.status);
        toast({
          title: "Error",
          description: "Failed to load freelancer information",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching freelancer data:', error);
      toast({
        title: "Error",
        description: "Failed to load freelancer information",
        variant: "destructive",
      });
    } finally {
      setFreelancerLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/freelancers/${freelancerId}/reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !firebaseUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit a review",
        variant: "destructive",
      });
      return;
    }

    if (!newReview.reviewText.trim()) {
      toast({
        title: "Review Required",
        description: "Please enter your review text",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiRequest('POST', `/api/freelancers/${freelancerId}/reviews`, {
        rating: newReview.rating,
        reviewText: newReview.reviewText.trim(),
      });

      if (response.ok) {
        toast({
          title: "Review Submitted",
          description: "Thank you for your review!",
        });
        
        // Reset form and refresh reviews
        setNewReview({ rating: 5, reviewText: "" });
        await fetchReviews();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to submit review",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center space-x-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : "button"}
            onClick={interactive ? () => onRatingChange?.(star) : undefined}
            className={`${interactive ? 'cursor-pointer hover:scale-125 active:scale-95 transition-all duration-200 ease-in-out' : ''}`}
            disabled={!interactive}
          >
            <Star
              className={`w-6 h-6 transition-all duration-200 ${
                star <= rating
                  ? 'text-yellow-400 fill-current drop-shadow-sm'
                  : 'text-gray-300 hover:text-yellow-200'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (freelancerLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="max-w-md mx-auto px-4 py-3">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/customer')}
                className="h-10 w-10 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900 flex-1 text-center">
                Write a Review
              </h1>
              <div className="w-10"></div>
            </div>
          </div>
        </div>

        {/* Loading Content */}
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading freelancer details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!freelancer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="max-w-md mx-auto px-4 py-3">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/customer')}
                className="h-10 w-10 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900 flex-1 text-center">
                Write a Review
              </h1>
              <div className="w-10"></div>
            </div>
          </div>
        </div>

        {/* Error Content */}
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Freelancer Not Found
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                The freelancer you're looking for doesn't exist or has been removed.
              </p>
              <Button
                onClick={() => setLocation('/customer')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/customer')}
              className="h-10 w-10 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900 flex-1 text-center">
              Write a Review
            </h1>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Freelancer Profile Card */}
        <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              {/* Profile Picture */}
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  {freelancer.profilePicture ? (
                    <img 
                      src={freelancer.profilePicture} 
                      alt={freelancer.fullName || 'Freelancer'}
                      className="w-full h-full rounded-2xl object-cover"
                    />
                  ) : (
                    <span className="text-white text-xl font-bold">
                      {freelancer.fullName ? freelancer.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                    </span>
                  )}
                </div>
                {/* Badges */}
                <div className="absolute -top-1 -right-1 flex space-x-1">
                  {freelancer.hasTrustBadge && (
                    <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                      <Shield className="w-3 h-3 text-yellow-800" />
                    </div>
                  )}
                  {freelancer.hasVerifiedBadge && (
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Freelancer Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 mb-1 truncate">
                  {freelancer.fullName || 'Unknown Freelancer'}
                </h2>
                {freelancer.professionalTitle && (
                  <p className="text-gray-600 text-sm mb-2 truncate">
                    {freelancer.professionalTitle}
                  </p>
                )}
                
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  {freelancer.area && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>{freelancer.area}</span>
                    </div>
                  )}
                  {freelancer.category && (
                    <div className="flex items-center space-x-1">
                      <Briefcase className="w-3 h-3" />
                      <span>{freelancer.category.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Review Form Card */}
        <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <form onSubmit={handleSubmitReview} className="space-y-6">
              {/* Star Rating */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                  How was your experience?
                </label>
                <div className="flex justify-center py-2">
                  {renderStars(newReview.rating, true, (rating) => 
                    setNewReview(prev => ({ ...prev, rating }))
                  )}
                </div>
                <p className="text-center text-sm text-gray-500">
                  {newReview.rating === 1 && "Poor"}
                  {newReview.rating === 2 && "Fair"}
                  {newReview.rating === 3 && "Good"}
                  {newReview.rating === 4 && "Very Good"}
                  {newReview.rating === 5 && "Excellent"}
                </p>
              </div>
              
              {/* Review Text */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                  Share your experience
                </label>
                <Textarea
                  placeholder="Share your experience..."
                  value={newReview.reviewText}
                  onChange={(e) => setNewReview(prev => ({ 
                    ...prev, 
                    reviewText: e.target.value 
                  }))}
                  rows={5}
                  className="resize-none border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
              
              {/* Submit Button */}
              <Button
                type="submit"
                disabled={submitting || !newReview.reviewText.trim()}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {submitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Send className="w-5 h-5" />
                    <span>Submit Review</span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Reviews List */}
        {reviews.length > 0 && (
          <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Customer Reviews ({reviews.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading reviews...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-white text-sm font-semibold">
                              {review.customer.firstName?.[0] || 'C'}
                            </span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 text-sm">
                              {review.customer.firstName} {review.customer.lastName}
                            </span>
                            <div className="mt-1">
                              {renderStars(review.rating)}
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-700 text-sm leading-relaxed ml-13">
                        {review.reviewText}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

