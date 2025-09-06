import { useEffect, useState } from 'react';
import { useFirebaseAuth } from './useFirebaseAuth';
import type { FreelancerProfile } from '@shared/schema';

export function useFreelancerProfile() {
  const { user: firebaseUser, isAuthenticated, isLoading: authLoading } = useFirebaseAuth();
  const [freelancerProfile, setFreelancerProfile] = useState<FreelancerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFreelancerProfile = async () => {
    if (!firebaseUser || !isAuthenticated) {
      setFreelancerProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/freelancer/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await firebaseUser.getIdToken()}`,
          'X-Firebase-User-ID': firebaseUser.uid
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch freelancer profile');
      }

      const profileData: FreelancerProfile = await response.json();
      setFreelancerProfile(profileData);
    } catch (err) {
      console.error('Error fetching freelancer profile:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFreelancerProfile();
  }, [firebaseUser, isAuthenticated]);

  return {
    freelancerProfile,
    isLoading: authLoading || isLoading,
    error,
    isAuthenticated,
    refetch: fetchFreelancerProfile,
  };
}
