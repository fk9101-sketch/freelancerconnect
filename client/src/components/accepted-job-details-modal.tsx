import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useCall } from "@/hooks/useCall";
import { useToast } from "@/hooks/use-toast";
import type { LeadWithRelations } from "@shared/schema";

interface AcceptedJobDetailsModalProps {
  lead: LeadWithRelations;
  isOpen: boolean;
  onClose: () => void;
}

export default function AcceptedJobDetailsModal({ 
  lead, 
  isOpen, 
  onClose 
}: AcceptedJobDetailsModalProps) {
  const { initiateCall, isCalling } = useCall();
  const { toast } = useToast();

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const maskMobileNumber = (mobileNumber: string) => {
    if (!mobileNumber) return 'N/A';
    return mobileNumber.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-center">
            Job Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Title */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Title</h3>
            <p className="text-gray-700">{lead.title}</p>
          </div>

          {/* Service Category */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Service Category</h3>
            <Badge variant="secondary" className="text-sm">
              {lead.category?.name || 'N/A'}
            </Badge>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Description</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              {lead.description}
            </p>
          </div>

          {/* Budget */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Budget</h3>
            <p className="text-green-600 font-medium">
              ₹{lead.budgetMin?.toLocaleString() || '0'} - ₹{lead.budgetMax?.toLocaleString() || '0'}
            </p>
          </div>

          {/* Location/Area */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Location/Area</h3>
            <p className="text-gray-700 flex items-center">
              <i className="fas fa-map-marker-alt mr-2 text-gray-500"></i>
              {lead.location}
            </p>
          </div>

          {/* Mobile Number (Masked) */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Mobile Number</h3>
            <p className="text-gray-700">
              {maskMobileNumber(lead.mobileNumber)}
            </p>
          </div>

          {/* Date & Time */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Posted On</h3>
            <p className="text-gray-700 flex items-center">
              <i className="fas fa-clock mr-2 text-gray-500"></i>
              {formatDate(typeof lead.createdAt === 'string' ? lead.createdAt : lead.createdAt?.toISOString() || '')}
            </p>
          </div>

          {/* Preferred Time (if available) */}
          {lead.preferredTime && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Preferred Time</h3>
              <p className="text-gray-700">
                {lead.preferredTime.replace('_', ' ')}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleCall}
              disabled={isCalling}
              className="flex-1 bg-gradient-purple text-white py-2 rounded-lg text-sm font-medium hover:opacity-90"
            >
              {isCalling ? (
                <div className="flex items-center justify-center">
                  <div className="spinner mr-1"></div>
                  Calling...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <i className="fas fa-phone mr-2"></i>
                  Call Customer
                </div>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
