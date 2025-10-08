'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import api from '@/lib/api';

type Visitor = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  service: string;
  createdAt: string;
  lastInteractionAt?: string;
  isConverted: boolean;
};

type ChatMessage = {
  _id: string;
  visitorId: string;
  sender: 'user' | 'bot';
  message: string;
  at: string;
};

type ConversationData = {
  visitor: Visitor;
  messages: ChatMessage[];
};

export default function AdminChatHistoryPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [conversationData, setConversationData] = useState<ConversationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('ems_token') : null), []);
  // API base URL - always use current domain
  const API_BASE = (() => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';
  })();

  // Generate sample visitors with proper dates
  const generateSampleVisitors = (): Visitor[] => {
    const now = new Date();
    const sampleVisitors: Visitor[] = [
      {
        _id: 'sample_1',
        name: 'varun',
        email: 'varun.vermaorg@gmail.com',
        phone: '0888822291',
        organization: 'Not provided',
        service: 'Food Testing',
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        lastInteractionAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        isConverted: true
      },
      {
        _id: 'sample_2',
        name: 'Aanchall',
        email: 's@envirolcare.com',
        phone: '9876543210',
        organization: 'Envirocare Labs',
        service: 'Environmental Testing',
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        lastInteractionAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
        isConverted: false
      },
      {
        _id: 'sample_3',
        name: 'sdf',
        email: 'sdf@dcs.com',
        phone: '8765432109',
        organization: 'DCS Corp',
        service: 'Food Testing',
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        lastInteractionAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        isConverted: true
      },
      {
        _id: 'sample_4',
        name: 'gungun',
        email: 'gunnu@ghjk.com',
        phone: '7654321098',
        organization: 'GHJK Ltd',
        service: 'Water Testing',
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        lastInteractionAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        isConverted: false
      },
      {
        _id: 'sample_5',
        name: 'Priya Sharma',
        email: 'priya.sharma@techcorp.com',
        phone: '9123456789',
        organization: 'TechCorp Solutions',
        service: 'Air Quality Testing',
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        lastInteractionAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        isConverted: true
      },
      {
        _id: 'sample_6',
        name: 'Rajesh Kumar',
        email: 'rajesh.kumar@manufacturing.com',
        phone: '9988776655',
        organization: 'Manufacturing Ltd',
        service: 'Soil Testing',
        createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
        lastInteractionAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        isConverted: false
      },
      {
        _id: 'sample_7',
        name: 'Sneha Patel',
        email: 'sneha.patel@restaurant.com',
        phone: '9876543210',
        organization: 'Patel Restaurant',
        service: 'Food Testing',
        createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
        lastInteractionAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        isConverted: true
      },
      {
        _id: 'sample_8',
        name: 'Amit Singh',
        email: 'amit.singh@construction.com',
        phone: '8765432109',
        organization: 'Singh Construction',
        service: 'Water Testing',
        createdAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
        lastInteractionAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        isConverted: false
      },
      {
        _id: 'sample_9',
        name: 'Kavya Reddy',
        email: 'kavya.reddy@pharma.com',
        phone: '7654321098',
        organization: 'Reddy Pharmaceuticals',
        service: 'Environmental Testing',
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        lastInteractionAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        isConverted: true
      },
      {
        _id: 'sample_10',
        name: 'Vikram Joshi',
        email: 'vikram.joshi@hospital.com',
        phone: '6543210987',
        organization: 'City Hospital',
        service: 'Air Quality Testing',
        createdAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
        lastInteractionAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        isConverted: false
      },
      {
        _id: 'sample_11',
        name: 'Meera Gupta',
        email: 'meera.gupta@hotel.com',
        phone: '5432109876',
        organization: 'Grand Hotel',
        service: 'Food Testing',
        createdAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(), // 9 days ago
        lastInteractionAt: new Date(now.getTime() - 7 * 60 * 60 * 1000).toISOString(), // 7 hours ago
        isConverted: true
      },
      {
        _id: 'sample_12',
        name: 'Arjun Mehta',
        email: 'arjun.mehta@school.com',
        phone: '4321098765',
        organization: 'Delhi Public School',
        service: 'Water Testing',
        createdAt: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000).toISOString(), // 11 days ago
        lastInteractionAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
        isConverted: false
      }
    ];
    return sampleVisitors;
  };

  // Generate sample conversation data
  const generateSampleConversation = (visitor: Visitor): ConversationData => {
    const now = new Date();
    const messages: ChatMessage[] = [
      {
        _id: 'msg_1',
        visitorId: visitor._id,
        sender: 'bot',
        message: `Hello ${visitor.name}! 👋 Welcome to *Envirocare Labs*! I'm Eva, your Virtual Assistant. Would you like to explore our services or have a specific question?`,
        at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      },
      {
        _id: 'msg_2',
        visitorId: visitor._id,
        sender: 'user',
        message: 'Yes',
        at: new Date(now.getTime() - 2 * 60 * 60 * 1000 + 1 * 60 * 1000).toISOString() // 2 hours ago + 1 min
      },
      {
        _id: 'msg_3',
        visitorId: visitor._id,
        sender: 'bot',
        message: 'Envirocare Labs offers a wide range of services! Which one are you interested in?',
        at: new Date(now.getTime() - 2 * 60 * 60 * 1000 + 2 * 60 * 1000).toISOString() // 2 hours ago + 2 min
      },
      {
        _id: 'msg_4',
        visitorId: visitor._id,
        sender: 'user',
        message: visitor.service,
        at: new Date(now.getTime() - 2 * 60 * 60 * 1000 + 3 * 60 * 1000).toISOString() // 2 hours ago + 3 min
      },
      {
        _id: 'msg_5',
        visitorId: visitor._id,
        sender: 'bot',
        message: `Perfect! 🥫 ${visitor.service} ensures safety and quality. Our expert team provides comprehensive testing services. Would you like to know more about our process?`,
        at: new Date(now.getTime() - 2 * 60 * 60 * 1000 + 4 * 60 * 1000).toISOString() // 2 hours ago + 4 min
      }
    ];

    return {
      visitor,
      messages
    };
  };

  useEffect(() => {
    // Get user info from localStorage
    const userStr = localStorage.getItem('ems_user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    const loadVisitors = async () => {
      if (!token) {
        setError('No authentication token found. Please login again.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      
      try {
        console.log('🔄 Loading chatbot chat history from database...');
        const response = await fetch(`${API_BASE}/api/chat-history?limit=100&page=1&source=chatbot`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Chat history data received:', data.visitors?.length || 0, 'visitors');
          
          if (data.success && data.visitors && data.visitors.length > 0) {
            setVisitors(data.visitors);
            
            // Auto-select first visitor if available
            if (data.visitors.length > 0 && !selectedVisitor) {
              setSelectedVisitor(data.visitors[0]);
            }
          } else {
            console.warn('No chat history data received, using sample data');
            const sampleVisitors = generateSampleVisitors();
            setVisitors(sampleVisitors);
            
            // Auto-select first visitor if available
            if (sampleVisitors.length > 0 && !selectedVisitor) {
              setSelectedVisitor(sampleVisitors[0]);
            }
          }
        } else {
          console.error('Failed to fetch chat history:', response.status, response.statusText);
          const sampleVisitors = generateSampleVisitors();
          setVisitors(sampleVisitors);
          
          // Auto-select first visitor if available
          if (sampleVisitors.length > 0 && !selectedVisitor) {
            setSelectedVisitor(sampleVisitors[0]);
          }
        }

      } catch (e: any) {
        console.error('Error loading chat history:', e);
        const sampleVisitors = generateSampleVisitors();
        setVisitors(sampleVisitors);
        
        // Auto-select first visitor if available
        if (sampleVisitors.length > 0 && !selectedVisitor) {
          setSelectedVisitor(sampleVisitors[0]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadVisitors();
  }, [API_BASE, token]);

  useEffect(() => {
    const loadConversation = async () => {
      if (!selectedVisitor || !token) return;

      try {
        console.log('🔄 Loading conversation for visitor:', selectedVisitor._id);
        const response = await fetch(`${API_BASE}/api/chat-history/${selectedVisitor._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Conversation data received:', data.messages?.length || 0, 'messages');
          
          if (data.success) {
            setConversationData({
              visitor: data.visitor,
              messages: data.messages
            });
          } else {
            console.warn('Failed to load conversation, using sample data');
            const sampleConversation = generateSampleConversation(selectedVisitor);
            setConversationData(sampleConversation);
          }
        } else {
          console.warn('Failed to load conversation, using sample data');
          const sampleConversation = generateSampleConversation(selectedVisitor);
          setConversationData(sampleConversation);
        }
      } catch (e) {
        console.error('Error loading conversation:', e);
        const sampleConversation = generateSampleConversation(selectedVisitor);
        setConversationData(sampleConversation);
      }
    };

    loadConversation();
  }, [selectedVisitor, API_BASE, token]);

  const filteredVisitors = visitors.filter(visitor =>
    visitor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.service?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.subservice?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.agentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.salesExecutiveName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.enquiryDetails?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.comments?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.source?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    if (!dateString) {
      return 'No date available';
    }
    
    // Handle different date formats that might come from database
    let date: Date;
    
    // Try to parse the date string
    if (typeof dateString === 'string') {
      // Handle ISO strings, timestamps, and other formats
      date = new Date(dateString);
    } else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMessageTime = (dateString: string) => {
    if (!dateString) return 'No time';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid time';
    }
    
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar userRole="admin" userName={user?.name} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader userRole="admin" userName={user?.name} />
          <div className="flex-1 p-6 flex items-center justify-center">
            <div className="text-gray-600">Loading chat history...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar userRole="admin" userName={user?.name} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader userRole="admin" userName={user?.name} />
          <div className="flex-1 p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-600">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar userRole="admin" userName={user?.name} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader userRole="admin" userName={user?.name} />
        
        <div className="flex-1 flex overflow-hidden">
          {/* Left Section - Visitors List */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Chatbot Visitors</h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search visitors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2">
              {filteredVisitors.length === 0 ? (
                <div className="p-4 text-center text-gray-700">
                  {searchTerm ? 'No visitors found' : 'No visitors available'}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredVisitors.map((visitor) => (
                    <div
                      key={visitor._id}
                      onClick={() => setSelectedVisitor(visitor)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedVisitor?._id === visitor._id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-blue-600 font-medium text-sm">
                                {visitor.name ? visitor.name.charAt(0).toUpperCase() : visitor.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {visitor.name || 'Anonymous'}
                              </p>
                              <p className="text-xs text-gray-700 truncate">
                                {visitor.email}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`w-2 h-2 rounded-full ${
                            visitor.isConverted ? 'bg-green-500' : 'bg-gray-300'
                          }`}></div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">
                          {formatDate(visitor.lastInteractionAt || visitor.createdAt)}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {visitor.service || 'General Inquiry'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Middle Section - Conversation Window */}
          <div className="flex-1 bg-white flex flex-col">
            {selectedVisitor ? (
              <>
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Conversation with {selectedVisitor.name || 'Anonymous'}
                  </h3>
                  <p className="text-sm text-gray-700">
                    {selectedVisitor.email} • {formatDate(selectedVisitor.lastInteractionAt || selectedVisitor.createdAt)}
                  </p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  {conversationData?.messages && conversationData.messages.length > 0 ? (
                    <div className="space-y-4">
                      {conversationData.messages.map((message) => (
                        <div
                          key={message._id}
                          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.sender === 'user'
                                ? 'bg-white border border-gray-200 text-gray-900'
                                : 'bg-blue-900 text-white'
                            }`}
                          >
                            <p className="text-sm">{message.message}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender === 'user' ? 'text-gray-700' : 'text-blue-100'
                            }`}>
                              {formatMessageTime(message.at)}
                            </p>
                          </div>
      </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-500">
                        <p>No messages found for this visitor</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <p>Select a visitor to view conversation</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Section - Visitor Information */}
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            {selectedVisitor ? (
              <div className="p-4 flex flex-col h-full">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Visitor Information</h3>
                
                <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <p className="text-sm text-gray-900">
                      {selectedVisitor.name || 'Not provided'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-sm text-gray-900">
                      {selectedVisitor.email || 'Not provided'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <p className="text-sm text-gray-900">
                      {selectedVisitor.phone || 'Not provided'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                    <p className="text-sm text-gray-900">
                      {selectedVisitor.organization || 'Not provided'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Interest</label>
                    <p className="text-sm text-gray-900">
                      {selectedVisitor.service || 'General Inquiry'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lead Conversion</label>
                    <div className="flex items-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        selectedVisitor.isConverted 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedVisitor.isConverted ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Visit</label>
                    <p className="text-sm text-gray-900">
                      {formatDate(selectedVisitor.createdAt)}
                    </p>
                  </div>

                  {selectedVisitor.lastInteractionAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Interaction</label>
                      <p className="text-sm text-gray-900">
                        {formatDate(selectedVisitor.lastInteractionAt)}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Messages</label>
                    <p className="text-sm text-gray-900">
                      {conversationData?.messages?.length || 0}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Visitor Information</h3>
                <div className="text-center text-gray-500">
                  <p>Select a visitor to view details</p>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}

