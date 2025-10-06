'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import AdminUserEditor from '@/components/AdminUserEditor';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type User = {
  id: string;
  _id: string;
  username: string;
  email: string;
  phone?: string;
  role: string;
  region?: string;
  isActive?: boolean;
  isApproved?: boolean;
  lastLoginAt?: string;
  name: string;
  createdAt: string;
};

type AgentPerformance = {
  agentId: string;
  agentName: string;
  visitorsHandled: number;
  enquiriesAdded: number;
  leadsConverted: number;
};

type AgentFormData = {
  name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: string;
  region: string;
};

export default function AdminAgentsPage() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Service management states
  const [availableServices, setAvailableServices] = useState<string[]>([]);
  const [serviceAssignments, setServiceAssignments] = useState<Record<string, string[]>>({});
  const [showServiceDropdown, setShowServiceDropdown] = useState<string | null>(null);
  const [editingServices, setEditingServices] = useState<string[]>([]);
  
  // Popup states
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<AgentFormData>({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'sales-executive',
    region: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  
  // User Management states
  const [activeTab, setActiveTab] = useState<'agents' | 'users'>('agents');
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<User[]>([]);

  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('ems_token') : null), []);
  // API base URL - always use current domain
  const API_BASE = (() => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';
  })();

  // Debug: Log state changes
  useEffect(() => {
    console.log('🔄 State updated - Users:', users.length, 'Performance:', agentPerformance.length);
    console.log('👥 Users:', users);
    console.log('📊 Performance:', agentPerformance);
  }, [users, agentPerformance]);

  useEffect(() => {
    // Get user info from localStorage
    const userStr = localStorage.getItem('ems_user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Error parsing user data:', e);
        setError('Invalid user data. Please login again.');
        return;
      }
    } else {
      setError('No user data found. Please login again.');
      return;
    }

    loadData();
    fetchAvailableServices();
    fetchServiceAssignments();
  }, [API_BASE, token]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showServiceDropdown && !(event.target as Element).closest('.service-dropdown')) {
        setShowServiceDropdown(null);
        setEditingServices([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showServiceDropdown]);

  // Load user management data when users tab is active
  useEffect(() => {
    if (activeTab === 'users') {
      loadPendingUsers();
      loadApprovedUsers();
    }
  }, [activeTab, token]);

  const loadData = async () => {
    if (!token) {
      setError('No authentication token found');
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Loading agents data...');
      
      // Load users - simplified without auth
      const usersRes = await fetch(`${API_BASE}/api/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!usersRes.ok) {
        throw new Error(`Users API failed: ${usersRes.status}`);
      }

      const usersData = await usersRes.json();
      console.log('👥 Users API response:', usersData);
      setUsers(usersData.users || []);

      // Load performance data
      const performanceRes = await fetch(`${API_BASE}/api/analytics/agent-performance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      let performanceData: AgentPerformance[] = [];
      if (performanceRes.ok) {
        const perfData = await performanceRes.json();
        console.log('📊 Performance API response:', perfData);
        performanceData = perfData.agentPerformance || [];
        } else {
        console.warn('⚠️ Performance API failed:', performanceRes.status);
        const errorText = await performanceRes.text().catch(() => 'Could not read error');
        console.warn('⚠️ Error response:', errorText);
          performanceData = [];
        }

      // Use actual performance data from API, no hardcoded data
      console.log('🔄 Using API performance data');
      const hardcodedData = performanceData; // Use real API data instead of hardcoded
      console.log('✅ Setting hardcoded performance data:', hardcodedData);
      setAgentPerformance(hardcodedData);
      
      // If no users found, add some sample users for testing
      if (!usersData.users || usersData.users.length === 0) {
        console.log('⚠️ No users found, adding sample users for testing');
        const sampleUsers = [
          {
            id: '68c93cfcef5d5f20eea31ed3',
            _id: '68c93cfcef5d5f20eea31ed3',
            username: 'sanjana',
            email: 'sanjana@envirocarelabs.com',
            role: 'customer-executive',
            name: 'Customer Executive',
            createdAt: new Date().toISOString()
          },
          {
            id: '68c9514b236787c8fd6ae3ec',
            _id: '68c9514b236787c8fd6ae3ec',
            username: 'shreyas',
            email: 'shreyas@envirocarelabs.com',
            role: 'sales-executive',
            name: 'Shreyas Salvi',
            createdAt: new Date().toISOString()
          },
          {
            id: '68c93445f67c14682fa5cd5c',
            _id: '68c93445f67c14682fa5cd5c',
            username: 'test-se',
            email: 'test-se@envirocarelabs.com',
            role: 'sales-executive',
            name: 'Test-SE',
            createdAt: new Date().toISOString()
          }
        ];
        setUsers(sampleUsers);
        console.log('✅ Sample users added:', sampleUsers);
      }
      
      // Debug: Log the users data
      console.log('👥 Users data:', usersData);
      console.log('📊 Performance data will be set to:', hardcodedData);

      console.log('✅ Agents data loaded successfully');

    } catch (e: any) {
      console.error('❌ Error loading agents data:', e);
      setError(e.message || 'Failed to load agents data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);
    
    // Validation
    if (!formData.name || !formData.username || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      setFormLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setFormLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setFormLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      setFormLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: formData.role,
          region: formData.region
        })
      });

      const data = await response.json();

      if (data.success || response.ok) {
        const newAgent = data.user;
        setUsers(prev => [...prev, {
          id: newAgent.id || newAgent._id,
          _id: newAgent.id || newAgent._id,
          username: newAgent.username,
          email: newAgent.email,
          role: newAgent.role,
          name: newAgent.name,
          createdAt: newAgent.createdAt || new Date().toISOString()
        }]);
        setShowAddAgent(false);
        setFormData({
          name: '',
          username: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          role: 'sales-executive',
          region: ''
        });
        // Refresh the approved users list
        loadApprovedUsers();
        loadPendingUsers();
        alert('Agent registered successfully! The agent needs to be approved before they can access the system.');
      } else {
        throw new Error(data.message || 'Failed to add agent');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to add agent');
      alert(e.message || 'Failed to add agent');
    } finally {
      setFormLoading(false);
    }
  };

  // User management functions
  const handleUserUpdate = (updatedUser: any) => {
    // Ensure the user has both id and _id for compatibility
    const userWithId = {
      ...updatedUser,
      id: updatedUser.id || updatedUser._id,
      _id: updatedUser._id
    };
    
    // Update the user in all relevant state arrays
    setUsers(prev => prev.map(u => u._id === userWithId._id ? userWithId : u));
    setApprovedUsers(prev => prev.map(u => u._id === userWithId._id ? userWithId : u));
    setPendingUsers(prev => prev.map(u => u._id === userWithId._id ? userWithId : u));
    
    console.log('✅ User updated in local state:', userWithId);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handleCloseEditor = () => {
    setEditingUser(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // User Management functions
  const loadPendingUsers = async () => {
    try {
      console.log('🔄 Loading all users for filtering...');
      const response = await fetch(`${API_BASE}/api/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('👥 All users API response:', data);
        const allUsers = data.users || [];
        
        // Filter pending users (explicitly not approved)
        const pending = allUsers.filter((user: User) => 
          ['sales-executive', 'customer-executive', 'executive'].includes(user.role) && 
          user.isApproved === false
        );
        console.log('📋 Filtered pending users:', pending);
        setPendingUsers(pending);
      } else {
        console.error('❌ Failed to load users:', response.status, response.statusText);
        const errorText = await response.text().catch(() => 'Could not read error');
        console.error('❌ Error response:', errorText);
      }
    } catch (err) {
      console.error('Error loading pending users:', err);
    }
  };

  const loadApprovedUsers = async () => {
    try {
      console.log('🔄 Loading all users for approved filtering...');
      const response = await fetch(`${API_BASE}/api/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('👥 All users API response for approved:', data);
        const allUsers = data.users || [];
        
        // Filter approved executives - show all executives (like the original behavior)
        const approved = allUsers.filter((user: User) => 
          ['sales-executive', 'customer-executive', 'executive'].includes(user.role)
        );
        console.log('✅ Filtered approved users:', approved);
        setApprovedUsers(approved);
      } else {
        console.error('❌ Failed to load approved users:', response.status, response.statusText);
        const errorText = await response.text().catch(() => 'Could not read error');
        console.error('❌ Error response:', errorText);
      }
    } catch (err) {
      console.error('Error loading approved users:', err);
    }
  };

  const handleApproveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to approve this user?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/approve-user/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        loadPendingUsers();
        loadApprovedUsers();
        loadData(); // Refresh agents data too
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to approve user');
      }
    } catch (err) {
      console.error('Error approving user:', err);
      alert('Failed to approve user');
    }
  };

  const handleRejectUser = async (userId: string) => {
    const reason = prompt('Enter reason for rejection (optional):') || 'Registration rejected by admin';
    
    if (!confirm(`Are you sure you want to reject this user?\nReason: ${reason}`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/reject-user/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        loadPendingUsers();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to reject user');
      }
    } catch (err) {
      console.error('Error rejecting user:', err);
      alert('Failed to reject user');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'sales-executive':
        return 'bg-green-100 text-green-800';
      case 'customer-executive':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const fetchAvailableServices = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/executive-services/services`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableServices(data.services || []);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  };

  const fetchServiceAssignments = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/executive-services/assignments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setServiceAssignments(data.assignments || {});
      }
    } catch (err) {
      console.error('Error fetching service assignments:', err);
    }
  };

  const handleSaveServices = async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/executive-services/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          services: editingServices
        })
      });

      if (response.ok) {
        setServiceAssignments(prev => ({
          ...prev,
          [userId]: editingServices
        }));
        setShowServiceDropdown(null);
        setEditingServices([]);
        alert('Services assigned successfully');
      } else {
        alert('Failed to assign services');
      }
    } catch (err) {
      console.error('Error assigning services:', err);
      alert('Error assigning services');
    }
  };

  const totalAgents = users.filter(user => ['executive', 'sales-executive', 'customer-executive'].includes(user.role)).length;
  const executiveUsers = users.filter(user => ['executive', 'sales-executive', 'customer-executive'].includes(user.role));

  // Chart data
  const chartData = {
    labels: agentPerformance.map(perf => perf.agentName),
    datasets: [
      {
        label: 'Visitors',
        data: agentPerformance.map(perf => perf.visitorsHandled),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Enquiries',
        data: agentPerformance.map(perf => perf.enquiriesAdded),
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
      },
      {
        label: 'Leads',
        data: agentPerformance.map(perf => perf.leadsConverted),
        backgroundColor: 'rgba(245, 158, 11, 0.5)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar userRole="admin" userName={user?.name} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader userRole="admin" userName={user?.name} />
        
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-black">Agents Management</h1>
            <p className="text-black">Manage system agents and their performance</p>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('agents')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'agents'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Agents & Performance
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Agent Management
              </button>
            </nav>
          </div>

          {/* Agents Tab Content */}
          {activeTab === 'agents' && (
            <>
          {/* Action Boxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-black">Total Agents</h3>
                      <p className="text-3xl font-bold text-blue-600">{totalAgents || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-xl">👥</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowAddAgent(true)}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-black">Add Agents</h3>
                  <p className="text-black">Create new agent accounts</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-xl">➕</span>
                </div>
              </div>
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-black">Loading agents...</div>
            </div>
          )}

          {error && (
                <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-red-600 text-lg mb-2">❌</div>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    loadData();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

              {!loading && !error && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Agents Table */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6 h-full flex flex-col">
                    <h2 className="text-lg font-semibold text-black mb-4">Agent Performance</h2>
                    
            <div className="overflow-x-auto flex-1">
                      <table className="w-full h-full">
                <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-2 text-sm font-medium text-black">Agent Name</th>
                              <th className="text-left py-2 px-2 text-sm font-medium text-black">Role</th>
                            <th className="text-left py-2 px-2 text-sm font-medium text-black">Visitors</th>
                            <th className="text-left py-2 px-2 text-sm font-medium text-black">Enquiries</th>
                            <th className="text-left py-2 px-2 text-sm font-medium text-black">Leads</th>
                            <th className="text-left py-2 px-2 text-sm font-medium text-black w-32">Services</th>
                  </tr>
                </thead>
                <tbody>
                            {(() => {
                              const filteredUsers = users.filter(user => ['executive', 'sales-executive', 'customer-executive'].includes(user.role));
                              console.log('🔍 All users:', users);
                              console.log('🔍 Filtered users:', filteredUsers);
                              console.log('🔍 Agent performance:', agentPerformance);
                              
                              if (filteredUsers.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-500">
                                      No agents found. Please add some agents or check if users are loaded.
                                    </td>
                                  </tr>
                                );
                              }
                              
                              return filteredUsers.map((user, index) => {
                                const performance = agentPerformance.find(p => p.agentId === user.id);
                                console.log(`🔍 User: ${user.name} (ID: ${user.id}), Performance:`, performance);
                                return (
                                <tr 
                                  key={`agent-${user.id}-${index}`} 
                              className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                              }`}
                            >
                              <td className="py-2 px-2">
                                <div className="flex items-center">
                                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                                    <span className="text-blue-600 font-medium text-xs">
                                          {(user.name || user.username).charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                      <span className="font-medium text-black text-sm truncate max-w-32" title={user.name || user.username}>
                                        {user.name || user.username}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2 px-2">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      user.role === 'sales-executive' 
                                        ? 'bg-green-100 text-green-800' 
                                        : user.role === 'customer-executive'
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {user.role === 'sales-executive' 
                                        ? 'Sales Executive' 
                                        : user.role === 'customer-executive'
                                        ? 'Customer Executive'
                                        : 'Executive'
                                      }
                                    </span>
                              </td>
                              <td className="py-2 px-2">
                                    <span className="text-black text-sm">{performance?.visitorsHandled || 0}</span>
                              </td>
                              <td className="py-2 px-2">
                                    <span className="text-black text-sm">{performance?.enquiriesAdded || 0}</span>
                              </td>
                                  <td className="py-2 px-2">
                                    <span className="text-black text-sm">{performance?.leadsConverted || 0}</span>
                                  </td>
                                  <td className="py-2 px-2">
                                    <div className="relative">
                                  <button
                                    onClick={() => {
                                          setShowServiceDropdown(showServiceDropdown === user.id ? null : user.id);
                                          setEditingServices(serviceAssignments[user.id] || []);
                                    }}
                                        className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                                  >
                                      {(() => {
                                          const count = serviceAssignments[user.id]?.length || 0;
                                        return count > 0 ? `${count} Services` : 'Assign Services';
                                      })()}
                                        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                  
                                      {showServiceDropdown === user.id && (
                                        <div className="service-dropdown absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                          <div className="p-3">
                                            <div className="text-sm font-medium text-black mb-2">Select Services</div>
                                            <div className="max-h-48 overflow-y-auto space-y-2">
                                              {availableServices.map((service, serviceIndex) => (
                                          <label key={`service-${service}-${serviceIndex}`} className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={editingServices.includes(service)}
                                              onChange={(e) => {
                                                if (e.target.checked) {
                                                  setEditingServices([...editingServices, service]);
                                                } else {
                                                  setEditingServices(editingServices.filter(s => s !== service));
                                                }
                                              }}
                                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700">{service}</span>
                                          </label>
                                        ))}
                                      </div>
                                            <div className="flex justify-end space-x-2 mt-3 pt-2 border-t border-gray-200">
                                        <button
                                          onClick={() => {
                                            setShowServiceDropdown(null);
                                            setEditingServices([]);
                                          }}
                                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                                onClick={() => handleSaveServices(user.id)}
                                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                        >
                                          Save
                                        </button>
                                            </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                    </tr>
                                );
                              });
                            })()}
                </tbody>
              </table>
                    </div>

                    {agentPerformance.length === 0 && (
                      <div className="flex items-center justify-center h-full text-black">
                        No performance data available
                      </div>
                    )}
                </div>
              </div>

              {/* Performance Chart */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 h-full flex flex-col">
                      <h2 className="text-lg font-semibold text-black mb-4">Performance Overview</h2>
                      <div className="flex-1 flex items-center justify-center">
                        {agentPerformance.length > 0 ? (
                          <Bar data={chartData} options={chartOptions} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-black">
                            No agents to display
                      </div>
                    )}
                  </div>
                      {executiveUsers && executiveUsers.length > 0 && (
                    <div className="mt-3 text-xs text-gray-600">
                          {executiveUsers.slice(0, 3).map((user: User, index: number) => (
                            <div key={`chart-user-${user.id}-${index}`} className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span>
                                {user.name || user.username}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
            </>
          )}

          {/* Agent Management Tab Content */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Pending Users */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Pending Registration Approvals ({pendingUsers.length})
                  </h3>
                  
                  {pendingUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-lg mb-2">✅</div>
                      <p className="text-gray-500">No pending registrations</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Region
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Registered
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {pendingUsers.map((user) => (
                            <tr key={user._id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                  <div className="text-sm text-gray-500">@{user.username}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{user.email}</div>
                                {user.phone && (
                                  <div className="text-sm text-gray-500">{user.phone}</div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.role === 'sales-executive' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {user.role === 'sales-executive' ? 'Sales Executive' : 'Customer Executive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {user.region || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(user.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => handleApproveUser(user._id)}
                                  className="text-green-600 hover:text-green-900 mr-4"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectUser(user._id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Reject
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
      </div>
      </div>

              {/* Approved Users */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Approved Executives ({approvedUsers.length})
                  </h3>
                  
                  {approvedUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-lg mb-2">👥</div>
                      <p className="text-gray-500">No approved executives</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Region
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Last Login
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {approvedUsers.map((user) => (
                            <tr key={user._id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                  <div className="text-sm text-gray-500">@{user.username}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{user.email}</div>
                                {user.phone && (
                                  <div className="text-sm text-gray-500">{user.phone}</div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.role === 'sales-executive' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {user.role === 'sales-executive' ? 'Sales Executive' : 'Customer Executive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {user.region || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className="text-blue-600 hover:text-blue-900 mr-3"
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

      {/* Add Agent Popup */}
      {showAddAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 my-8">
            <h2 className="text-xl font-bold text-black mb-4">Add New Agent</h2>
            <form onSubmit={handleAddAgent}>
              <div className="space-y-4">
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Enter full name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      placeholder="Choose a username"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="Enter email address"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="Enter phone number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="Create password (min 6 characters)"
                      minLength={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      placeholder="Confirm password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    required
                  >
                    <option value="sales-executive">Sales Executive</option>
                    <option value="customer-executive">Customer Executive</option>
                   
                  </select>
                  <p className="text-xs text-gray-600 mt-1">
                    Sales Executive: Handles leads and sales pipeline | Customer Executive: Manages customer service and support
                  </p>
                </div>

                {/* Region */}
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Region/Territory
                  </label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({...formData, region: e.target.value})}
                    placeholder="e.g., North India, Mumbai Metro, International"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddAgent(false);
                    setError(null);
                  }}
                  className="px-4 py-2 text-black border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {formLoading ? 'Adding...' : 'Add Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Editor Modal */}
      {editingUser && token && (
        <AdminUserEditor
          user={editingUser}
          onClose={handleCloseEditor}
          onUpdate={handleUserUpdate}
          token={token}
        />
      )}
                  </div>
                  </div>
    </div>
  );
}
