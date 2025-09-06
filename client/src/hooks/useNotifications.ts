import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFirebaseAuth } from './useFirebaseAuth';
import { apiRequest } from '@/lib/queryClient';

export function useNotifications() {
  const { user, isAuthenticated } = useFirebaseAuth();
  const queryClient = useQueryClient();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch unread count
  const { data: unreadData } = useQuery({
    queryKey: ['/api/notifications/unread-count'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/notifications/unread-count');
        return response.json();
      } catch (error) {
        console.error('Error fetching unread count:', error);
        return { unreadCount: 0 };
      }
    },
    enabled: isAuthenticated && !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unreadCount = unreadData?.unreadCount || 0;

  // Listen for real-time notifications via WebSocket
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // This will be handled by the existing WebSocket connection
    // The notification count will be updated when new notifications arrive
    console.log('🔔 Notifications hook initialized for user:', user.uid);
  }, [isAuthenticated, user]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  const refreshNotifications = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
  };

  return {
    unreadCount,
    isDropdownOpen,
    toggleDropdown,
    closeDropdown,
    refreshNotifications,
  };
}
