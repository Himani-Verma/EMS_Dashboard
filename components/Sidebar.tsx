import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  userRole: 'admin' | 'executive' | 'sales-executive' | 'customer-executive';
  userName?: string;
}

export default function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if we're on mobile on component mount and window resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Auto-collapse sidebar on small screens
      setIsCollapsed(window.innerWidth < 1024);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMobileMenuOpen && !target.closest('.mobile-sidebar') && !target.closest('.mobile-menu-button')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  const adminLinks = [
    { href: '/dashboard/admin/overview', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/admin/agents', label: 'Agents & Users', icon: '👥' },
    { href: '/dashboard/admin/visitors', label: 'Visitors', icon: '👤' },
    { href: '/dashboard/admin/analytics', label: 'Analytics', icon: '📈' },
    { href: '/dashboard/admin/chats', label: 'Chat History', icon: '💬' },
    { href: '/dashboard/admin/enquiries', label: 'Enquiries', icon: '📋' },
    { href: '/dashboard/admin/quotations', label: 'Quotations', icon: '📄' },
    { href: '/dashboard/admin/settings', label: 'Settings', icon: '⚙️' },
  ];

  const executiveLinks = [
    { href: '/dashboard/executive', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/executive/visitors', label: 'Visitors', icon: '👤' },
    { href: '/dashboard/executive/enquiries', label: 'Enquiries', icon: '📋' },
    { href: '/dashboard/executive/chats', label: 'Chat History', icon: '💬' },
    { href: '/dashboard/executive/analytics', label: 'Analytics', icon: '📈' },
    { href: '/dashboard/executive/profile', label: 'Profile', icon: '👤' },
  ];

  const links = userRole === 'admin' ? adminLinks : executiveLinks;

  // Mobile menu component
  const MobileMenu = () => (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-3 left-3 z-50 p-2.5 rounded-lg bg-gradient-to-r from-blue-900 to-blue-800 text-white md:hidden mobile-menu-button shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isMobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 sm:w-72 bg-[#2d4891] dark:bg-gray-900 transform transition-transform duration-300 ease-in-out md:hidden mobile-sidebar shadow-large ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ maxHeight: '100vh', overflow: 'hidden' }}
      >
        <div className="flex flex-col h-full">
          {/* Mobile header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center">
              <span className="text-white font-semibold text-lg">
                Envirocare EMS
              </span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-center w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 text-white hover:scale-105"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <SidebarContent />
          </div>
          
          {/* Mobile logout */}
          <div className="p-6 border-t border-white/10">
            <button
              onClick={() => {
                localStorage.removeItem('ems_token');
                localStorage.removeItem('ems_user');
                window.location.href = '/login';
              }}
              className="w-full flex items-center px-4 py-3 text-white hover:bg-red-500/20 hover:text-red-200 rounded-lg transition-all duration-200 group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform duration-200 mr-3">🚪</span>
              <span className="font-medium text-sm group-hover:text-red-200 transition-colors duration-200">
                Logout
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // Desktop sidebar component
  const DesktopSidebar = () => (
    <div
      className={`hidden md:flex flex-col h-screen bg-[#2d4891] dark:bg-gray-900 text-white transition-all duration-300 ease-in-out shadow-large border-r border-white/10
                ${isCollapsed ? 'w-20' : 'w-64'}`}
    >
      {/* Header with minimize button */}
      <div className={`flex items-center border-b border-white/10 ${isCollapsed ? 'justify-center p-6' : 'justify-between p-6'}`}>
        {!isCollapsed ? (
          <>
            <span className="text-white font-semibold text-lg truncate">
              Envirocare EMS
            </span>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center justify-center w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 text-white hover:scale-105"
              title="Collapse sidebar"
            >
              <svg 
                className="w-4 h-4 transition-transform duration-200" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center justify-center w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 text-white hover:scale-105"
            title="Expand sidebar"
          >
            <svg 
              className="w-4 h-4 transition-transform duration-200 rotate-180" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Navigation - scrollable area */}
      <div className="flex-1 overflow-y-auto">
        <SidebarContent />
      </div>
      
      {/* Logout button pinned at bottom */}
      <div className="p-6 border-t border-white/10">
        <button
          onClick={() => {
            localStorage.removeItem('ems_token');
            localStorage.removeItem('ems_user');
            window.location.href = '/login';
          }}
          className={`w-full text-white hover:bg-red-500/20 hover:text-red-200 rounded-lg transition-all duration-200 group ${
            isCollapsed 
              ? 'flex justify-center px-2 py-3' 
              : 'flex items-center px-4 py-3'
          }`}
          title={isCollapsed ? 'Logout' : ''}
        >
          <span className={`text-lg group-hover:scale-110 transition-transform duration-200 ${
            isCollapsed ? '' : 'mr-3'
          }`}>🚪</span>
          {!isCollapsed && (
            <span className="font-medium text-sm group-hover:text-red-200 transition-colors duration-200">
              Logout
            </span>
          )}
        </button>
      </div>
    </div>
  );

  // Common sidebar content
  const SidebarContent = () => (
    <div className="p-6">
      {/* User Welcome Section */}
      <div className={`${isCollapsed ? 'text-center mb-6' : 'mb-6'}`}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center justify-center mb-4">
              <Image
                src="/envirocare-logo.png"
                alt="Envirocare Labs"
                width={isMobile ? 120 : 100}
                height={isMobile ? 30 : 25}
                className="drop-shadow-sm"
              />
            </div>
            {userName && (
              <div className="text-center">
                <p className="text-xs text-white/70 font-medium">Welcome,</p>
                <p className="text-sm text-white font-semibold truncate">{userName}</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex justify-center mb-4">
            <Image
              src="/envirocare-logo.png"
              alt="Envirocare Labs"
              width={32}
              height={32}
              className="drop-shadow-sm rounded-full"
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav>
        <ul className="space-y-2">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center rounded-lg transition-all duration-200 group ${
                    isCollapsed 
                      ? 'justify-center px-3 py-3' 
                      : 'px-4 py-3'
                  } ${
                    isActive 
                      ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/20' 
                      : 'hover:bg-[#1f336e] text-white/80 hover:text-white hover:shadow-md'
                  }`}
                  onClick={() => isMobile && setIsMobileMenuOpen(false)}
                  title={isCollapsed ? link.label : ''}
                >
                  <span className={`text-lg transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-white/80'
                  } ${isCollapsed ? '' : 'mr-3'}`}>
                    {link.icon}
                  </span>
                  {!isCollapsed && (
                    <span className={`font-medium text-sm transition-colors duration-200 ${
                      isActive ? 'text-white' : 'text-white/80 group-hover:text-white'
                    }`}>
                      {link.label}
                    </span>
                  )}
                  {isActive && !isCollapsed && (
                    <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );

  return (
    <>
      <MobileMenu />
      <DesktopSidebar />
    </>
  );
}
