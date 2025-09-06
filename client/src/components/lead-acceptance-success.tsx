import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface LeadAcceptanceSuccessProps {
  customerDetails: {
    name: string;
    requirement: string;
    budget: string;
    location: string;
    preferredTime?: string;
  };
  onClose: () => void;
}

export default function LeadAcceptanceSuccess({
  customerDetails,
  onClose
}: LeadAcceptanceSuccessProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="bg-white rounded-3xl shadow-2xl max-w-lg w-full animate-scale-in">
        <CardContent className="p-6">
          {/* Success Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">🎉 Lead Accepted!</h2>
            <p className="text-sm text-gray-600">You can now contact the customer</p>
          </div>

          {/* Customer Details */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <h3 className="font-semibold text-lg text-gray-900 mb-3">Customer Details</h3>
            
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">Customer Name:</span>
                <p className="text-gray-900 font-semibold">{customerDetails.name}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">Requirement:</span>
                <p className="text-gray-900">{customerDetails.requirement}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">Budget:</span>
                  <p className="text-gray-900 font-semibold">{customerDetails.budget}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Location:</span>
                  <p className="text-gray-900">{customerDetails.location}</p>
                </div>
              </div>
              
              {customerDetails.preferredTime && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Preferred Time:</span>
                  <p className="text-gray-900">{customerDetails.preferredTime}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={onClose}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-2xl transition-all duration-200"
            >
              <i className="fas fa-check mr-2"></i>
              Got It!
            </Button>
          </div>

          {/* Next Steps */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Next Steps:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Contact the customer to discuss details</li>
                  <li>• Provide a quote based on the requirement</li>
                  <li>• Schedule a convenient time for the work</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
