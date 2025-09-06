import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useFreelancerProfile } from "@/hooks/useFreelancerProfile";
import { useCall } from "@/hooks/useCall";
import { useInquiryNotifications } from "@/hooks/useInquiryNotifications";
import AcceptedJobCard from "@/components/accepted-job-card";
import InquiryNotification from "@/components/inquiry-notification";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/navigation";
import type { FreelancerProfile, LeadWithRelations, Inquiry } from "@shared/schema";

// Interface for inquiry messages from database
interface InquiryMessage {
  id: string;
  customerName: string;
  requirement: string;
  mobileNumber: string;
  budget?: string;
  area?: string;
  status: 'new' | 'read' | 'replied';
  createdAt: string;
}

export default function FreelancerMessages() {
  const { user: firebaseUser, isAuthenticated, isLoading } = useFirebaseAuth();
  const { freelancerProfile, isLoading: profileLoading } = useFreelancerProfile();
  const { initiateCall, isCalling } = useCall();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'messages' | 'accepted'>('messages');
  
  // Inquiry notifications
  const { 
    currentNotification, 
    dismissNotification, 
    viewInquiry,
    hasNewInquiries 
  } = useInquiryNotifications();

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
      return;
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Get freelancer name for welcome message
  const getFreelancerName = () => {
    if (freelancerProfile?.fullName) {
      return freelancerProfile.fullName;
    }
    if (firebaseUser?.displayName) {
      return firebaseUser.displayName;
    }
    if (firebaseUser?.email) {
      return firebaseUser.email.split('@')[0];
    }
    return 'Freelancer';
  };

  // Fetch real inquiries from API
  const { data: inquiries = [], isLoading: inquiriesLoading } = useQuery<Inquiry[]>({
    queryKey: ['/api/freelancer/inquiries'],
    queryFn: async () => {
      if (!freelancerProfile?.id) return [];
      
      const response = await apiRequest('GET', '/api/freelancer/inquiries');
      if (!response.ok) {
        throw new Error('Failed to fetch inquiries');
      }
      return response.json();
    },
    enabled: !!freelancerProfile?.id,
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
  });

  // Fetch real accepted leads from API
  const { data: acceptedLeads = [], isLoading: acceptedLeadsLoading } = useQuery<LeadWithRelations[]>({
    queryKey: ['/api/freelancer/leads/accepted'],
    queryFn: async () => {
      if (!freelancerProfile?.id) return [];
      
      const response = await apiRequest('GET', '/api/freelancer/leads/accepted');
      if (!response.ok) {
        throw new Error('Failed to fetch accepted leads');
      }
      return response.json();
    },
    enabled: !!freelancerProfile?.id,
  });

  // Transform inquiries to match the expected interface
  const inquiryMessages: InquiryMessage[] = inquiries.map(inquiry => ({
    id: inquiry.id,
    customerName: inquiry.customerName,
    requirement: inquiry.requirement,
    mobileNumber: inquiry.mobileNumber,
    budget: inquiry.budget,
    area: inquiry.area,
    status: inquiry.status as 'new' | 'read' | 'replied',
    createdAt: inquiry.createdAt,
  }));

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-blue-500 text-white';
      case 'completed': return 'bg-green-500 text-white';
      case 'cancelled': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
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

  if (isLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-background text-foreground">
      {/* Inquiry Notification */}
      {currentNotification && (
        <InquiryNotification
          notification={currentNotification}
          onDismiss={dismissNotification}
          onView={viewInquiry}
        />
      )}
      
      {/* Header */}
      <div className="bg-gradient-purple text-white p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold mb-2">
              Messages & Inquiries
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <span className="text-purple-100 text-sm">
                Manage your customer communications
              </span>
              <div className="flex items-center space-x-2">
                <span className="bg-green-400 w-2 h-2 rounded-full"></span>
                <span className="text-xs text-purple-200">
                  {freelancerProfile?.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 ml-4">
            {freelancerProfile?.verificationStatus === 'approved' && (
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                <i className="fas fa-check-circle mr-1"></i>
                VERIFIED
              </Badge>
            )}
            <Button
              onClick={() => setLocation('/freelancer')}
              variant="outline"
              size="sm"
              className="text-white border-white/30 hover:bg-white/20 text-xs"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white bg-opacity-20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{inquiryMessages.filter(i => i.status === 'new').length}</p>
            <p className="text-xs text-purple-100">New Messages</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{acceptedLeads.length}</p>
            <p className="text-xs text-purple-100">Active Jobs</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{acceptedLeads.filter(lead => lead.status === 'completed').length}</p>
            <p className="text-xs text-purple-100">Completed</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="p-4">
        <div className="flex space-x-2 mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'messages'
                ? 'bg-white text-gray-900 shadow-sm border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <i className="fas fa-envelope mr-2"></i>
            Messages ({inquiryMessages.length})
          </button>
          <button
            onClick={() => setActiveTab('accepted')}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'accepted'
                ? 'bg-white text-gray-900 shadow-sm border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <i className="fas fa-handshake mr-2"></i>
            Accepted Jobs ({acceptedLeads.length})
          </button>
        </div>

        {/* Messages Section */}
        {activeTab === 'messages' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 text-lg">Customer Inquiries</h3>
              <div className="flex items-center gap-2">
                {hasNewInquiries && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                )}
                <Badge className="bg-blue-500 text-white">
                  {inquiryMessages.filter(i => i.status === 'new').length} New
                </Badge>
              </div>
            </div>

            {inquiriesLoading ? (
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-6 text-center">
                  <i className="fas fa-spinner fa-spin text-3xl text-gray-400 mb-3"></i>
                  <h4 className="font-semibold text-gray-600 mb-2">Loading Inquiries...</h4>
                  <p className="text-sm text-gray-500">Please wait while we fetch your messages</p>
                </CardContent>
              </Card>
            ) : inquiryMessages.length > 0 ? (
              inquiryMessages.map((inquiry) => (
                <Card key={inquiry.id} className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-lg flex-shrink-0">
                          {inquiry.customerName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="bg-gray-50 px-3 py-2 rounded-lg mb-2">
                            <h4 className="font-bold text-gray-900 text-lg leading-tight">{inquiry.customerName}</h4>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs max-w-full truncate">
                              {inquiry.requirement}
                            </span>
                            {inquiry.area && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span className="bg-green-50 text-green-700 px-2 py-1 rounded-md text-xs">
                                  {inquiry.area}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-3">
                        <Badge className="bg-blue-500 text-white text-xs px-2 py-1">
                          New
                        </Badge>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-700 text-sm leading-relaxed break-words whitespace-normal overflow-hidden max-h-20 overflow-y-auto">
                        {inquiry.requirement}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-sm text-gray-600">
                          <span className="font-semibold">Budget:</span>
                          <span className="ml-2 font-medium text-green-600">
                            {inquiry.budget || 'Not specified'}
                          </span>
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-sm text-gray-600">
                          <span className="font-semibold">Date:</span>
                          <span className="ml-2 font-medium text-gray-700">
                            {formatDate(inquiry.createdAt)}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-around gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-sm px-3 py-2.5 min-h-[40px] rounded-lg transition-opacity hover:opacity-90 flex-1 max-w-[120px]"
                        onClick={() => initiateCall('inquiry', inquiry.id)}
                        disabled={isCalling}
                      >
                        <i className="fas fa-phone mr-2"></i>
                        {isCalling ? 'Calling...' : 'Call'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-sm px-3 py-2.5 min-h-[40px] rounded-lg transition-opacity hover:opacity-90 flex-1 max-w-[120px]"
                      >
                        <i className="fas fa-envelope mr-2"></i>
                        Email
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-6 text-center">
                  <i className="fas fa-inbox text-3xl text-gray-400 mb-3"></i>
                  <h4 className="font-semibold text-gray-600 mb-2">No Messages Yet</h4>
                  <p className="text-sm text-gray-500">Customer inquiries will appear here when they send messages</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Accepted Inquiries Section */}
        {activeTab === 'accepted' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 text-lg">Accepted Jobs</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation('/freelancer')}
                className="text-sm px-4 py-2.5 min-h-[40px] rounded-lg transition-opacity hover:opacity-90"
              >
                <i className="fas fa-plus mr-2"></i>
                Find More Jobs
              </Button>
            </div>

            {acceptedLeadsLoading ? (
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-6 text-center">
                  <i className="fas fa-spinner fa-spin text-3xl text-gray-400 mb-3"></i>
                  <h4 className="font-semibold text-gray-600 mb-2">Loading Accepted Jobs...</h4>
                  <p className="text-sm text-gray-500">Please wait while we fetch your accepted leads</p>
                </CardContent>
              </Card>
            ) : acceptedLeads.length > 0 ? (
              <div className="space-y-3">
                {acceptedLeads.map((lead) => (
                  <AcceptedJobCard
                    key={lead.id}
                    lead={lead}
                  />
                ))}
              </div>
            ) : (
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-6 text-center">
                  <i className="fas fa-handshake text-3xl text-gray-400 mb-3"></i>
                  <h4 className="font-semibold text-gray-600 mb-2">No Accepted Leads Yet</h4>
                  <p className="text-sm text-gray-500">Accept leads from the dashboard to see them here</p>
                  <Button 
                    onClick={() => setLocation('/freelancer')}
                    className="mt-3 bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Go to Dashboard
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <Navigation currentPage="messages" userRole="freelancer" />
    </div>
  );
}
