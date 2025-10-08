'use client';
import React, { useState, useEffect } from 'react';
import { useTheme } from '@/lib/contexts/ThemeContext';

interface DashboardHeaderProps {
  userRole: 'admin' | 'executive' | 'sales-executive' | 'customer-executive';
  userName?: string;
}

export default function DashboardHeader({ userRole, userName }: DashboardHeaderProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Set isClient to true after hydration
    setIsClient(true);
    setCurrentTime(new Date());
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    if (!currentTime) return 'Welcome';
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-card border-b border-border shadow-soft px-4 py-4 md:mt-0 mt-12 transition-all duration-300">
      <div className="flex justify-between items-center">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground truncate">
            {getGreeting()}, {userName || userRole}
          </h1>
          {isClient && currentTime ? (
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {formatDate(currentTime)} • {formatTime(currentTime)}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">
              Loading...
            </p>
          )}
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
          {/* Theme Toggle Button - Only show after mount to prevent hydration mismatch */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-lg bg-secondary hover:bg-accent transition-all duration-200 hover:scale-105"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
          )}

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 bg-secondary hover:bg-accent rounded-lg px-3 py-2 transition-all duration-200 hover:scale-105"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-semibold">
                {userName ? userName.charAt(0).toUpperCase() : userRole.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline text-sm font-medium text-foreground truncate max-w-24">
                {userName || userRole}
              </span>
              <svg 
                className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-large z-50 animate-scale-in">
                <div className="py-2">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      window.location.href = userRole === 'admin' 
                        ? '/dashboard/admin/settings' 
                        : '/dashboard/executive/profile';
                    }}
                    className="flex items-center w-full px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors duration-200"
                  >
                    <span className="mr-3">👤</span>
                    View Profile
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      window.location.href = userRole === 'admin' 
                        ? '/dashboard/admin/settings' 
                        : '/dashboard/executive/profile';
                    }}
                    className="flex items-center w-full px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors duration-200"
                  >
                    <span className="mr-3">⚙️</span>
                    Settings
                  </button>
                  <hr className="my-2 border-border" />
                  <button
                    onClick={() => {
                      localStorage.removeItem('ems_token');
                      localStorage.removeItem('ems_user');
                      window.location.href = '/login';
                    }}
                    className="flex items-center w-full px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors duration-200"
                  >
                    <span className="mr-3">🚪</span>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
