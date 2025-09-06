import { useEffect, useState } from 'react';
import { useFirebaseAuth } from './useFirebaseAuth';
import type { User } from '@shared/schema';

export function useUserProfile() {
  const { user: firebaseUser, isAuthenticated, isLoading: authLoading } = useFirebaseAuth();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserProfile = async () => {
    if (!firebaseUser || !isAuthenticated) {
      setUserProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Get Firebase token for authentication
      const token = await firebaseUser.getIdToken();
      
      const response = await fetch('/api/customer/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Firebase-User-ID': firebaseUser.uid
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const userData: User = await response.json();
      console.log('User profile fetched:', userData);
      setUserProfile(userData);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [firebaseUser, isAuthenticated]);

  return {
    userProfile,
    isLoading: authLoading || isLoading,
    error,
    isAuthenticated,
    refetch: fetchUserProfile,
  };
}
