import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { loadRazorpayScript, getRazorpayOptions, createRazorpayInstance, validateRazorpayConfig } from '@/lib/razorpay-config';

interface RazorpayPaymentProps {
  amount: number;
  description: string;
  subscriptionId?: string;
  customerDetails?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  paymentType?: 'lead' | 'position' | 'badge';
  positionPlanDetails?: {
    position: number;
    categoryId: string;
    area: string;
  };
  onSuccess: (paymentId: string) => void;
  onFailure: (error: string) => void;
  onCancel: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RazorpayPayment({
  amount,
  description,
  subscriptionId,
  customerDetails,
  paymentType,
  positionPlanDetails,
  onSuccess,
  onFailure,
  onCancel
}: RazorpayPaymentProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Pre-load Razorpay script on component mount
  useEffect(() => {
    const loadScript = async () => {
      try {
        await loadRazorpayScript();
        setScriptLoaded(true);
        console.log('Razorpay script loaded successfully');
      } catch (error) {
        console.error('Failed to load Razorpay script:', error);
        toast({
          title: "Error",
          description: "Failed to load payment gateway. Please refresh the page and try again.",
          variant: "destructive",
        });
      }
    };
    loadScript();
  }, [toast]);

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      console.log('Creating payment order for amount:', amount);
      const response = await apiRequest('POST', '/api/payments/create-order', {
        amount,
        description,
        subscriptionId,
        paymentType,
        positionPlanDetails
      });
      
      // Ensure we get the response data correctly
      const responseData = await response.json();
      console.log('Payment order response:', responseData);
      return responseData;
    },
    onError: (error: any) => {
      console.error('Order creation failed:', error);
      let errorMessage = "Failed to create payment order";
      
      // Extract error message from response
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response) {
        try {
          const errorData = JSON.parse(error.response);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = error.response || errorMessage;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      onFailure(errorMessage);
    }
  });

  // Verify payment mutation
  const verifyPaymentMutation = useMutation({
    mutationFn: async (paymentData: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => {
      console.log('Verifying payment:', paymentData);
      try {
        const response = await apiRequest('POST', '/api/payments/verify', paymentData);
        // Parse the JSON response
        const responseData = await response.json();
        console.log('Payment verification response:', responseData);
        return responseData;
      } catch (error: any) {
        console.error('Payment verification API error:', error);
        // If the API request fails, try to extract error details
        let errorMessage = 'Payment verification failed';
        if (error.message) {
          errorMessage = error.message;
        }
        throw new Error(errorMessage);
      }
    },
    onSuccess: (data) => {
      console.log('Payment verified successfully:', data);
      
      // Check if verification was successful
      if (data.success) {
        toast({
          title: "✅ Payment Successful!",
          description: "Your plan has been activated!",
        });
        
        // Call the success callback
        onSuccess(data.paymentId || 'verified');
        
        // Redirect to payment success page with verification status
        const successUrl = `/payment-success?verified=true&subscriptionType=${data.subscriptionType || 'lead'}`;
        window.location.href = successUrl;
      } else {
        // Handle verification failure
        toast({
          title: "❌ Payment Verification Failed",
          description: data.message || "Please try again.",
          variant: "destructive",
        });
        onFailure(data.message || "Payment verification failed. Please try again.");
      }
    },
    onError: (error: any) => {
      console.error('Payment verification failed:', error);
      
      // Extract error message from response
      let errorMessage = "Payment verification failed. Please try again.";
      
      if (error.message) {
        // Check if it's a status code error (e.g., "400: Invalid payment signature")
        if (error.message.includes(':')) {
          const parts = error.message.split(':');
          if (parts.length >= 2) {
            const statusCode = parts[0].trim();
            const message = parts.slice(1).join(':').trim();
            
            if (statusCode === '400') {
              errorMessage = `Payment verification failed: ${message}`;
            } else if (statusCode === '500') {
              errorMessage = `Server error: ${message}`;
            } else {
              errorMessage = message;
            }
          } else {
            errorMessage = error.message;
          }
        } else {
          errorMessage = error.message;
        }
      }
      
      console.error('Final error message:', errorMessage);
      
      toast({
        title: "❌ Payment Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
      onFailure(errorMessage);
    }
  });

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      
      // Validate Razorpay configuration
      validateRazorpayConfig();
      
      // Ensure script is loaded
      if (!scriptLoaded) {
        await loadRazorpayScript();
        setScriptLoaded(true);
      }
      
      // Create order
      const orderData = await createOrderMutation.mutateAsync();
      
      if (!orderData || !orderData.orderId) {
        throw new Error('Failed to create payment order');
      }
      
      console.log('Order created successfully:', orderData);

      // Configure Razorpay options
      const options = {
        ...getRazorpayOptions(orderData, description, customerDetails),
        handler: function (response: any) {
          console.log('=== RAZORPAY PAYMENT SUCCESS HANDLER ===');
          console.log('Payment response:', response);
          console.log('Response keys:', Object.keys(response));
          console.log('Response values:', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          
          // Validate that we have all required fields
          if (!response.razorpay_order_id || !response.razorpay_payment_id || !response.razorpay_signature) {
            console.error('Missing required payment fields:', {
              hasOrderId: !!response.razorpay_order_id,
              hasPaymentId: !!response.razorpay_payment_id,
              hasSignature: !!response.razorpay_signature,
            });
            toast({
              title: "❌ Payment Error",
              description: "Invalid payment response. Please try again.",
              variant: "destructive",
            });
            onFailure("Invalid payment response from Razorpay");
            return;
          }
          
          // Verify payment on server
          verifyPaymentMutation.mutate({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal dismissed');
            onCancel();
          }
        },
        // Add error handler
        prefill: {
          name: customerDetails?.name || 'Test User',
          email: customerDetails?.email || 'test@example.com',
          contact: customerDetails?.contact || '9999999999'
        },
        notes: {
          address: 'HireLocal Office',
          description: description
        },
        theme: {
          color: '#6366f1'
        }
      };

      console.log('Opening Razorpay checkout with options:', options);

      // Open Razorpay checkout
      const rzp = createRazorpayInstance(options);
      
      // Add error handling for the checkout
      rzp.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response.error);
        let errorMessage = 'Payment failed';
        
        if (response.error) {
          if (response.error.code === 'PAYMENT_CANCELLED') {
            errorMessage = 'Payment was cancelled by the user';
          } else if (response.error.code === 'INSUFFICIENT_FUNDS') {
            errorMessage = 'Insufficient funds in your account';
          } else if (response.error.code === 'NETWORK_ERROR') {
            errorMessage = 'Network error. Please check your internet connection';
          } else if (response.error.description) {
            errorMessage = response.error.description;
          }
        }
        
        toast({
          title: "Payment Failed",
          description: errorMessage,
          variant: "destructive",
        });
        onFailure(errorMessage);
      });
      
      rzp.open();
      
    } catch (error: any) {
      console.error('Payment error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Payment failed';
      if (error.message) {
        if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('cancelled')) {
          errorMessage = 'Payment was cancelled.';
        } else if (error.message.includes('insufficient')) {
          errorMessage = 'Insufficient funds. Please check your account balance.';
        } else if (error.message.includes('script')) {
          errorMessage = 'Payment gateway failed to load. Please refresh the page and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });
      onFailure(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Complete Payment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">₹{amount}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Payment methods available:
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm">
            <span className="flex items-center">
              <i className="fas fa-credit-card mr-1"></i>
              Cards
            </span>
            <span className="flex items-center">
              <i className="fas fa-mobile-alt mr-1"></i>
              UPI
            </span>
            <span className="flex items-center">
              <i className="fas fa-university mr-1"></i>
              Net Banking
            </span>
            <span className="flex items-center">
              <i className="fas fa-wallet mr-1"></i>
              Wallets
            </span>
          </div>
          

        </div>

        <div className="flex space-x-2">
          <Button
            onClick={handlePayment}
            disabled={isLoading || createOrderMutation.isPending || !scriptLoaded}
            className="flex-1"
          >
            {isLoading || createOrderMutation.isPending ? (
              <div className="flex items-center">
                <div className="spinner mr-2"></div>
                Processing...
              </div>
            ) : (
              'Pay Now'
            )}
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>

        {verifyPaymentMutation.isPending && (
          <div className="text-center text-sm text-muted-foreground">
            Verifying payment...
          </div>
        )}
        
        {!scriptLoaded && (
          <div className="text-center text-sm text-muted-foreground">
            Loading payment gateway...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
