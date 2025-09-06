import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import InquiryModal from "./inquiry-modal";
import FreelancerProfileView from "./freelancer-profile-view";
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
  const [, setLocation] = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Generate random rating between 4.0 and 5.0 for demo purposes
  const randomRating = (Math.random() * 1 + 4).toFixed(1);
  const randomRatings = Math.floor(Math.random() * 100) + 50;

  // Check badge subscriptions dynamically
  const hasTrustBadge = freelancer.subscriptions?.some(sub => 
    sub.status === 'active' && 
    sub.type === 'badge' && 
    sub.badgeType === 'trusted'
  );
  
  const hasVerifiedBadge = freelancer.subscriptions?.some(sub => 
    sub.status === 'active' && 
    sub.type === 'badge' && 
    sub.badgeType === 'verified'
  );

  // Check if freelancer has active lead plan subscription
  const hasLeadPlan = freelancer.subscriptions?.some(sub => 
    sub.status === 'active' && 
    sub.type === 'lead' && 
    new Date(sub.endDate) > new Date()
  );

  // Check if freelancer has active position plan subscription
  const positionSubscription = freelancer.subscriptions?.find(sub => 
    sub.status === 'active' && 
    sub.type === 'position' && 
    new Date(sub.endDate) > new Date()
  );

  const getPositionLabel = (position: number) => {
    switch (position) {
      case 1: return 'I';
      case 2: return 'II';
      case 3: return 'III';
      default: return position.toString();
    }
  };

  return (
    <>
      <Card className="bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden w-full max-w-md mx-auto">
        <CardContent className="p-4">
          {/* Top Section - Badges */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 flex-wrap">
              {/* Rating Box */}
              <button
                onClick={() => setLocation(`/freelancer/reviews?id=${freelancer.id}`)}
                className="bg-green-500 text-white px-2 py-1 rounded-lg flex items-center space-x-1 hover:bg-green-600 transition-colors cursor-pointer text-xs"
              >
                <span className="font-semibold">{randomRating}</span>
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </button>
              
              {/* Number of Ratings */}
              <button
                onClick={() => setLocation(`/freelancer/reviews?id=${freelancer.id}`)}
                className="text-gray-600 text-xs hover:text-gray-800 transition-colors cursor-pointer"
              >
                {randomRatings} Ratings
              </button>
            </div>
            
            <div className="flex items-center space-x-1 flex-wrap">
              {/* Badges */}
              {hasTrustBadge && (
                <div className="bg-yellow-400 text-yellow-800 px-2 py-1 rounded-full flex items-center space-x-1 text-xs">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L3 7v11c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/>
                  </svg>
                  <span>Trust</span>
                </div>
              )}
              
              {hasVerifiedBadge && (
                <div className="bg-blue-500 text-white px-2 py-1 rounded-full flex items-center space-x-1 text-xs">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>Verified</span>
                </div>
              )}

              {positionSubscription && (
                <div className="bg-yellow-500 text-white px-2 py-1 rounded-full flex items-center space-x-1 text-xs font-bold" title={`Position ${getPositionLabel(positionSubscription.position)} in ${positionSubscription.area}`}>
                  <span>{getPositionLabel(positionSubscription.position)}</span>
                </div>
              )}

              {hasLeadPlan && (
                <div className="bg-black text-white px-2 py-1 rounded-full flex items-center space-x-1 text-xs" title="Lead Plan Member">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558-.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z"/>
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Section */}
          <div className="flex items-start space-x-3 mb-4">
            {/* Profile Picture */}
            <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 hover:shadow-lg transition-all duration-300 hover:scale-105">
              {freelancer.profilePhotoUrl ? (
                <img 
                  src={freelancer.profilePhotoUrl} 
                  alt={`${freelancer.fullName || 'Freelancer'} profile picture`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span class="text-white font-bold text-xl">${(freelancer.fullName || 'D').charAt(0).toUpperCase()}</span>`;
                    }
                  }}
                />
              ) : (
                <span className="text-white font-bold text-xl">
                  {(freelancer.fullName || 'D').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            
            {/* Name and Basic Info */}
            <div className="flex flex-col space-y-1 min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 text-gray-700 flex-shrink-0">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7.5 21h2.25a2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H8.25a2.25 2.25 0 00-2.25 2.25v6.75A2.25 2.25 0 007.5 21zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5A2.25 2.25 0 006.75 21h9a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-black truncate">
                  {freelancer.fullName || 'Digital Marketing Jaipur (D M J) By Compusys'}
                </h3>
              </div>
              
              {/* Location and Experience */}
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span className="font-medium text-xs">{freelancer.area || 'Jaipur'}</span>
                </div>
                <span className="text-gray-400">•</span>
                <div className="flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 00-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4V8h16v11z"/>
                  </svg>
                  <span className="font-semibold text-xs">{freelancer.experience || '15'} Years</span>
                  <span className="text-xs">in Business</span>
                </div>
              </div>

              {/* Service Category */}
              <div className="flex items-center space-x-2">
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs border border-gray-200">
                  {freelancer.category?.name || 'Digital Marketing Services'}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Section - Action Buttons */}
          <div className="flex space-x-2">
            <Button 
              onClick={() => setIsProfileOpen(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg flex items-center justify-center space-x-2 text-sm flex-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
              </svg>
              <span>View Profile</span>
            </Button>
            
            <InquiryModal freelancer={freelancer}>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center justify-center space-x-2 text-sm flex-1">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
                </svg>
                <span>Send Inquiry</span>
              </Button>
            </InquiryModal>
          </div>
        </CardContent>
      </Card>

      {/* Profile View Modal */}
      <FreelancerProfileView
        freelancer={freelancer}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
}
