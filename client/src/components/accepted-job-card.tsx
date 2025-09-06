import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCall } from "@/hooks/useCall";
import { useToast } from "@/hooks/use-toast";
import AcceptedJobDetailsModal from "./accepted-job-details-modal";
import type { LeadWithRelations } from "@shared/schema";

interface AcceptedJobCardProps {
  lead: LeadWithRelations;
}

export default function AcceptedJobCard({ lead }: AcceptedJobCardProps) {
  const { initiateCall, isCalling } = useCall();
  const { toast } = useToast();
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatBudget = (lead: LeadWithRelations) => {
    if (lead.budgetMin && lead.budgetMax) {
      return `₹${lead.budgetMin.toLocaleString()} - ₹${lead.budgetMax.toLocaleString()}`;
    } else if (lead.budgetMin) {
      return `₹${lead.budgetMin.toLocaleString()}+`;
    } else if (lead.budgetMax) {
      return `Up to ₹${lead.budgetMax.toLocaleString()}`;
    }
    return 'Budget not specified';
  };

  const handleCall = async () => {
    try {
      await initiateCall('lead', lead.id);
    } catch (error) {
      toast({
        title: "Call Failed",
        description: "Failed to initiate call. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDetails = () => {
    setIsDetailsModalOpen(true);
  };

  const getCustomerName = () => {
    if (lead.customer.firstName && lead.customer.lastName) {
      return `${lead.customer.firstName} ${lead.customer.lastName}`;
    }
    if (lead.customer.firstName) {
      return lead.customer.firstName;
    }
    if (lead.customer.email) {
      return lead.customer.email.split('@')[0];
    }
    return 'Customer';
  };

  const getCustomerInitial = () => {
    const name = getCustomerName();
    return name.charAt(0).toUpperCase();
  };

  return (
    <>
      <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-semibold text-lg flex-shrink-0">
                {getCustomerInitial()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-gray-50 px-3 py-2 rounded-lg mb-2">
                  <h4 className="font-bold text-gray-900 text-lg leading-tight">
                    {getCustomerName()}
                  </h4>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md text-xs max-w-full truncate">
                    {lead.category?.name || 'Service'}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs">
                    {lead.location}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-3">
              <Badge className="bg-green-500 text-white text-xs px-2 py-1">
                Accepted
              </Badge>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-gray-700 text-sm leading-relaxed break-words whitespace-normal overflow-hidden max-h-20 overflow-y-auto">
              {lead.title}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-gray-600">
                <span className="font-semibold">Budget:</span>
                <span className="ml-2 font-medium text-green-600">
                  {formatBudget(lead)}
                </span>
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-gray-600">
                <span className="font-semibold">Posted:</span>
                <span className="ml-2 font-medium text-gray-700">
                  {formatDate(typeof lead.createdAt === 'string' ? lead.createdAt : lead.createdAt?.toISOString() || '')}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-around gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="text-sm px-3 py-2.5 min-h-[40px] rounded-lg transition-opacity hover:opacity-90 flex-1 max-w-[120px]"
              onClick={handleCall}
              disabled={isCalling}
            >
              <i className="fas fa-phone mr-2"></i>
              {isCalling ? 'Calling...' : 'Call'}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-sm px-3 py-2.5 min-h-[40px] rounded-lg transition-opacity hover:opacity-90 flex-1 max-w-[120px]"
              onClick={handleDetails}
            >
              <i className="fas fa-eye mr-2"></i>
              Details
            </Button>
          </div>
        </CardContent>
      </Card>

      <AcceptedJobDetailsModal
        lead={lead}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />
    </>
  );
}
