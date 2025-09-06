import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useFreelancerProfile } from "@/hooks/useFreelancerProfile";
import { useLeadNotifications } from "@/hooks/useLeadNotifications";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Clock, CheckCircle, XCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import LeadCard from "@/components/lead-card";
import Navigation from "@/components/navigation";
import type { LeadWithRelations } from "@shared/schema";

type DateFilterType = 'all' | 'month' | 'range';
type StatusFilterType = 'all' | 'accepted' | 'missed';

interface DateFilter {
  type: DateFilterType;
  month?: string; // Format: "2025-01"
  fromDate?: Date;
  toDate?: Date;
}

interface LeadWithInteraction extends LeadWithRelations {
  freelancerInteractions?: Array<{
    status: string;
    missedReason?: string;
    notes?: string;
    notifiedAt?: string;
    viewedAt?: string;
    respondedAt?: string;
  }>;
}

interface MissedLeadDialogProps {
  leadId: string;
  onMarkMissed: (leadId: string, reason: string, notes?: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

// Missed Lead Dialog Component
function MissedLeadDialog({ leadId, onMarkMissed, isOpen, onClose }: MissedLeadDialogProps) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validReasons = [
    { value: 'expired', label: 'Lead Expired' },
    { value: 'no_response', label: 'No Response in Time' },
    { value: 'busy', label: 'Was Busy' },
    { value: 'not_interested', label: 'Not Interested' }
  ];

  const handleSubmit = async () => {
    if (!reason) return;
    
    setIsSubmitting(true);
    try {
      await onMarkMissed(leadId, reason, notes || undefined);
      setReason('');
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Error marking lead as missed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark Lead as Missed</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="reason">Reason for missing this lead</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {validReasons.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes about why this lead was missed..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!reason || isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? 'Marking...' : 'Mark as Missed'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function FreelancerLeads() {
  const { user: firebaseUser, isAuthenticated, isLoading } = useFirebaseAuth();
  const { freelancerProfile, isLoading: profileLoading } = useFreelancerProfile();
  const [, setLocation] = useLocation();
  const { hasActiveLeadPlan, acceptLead } = useLeadNotifications();
  
  const [dateFilter, setDateFilter] = useState<DateFilter>({ type: 'all' });
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isRangeCalendarOpen, setIsRangeCalendarOpen] = useState(false);
  const [missedLeadDialog, setMissedLeadDialog] = useState<{ isOpen: boolean; leadId: string }>({ isOpen: false, leadId: '' });
  const [showUpgradeAlert, setShowUpgradeAlert] = useState(false);

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
      return;
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Generate month options (past 12 months + future 6 months)
  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    
    // Past 12 months
    for (let i = 12; i >= 1; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      options.push({ value, label });
    }
    
    // Current month
    const currentValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentLabel = now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    options.push({ value: currentValue, label: currentLabel });
    
    // Future 6 months
    for (let i = 1; i <= 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      options.push({ value, label });
    }
    
    return options;
  };

  const monthOptions = generateMonthOptions();

  // Fetch leads with enhanced filtering (status and date)
  const { data: leads = [], isLoading: leadsLoading, refetch } = useQuery<LeadWithInteraction[]>({
    queryKey: ['/api/freelancer/leads/filtered-with-status', dateFilter, statusFilter],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        
        // Add status filter
        if (statusFilter !== 'all') {
          params.append('status', statusFilter);
        }
        
        // Add date filters
        if (dateFilter.type === 'month' && dateFilter.month) {
          params.append('month', dateFilter.month);
        } else if (dateFilter.type === 'range' && dateFilter.fromDate && dateFilter.toDate) {
          params.append('fromDate', dateFilter.fromDate.toISOString());
          params.append('toDate', dateFilter.toDate.toISOString());
        }
        
        const response = await apiRequest('GET', `/api/freelancer/leads/filtered-with-status?${params.toString()}`);
        
        if (response.status === 403) {
          const errorData = await response.json();
          if (errorData.needsSubscription) {
            setShowUpgradeAlert(true);
            return [];
          }
        }
        
        const jsonData = await response.json();
        
        if (Array.isArray(jsonData)) {
          return jsonData;
        } else {
          console.warn('Unexpected leads response format:', jsonData);
          return [];
        }
      } catch (error) {
        console.error('Error fetching filtered leads:', error);
        return [];
      }
    },
    enabled: isAuthenticated && !!freelancerProfile,
    retry: 2,
  });

  const handleAcceptLead = async (leadId: string) => {
    try {
      await acceptLead(leadId);
      refetch(); // Refresh the leads list
    } catch (error) {
      console.error('Error accepting lead:', error);
    }
  };

  const handleMarkMissed = async (leadId: string, reason: string, notes?: string) => {
    try {
      const response = await apiRequest('POST', `/api/freelancer/leads/${leadId}/missed`, {
        reason,
        notes
      });
      
      if (response.ok) {
        refetch(); // Refresh the leads list
      } else {
        const errorData = await response.json();
        if (errorData.needsSubscription) {
          setShowUpgradeAlert(true);
        }
        throw new Error(errorData.message || 'Failed to mark lead as missed');
      }
    } catch (error) {
      console.error('Error marking lead as missed:', error);
      throw error;
    }
  };

  const handleMarkIgnored = async (leadId: string, notes?: string) => {
    try {
      const response = await apiRequest('POST', `/api/freelancer/leads/${leadId}/ignored`, {
        notes
      });
      
      if (response.ok) {
        refetch(); // Refresh the leads list
      } else {
        const errorData = await response.json();
        if (errorData.needsSubscription) {
          setShowUpgradeAlert(true);
        }
        throw new Error(errorData.message || 'Failed to mark lead as ignored');
      }
    } catch (error) {
      console.error('Error marking lead as ignored:', error);
      throw error;
    }
  };

  const handleDateFilterChange = (type: DateFilterType) => {
    if (type === 'all') {
      setDateFilter({ type: 'all' });
    } else if (type === 'month') {
      setDateFilter({ type: 'month', month: monthOptions[12]?.value }); // Default to current month
    } else if (type === 'range') {
      setDateFilter({ type: 'range' });
    }
  };

  const handleMonthChange = (month: string) => {
    setDateFilter(prev => ({ ...prev, month }));
  };

  const handleDateRangeChange = (fromDate: Date | undefined, toDate: Date | undefined) => {
    setDateFilter(prev => ({ ...prev, fromDate, toDate }));
  };

  // Helper function to get lead status and display info
  const getLeadStatusInfo = (lead: LeadWithInteraction) => {
    const interaction = lead.freelancerInteractions?.[0];
    
    // Check if this lead was accepted by the current freelancer
    if (lead.status === 'accepted' && lead.acceptedBy === freelancerProfile?.id) {
      return {
        status: 'accepted',
        label: 'Accepted',
        icon: <CheckCircle className="h-4 w-4 text-green-600" />,
        color: 'bg-green-100 text-green-800 border-green-200'
      };
    } else if (interaction?.status === 'missed') {
      return {
        status: 'missed',
        label: 'Missed',
        icon: <XCircle className="h-4 w-4 text-red-600" />,
        color: 'bg-red-100 text-red-800 border-red-200',
        reason: interaction.missedReason,
        notes: interaction.notes
      };
    } else if (interaction?.status === 'ignored') {
      return {
        status: 'ignored',
        label: 'Ignored',
        icon: <EyeOff className="h-4 w-4 text-gray-600" />,
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        notes: interaction.notes
      };
    } else if (lead.status === 'pending' && (interaction?.status === 'notified' || interaction?.status === 'accepted')) {
      return {
        status: 'pending',
        label: 'Available',
        icon: <Clock className="h-4 w-4 text-blue-600" />,
        color: 'bg-blue-100 text-blue-800 border-blue-200'
      };
    } else {
      return {
        status: 'unknown',
        label: 'Unknown',
        icon: <AlertCircle className="h-4 w-4 text-gray-600" />,
        color: 'bg-gray-100 text-gray-800 border-gray-200'
      };
    }
  };

  const getMissedReasonLabel = (reason: string) => {
    const reasonMap: Record<string, string> = {
      'expired': 'Lead Expired',
      'no_response': 'No Response in Time',
      'busy': 'Was Busy',
      'not_interested': 'Not Interested'
    };
    return reasonMap[reason] || reason;
  };

  const getFilterDisplayText = () => {
    if (dateFilter.type === 'all') return 'All Time';
    if (dateFilter.type === 'month' && dateFilter.month) {
      const [year, month] = dateFilter.month.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    if (dateFilter.type === 'range' && dateFilter.fromDate && dateFilter.toDate) {
      return `${format(dateFilter.fromDate, 'MMM dd')} - ${format(dateFilter.toDate, 'MMM dd, yyyy')}`;
    }
    return 'Select Filter';
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
      {/* Header */}
      <div className="bg-gradient-purple text-white px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => setLocation('/freelancer')}
            className="text-white p-2 -ml-2"
          >
            <i className="fas fa-arrow-left text-xl"></i>
          </button>
          <h1 className="text-xl font-bold">All Leads</h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        {/* Filter Controls */}
        <div className="space-y-4">
          {/* Status Filter */}
          <div className="flex gap-3 overflow-x-auto">
            <Button
              onClick={() => setStatusFilter('all')}
              variant={statusFilter === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                "whitespace-nowrap text-sm font-semibold rounded-full px-5 py-2.5 transition-all duration-200",
                statusFilter === 'all' 
                  ? "bg-white text-purple-600 shadow-sm" 
                  : "text-white hover:text-white hover:bg-white/10"
              )}
            >
              All Leads
            </Button>
            <Button
              onClick={() => setStatusFilter('accepted')}
              variant={statusFilter === 'accepted' ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                "whitespace-nowrap text-sm font-semibold rounded-full px-5 py-2.5 transition-all duration-200",
                statusFilter === 'accepted' 
                  ? "bg-white text-purple-600 shadow-sm" 
                  : "text-white hover:text-white hover:bg-white/10"
              )}
            >
              Accepted
            </Button>
            <Button
              onClick={() => setStatusFilter('missed')}
              variant={statusFilter === 'missed' ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                "whitespace-nowrap text-sm font-semibold rounded-full px-5 py-2.5 transition-all duration-200",
                statusFilter === 'missed' 
                  ? "bg-white text-purple-600 shadow-sm" 
                  : "text-white hover:text-white hover:bg-white/10"
              )}
            >
              Missed
            </Button>
          </div>

          {/* Date Filter Type Selection */}
          <div className="flex gap-3 overflow-x-auto">
            <Button
              onClick={() => handleDateFilterChange('all')}
              variant={dateFilter.type === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                "whitespace-nowrap text-sm font-semibold rounded-full px-5 py-2.5 transition-all duration-200",
                dateFilter.type === 'all' 
                  ? "bg-white text-purple-600 shadow-sm" 
                  : "text-white hover:text-white hover:bg-white/10"
              )}
            >
              All Time
            </Button>
            <Button
              onClick={() => handleDateFilterChange('month')}
              variant={dateFilter.type === 'month' ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                "whitespace-nowrap text-sm font-semibold rounded-full px-5 py-2.5 transition-all duration-200",
                dateFilter.type === 'month' 
                  ? "bg-white text-purple-600 shadow-sm" 
                  : "text-white hover:text-white hover:bg-white/10"
              )}
            >
              By Month
            </Button>
            <Button
              onClick={() => handleDateFilterChange('range')}
              variant={dateFilter.type === 'range' ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                "whitespace-nowrap text-sm font-semibold rounded-full px-5 py-2.5 transition-all duration-200",
                dateFilter.type === 'range' 
                  ? "bg-white text-purple-600 shadow-sm" 
                  : "text-white hover:text-white hover:bg-white/10"
              )}
            >
              Custom Range
            </Button>
          </div>

          {/* Month Selector */}
          {dateFilter.type === 'month' && (
            <Select value={dateFilter.month || ''} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-full bg-white bg-opacity-90 text-gray-800 border-0 rounded-xl">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Custom Date Range */}
          {dateFilter.type === 'range' && (
            <div className="flex gap-2">
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white bg-opacity-90 text-gray-800 border-0 rounded-xl",
                      !dateFilter.fromDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFilter.fromDate ? format(dateFilter.fromDate, "MMM dd, yyyy") : "From Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFilter.fromDate}
                    onSelect={(date) => {
                      handleDateRangeChange(date, dateFilter.toDate);
                      setIsCalendarOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover open={isRangeCalendarOpen} onOpenChange={setIsRangeCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white bg-opacity-90 text-gray-800 border-0 rounded-xl",
                      !dateFilter.toDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFilter.toDate ? format(dateFilter.toDate, "MMM dd, yyyy") : "To Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFilter.toDate}
                    onSelect={(date) => {
                      handleDateRangeChange(dateFilter.fromDate, date);
                      setIsRangeCalendarOpen(false);
                    }}
                    disabled={(date) => dateFilter.fromDate ? date < dateFilter.fromDate : false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Current Filter Display */}
          <div className="text-center pt-1">
            <p className="text-sm text-white">
              Showing {statusFilter === 'all' ? 'all' : statusFilter} leads: <span className="font-bold">{getFilterDisplayText()}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Upgrade Alert */}
      {showUpgradeAlert && (
        <div className="p-4">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Upgrade Required:</strong> Lead tracking features are available only for paid freelancers. 
              <Button 
                variant="link" 
                className="p-0 h-auto text-orange-600 underline"
                onClick={() => setLocation('/subscription-plans')}
              >
                Upgrade now
              </Button> to access lead history and tracking.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Leads List */}
      <div className="px-4 pb-24">
        {leadsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner"></div>
          </div>
        ) : leads.length > 0 ? (
          <div className="space-y-3">
            {leads.map((lead) => {
              const statusInfo = getLeadStatusInfo(lead);
              const interaction = lead.freelancerInteractions?.[0];
              
              return (
                <Card key={lead.id} className="border-0 shadow-sm bg-white rounded-xl">
                  <CardHeader className="pb-3 px-4 pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base font-semibold text-gray-900 mb-2 leading-tight">
                          {lead.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className={cn("text-xs px-2 py-1 rounded-full", statusInfo.color)}>
                            {statusInfo.icon}
                            <span className="ml-1">{statusInfo.label}</span>
                          </Badge>
                          {statusInfo.status === 'missed' && statusInfo.reason && (
                            <Badge variant="outline" className="text-xs px-2 py-1 rounded-full text-red-600 border-red-200">
                              {getMissedReasonLabel(statusInfo.reason)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                          {lead.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0 px-4 pb-4">
                    <div className="space-y-3">
                      {/* Lead Details */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <span className="font-medium text-gray-700 text-xs uppercase tracking-wide">Budget</span>
                          <p className="text-gray-900 font-semibold mt-1">
                            ₹{lead.budgetMin} - ₹{lead.budgetMax}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <span className="font-medium text-gray-700 text-xs uppercase tracking-wide">Location</span>
                          <p className="text-gray-900 font-semibold mt-1">{lead.location}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <span className="font-medium text-gray-700 text-xs uppercase tracking-wide">Customer</span>
                          <p className="text-gray-900 font-semibold mt-1">
                            {lead.customer.firstName} {lead.customer.lastName}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <span className="font-medium text-gray-700 text-xs uppercase tracking-wide">Category</span>
                          <p className="text-gray-900 font-semibold mt-1">{lead.category.name}</p>
                        </div>
                      </div>

                      {/* Interaction Details */}
                      {interaction && (
                        <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
                          <div className="text-sm space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-blue-800">Notified</span>
                              <span className="text-blue-700 font-medium">
                                {interaction.notifiedAt ? format(new Date(interaction.notifiedAt), 'MMM dd, HH:mm') : 'N/A'}
                              </span>
                            </div>
                            {interaction.respondedAt && (
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-blue-800">Responded</span>
                                <span className="text-blue-700 font-medium">
                                  {format(new Date(interaction.respondedAt), 'MMM dd, HH:mm')}
                                </span>
                              </div>
                            )}
                            {statusInfo.notes && (
                              <div className="pt-2 border-t border-blue-200">
                                <span className="font-medium text-blue-800 text-xs">Notes</span>
                                <p className="text-blue-700 text-xs mt-1 leading-relaxed">{statusInfo.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        {statusInfo.status === 'pending' && hasActiveLeadPlan() && (
                          <>
                            <Button
                              onClick={() => handleAcceptLead(lead.id)}
                              size="sm"
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg h-10"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Accept
                            </Button>
                            <Button
                              onClick={() => setMissedLeadDialog({ isOpen: true, leadId: lead.id })}
                              variant="outline"
                              size="sm"
                              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 font-medium rounded-lg h-10"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Missed
                            </Button>
                            <Button
                              onClick={() => handleMarkIgnored(lead.id)}
                              variant="outline"
                              size="sm"
                              className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50 font-medium rounded-lg h-10"
                            >
                              <EyeOff className="h-4 w-4 mr-2" />
                              Ignore
                            </Button>
                          </>
                        )}
                        
                        {statusInfo.status === 'accepted' && (
                          <Button
                            onClick={() => setLocation(`/freelancer/call-lead/${lead.id}`)}
                            size="sm"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg h-10"
                          >
                            <i className="fas fa-phone mr-2"></i>
                            Call Customer
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[500px] px-4">
            <Card className="bg-white border-0 shadow-sm rounded-2xl w-full max-w-sm">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="fas fa-inbox text-3xl text-gray-400"></i>
                </div>
                <h4 className="font-bold text-gray-900 mb-3 text-xl">No Leads Found</h4>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  {statusFilter === 'all' && dateFilter.type === 'all'
                  ? 'No leads available at the moment'
                    : `No ${statusFilter === 'all' ? '' : statusFilter} leads found for ${getFilterDisplayText()}`
                }
              </p>
                {(statusFilter !== 'all' || dateFilter.type !== 'all') && (
                <Button
                    onClick={() => {
                      setStatusFilter('all');
                      handleDateFilterChange('all');
                    }}
                  variant="outline"
                  size="sm"
                    className="border-gray-200 text-gray-600 hover:bg-gray-50 font-medium rounded-lg px-6 py-2"
                >
                  Show All Leads
                </Button>
              )}
            </CardContent>
          </Card>
          </div>
        )}
      </div>

      {/* Missed Lead Dialog */}
      <MissedLeadDialog
        leadId={missedLeadDialog.leadId}
        onMarkMissed={handleMarkMissed}
        isOpen={missedLeadDialog.isOpen}
        onClose={() => setMissedLeadDialog({ isOpen: false, leadId: '' })}
      />

      <Navigation currentPage="leads" userRole="freelancer" />
    </div>
  );
}
