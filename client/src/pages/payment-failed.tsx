import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle } from 'lucide-react';

export default function PaymentFailed() {
  const { isAuthenticated, isLoading } = useFirebaseAuth();
  const [, setLocation] = useLocation();
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // Get URL parameters from Razorpay redirect
  const urlParams = new URLSearchParams(window.location.search);
  const razorpayOrderId = urlParams.get('razorpay_order_id');
  const razorpayPaymentId = urlParams.get('razorpay_payment_id');
  const razorpaySignature = urlParams.get('razorpay_signature');
  const errorCode = urlParams.get('error_code');
  const errorDescription = urlParams.get('error_description');
  const errorSource = urlParams.get('error_source');
  const errorStep = urlParams.get('error_step');
  const errorReason = urlParams.get('error_reason');

  // Process error details on component mount
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Build error message from URL parameters
      let errorMessage = 'Payment was not completed successfully.';
      
      if (errorCode || errorDescription || errorReason) {
        const details = [];
        if (errorCode) details.push(`Error Code: ${errorCode}`);
        if (errorDescription) details.push(`Description: ${errorDescription}`);
        if (errorReason) details.push(`Reason: ${errorReason}`);
        if (errorSource) details.push(`Source: ${errorSource}`);
        if (errorStep) details.push(`Step: ${errorStep}`);
        
        errorMessage = details.join('\n');
        setErrorDetails(errorMessage);
      }

      // Log payment failure details for debugging
      console.log('Payment failed with details:', {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        errorCode,
        errorDescription,
        errorSource,
        errorStep,
        errorReason
      });
    } else if (!isLoading && !isAuthenticated) {
      // If not authenticated, redirect to landing
      setLocation('/');
    }
  }, [isAuthenticated, isLoading, razorpayOrderId, razorpayPaymentId, razorpaySignature, errorCode, errorDescription, errorSource, errorStep, errorReason, setLocation]);

  const handleTryAgain = () => {
    setLocation('/plans');
  };

  const handleGoToDashboard = () => {
    setLocation('/freelancer');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-2xl text-red-600">Payment Failed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-foreground">
                We couldn't process your payment
              </p>
              <p className="text-sm text-muted-foreground">
                Don't worry, your account hasn't been charged. Please try again or contact support if the issue persists.
              </p>
            </div>

            {/* Show specific error details if available */}
            {errorDetails && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">Error Details:</h4>
                <div className="text-sm text-red-700 whitespace-pre-line">
                  {errorDetails}
                </div>
              </div>
            )}

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-2">Possible reasons:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Insufficient funds in your account</li>
                <li>• Network connectivity issues</li>
                <li>• Payment gateway temporarily unavailable</li>
                <li>• Incorrect payment details</li>
                <li>• Payment was cancelled by you</li>
                <li>• Bank declined the transaction</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleTryAgain}
                className="w-full"
              >
                Try Again
              </Button>
              <Button
                onClick={handleGoToDashboard}
                variant="outline"
                className="w-full"
              >
                Go to Dashboard
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

            {/* Show payment reference if available */}
            {razorpayOrderId && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Reference: {razorpayOrderId}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
