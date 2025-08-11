import { useLocation } from "wouter";

interface NavigationProps {
  currentPage?: string;
  userRole?: 'customer' | 'freelancer' | 'admin';
}

export default function Navigation({ currentPage, userRole }: NavigationProps) {
  const [, setLocation] = useLocation();

  // Auto-detect user role from localStorage if not provided
  const getUserRole = (): 'customer' | 'freelancer' | 'admin' => {
    if (userRole) return userRole;
    const storedRole = localStorage.getItem('selectedRole');
    return (storedRole as 'customer' | 'freelancer' | 'admin') || 'customer';
  };

  const actualUserRole = getUserRole();

  const getNavItems = () => {
    switch (actualUserRole) {
      case 'customer':
        return [
          { id: 'home', icon: 'fas fa-home', label: 'Home', path: '/customer' },
          { id: 'search', icon: 'fas fa-search', label: 'Search', path: '/customer/search' },
          { id: 'requests', icon: 'fas fa-list', label: 'Requests', path: '/customer/requests' },
          { id: 'profile', icon: 'fas fa-user', label: 'Profile', path: '/customer/profile' },
        ];
      case 'freelancer':
        return [
          { id: 'dashboard', icon: 'fas fa-home', label: 'Dashboard', path: '/freelancer' },
          { id: 'leads', icon: 'fas fa-list-alt', label: 'Leads', path: '/freelancer/leads' },
          { id: 'plans', icon: 'fas fa-credit-card', label: 'Plans', path: '/plans' },
          { id: 'profile', icon: 'fas fa-user', label: 'Profile', path: '/freelancer/profile' },
        ];
      case 'admin':
        return [
          { id: 'dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard', path: '/admin' },
          { id: 'users', icon: 'fas fa-users', label: 'Users', path: '/admin/users' },
          { id: 'leads', icon: 'fas fa-tasks', label: 'Leads', path: '/admin/leads' },
          { id: 'settings', icon: 'fas fa-cog', label: 'Settings', path: '/admin/settings' },
        ];
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
              <i className={`${item.icon} text-lg mb-1`}></i>
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
