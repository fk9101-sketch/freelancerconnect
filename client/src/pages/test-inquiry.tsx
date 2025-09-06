import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function TestInquiry() {
  const [formData, setFormData] = useState({
    customerName: "Test User",
    requirement: "This is a test requirement to verify the inquiry functionality works correctly",
    mobileNumber: "1234567890",
    budget: "₹5000",
    area: "Jaipur"
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('Submitting test inquiry:', formData);
      
      // Test the main endpoint first
      const response = await fetch('/api/test/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          freelancerId: 'test-freelancer-id'
        }),
      });
      
      console.log('Test response status:', response.status);
      console.log('Test response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Test error response:', errorText);
        throw new Error(`Test failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Test success result:', result);
      
      toast({
        title: "Test successful!",
        description: "Inquiry test endpoint is working correctly",
      });
      
    } catch (error) {
      console.error('Test submission error:', error);
      toast({
        title: "Test failed",
        description: error.message || "Please check the console for details",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Test Inquiry Form</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name
            </label>
            <Input
              value={formData.customerName}
              onChange={(e) => setFormData({...formData, customerName: e.target.value})}
              placeholder="Enter customer name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Requirement
            </label>
            <Textarea
              value={formData.requirement}
              onChange={(e) => setFormData({...formData, requirement: e.target.value})}
              placeholder="Enter requirement"
              rows={4}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number
            </label>
            <Input
              value={formData.mobileNumber}
              onChange={(e) => setFormData({...formData, mobileNumber: e.target.value})}
              placeholder="Enter mobile number"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget
            </label>
            <Input
              value={formData.budget}
              onChange={(e) => setFormData({...formData, budget: e.target.value})}
              placeholder="Enter budget"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Area
            </label>
            <Input
              value={formData.area}
              onChange={(e) => setFormData({...formData, area: e.target.value})}
              placeholder="Enter area"
            />
          </div>
          
          <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600">
            Test Inquiry API
          </Button>
        </form>
        
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ol className="text-sm text-gray-600 space-y-1">
            <li>1. Fill out the form above</li>
            <li>2. Click "Test Inquiry API"</li>
            <li>3. Check the console for detailed logs</li>
            <li>4. Check the server console for backend logs</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
