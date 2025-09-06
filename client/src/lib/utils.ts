import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function to sort freelancers with paid members first and rotation logic
export function sortFreelancersWithPaidMembersFirst(
  freelancers: any[],
  rotationKey?: string
): any[] {
  if (!freelancers || freelancers.length === 0) return [];

  // Separate paid and free freelancers
  const paidMembers: any[] = [];
  const freeListings: any[] = [];

  freelancers.forEach(freelancer => {
    // Check if freelancer has active paid subscriptions
    const hasPaidPlan = freelancer.subscriptions && 
      freelancer.subscriptions.some((sub: any) => 
        sub.status === 'active' && 
        (sub.type === 'lead' || sub.type === 'position' || sub.type === 'badge')
      );

    if (hasPaidPlan) {
      paidMembers.push(freelancer);
    } else {
      freeListings.push(freelancer);
    }
  });

  // Sort paid members by position plans first, then by rotation
  if (paidMembers.length > 0) {
    // Separate position plan holders from other paid members
    const positionPlanHolders: any[] = [];
    const otherPaidMembers: any[] = [];

    paidMembers.forEach(freelancer => {
      const positionSubscription = freelancer.subscriptions?.find((sub: any) => 
        sub.status === 'active' && 
        sub.type === 'position' && 
        new Date(sub.endDate) > new Date()
      );

      if (positionSubscription) {
        positionPlanHolders.push({
          ...freelancer,
          positionNumber: positionSubscription.position
        });
      } else {
        otherPaidMembers.push(freelancer);
      }
    });

    // Sort position plan holders by position (1, 2, 3)
    positionPlanHolders.sort((a, b) => a.positionNumber - b.positionNumber);

    // Sort other paid members by rotation
    if (otherPaidMembers.length > 0) {
      if (rotationKey) {
        // Use rotationKey to create a deterministic but rotating order
        const rotationIndex = Math.abs(hashCode(rotationKey)) % otherPaidMembers.length;
        const rotatedPaidMembers = [
          ...otherPaidMembers.slice(rotationIndex),
          ...otherPaidMembers.slice(0, rotationIndex)
        ];
        otherPaidMembers.splice(0, otherPaidMembers.length, ...rotatedPaidMembers);
      } else {
        // Random rotation for fair display
        otherPaidMembers.sort(() => Math.random() - 0.5);
      }
    }

    // Combine: position plan holders first (sorted by position), then other paid members
    paidMembers.splice(0, paidMembers.length, ...positionPlanHolders, ...otherPaidMembers);
  }

  // Sort free listings randomly for fair display
  freeListings.sort(() => Math.random() - 0.5);

  // Return paid members first, then free listings
  return [...paidMembers, ...freeListings];
}

// Simple hash function for rotation key
function hashCode(str: string): number {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}
