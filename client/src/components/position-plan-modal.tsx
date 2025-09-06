import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useFreelancerProfile } from '@/hooks/useFreelancerProfile';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CategoryAutoSuggest } from '@/components/CategoryAutoSuggest';
import { AreaAutoSuggest } from '@/components/AreaAutoSuggest';

interface PositionPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onPaymentRequired: (paymentDetails: {
    amount: number;
    description: string;
    position: number;
    categoryId: string;
    area: string;
  }) => void;
}

interface PositionAvailability {
  categoryId: string;
  area: string;
  takenPositions: number[];
  availablePositions: number[];
  currentPosition: number | null;
  canPurchase: boolean;
}

export default function PositionPlanModal({ isOpen, onClose, onSuccess, onPaymentRequired }: PositionPlanModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { freelancerProfile, isLoading: profileLoading } = useFreelancerProfile();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [availability, setAvailability] = useState<PositionAvailability | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  // Auto-fetch freelancer's area and category from profile when modal opens
  useEffect(() => {
    if (isOpen && freelancerProfile && !profileLoading) {
      // Set freelancer's area and category automatically
      if (freelancerProfile.area) {
        setSelectedArea(freelancerProfile.area);
      }
      if (freelancerProfile.categoryId && freelancerProfile.category) {
        setSelectedCategory(freelancerProfile.categoryId);
        setSelectedCategoryName(freelancerProfile.category.name);
      }
    }
  }, [isOpen, freelancerProfile, profileLoading]);

  // Check position availability when category and area are selected
  useEffect(() => {
    if (selectedCategory && selectedArea) {
      checkAvailability();
    } else {
      setAvailability(null);
      setSelectedPosition(null);
    }
  }, [selectedCategory, selectedArea]);

  const checkAvailability = async () => {
    if (!selectedCategory || !selectedArea) return;
    
    setIsCheckingAvailability(true);
    setAvailabilityError(null);
    try {
      console.log('Checking position availability for:', { selectedCategory, selectedArea });
      const response = await apiRequest('GET', `/api/freelancer/position-plans/availability/${selectedCategory}/${selectedArea}`);
      const data = await response.json();
      console.log('Position availability response:', data);
      setAvailability(data);
    } catch (error) {
      console.error('Error checking availability:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to check position availability';
      setAvailabilityError(errorMessage);
      setAvailability(null);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  // Purchase position plan mutation - now triggers payment flow
  const purchaseMutation = useMutation({
    mutationFn: async ({ position, amount }: { position: number; amount: number }) => {
      // Instead of directly purchasing, we'll trigger the payment flow
      // This mutation now just validates the purchase and triggers payment
      return { position, amount, categoryId: selectedCategory, area: selectedArea };
    },
    onSuccess: (data) => {
      // Trigger payment flow instead of direct success
      onPaymentRequired({
        amount: data.amount,
        description: `Position ${getPositionLabel(data.position)} plan for ${selectedCategoryName} in ${selectedArea}`,
        position: data.position,
        categoryId: data.categoryId,
        area: data.area,
      });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to initiate position plan purchase';
      
      // Handle specific error cases
      if (error.status === 409 || message.includes('already have') || message.includes('already taken')) {
        toast({
          title: "Position Not Available",
          description: message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      }
    },
  });

  // Handle category selection from auto-suggest
  const handleCategorySelect = (categoryId: string, categoryName: string) => {
    setSelectedCategory(categoryId);
    setSelectedCategoryName(categoryName);
    // Clear availability when category changes
    setAvailability(null);
    setSelectedPosition(null);
    setAvailabilityError(null);
  };

  // Handle area selection from auto-suggest
  const handleAreaSelect = (area: string) => {
    setSelectedArea(area);
    // Clear availability when area changes
    setAvailability(null);
    setSelectedPosition(null);
    setAvailabilityError(null);
  };

  const resetForm = () => {
    setSelectedCategory('');
    setSelectedCategoryName('');
    setSelectedArea('');
    setSelectedPosition(null);
    setAvailability(null);
    setAvailabilityError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getPositionPrice = (position: number) => {
    switch (position) {
      case 1: return 1999;
      case 2: return 999;
      case 3: return 699;
      default: return 0;
    }
  };

  const getPositionLabel = (position: number) => {
    switch (position) {
      case 1: return 'I';
      case 2: return 'II';
      case 3: return 'III';
      default: return position.toString();
    }
  };

  const handlePurchase = (position: number) => {
    const amount = getPositionPrice(position);
    purchaseMutation.mutate({ position, amount });
  };



  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Purchase Position Plan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Auto-fetched Category and Area Display */}
          {profileLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="spinner"></div>
              <span className="ml-2">Loading your profile...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Category Display */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Your Category</label>
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-tag text-blue-500"></i>
                      <span className="text-blue-800 font-medium">
                        {selectedCategoryName || 'No category set in profile'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Area Display */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Your Area</label>
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-map-marker-alt text-green-500"></i>
                      <span className="text-green-800 font-medium">
                        {selectedArea || 'No area set in profile'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Info Message */}
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-info-circle text-yellow-500"></i>
                    <span className="text-yellow-800 text-sm">
                      Position Plan will be created for your profile category and area automatically.
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Availability Status */}
          {selectedCategory && selectedArea && (
            <div className="space-y-4">
              {isCheckingAvailability ? (
                <div className="flex items-center justify-center py-4">
                  <div className="spinner"></div>
                  <span className="ml-2">Checking availability...</span>
                </div>
              ) : availability ? (
                <div className="space-y-4">
                  {/* Current Status */}
                  {availability.currentPosition ? (
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <i className="fas fa-check-circle text-green-500"></i>
                          <span className="text-green-800 font-medium">
                            You already have Position {getPositionLabel(availability.currentPosition)} in this category and area
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-blue-800">Available Positions</h4>
                            <p className="text-sm text-blue-600">
                              {availability.availablePositions.length} of 3 positions available
                            </p>
                          </div>
                          <div className="flex space-x-1">
                            {[1, 2, 3].map((pos) => (
                              <div
                                key={pos}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                  availability.takenPositions.includes(pos)
                                    ? 'bg-red-100 text-red-600'
                                    : 'bg-green-100 text-green-600'
                                }`}
                              >
                                {getPositionLabel(pos)}
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Position Options */}
                  {availability.canPurchase && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Available Positions</h4>
                      {availability.availablePositions.map((position) => (
                        <Card key={position} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                  <span className="text-yellow-600 font-bold text-lg">
                                    {getPositionLabel(position)}
                                  </span>
                                </div>
                                <div>
                                  <h5 className="font-semibold">Position {getPositionLabel(position)}</h5>
                                  <p className="text-sm text-muted-foreground">
                                    {position === 1 && 'Top priority in search results'}
                                    {position === 2 && 'Second priority in search results'}
                                    {position === 3 && 'Third priority in search results'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className="font-bold text-lg">₹{getPositionPrice(position)}</span>
                                <Button
                                  onClick={() => handlePurchase(position)}
                                  disabled={purchaseMutation.isPending}
                                  className="bg-gradient-purple text-white"
                                >
                                  {purchaseMutation.isPending ? (
                                    <div className="spinner"></div>
                                  ) : (
                                    'Purchase'
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ) : availabilityError ? (
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <i className="fas fa-exclamation-triangle text-red-500"></i>
                        <div>
                          <h4 className="font-medium text-red-800">Failed to Check Availability</h4>
                          <p className="text-sm text-red-600">{availabilityError}</p>
                        </div>
                      </div>
                      <Button
                        onClick={checkAvailability}
                        disabled={isCheckingAvailability}
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        {isCheckingAvailability ? (
                          <div className="spinner w-4 h-4"></div>
                        ) : (
                          <>
                            <i className="fas fa-refresh mr-1"></i>
                            Retry
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          )}

          {/* Instructions */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">How Position Plans Work</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Only 3 freelancers can hold positions per category and area</li>
                <li>• Position I appears first in customer search results</li>
                <li>• Position II appears second in customer search results</li>
                <li>• Position III appears third in customer search results</li>
                <li>• Position plans are valid for 1 month</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
