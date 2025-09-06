import { useState, useEffect, useCallback } from 'react';
import { useFirebaseAuth } from './useFirebaseAuth';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface LeadNotificationData {
  type: 'lead_ring' | 'missed_lead';
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
}

export function useLeadNotifications() {
  const { user, isAuthenticated } = useFirebaseAuth();
  const { toast } = useToast();
  const [currentNotification, setCurrentNotification] = useState<LeadNotificationData | null>(null);
  const [notificationHistory, setNotificationHistory] = useState<LeadNotificationData[]>([]);
  
  // Get dismissed lead IDs from localStorage
  const getDismissedLeadIds = (): string[] => {
    try {
      const dismissed = localStorage.getItem('dismissedLeadIds');
      return dismissed ? JSON.parse(dismissed) : [];
    } catch (error) {
      console.error('Error reading dismissed lead IDs:', error);
      return [];
    }
  };

  // Store dismissed lead ID in localStorage
  const addDismissedLeadId = (leadId: string): void => {
    try {
      const dismissed = getDismissedLeadIds();
      if (!dismissed.includes(leadId)) {
        dismissed.push(leadId);
        localStorage.setItem('dismissedLeadIds', JSON.stringify(dismissed));
      }
    } catch (error) {
      console.error('Error storing dismissed lead ID:', error);
    }
  };

  // Check if user has lead plan - use same query key as dashboard for consistency
  const { data: subscriptions = [] } = useQuery({
    queryKey: ['/api/freelancer/subscriptions'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/freelancer/subscriptions');
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.log('Could not check lead plan status:', error);
        return [];
      }
    },
    enabled: isAuthenticated && !!user,
    retry: false,
  });

  // Calculate hasLeadPlan from subscriptions with proper validation
  const hasLeadPlan = subscriptions.some((sub: any) => 
    sub && 
    sub.status === 'active' && 
    sub.type === 'lead' && 
    sub.endDate && 
    new Date(sub.endDate) > new Date()
  );

  console.log('🔍 useLeadNotifications - Lead plan status:', {
    subscriptions: subscriptions.length,
    hasLeadPlan,
    subscriptionDetails: subscriptions.filter((sub: any) => sub && sub.type === 'lead').map((sub: any) => ({
      id: sub.id,
      type: sub.type,
      status: sub.status,
      endDate: sub.endDate,
      isActive: sub.status === 'active' && new Date(sub.endDate) > new Date()
    }))
  });

  // Check for new leads and missed lead notifications periodically
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const checkForNotifications = async () => {
      try {
        const role = localStorage.getItem('selectedRole');
        if (role !== 'freelancer') return;

        console.log('🔍 Checking for new leads and missed lead notifications...');

        // Get lead notifications for this freelancer (both free and paid)
        const response = await apiRequest('GET', '/api/freelancer/leads/notifications');
        const leads = await response.json();
        
        console.log(`📋 Found ${leads.length} leads for freelancer`);
        
        // Get dismissed lead IDs
        const dismissedLeadIds = getDismissedLeadIds();
        
        // Only show notifications for leads that haven't been shown yet and haven't been dismissed
        const newLeads = leads.filter((lead: any) => 
          !notificationHistory.some(notif => notif.leadId === lead.id) &&
          !dismissedLeadIds.includes(lead.id)
        );

        console.log(`🆕 Found ${newLeads.length} new leads to notify about`);

        if (newLeads.length > 0 && !currentNotification) {
          const newLead = newLeads[0]; // Show first new lead
          
          console.log(`🔔 Showing notification for lead: ${newLead.id}`);
          
          const notificationData: LeadNotificationData = {
            type: 'lead_ring',
            leadId: newLead.id,
            lead: {
              id: newLead.id,
              title: newLead.title,
              description: newLead.description,
              budgetMin: newLead.budgetMin,
              budgetMax: newLead.budgetMax,
              location: newLead.location,
              preferredTime: newLead.preferredTime,
              customer: newLead.customer,
              category: newLead.category
            },
            sound: true,
            requiresAction: true
          };

          setCurrentNotification(notificationData);
          setNotificationHistory(prev => [...prev, notificationData]);
        }

        // Check for missed lead notifications (for paid freelancers only)
        if (hasLeadPlan) {
          try {
            const notificationsResponse = await apiRequest('GET', '/api/notifications');
            const notifications = await notificationsResponse.json();
            
            const missedLeadNotifications = notifications.filter((notif: any) => 
              notif.type === 'missed_lead' && !notif.isRead
            );

            if (missedLeadNotifications.length > 0 && !currentNotification) {
              const missedNotification = missedLeadNotifications[0];
              
              console.log(`⚠️ Showing missed lead notification: ${missedNotification.id}`);
              
              // Show toast notification for missed lead
              toast({
                title: "Lead Missed ⚠️",
                description: missedNotification.message,
                variant: "destructive",
                duration: 10000, // Show for 10 seconds
              });
            }
          } catch (error) {
            console.error('❌ Error checking missed lead notifications:', error);
          }
        }
      } catch (error) {
        console.error('❌ Error checking for notifications:', error);
      }
    };

    // Check immediately and then every 30 seconds
    checkForNotifications();
    const interval = setInterval(checkForNotifications, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user, currentNotification, notificationHistory, hasLeadPlan, toast]);

  const acceptLead = useCallback(async (leadId: string) => {
    try {
      console.log(`🎯 Attempting to accept lead: ${leadId}`);
      
      const response = await apiRequest('POST', `/api/freelancer/leads/${leadId}/accept`);
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Lead accepted successfully');
        toast({
          title: "Lead Accepted! 🎉",
          description: `You can now contact ${result.customerDetails?.name}`,
        });
      }
      
      return result;
    } catch (error: any) {
      console.error('❌ Error accepting lead:', error);
      
      // Handle specific error responses
      if (error.status === 403) {
        const errorData = await error.json().catch(() => ({}));
        console.log('🔒 Access denied - needs subscription:', errorData);
        const enhancedError = {
          ...errorData,
          needsSubscription: true,
          message: errorData.message || "Upgrade to Lead Plan to accept leads instantly."
        };
        throw enhancedError;
      }
      
      throw error;
    }
  }, [toast]);

  const dismissNotification = useCallback(() => {
    if (currentNotification) {
      // Store the dismissed lead ID to prevent it from showing again
      addDismissedLeadId(currentNotification.leadId);
      console.log(`🚫 Lead ${currentNotification.leadId} dismissed and added to dismissed list`);
    }
    setCurrentNotification(null);
  }, [currentNotification]);

  return {
    currentNotification,
    hasLeadPlan,
    acceptLead,
    dismissNotification
  };
}
