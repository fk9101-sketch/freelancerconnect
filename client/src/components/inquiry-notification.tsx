import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, MessageCircle, Phone } from 'lucide-react';
import { useCall } from '@/hooks/useCall';

interface InquiryNotificationProps {
  notification: {
    type: 'new_inquiry';
    inquiry: {
      id: string;
      customerName: string;
      requirement: string;
      mobileNumber: string;
      budget?: string;
      area?: string;
      status: 'new' | 'read' | 'replied';
      createdAt: string;
    };
    sound?: boolean;
    requiresAction?: boolean;
  };
  onDismiss: () => void;
  onView: (inquiryId: string) => void;
}

export default function InquiryNotification({ 
  notification, 
  onDismiss, 
  onView 
}: InquiryNotificationProps) {
  const { initiateCall, isCalling } = useCall();

  const handleCall = async () => {
    try {
      await initiateCall('inquiry', notification.inquiry.id);
    } catch (error) {
      console.error('Error initiating call:', error);
    }
  };

  const handleView = () => {
    onView(notification.inquiry.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-300">
      <Card className="w-full max-w-md mx-4 animate-in slide-in-from-bottom-4 duration-300">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className="font-semibold text-lg">New Inquiry!</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Inquiry Details */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">
                  {notification.inquiry.customerName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h4 className="font-medium">{notification.inquiry.customerName}</h4>
                <p className="text-sm text-gray-600">
                  {notification.inquiry.area || 'Location not specified'}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-700 line-clamp-3">
                {notification.inquiry.requirement}
              </p>
            </div>

            {notification.inquiry.budget && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Budget: {notification.inquiry.budget}
                </Badge>
              </div>
            )}

            <div className="text-xs text-gray-500">
              Received {new Date(notification.inquiry.createdAt).toLocaleTimeString()}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleView}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              View Details
            </Button>
            <Button
              onClick={handleCall}
              disabled={isCalling}
              variant="outline"
              className="flex-1"
            >
              <Phone className="h-4 w-4 mr-2" />
              {isCalling ? 'Calling...' : 'Call Now'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
