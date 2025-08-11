import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user: firebaseUser, isAuthenticated, isLoading } = useFirebaseAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
      return;
    }

    if (isAuthenticated && firebaseUser) {
      // Get the selected role from localStorage
      const selectedRole = localStorage.getItem('selectedRole') || 'customer';
      
      // Redirect to appropriate dashboard based on selected role
      switch (selectedRole) {
        case 'freelancer':
          setLocation('/freelancer');
          break;
        case 'admin':
          setLocation('/admin');
          break;
        case 'customer':
        default:
          setLocation('/customer');
          break;
      }
    }
  }, [isAuthenticated, firebaseUser, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  // This component serves as a router - it shouldn't render anything
  return null;
}