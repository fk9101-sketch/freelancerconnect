import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function PaymentSuccess() {
  const { isAuthenticated, isLoading } = useFirebaseAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(true);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [subscriptionType, setSubscriptionType] = useState<string>('lead');

  // Get URL parameters from Razorpay redirect
  const urlParams = new URLSearchParams(window.location.search);
  const isVerified = urlParams.get('verified') === 'true';
  const urlSubscriptionType = urlParams.get('subscriptionType') || 'lead';
  const razorpayOrderId = urlParams.get('razorpay_order_id');
  const razorpayPaymentId = urlParams.get('razorpay_payment_id');
  const razorpaySignature = urlParams.get('razorpay_signature');

  // Handle payment success on component mount
  useEffect(() => {
    const handlePaymentSuccess = async () => {
      try {
        // If payment is already verified (from RazorpayPayment component), show success
        if (isVerified) {
          console.log('Payment already verified, showing success page');
          setVerificationSuccess(true);
          setSubscriptionType(urlSubscriptionType);
          
          // Show success toast
          const isPositionPlan = urlSubscriptionType === 'position';
          if (isPositionPlan) {
            toast({
              title: "✅ Payment Successful!",
              description: "Your Position Plan is now active.",
            });
          } else {
            toast({
              title: "✅ Payment Successful!",
              description: "Your Lead Plan is Activated!",
            });
          }
          
          // Auto-redirect to my-plans page after 3 seconds with countdown
          let countdown = 3;
          const countdownInterval = setInterval(() => {
            countdown--;
            setRedirectCountdown(countdown);
            if (countdown <= 0) {
              clearInterval(countdownInterval);
              setLocation('/my-plans');
            }
          }, 1000);
          
          setVerifying(false);
          return;
        }

        // Legacy flow: If we have Razorpay parameters, verify payment
        if (razorpayOrderId && razorpayPaymentId && razorpaySignature) {
          console.log('Verifying payment with parameters:', {
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature
          });

          // Verify payment on server
          const response = await apiRequest('POST', '/api/payments/verify', {
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: razorpaySignature,
          });

          const responseData = await response.json();
          console.log('Payment verification response:', responseData);

          if (responseData && responseData.success) {
            setVerificationSuccess(true);
            
            // Store subscription type for display
            const subType = responseData.subscriptionType || 'lead';
            setSubscriptionType(subType);
            
            // Check if this is a Position Plan payment
            const isPositionPlan = subType === 'position';
            
            if (isPositionPlan) {
              toast({
                title: "✅ Payment Successful!",
                description: "Your Position Plan is now active.",
              });
            } else {
              toast({
                title: "✅ Payment Successful!",
                description: "Your Lead Plan is Activated!",
              });
            }
            
            // Auto-redirect to my-plans page after 3 seconds with countdown
            let countdown = 3;
            const countdownInterval = setInterval(() => {
              countdown--;
              setRedirectCountdown(countdown);
              if (countdown <= 0) {
                clearInterval(countdownInterval);
                setLocation('/my-plans');
              }
            }, 1000);
          } else if (responseData && responseData.errorType === 'DUPLICATE_PLAN_DURING_PAYMENT') {
            // Handle duplicate plan detected during payment verification
            setError(`You have already taken this plan. Your existing plan expires on ${new Date(responseData.details.expiryDate).toLocaleDateString()}.`);
            toast({
              title: "Duplicate Plan Detected",
              description: "You have already taken this plan. Please check your active plans.",
              variant: "destructive",
            });
          } else {
            throw new Error((responseData && responseData.message) || 'Payment verification failed');
          }
        } else {
          // No verification parameters found
          setError('No payment information found. Please try again.');
        }
      } catch (error: any) {
        console.error('Payment verification error:', error);
        setError(error.message || 'Failed to verify payment. Please contact support.');
        toast({
          title: "Verification Failed",
          description: error.message || "Payment verification failed",
          variant: "destructive",
        });
      } finally {
        setVerifying(false);
      }
    };

    // Only process if authenticated
    if (!isLoading && isAuthenticated) {
      handlePaymentSuccess();
    } else if (!isLoading && !isAuthenticated) {
      // If not authenticated, redirect to landing
      setLocation('/');
    }
  }, [isAuthenticated, isLoading, isVerified, urlSubscriptionType, razorpayOrderId, razorpayPaymentId, razorpaySignature, setLocation, toast]);

  const handleGoToMyPlans = () => {
    setLocation('/my-plans');
  };

  const handleViewSubscriptions = () => {
    setLocation('/plans');
  };

  const handleTryAgain = () => {
    setLocation('/plans');
  };

  if (isLoading || verifying) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
              </div>
              <CardTitle className="text-2xl text-blue-600">Verifying Payment...</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-foreground">
                  Please wait while we verify your payment
                </p>
                <p className="text-sm text-muted-foreground">
                  This may take a few moments.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show error if verification failed
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-red-500" />
              </div>
              <CardTitle className="text-2xl text-red-600">Payment Verification Failed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-foreground">
                  ❌ Payment Failed! Please try again.
                </p>
                <p className="text-sm text-muted-foreground">
                  Please try again or contact support if the issue persists.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleTryAgain}
                  className="w-full"
                >
                  Try Again
                </Button>
                <Button
                  onClick={handleGoToMyPlans}
                  variant="outline"
                  className="w-full"
                >
                  Go to My Plans
                </Button>
              </div>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Need help? Contact our support team at{' '}
                  <a href="mailto:support@hirelocal.com" className="text-primary hover:underline">
                    support@hirelocal.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show success if verification passed
  if (verificationSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-foreground">
                  ✅ Payment Successful! {subscriptionType === 'position' ? 'Your Position Plan is now active.' : 'Your Lead Plan is Activated.'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Your subscription has been activated and you can now access all premium features.
                </p>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <i className="fas fa-clock mr-2"></i>
                    Redirecting to My Plans in <span className="font-bold text-blue-900">{redirectCountdown}</span> seconds...
                  </p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">What's Next?</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Your subscription is now active</li>
                  <li>• You can accept unlimited leads</li>
                  <li>• Get priority in search results</li>
                  <li>• Access to premium features</li>
                  <li>• Check your dashboard to see your active plans</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleGoToMyPlans}
                  className="w-full"
                >
                  Go to My Plans
                </Button>
                <Button
                  onClick={handleViewSubscriptions}
                  variant="outline"
                  className="w-full"
                >
                  View Subscriptions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Fallback - should not reach here
  return null;
}
