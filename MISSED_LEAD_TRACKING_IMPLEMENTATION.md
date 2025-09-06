# Missed Lead Tracking Implementation

## Overview
This implementation adds comprehensive lead tracking for freelancers, allowing them to see all leads they've been assigned, including accepted, missed, and ignored leads. The system is designed for paid freelancers only and includes automatic missed lead detection.

## Features Implemented

### 1. Database Schema Updates
- **New Table**: `freelancer_lead_interactions` - tracks all interactions between freelancers and leads
- **Enhanced Enum**: Added 'missed' and 'ignored' to `lead_status` enum
- **New Fields**: 
  - `status`: 'notified', 'viewed', 'accepted', 'missed', 'ignored'
  - `missed_reason`: 'expired', 'no_response', 'busy', 'not_interested'
  - `notes`: Additional notes about why the lead was missed
  - Timestamps for notified, viewed, and responded times

### 2. Backend API Enhancements
- **New Endpoints**:
  - `GET /api/freelancer/leads/all-with-interactions` - Get all leads with interaction history
  - `POST /api/freelancer/leads/:leadId/missed` - Mark a lead as missed with reason
  - `POST /api/freelancer/leads/:leadId/ignored` - Mark a lead as ignored
  - `GET /api/freelancer/leads/filtered-with-status` - Filter leads by status and date
  - `POST /api/admin/check-missed-leads` - Admin endpoint to check for missed leads

### 3. Frontend Enhancements
- **Enhanced Leads Page**: Complete redesign with status filtering and detailed lead information
- **Status Indicators**: Visual badges showing lead status (Accepted, Missed, Ignored, Pending)
- **Action Buttons**: Accept, Mark Missed, Ignore buttons for pending leads
- **Missed Lead Dialog**: Modal for marking leads as missed with reason selection
- **Filtering**: Filter by status (All, Accepted, Missed, Ignored, Pending) and date ranges
- **Upgrade Alerts**: Clear messaging for free freelancers about paid features

### 4. Automatic Missed Lead Detection
- **Timeout System**: Leads are automatically marked as missed after 30 minutes of no response
- **Notification System**: Freelancers receive notifications when leads are marked as missed
- **Admin Script**: `check-missed-leads.js` script to run missed lead detection

## Setup Instructions

### 1. Database Migration
The migration has been applied successfully:
```sql
-- Migration 0014_add_freelancer_lead_interactions.sql
-- Adds new enum values and creates freelancer_lead_interactions table
```

### 2. Automatic Missed Lead Detection
To set up automatic missed lead detection, you can:

#### Option A: Manual Execution
Run the script manually when needed:
```bash
node check-missed-leads.js
```

#### Option B: Cron Job (Recommended)
Set up a cron job to run every 15 minutes:
```bash
# Add to crontab
*/15 * * * * cd /path/to/HireLocal && node check-missed-leads.js
```

#### Option C: System Service
Create a systemd service for automatic execution.

### 3. Server Configuration
Ensure the server is running on port 3000 for the missed lead detection script to work.

## Usage

### For Freelancers
1. **View All Leads**: Navigate to the leads page to see all assigned leads
2. **Filter by Status**: Use the status filter buttons to view specific lead types
3. **Filter by Date**: Use date filters to view leads from specific time periods
4. **Mark Missed Leads**: Click "Mark Missed" to provide a reason for missing a lead
5. **Ignore Leads**: Click "Ignore" to mark leads as not interested
6. **View Lead History**: See detailed interaction history for each lead

### For Administrators
1. **Run Missed Lead Check**: Execute the missed lead detection script
2. **Monitor System**: Check logs for missed lead processing
3. **Adjust Timeouts**: Modify the 30-minute timeout in the admin endpoint if needed

## Key Benefits

1. **Complete Lead History**: Freelancers can see all leads they've been assigned
2. **Performance Tracking**: Understand why leads were missed to improve response times
3. **Paid Feature**: Encourages freelancer upgrades to access lead tracking
4. **Automatic Detection**: Reduces manual work by automatically detecting missed leads
5. **Detailed Analytics**: Rich data for understanding freelancer performance

## Technical Notes

- **Paid Freelancers Only**: All tracking features require an active lead plan
- **Real-time Updates**: Lead status updates immediately in the UI
- **Data Persistence**: All interactions are stored permanently for analysis
- **Performance Optimized**: Indexed database queries for fast filtering
- **Error Handling**: Comprehensive error handling and user feedback

## Future Enhancements

1. **Lead Analytics Dashboard**: Detailed performance metrics for freelancers
2. **Response Time Tracking**: Measure and display average response times
3. **Lead Quality Scoring**: Rate leads based on freelancer interactions
4. **Automated Follow-ups**: Remind freelancers about pending leads
5. **Lead Reassignment**: Automatically reassign missed leads to other freelancers
