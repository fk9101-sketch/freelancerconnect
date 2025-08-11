import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { LeadWithRelations } from "@shared/schema";

interface LeadCardProps {
  lead: LeadWithRelations;
  canAccept: boolean;
  onAccept: () => void;
  onExpressInterest: () => void;
  isAccepting: boolean;
  isExpressingInterest: boolean;
}

export default function LeadCard({ 
  lead, 
  canAccept, 
  onAccept, 
  onExpressInterest,
  isAccepting,
  isExpressingInterest 
}: LeadCardProps) {
  const timeAgo = (date: string) => {
    const now = new Date();
    const leadDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - leadDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const getBorderColor = () => {
    if (canAccept) return 'border-l-primary';
    return 'border-l-orange-400';
  };

  return (
    <Card className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${getBorderColor()} lead-card`}>
      <CardContent className="p-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-medium text-on-surface mb-1" data-testid={`text-lead-title-${lead.id}`}>
              {lead.title}
            </h4>
            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
              {lead.description}
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>
                <i className="fas fa-map-marker-alt mr-1"></i>
                {lead.location}
              </span>
              <span>
                <i className="fas fa-clock mr-1"></i>
                {timeAgo(lead.createdAt!)}
              </span>
            </div>
          </div>
          <div className="text-right ml-4">
            <p className="text-primary font-semibold text-sm" data-testid={`text-budget-${lead.id}`}>
              ₹{lead.budgetMin}-{lead.budgetMax}
            </p>
            {lead.preferredTime && (
              <p className="text-xs text-gray-500 mt-1">
                {lead.preferredTime.replace('_', ' ')}
              </p>
            )}
          </div>
        </div>

        <div className="flex space-x-2">
          {canAccept ? (
            <Button
              onClick={onAccept}
              disabled={isAccepting}
              className="flex-1 bg-gradient-purple text-white py-2 rounded-lg text-sm font-medium hover:opacity-90"
              data-testid={`button-accept-lead-${lead.id}`}
            >
              {isAccepting ? (
                <div className="flex items-center justify-center">
                  <div className="spinner mr-1"></div>
                  Accepting...
                </div>
              ) : (
                "Accept Lead"
              )}
            </Button>
          ) : (
            <Button
              onClick={onExpressInterest}
              disabled={isExpressingInterest}
              className="flex-1 bg-gradient-purple-light text-white py-2 rounded-lg text-sm font-medium hover:opacity-90"
              data-testid={`button-express-interest-${lead.id}`}
            >
              {isExpressingInterest ? (
                <div className="flex items-center justify-center">
                  <div className="spinner mr-1"></div>
                  Expressing...
                </div>
              ) : (
                "Express Interest"
              )}
            </Button>
          )}
          <Button
            variant="outline"
            className="px-4 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50"
            data-testid={`button-view-details-${lead.id}`}
          >
            Details
          </Button>
        </div>

        {!canAccept && (
          <div className="mt-2 p-2 bg-yellow-50 rounded-lg">
            <p className="text-xs text-yellow-700">
              <i className="fas fa-info-circle mr-1"></i>
              Upgrade to Lead Plan to accept leads instantly
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
