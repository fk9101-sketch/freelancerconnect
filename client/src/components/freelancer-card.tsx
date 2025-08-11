import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { FreelancerWithRelations } from "@shared/schema";

interface FreelancerCardProps {
  freelancer: FreelancerWithRelations;
  onContact?: () => void;
  showPositionIndicator?: boolean;
  position?: number;
}

export default function FreelancerCard({ 
  freelancer, 
  onContact, 
  showPositionIndicator = false,
  position 
}: FreelancerCardProps) {
  const hasActiveLeadPlan = freelancer.subscriptions?.some(
    sub => sub.type === 'lead' && sub.status === 'active' && new Date(sub.endDate) > new Date()
  );

  const hasBadgePlan = freelancer.subscriptions?.find(
    sub => sub.type === 'badge' && sub.status === 'active' && new Date(sub.endDate) > new Date()
  );

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow card-hover relative">
      {showPositionIndicator && position && (
        <div className="position-indicator" data-testid={`position-indicator-${position}`}>
          #{position}
        </div>
      )}
      
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* Profile Image */}
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
            {freelancer.user.profileImageUrl ? (
              <img 
                src={freelancer.user.profileImageUrl} 
                alt={`${freelancer.user.firstName}'s profile`}
                className="w-12 h-12 rounded-full object-cover"
                data-testid={`img-profile-${freelancer.id}`}
              />
            ) : (
              <i className="fas fa-user text-gray-600"></i>
            )}
          </div>

          {/* Freelancer Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-medium text-on-surface truncate" data-testid={`text-name-${freelancer.id}`}>
                {freelancer.user.firstName} {freelancer.user.lastName}
              </h3>
              <div className="flex items-center space-x-1">
                {hasActiveLeadPlan && (
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-thumbs-up text-green-600 text-xs" data-testid="icon-paid-freelancer"></i>
                  </div>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-1">{freelancer.category.name}</p>
            
            {freelancer.bio && (
              <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                {freelancer.bio}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center">
                  <i className="fas fa-star text-yellow-500 mr-1"></i>
                  {freelancer.rating || '0.0'}
                </span>
                <span>{freelancer.totalJobs || 0} jobs</span>
                {freelancer.experience && (
                  <span>{freelancer.experience}</span>
                )}
              </div>

              <div className="flex items-center space-x-1">
                {freelancer.verificationStatus === 'approved' && (
                  <Badge className="badge-verified text-xs">
                    VERIFIED
                  </Badge>
                )}
                {hasBadgePlan && (
                  <Badge className={hasBadgePlan.badgeType === 'trusted' ? 'badge-trusted' : 'badge-verified'}>
                    {hasBadgePlan.badgeType?.toUpperCase()}
                  </Badge>
                )}
              </div>
            </div>

            {/* Working Areas */}
            {freelancer.workingAreas && freelancer.workingAreas.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500">
                  <i className="fas fa-map-marker-alt mr-1"></i>
                  Areas: {freelancer.workingAreas.slice(0, 2).join(', ')}
                  {freelancer.workingAreas.length > 2 && ` +${freelancer.workingAreas.length - 2} more`}
                </p>
              </div>
            )}

            {/* Online Status */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-1">
                <span className={`w-2 h-2 rounded-full ${freelancer.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                <span className="text-xs text-gray-500">
                  {freelancer.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              {onContact && (
                <Button 
                  size="sm" 
                  onClick={onContact}
                  className="bg-gradient-purple text-white text-xs px-3 py-1"
                  data-testid={`button-contact-${freelancer.id}`}
                >
                  Contact
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
