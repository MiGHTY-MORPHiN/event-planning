import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  CalendarDays, 
  Users, 
  MapPin, 
  ShoppingBag, 
  ClipboardList,
  UserCheck,
  BarChart3,
  Menu,
  X,
  Home,
  Star,
  FileText,
  Shield,
  Settings
} from 'lucide-react';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  const userType = currentPath.startsWith('/vendor') ? 'vendor' : 
                   currentPath.startsWith('/admin') ? 'admin' : 'planner';

  const plannerNavItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/events', icon: CalendarDays, label: 'Events' },
    { path: '/floorplan', icon: MapPin, label: 'Floorplan' },
    { path: '/vendors', icon: ShoppingBag, label: 'Vendors' },
    { path: '/guests', icon: Users, label: 'Guest List' },
    { path: '/rsvp', icon: UserCheck, label: 'RSVP Tracker' },
    { path: '/agenda', icon: ClipboardList, label: 'Agenda' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
  ];

  const vendorNavItems = [
    { path: '/vendor/profile', icon: Home, label: 'Profile' },
    { path: '/vendor/bookings', icon: CalendarDays, label: 'Bookings' },
    { path: '/vendor/floorplan', icon: MapPin, label: 'Floorplan' },
    { path: '/vendor/reviews', icon: Star, label: 'Reviews' },
    { path: '/vendor/contracts', icon: FileText, label: 'Contracts' },
  ];

  const adminNavItems = [
    { path: '/admin/verification', icon: Shield, label: 'Verification' },
    { path: '/admin/vendors', icon: Users, label: 'Vendor Details' },
    { path: '/admin/reports', icon: BarChart3, label: 'Reports' },
    { path: '/admin/users', icon: Settings, label: 'User Management' },
  ];

  const navItems = userType === 'vendor' ? vendorNavItems : 
                   userType === 'admin' ? adminNavItems : plannerNavItems;

  // Removed TypeScript type annotation
  const isActive = (path) => {
    if (path === '/dashboard' && currentPath === '/') return true;
    return currentPath === path;
  };

  return (
    <nav className="bg-card border-b border-border shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">
                {userType === 'vendor' ? 'VendorHub' : 
                 userType === 'admin' ? 'AdminPanel' : 'EventPlanner'}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive(item.path) ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.path} 
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                  >
                    <Button
                      variant={isActive(item.path) ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start space-x-2"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
