import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import LeadAcceptanceSuccess from './lead-acceptance-success';

interface LeadNotificationProps {
  leadData: {
    type: 'lead_ring';
    leadId: string;
    lead: {
      id: string;
      title: string;
      description: string;
      budgetMin: number;
      budgetMax: number;
      location: string;
      preferredTime?: string;
      customer: {
        firstName: string;
        lastName: string;
      };
      category: {
        name: string;
      };
    };
    sound?: boolean;
    requiresAction?: boolean;
  };
  onAccept: (leadId: string) => Promise<any>;
  onDismiss: () => void;
  hasLeadPlan: boolean;
}

export default function LeadNotification({
  leadData,
  onAccept,
  onDismiss,
  hasLeadPlan
}: LeadNotificationProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAccepting, setIsAccepting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [customerDetails, setCustomerDetails] = useState<any>(null);

  // Play notification sound if enabled
  useEffect(() => {
    if (leadData.sound) {
      playNotificationSound();
    }
  }, [leadData.sound]);

  const playNotificationSound = () => {
    try {
      // Create a simple notification sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  };

  const handleAccept = async () => {
    if (!hasLeadPlan) {
      // Show restriction message for free freelancers
      toast({
        title: "Lead Plan Required",
        description: "Please upgrade to a paid plan to accept this lead.",
        variant: "destructive",
      });
      
      // Redirect to subscription plans
      setTimeout(() => {
        setLocation('/subscription-plans');
      }, 2000);
      return;
    }

    setIsAccepting(true);
    try {
      const result = await onAccept(leadData.leadId);
      
      // Show success modal with customer details
      if (result.success && result.customerDetails) {
        setCustomerDetails(result.customerDetails);
        setShowSuccessModal(true);
      } else {
        onDismiss();
      }
    } catch (error: any) {
      console.error('Error accepting lead:', error);
      if (error.needsSubscription) {
        toast({
          title: "Lead Plan Required",
          description: error.message || "Please upgrade to a paid plan to accept this lead.",
          variant: "destructive",
        });
        setTimeout(() => {
          setLocation('/subscription-plans');
        }, 2000);
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to accept lead",
          variant: "destructive",
        });
      }
    } finally {
      setIsAccepting(false);
    }
  };

  const formatBudget = (min: number, max: number) => {
    return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="bg-white rounded-3xl shadow-2xl max-w-lg w-full animate-bounce-in relative">
        {/* Close X button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200 z-10"
          aria-label="Close"
        >
          <svg className="w-5 h-5 text-gray-500 hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <CardContent className="p-6">
          {/* Header with ring icon */}
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse-ring">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">🔔 New Lead Alert!</h2>
            <p className="text-sm text-gray-600">A customer posted a requirement in your area</p>
          </div>

          {/* Lead Details */}
          <div className="space-y-3 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{leadData.lead.title}</h3>
              <p className="text-gray-600 text-sm mb-3">{leadData.lead.description}</p>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Budget:</span>
                  <p className="font-semibold text-green-600">{formatBudget(leadData.lead.budgetMin, leadData.lead.budgetMax)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Location:</span>
                  <p className="font-semibold text-gray-900">{leadData.lead.location}</p>
                </div>
                <div>
                  <span className="text-gray-500">Category:</span>
                  <p className="font-semibold text-gray-900">{leadData.lead.category.name}</p>
                </div>
                {leadData.lead.preferredTime && (
                  <div>
                    <span className="text-gray-500">Preferred Time:</span>
                    <p className="font-semibold text-gray-900">{leadData.lead.preferredTime.replace('_', ' ')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {hasLeadPlan ? (
              <Button
                onClick={handleAccept}
                disabled={isAccepting}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-semibold hover:opacity-90"
              >
                {isAccepting ? (
                  <div className="flex items-center justify-center">
                    <div className="spinner mr-2"></div>
                    Accepting...
                  </div>
                ) : (
                  "Accept Lead"
                )}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  toast({
                    title: "Lead Plan Required",
                    description: "Please upgrade to a paid plan to accept this lead.",
                    variant: "destructive",
                  });
                  setTimeout(() => {
                    setLocation('/subscription-plans');
                  }, 2000);
                }}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-3 rounded-xl font-semibold hover:opacity-90"
              >
                Upgrade to Accept
              </Button>
            )}
            
            <Button
              onClick={onDismiss}
              variant="outline"
              className="px-6 border border-gray-300 text-gray-600 py-3 rounded-xl hover:bg-gray-50 hover:text-gray-800"
            >
              Dismiss
            </Button>
          </div>

          {/* Lead Plan Status */}
          {!hasLeadPlan && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700 text-center">
                <i className="fas fa-info-circle mr-1"></i>
                Please upgrade to a paid plan to accept this lead
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Success Modal */}
      {showSuccessModal && customerDetails && (
        <LeadAcceptanceSuccess
          customerDetails={customerDetails}
          onClose={() => {
            setShowSuccessModal(false);
            onDismiss();
          }}
        />
      )}
    </div>
  );
}
