import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/queryClient';
import { loadRazorpayScript, getRazorpayOptions, createRazorpayInstance, validateRazorpayConfig } from '@/lib/razorpay-config';

interface CustomerPaymentProps {
  amount: number;
  description: string;
  onSuccess: (paymentId: string) => void;
  onFailure: (error: string) => void;
  onCancel: () => void;
}

export default function CustomerPayment({
  amount,
  description,
  onSuccess,
  onFailure,
  onCancel
}: CustomerPaymentProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      console.log('Creating customer payment order for amount:', amount);
      const response = await apiRequest('POST', '/api/payments/create-order', {
        amount,
        description
      });
      
      // Ensure we get the response data correctly
      const responseData = await response.json();
      console.log('Customer payment order response:', responseData);
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
      console.log('Verifying customer payment:', paymentData);
      return await apiRequest('POST', '/api/payments/verify', paymentData);
    },
    onSuccess: (data) => {
      console.log('Customer payment verified successfully:', data);
      toast({
        title: "✅ Payment Successful!",
        description: "Your payment has been completed!",
      });
      onSuccess(data.paymentId || 'verified');
    },
    onError: (error: any) => {
      console.error('Customer payment verification failed:', error);
      toast({
        title: "❌ Payment Failed",
        description: "Please try again.",
        variant: "destructive",
      });
      onFailure("Payment verification failed. Please try again.");
    }
  });

  const handlePayment = async () => {
    if (!customerName || !customerEmail || !customerPhone) {
      toast({
        title: "Error",
        description: "Please fill in all customer details",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Validate Razorpay configuration
      validateRazorpayConfig();
      
      // Create order
      const orderData = await createOrderMutation.mutateAsync();
      
      if (!orderData || !orderData.orderId) {
        throw new Error('Failed to create payment order');
      }
      
      console.log('Customer order created successfully:', orderData);
      
      // Load Razorpay script
      await loadRazorpayScript();

      // Configure Razorpay options
      const options = {
        ...getRazorpayOptions(orderData, description, {
          name: customerName,
          email: customerEmail,
          contact: customerPhone
        }),
        handler: function (response: any) {
          console.log('=== CUSTOMER RAZORPAY PAYMENT SUCCESS HANDLER ===');
          console.log('Payment response:', response);
          console.log('Response keys:', Object.keys(response));
          
          // Verify payment on server
          verifyPaymentMutation.mutate({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
        },
        modal: {
          ondismiss: function() {
            console.log('Customer payment modal dismissed');
            onCancel();
          }
        }
      };

      console.log('Opening Razorpay checkout for customer with options:', options);

      // Open Razorpay checkout
      const rzp = createRazorpayInstance(options);
      
      // Add error handling for the checkout
      rzp.on('payment.failed', function (response: any) {
        console.error('Customer payment failed:', response.error);
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
      console.error('Customer payment error:', error);
      
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
        <CardTitle className="text-center">Customer Payment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">₹{amount}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="customerName">Full Name</Label>
            <Input
              id="customerName"
              type="text"
              placeholder="Enter your full name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="customerEmail">Email</Label>
            <Input
              id="customerEmail"
              type="email"
              placeholder="Enter your email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="customerPhone">Phone Number</Label>
            <Input
              id="customerPhone"
              type="tel"
              placeholder="Enter your phone number"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
            />
          </div>
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
            disabled={isLoading || createOrderMutation.isPending}
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
      </CardContent>
    </Card>
  );
}
