import { useLocation } from "wouter";
import { useInquiryNotifications } from "@/hooks/useInquiryNotifications";
import { useUserProfile } from "@/hooks/useUserProfile";
import { hasAdminAccess } from "@/lib/roleUtils";

// Updated navigation component - cache bust v2.0
interface NavigationProps {
  currentPage?: string;
  userRole?: 'customer' | 'freelancer' | 'admin';
}

export default function Navigation({ currentPage, userRole }: NavigationProps) {
  const [, setLocation] = useLocation();
  
  // Get inquiry notifications for freelancers
  const { hasNewInquiries } = useInquiryNotifications();
  
  // Get user profile to determine role
  const { userProfile } = useUserProfile();

  // Auto-detect user role from localStorage if not provided
  const getUserRole = (): 'customer' | 'freelancer' | 'admin' => {
    if (userRole) return userRole;
    const storedRole = localStorage.getItem('selectedRole');
    return (storedRole as 'customer' | 'freelancer' | 'admin') || 'customer';
  };

  const actualUserRole = getUserRole();
  
  // Check if user has admin access
  const userHasAdminAccess = hasAdminAccess(userProfile);

  const getNavItems = () => {
    switch (actualUserRole) {
      case 'customer':
        // Updated customer navigation with new structure
        return [
          { id: 'home', icon: 'fas fa-home', label: 'Home', path: '/customer' },
          { id: 'leads', icon: 'fas fa-list', label: 'Request', path: '/customer/requests' },
          { id: 'news', icon: 'fas fa-newspaper', label: 'News', path: '/customer/news' },
          { id: 'profile', icon: 'fas fa-user', label: 'Profile', path: '/customer/profile' },
          { id: 'more', icon: 'fas fa-ellipsis-h', label: 'More', path: '/customer/more' },
        ];
      case 'freelancer':
        return [
          { id: 'home', icon: 'fas fa-home', label: 'Home', path: '/freelancer' },
          { id: 'leads', icon: 'fas fa-envelope', label: 'Leads', path: '/freelancer/leads' },
          { id: 'plan', icon: 'fas fa-credit-card', label: 'Plan', path: '/plans' },
          { id: 'news', icon: 'fas fa-newspaper', label: 'News', path: '/freelancer/news' },
          { id: 'more', icon: 'fas fa-ellipsis-h', label: 'More', path: '/freelancer/more' },
        ];
      case 'admin':
        // Only show admin navigation if user actually has admin access
        if (userHasAdminAccess) {
          return [
            { id: 'dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard', path: '/admin' },
            { id: 'users', icon: 'fas fa-users', label: 'Users', path: '/admin/users' },
            { id: 'leads', icon: 'fas fa-tasks', label: 'Leads', path: '/admin/leads' },
            { id: 'settings', icon: 'fas fa-cog', label: 'Settings', path: '/admin/settings' },
          ];
        } else {
          // If user claims to be admin but doesn't have admin access, show customer nav
          return [
            { id: 'home', icon: 'fas fa-home', label: 'Home', path: '/customer' },
            { id: 'leads', icon: 'fas fa-list', label: 'Request', path: '/customer/requests' },
            { id: 'news', icon: 'fas fa-newspaper', label: 'News', path: '/customer/news' },
            { id: 'profile', icon: 'fas fa-user', label: 'Profile', path: '/customer/profile' },
            { id: 'more', icon: 'fas fa-ellipsis-h', label: 'More', path: '/customer/more' },
          ];
        }
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const handleNavigation = (path: string) => {
    setLocation(path);
  };

  return (
    <div className="bottom-nav">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              data-testid={`nav-${item.id}`}
            >
              <div className="relative">
                <i className={`${item.icon} text-lg mb-1`}></i>
                {item.id === 'leads' && hasNewInquiries && (
                  <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center animate-pulse"></span>
                )}
              </div>
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
