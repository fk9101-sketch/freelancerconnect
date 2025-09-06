import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CallResponse {
  success: boolean;
  phoneNumber: string;
  customerName: string;
}

export const useCall = () => {
  const [isCalling, setIsCalling] = useState(false);
  const { toast } = useToast();

  const initiateCall = async (type: 'inquiry' | 'lead', id: string) => {
    setIsCalling(true);
    
    try {
      let endpoint: string;
      
      if (type === 'inquiry') {
        endpoint = `/api/freelancer/call-inquiry/${id}`;
      } else {
        endpoint = `/api/freelancer/call-lead/${id}`;
      }
      
      const response = await apiRequest('GET', endpoint);
      
      if (!response.ok) {
        const errorData = await response.json();
        
        if (errorData.needsSubscription) {
          toast({
            title: "Subscription Required",
            description: "You need an active subscription to make calls. Please upgrade your plan.",
            variant: "destructive",
          });
          return;
        }
        
        throw new Error(errorData.message || 'Failed to fetch customer phone number');
      }
      
      const data: CallResponse = await response.json();
      
      if (!data.success || !data.phoneNumber) {
        throw new Error('Customer phone number not available');
      }
      
      // Check if running on mobile device
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Use tel: protocol for mobile devices
        const telUrl = `tel:${data.phoneNumber}`;
        window.location.href = telUrl;
      } else {
        // For desktop, show the phone number and provide instructions
        toast({
          title: "Call Customer",
          description: `Call ${data.customerName} at ${data.phoneNumber}`,
          variant: "default",
        });
        
        // Also try to open tel: link (some desktop browsers support it)
        const telUrl = `tel:${data.phoneNumber}`;
        window.open(telUrl, '_blank');
      }
      
      toast({
        title: "Call Initiated",
        description: `Calling ${data.customerName}...`,
        variant: "default",
      });
      
    } catch (error) {
      console.error('Call initiation error:', error);
      
      toast({
        title: "Call Failed",
        description: error instanceof Error ? error.message : 'Failed to initiate call',
        variant: "destructive",
      });
    } finally {
      setIsCalling(false);
    }
  };

  return {
    initiateCall,
    isCalling,
  };
};
