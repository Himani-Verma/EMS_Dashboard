'use client';
import { useState, useEffect } from 'react';

interface PendingUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  isApproved: boolean;
}

export function usePendingApprovals() {
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('ems_token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const API_BASE = window.location.origin;
      const response = await fetch(`${API_BASE}/api/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const allUsers = data.users || [];
        
        // Filter pending users
        const pending = allUsers.filter((user: any) => 
          ['sales-executive', 'customer-executive', 'executive'].includes(user.role) && 
          user.isApproved === false
        );
        
        setPendingUsers(pending);
        setPendingCount(pending.length);
      } else {
        setError('Failed to fetch pending approvals');
      }
    } catch (err) {
      console.error('Error fetching pending approvals:', err);
      setError('Error fetching pending approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingApprovals, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    pendingCount,
    pendingUsers,
    loading,
    error,
    refetch: fetchPendingApprovals
  };
}
