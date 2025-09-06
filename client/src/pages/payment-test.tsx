import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import RazorpayPayment from '@/components/razorpay-payment';
import CustomerPayment from '@/components/customer-payment';

export default function PaymentTestPage() {
  const { toast } = useToast();
  const [showRazorpayPayment, setShowRazorpayPayment] = useState(false);
  const [showCustomerPayment, setShowCustomerPayment] = useState(false);
  const [testAmount, setTestAmount] = useState('100');

  const handleRazorpaySuccess = (paymentId: string) => {
    toast({
      title: "Payment Success",
      description: `Payment completed successfully! Payment ID: ${paymentId}`,
    });
    setShowRazorpayPayment(false);
  };

  const handleRazorpayFailure = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive",
    });
    setShowRazorpayPayment(false);
  };

  const handleCustomerSuccess = (paymentId: string) => {
    toast({
      title: "Payment Success",
      description: `Customer payment completed successfully! Payment ID: ${paymentId}`,
    });
    setShowCustomerPayment(false);
  };

  const handleCustomerFailure = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive",
    });
    setShowCustomerPayment(false);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Razorpay Payment Test</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Test Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Test Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="testAmount">Test Amount (₹)</Label>
                <Input
                  id="testAmount"
                  type="number"
                  value={testAmount}
                  onChange={(e) => setTestAmount(e.target.value)}
                  placeholder="Enter test amount"
                />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold">Test Credentials:</h3>
                <div className="text-sm space-y-1">
                  <p><strong>Test Card:</strong> 4111 1111 1111 1111</p>
                  <p><strong>Test UPI:</strong> success@razorpay</p>
                  <p><strong>CVV:</strong> Any 3 digits</p>
                  <p><strong>Expiry:</strong> Any future date</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold">Payment Methods Available:</h3>
                <div className="text-sm space-y-1">
                  <p>✅ Credit/Debit Cards</p>
                  <p>✅ UPI</p>
                  <p>✅ Net Banking</p>
                  <p>✅ Digital Wallets</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Test Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Subscription Payment Test</h3>
                <p className="text-sm text-muted-foreground">
                  Test the Razorpay payment component used for subscription payments.
                </p>
                <Button 
                  onClick={() => setShowRazorpayPayment(true)}
                  className="w-full"
                >
                  Test Subscription Payment
                </Button>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold">Customer Payment Test</h3>
                <p className="text-sm text-muted-foreground">
                  Test the customer payment component with customer details form.
                </p>
                <Button 
                  onClick={() => setShowCustomerPayment(true)}
                  className="w-full"
                >
                  Test Customer Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Debug Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">How to Debug:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Open browser console (F12 → Console tab)</li>
                  <li>Click on any test payment button</li>
                  <li>Monitor console messages for debugging information</li>
                  <li>Check for any error messages</li>
                  <li>Verify payment method selection in Razorpay modal</li>
                </ol>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Expected Console Messages:</h3>
                <div className="text-sm space-y-1 bg-gray-50 p-3 rounded">
                  <p>✅ Razorpay script loaded successfully</p>
                  <p>✅ Creating payment order for amount: [amount]</p>
                  <p>✅ Order created successfully: [order details]</p>
                  <p>✅ Opening Razorpay checkout with options: [options]</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Troubleshooting:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>If payment methods are not clickable, refresh the page</li>
                  <li>If script fails to load, check internet connection</li>
                  <li>If payment fails, use the test credentials provided</li>
                  <li>Check browser console for specific error messages</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Modals */}
        {showRazorpayPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg max-w-md w-full">
              <RazorpayPayment
                amount={parseInt(testAmount)}
                description="Test subscription payment"
                subscriptionId="test-subscription-123"
                customerDetails={{
                  name: "Test User",
                  email: "test@example.com",
                  contact: "9999999999"
                }}
                onSuccess={handleRazorpaySuccess}
                onFailure={handleRazorpayFailure}
                onCancel={() => setShowRazorpayPayment(false)}
              />
            </div>
          </div>
        )}

        {showCustomerPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg max-w-md w-full">
              <CustomerPayment
                amount={parseInt(testAmount)}
                description="Test customer payment"
                onSuccess={handleCustomerSuccess}
                onFailure={handleCustomerFailure}
                onCancel={() => setShowCustomerPayment(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
