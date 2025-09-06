/**
 * Utility functions for role-based access control
 */

export type UserRole = 'customer' | 'freelancer' | 'admin';

/**
 * Get the current user's role from localStorage or userProfile
 * @param userProfile - Optional user profile object from useUserProfile hook
 * @returns The user's role, defaults to 'customer' if not found
 */
export function getUserRole(userProfile?: { role?: UserRole } | null): UserRole {
  // First try to get role from userProfile (most reliable)
  if (userProfile?.role) {
    return userProfile.role;
  }
  
  // Fallback to localStorage
  const storedRole = localStorage.getItem('selectedRole');
  return (storedRole as UserRole) || 'customer';
}

/**
 * Check if the current user is an admin
 * @param userProfile - Optional user profile object from useUserProfile hook
 * @returns true if user is admin, false otherwise
 */
export function isAdmin(userProfile?: { role?: UserRole } | null): boolean {
  return getUserRole(userProfile) === 'admin';
}

/**
 * Check if the current user is a customer
 * @param userProfile - Optional user profile object from useUserProfile hook
 * @returns true if user is customer, false otherwise
 */
export function isCustomer(userProfile?: { role?: UserRole } | null): boolean {
  return getUserRole(userProfile) === 'customer';
}

/**
 * Check if the current user is a freelancer
 * @param userProfile - Optional user profile object from useUserProfile hook
 * @returns true if user is freelancer, false otherwise
 */
export function isFreelancer(userProfile?: { role?: UserRole } | null): boolean {
  return getUserRole(userProfile) === 'freelancer';
}

/**
 * Check if the current user should have access to admin portal
 * @param userProfile - Optional user profile object from useUserProfile hook
 * @returns true if user should see admin portal, false otherwise
 */
export function hasAdminAccess(userProfile?: { role?: UserRole } | null): boolean {
  return isAdmin(userProfile);
}
