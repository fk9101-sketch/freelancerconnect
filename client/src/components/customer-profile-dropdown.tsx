import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface CustomerProfileDropdownProps {
  className?: string;
}

export default function CustomerProfileDropdown({ className = "" }: CustomerProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [, setLocation] = useLocation();
  const { user: firebaseUser, signOut } = useFirebaseAuth();
  const { userProfile, refetch: refetchUserProfile } = useUserProfile();
  const { toast } = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debug logging for userProfile
  useEffect(() => {
    console.log('CustomerProfileDropdown - userProfile updated:', userProfile);
    console.log('CustomerProfileDropdown - profileImageUrl:', userProfile?.profileImageUrl);
  }, [userProfile]);

  const handleMenuClick = (path: string) => {
    setLocation(path);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setLocation('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('File selected:', file);
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPG, PNG, or WebP image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 2MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const currentUser = firebaseUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Get auth token
      const token = await currentUser.getIdToken();

      // Create form data
      const formData = new FormData();
      formData.append('photo', file);

      // Upload to server
      const uploadUrl = '/api/customer/upload-photo';
      console.log('Uploading to URL:', uploadUrl);
      console.log('Upload headers:', {
        'Authorization': `Bearer ${token.substring(0, 20)}...`,
        'X-Firebase-User-ID': currentUser.uid
      });
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Firebase-User-ID': currentUser.uid
        },
        body: formData
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response received:', text);
        throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Upload failed');
      }

      // Success - refetch user profile to get updated photo
      console.log('Upload successful, refetching user profile...');
      await refetchUserProfile();
      console.log('User profile refetched, current profile:', userProfile);
      
      // Force a small delay to ensure the refetch completes
      setTimeout(() => {
        console.log('Force refresh after upload - userProfile:', userProfile);
      }, 100);
      
      toast({
        title: "Photo uploaded",
        description: "Your profile photo has been updated successfully.",
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const testServerConnection = async () => {
    try {
      console.log('Testing server connection...');
      const response = await fetch('/api/customer/test');
      const result = await response.json();
      console.log('Server test result:', result);
    } catch (error) {
      console.error('Server test failed:', error);
    }
  };

  const handleEditPhotoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Pencil icon clicked, isUploading:', isUploading);
    console.log('File input ref:', fileInputRef.current);
    
    // Test server connection first
    testServerConnection();
    
    if (!isUploading) {
      console.log('Triggering file input click');
      if (fileInputRef.current) {
        // Try multiple methods to ensure the file input opens
        fileInputRef.current.click();
        // Fallback: dispatch a click event
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        });
        fileInputRef.current.dispatchEvent(clickEvent);
      } else {
        console.error('File input ref is null');
      }
    }
  };

  const menuItems = [
    {
      id: 'profile',
      label: 'My Profile',
      icon: 'fas fa-user',
      description: 'Profile Picture, Name, Email, Phone, Address',
      path: '/customer/profile',
      badge: null
    },
    {
      id: 'requests',
      label: 'My Requests / Bookings',
      icon: 'fas fa-list-alt',
      description: 'Ongoing & Past Requests, Re-book Options',
      path: '/customer/requests',
      badge: null
    },
    {
      id: 'rewards',
      label: 'Rewards & Offers',
      icon: 'fas fa-gift',
      description: 'Cashback Points, Discount Coupons, Referrals',
      path: '/customer/rewards',
      badge: 'New'
    },
    {
      id: 'saved',
      label: 'Saved Freelancers',
      icon: 'fas fa-heart',
      description: 'Favorite Freelancers, Quick Re-book',
      path: '/customer/saved',
      badge: null
    },
    {
      id: 'notifications',
      label: 'Notifications & Alerts',
      icon: 'fas fa-bell',
      description: 'New Offers, Booking Updates, Reminders',
      path: '/customer/notifications',
      badge: null
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: 'fas fa-question-circle',
      description: 'FAQs, Chat Support, Complaints',
      path: '/customer/help',
      badge: null
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'fas fa-cog',
      description: 'Language, Location, Notifications',
      path: '/customer/settings',
      badge: null
    },
    {
      id: 'security',
      label: 'Account Security',
      icon: 'fas fa-shield-alt',
      description: 'Change Password, Linked Accounts',
      path: '/customer/security',
      badge: null
    }
  ];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Hidden file input for photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handlePhotoUpload}
        className="hidden"
        disabled={isUploading}
        style={{ display: 'none' }}
        tabIndex={-1}
      />
      
      <div className="relative">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="relative h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200"
            >
              <div className="flex items-center justify-center">
                {userProfile?.profileImageUrl ? (
                  <img
                    key={userProfile.profileImageUrl}
                    src={`${userProfile.profileImageUrl.startsWith('http') ? userProfile.profileImageUrl : `${window.location.protocol}//${window.location.hostname}:5001${userProfile.profileImageUrl}`}?t=${Date.now()}`}
                    alt="Profile"
                    className="h-8 w-8 rounded-full object-cover object-center"
                    style={{
                      objectFit: 'cover',
                      objectPosition: 'center',
                      borderRadius: '50%',
                      width: '100%',
                      height: '100%'
                    }}
                    onError={(e) => {
                      console.error('Profile image failed to load:', userProfile.profileImageUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                    onLoad={() => {
                      console.log('Profile image loaded successfully:', userProfile.profileImageUrl);
                    }}
                  />
                ) : (
                  <i className="fas fa-user text-white text-lg"></i>
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          
                    <DropdownMenuContent
            align="end"
            className="w-64 bg-white border border-gray-200 shadow-xl rounded-xl p-1 max-h-[80vh] overflow-y-auto"
            sideOffset={8}
          >
          {/* Profile Header */}
          <div className="px-2 py-1 border-b border-gray-100">
            <div className="flex items-center space-x-2">
                             <div className="flex-shrink-0">
                 {userProfile?.profileImageUrl ? (
                   <img
                     key={userProfile.profileImageUrl}
                     src={`${userProfile.profileImageUrl.startsWith('http') ? userProfile.profileImageUrl : `${window.location.protocol}//${window.location.hostname}:5001${userProfile.profileImageUrl}`}?t=${Date.now()}`}
                     alt="Profile"
                     className="h-8 w-8 rounded-full object-cover object-center border border-gray-200"
                     style={{
                       objectFit: 'cover',
                       objectPosition: 'center',
                       borderRadius: '50%',
                       width: '100%',
                       height: '100%'
                     }}
                     onError={(e) => {
                       console.error('Profile image failed to load:', userProfile.profileImageUrl);
                       e.currentTarget.style.display = 'none';
                     }}
                     onLoad={() => {
                       console.log('Profile image loaded successfully:', userProfile.profileImageUrl);
                     }}
                   />
                 ) : (
                   <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                     <i className="fas fa-user text-white text-xs"></i>
                   </div>
                 )}
               </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {userProfile?.fullName || 'Customer'}
                </h3>
                <p className="text-xs text-gray-500 truncate">
                  {userProfile?.email || firebaseUser?.email || 'No email'}
                </p>
                {userProfile?.area && (
                  <div className="flex items-center mt-1">
                    <i className="fas fa-map-marker-alt text-xs text-gray-400 mr-1"></i>
                    <span className="text-xs text-gray-500 truncate">{userProfile.area}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {menuItems.map((item, index) => (
              <div key={item.id}>
                                        <DropdownMenuItem
                          onClick={() => handleMenuClick(item.path)}
                          className="flex items-start space-x-2 px-2 py-1 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors duration-150"
                        >
                  <div className="flex-shrink-0 mt-0.5">
                    <i className={`${item.icon} text-gray-600 text-sm`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">{item.label}</h4>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
                  </div>
                </DropdownMenuItem>
                
                {/* Add separator after certain items */}
                {index === 1 || index === 3 || index === 5 ? (
                  <DropdownMenuSeparator className="my-1" />
                ) : null}
              </div>
            ))}
          </div>

          {/* Logout Section */}
          <div className="border-t border-gray-100 pt-1">
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center space-x-2 px-2 py-1 cursor-pointer hover:bg-red-50 rounded-lg transition-colors duration-150 text-red-600"
            >
              <div className="flex-shrink-0">
                <i className="fas fa-sign-out-alt text-red-500 text-sm"></i>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium">Logout</h4>
                <p className="text-xs text-red-400">Sign out of your account</p>
              </div>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Pencil Edit Icon Overlay - Outside of dropdown trigger */}
        <div 
          className="absolute -bottom-1 -right-1 h-5 w-5 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 shadow-lg border-2 border-white z-10"
          onClick={handleEditPhotoClick}
          title="Edit profile photo"
        >
          {isUploading ? (
            <div className="w-2 h-2 border border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <i className="fas fa-pencil-alt text-white text-xs"></i>
          )}
        </div>
      </div>
    </div>
  );
}
