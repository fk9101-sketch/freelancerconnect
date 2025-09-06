import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      console.log('Setting up Firebase auth state listener...');
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log('Firebase auth state changed:', user ? 'User logged in' : 'User logged out');
        if (user) {
          console.log('User details:', {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
          });
        }
        setUser(user);
        setIsLoading(false);
        setError(null);
      }, (error) => {
        console.error('Firebase auth error:', error);
        setError(error);
        setIsLoading(false);
      });

      return () => {
        console.log('Cleaning up Firebase auth state listener');
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up Firebase auth:', error);
      setError(error as Error);
      setIsLoading(false);
    }
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}