import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useFirebaseAuth } from './useFirebaseAuth';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/useWebSocket';
import { apiRequest } from '@/lib/queryClient';

interface InquiryNotificationData {
  type: 'new_inquiry';
  inquiry: {
    id: string;
    customerName: string;
    requirement: string;
    mobileNumber: string;
    budget?: string;
    area?: string;
    status: 'new' | 'read' | 'replied';
    createdAt: string;
  };
  sound?: boolean;
  requiresAction?: boolean;
}

export function useInquiryNotifications() {
  const { user, isAuthenticated } = useFirebaseAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentNotification, setCurrentNotification] = useState<InquiryNotificationData | null>(null);
  const [notificationHistory, setNotificationHistory] = useState<InquiryNotificationData[]>([]);

  // WebSocket connection for real-time notifications
  const { isConnected } = useWebSocket({
    onMessage: (data) => {
      if (data.type === 'new_inquiry') {
        handleNewInquiry(data.inquiry);
      }
    },
  });

  // Check for new inquiries periodically
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const checkForNewInquiries = async () => {
      try {
        const role = localStorage.getItem('selectedRole');
        if (role !== 'freelancer') return;

        // Get current inquiries from cache
        const currentInquiries = queryClient.getQueryData(['/api/freelancer/inquiries']) as any[] || [];
        
        // Fetch latest inquiries from API
        const response = await apiRequest('GET', '/api/freelancer/inquiries');
        if (!response.ok) return;
        
        const latestInquiries = await response.json();
        
        // Find new inquiries that weren't in the cache
        const newInquiries = latestInquiries.filter((inquiry: any) => 
          !currentInquiries.some(existing => existing.id === inquiry.id) &&
          !notificationHistory.some(notif => notif.inquiry.id === inquiry.id)
        );

        if (newInquiries.length > 0 && !currentNotification) {
          const newInquiry = newInquiries[0]; // Show first new inquiry
          
          const notificationData: InquiryNotificationData = {
            type: 'new_inquiry',
            inquiry: {
              id: newInquiry.id,
              customerName: newInquiry.customerName,
              requirement: newInquiry.requirement,
              mobileNumber: newInquiry.mobileNumber,
              budget: newInquiry.budget,
              area: newInquiry.area,
              status: newInquiry.status,
              createdAt: newInquiry.createdAt,
            },
            sound: true,
            requiresAction: true
          };

          setCurrentNotification(notificationData);
          setNotificationHistory(prev => [...prev, notificationData]);

          // Play notification sound
          if (notificationData.sound) {
            playNotificationSound();
          }

          // Show toast notification
          toast({
            title: "New Inquiry Received!",
            description: `${newInquiry.customerName} sent you a new inquiry`,
            duration: 5000,
          });

          // Update the query cache with new data
          queryClient.setQueryData(['/api/freelancer/inquiries'], latestInquiries);
        }
      } catch (error) {
        console.log('Error checking for new inquiries:', error);
      }
    };

    // Check immediately and then every 10 seconds for faster updates
    checkForNewInquiries();
    const interval = setInterval(checkForNewInquiries, isConnected ? 30000 : 10000); // Less frequent when WebSocket is connected

    return () => clearInterval(interval);
  }, [isAuthenticated, user, currentNotification, notificationHistory, queryClient, toast, isConnected]);

  const handleNewInquiry = useCallback((inquiry: any) => {
    // Check if this inquiry has already been shown
    if (notificationHistory.some(notif => notif.inquiry.id === inquiry.id)) {
      return;
    }

    const notificationData: InquiryNotificationData = {
      type: 'new_inquiry',
      inquiry: {
        id: inquiry.id,
        customerName: inquiry.customerName,
        requirement: inquiry.requirement,
        mobileNumber: inquiry.mobileNumber,
        budget: inquiry.budget,
        area: inquiry.area,
        status: inquiry.status,
        createdAt: inquiry.createdAt,
      },
      sound: true,
      requiresAction: true
    };

    setCurrentNotification(notificationData);
    setNotificationHistory(prev => [...prev, notificationData]);

    // Play notification sound
    if (notificationData.sound) {
      playNotificationSound();
    }

    // Show toast notification
    toast({
      title: "New Inquiry Received!",
      description: `${inquiry.customerName} sent you a new inquiry`,
      duration: 5000,
    });

    // Update the query cache with new data
    queryClient.invalidateQueries({ queryKey: ['/api/freelancer/inquiries'] });
  }, [notificationHistory, queryClient, toast]);

  const playNotificationSound = () => {
    try {
      // Create audio context for notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  };

  const dismissNotification = useCallback(() => {
    setCurrentNotification(null);
  }, []);

  const viewInquiry = useCallback((inquiryId: string) => {
    // Dismiss current notification
    setCurrentNotification(null);
    
    // Navigate to messages page
    setLocation('/freelancer/messages');
  }, [setLocation]);

  return {
    currentNotification,
    dismissNotification,
    viewInquiry,
    hasNewInquiries: currentNotification !== null,
  };
}
