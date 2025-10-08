'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ChatbotWidget from '@/components/ChatbotWidget';
import PipelineFlowchart from '@/components/PipelineFlowchart';
import { getServiceDisplayName } from '@/lib/utils/serviceMapping';
import api from '@/lib/api';

type Visitor = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  region?: string;
  service: string;
  subservice?: string;
  enquiryDetails?: string;
  source: 'chatbot' | 'email' | 'calls' | 'website';
  createdAt: string;
  lastInteractionAt?: string;
  isConverted: boolean;
  status: string;
  agent?: string;
  agentName?: string;
  assignedAgent?: string;
  salesExecutive?: string;
  salesExecutiveName?: string;
  comments?: string;
  amount?: number;
  pipelineHistory?: Array<{
    status: string;
    changedAt: string;
    changedBy: string;
    notes?: string;
  }>;
};

// Pipeline stages for status filtering
const PIPELINE_STAGES = [
  { id: 'enquiry_required', name: 'Enquiry Received' },
  { id: 'contact_initiated', name: 'Contact Initiated' },
  { id: 'feasibility_check', name: 'Feasibility Check' },
  { id: 'qualified', name: 'Qualified' },
  { id: 'quotation_sent', name: 'Quotation Sent' },
  { id: 'negotiation_stage', name: 'Negotiation Stage' },
  { id: 'converted', name: 'Converted' },
  { id: 'payment_received', name: 'Payment Received' },
  { id: 'sample_received', name: 'Sample Received' },
  { id: 'handed_to_smc', name: 'Handed to SMC' },
  { id: 'informed_about_se', name: 'Informed about SE' },
  { id: 'provided_kyc_quotation_to_smc', name: 'Provided KYC & Quotation to SMC' },
  { id: 'process_initiated', name: 'Process Initiated' },
  { id: 'ongoing_process', name: 'Ongoing Process' },
  { id: 'report_generated', name: 'Report Generated' },
  { id: 'sent_to_client_via_mail', name: 'Sent to Client via Mail' },
  { id: 'report_hardcopy_sent', name: 'Report Hardcopy Sent' },
  { id: 'unqualified', name: 'Unqualified' }
];

// Time period options for filtering
const TIME_PERIODS = [
  { id: 'all', name: 'All Time' },
  { id: 'daily', name: 'Daily' },
  { id: 'weekly', name: 'Weekly' },
  { id: 'monthly', name: 'Monthly' }
];

// Months for month picker
const MONTHS = [
  { id: '01', name: 'January' },
  { id: '02', name: 'February' },
  { id: '03', name: 'March' },
  { id: '04', name: 'April' },
  { id: '05', name: 'May' },
  { id: '06', name: 'June' },
  { id: '07', name: 'July' },
  { id: '08', name: 'August' },
  { id: '09', name: 'September' },
  { id: '10', name: 'October' },
  { id: '11', name: 'November' },
  { id: '12', name: 'December' }
];

export default function Home() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showColumnFilter, setShowColumnFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showTimeFilter, setShowTimeFilter] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [showPipeline, setShowPipeline] = useState(false);
  const [selectedVisitors, setSelectedVisitors] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  // Using Next.js API routes instead of external backend

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    'Sr.no.': true,
    'Name of Client': true,
    'Agent': true,
    'Status': true,
    'Date & Time': true,
    'Service': true,
    'Sub-service': true,
    'Enquiry Details': true,
    'Source': true,
    'Contact no.': true,
    'Email id': true,
    'Organization': true,
    'Region': true,
    'Sales Executive': true,
    'Comments': true,
    'Amount': true
  });

  // Filters state
  const [filters, setFilters] = useState({
    status: 'all',
    timePeriod: 'all',
    month: 'all'
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load visitors data
  const loadVisitors = useCallback(async () => {
    try {
      setLoading(true);
      // Get all visitors by setting a high limit
      const data = await api.visitors.list({ limit: 1000 });
      console.log('📊 API Response:', data);
      setVisitors(data.items || data.visitors || []);
    } catch (e) {
      console.error('Error loading visitors:', e);
      setError('Failed to load visitors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVisitors();
  }, [loadVisitors]);

  // Delete individual visitor
  const handleDeleteVisitor = async (visitorId: string) => {
    if (!confirm('Are you sure you want to delete this visitor? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/visitors?ids=${visitorId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Visitor deleted successfully:', result);
        // Refresh the visitors list
        await loadVisitors();
        // Remove from selected visitors if it was selected
        setSelectedVisitors(prev => {
          const newSet = new Set(prev);
          newSet.delete(visitorId);
          return newSet;
        });
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete visitor');
      }
    } catch (error) {
      console.error('Error deleting visitor:', error);
      alert('Failed to delete visitor');
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete selected visitors
  const handleDeleteSelected = async () => {
    if (selectedVisitors.size === 0) {
      alert('Please select at least one visitor to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedVisitors.size} selected visitor(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(true);
      const ids = Array.from(selectedVisitors).join(',');
      const response = await fetch(`/api/visitors?ids=${ids}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Visitors deleted successfully:', result);
        // Refresh the visitors list
        await loadVisitors();
        // Clear selected visitors
        setSelectedVisitors(new Set());
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete visitors');
      }
    } catch (error) {
      console.error('Error deleting visitors:', error);
      alert('Failed to delete visitors');
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete all visitors
  const handleDeleteAll = async () => {
    if (visitors.length === 0) {
      alert('No visitors to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ALL ${visitors.length} visitors? This action cannot be undone.`)) {
      return;
    }

    // Extra confirmation for delete all
    if (!confirm('This will permanently delete all visitor data. Are you absolutely sure?')) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch('/api/visitors?deleteAll=true', {
        method: 'DELETE'
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ All visitors deleted successfully:', result);
        // Refresh the visitors list
        await loadVisitors();
        // Clear selected visitors
        setSelectedVisitors(new Set());
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete all visitors');
      }
    } catch (error) {
      console.error('Error deleting all visitors:', error);
      alert('Failed to delete all visitors');
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle selection of a single visitor
  const toggleVisitorSelection = (visitorId: string) => {
    setSelectedVisitors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(visitorId)) {
        newSet.delete(visitorId);
      } else {
        newSet.add(visitorId);
      }
      return newSet;
    });
  };

  // Toggle selection of all visitors
  const toggleSelectAll = () => {
    if (selectedVisitors.size === filteredVisitors.length) {
      setSelectedVisitors(new Set());
    } else {
      setSelectedVisitors(new Set(filteredVisitors.map(v => v._id)));
    }
  };

  // Column visibility change handler
  const handleColumnVisibilityChange = (columnName: string, isVisible: boolean) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnName]: isVisible
    }));
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      if (showExportDropdown && !target.closest('.export-dropdown')) {
        setShowExportDropdown(false);
      }
      
      if (showColumnFilter && !target.closest('.column-filter')) {
        setShowColumnFilter(false);
      }
      
      if (showStatusFilter && !target.closest('.status-filter')) {
        setShowStatusFilter(false);
      }
      
      if (showTimeFilter && !target.closest('.time-filter')) {
        setShowTimeFilter(false);
      }
      
      if (showMonthPicker && !target.closest('.month-picker')) {
        setShowMonthPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown, showColumnFilter, showStatusFilter, showTimeFilter, showMonthPicker]);

  // Filter visitors based on search term and filters
  const filteredVisitors = useMemo(() => {
    let filtered = visitors;

    // Search filter
    if (debouncedSearchTerm) {
      filtered = filtered.filter(visitor =>
        visitor.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        visitor.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        visitor.organization?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        visitor.phone?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        visitor.region?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        visitor.service?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        visitor.subservice?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        visitor.agentName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        visitor.salesExecutiveName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        visitor.status?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        visitor.enquiryDetails?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        visitor.comments?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        visitor.source?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(visitor => visitor.status === filters.status);
    }

    // Time period filter
    if (filters.timePeriod !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.timePeriod) {
        case 'daily':
          filterDate.setDate(now.getDate() - 1);
          break;
        case 'weekly':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'monthly':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(visitor => 
        new Date(visitor.createdAt) >= filterDate
      );
    }

    // Month filter
    if (filters.month !== 'all') {
      filtered = filtered.filter(visitor => {
        const visitorDate = new Date(visitor.createdAt);
        return visitorDate.getMonth() + 1 === parseInt(filters.month);
      });
    }

    return filtered;
  }, [visitors, debouncedSearchTerm, filters]);

  // Export functions
  const exportToCSV = () => {
    const csvData = filteredVisitors.map((visitor, index) => ({
      'Sr. No.': index + 1,
      'Name of Client': visitor.name || '',
      'Agent': visitor.agentName || visitor.assignedAgent || 'Unassigned',
      'Status': visitor.status || 'New',
      'Date & Time': new Date(visitor.createdAt).toLocaleString(),
      'Service': getServiceDisplayName(visitor.service) || visitor.service,
      'Sub-service': visitor.subservice || '',
      'Enquiry Details': visitor.enquiryDetails || '',
      'Source': visitor.source || '',
      'Contact no.': visitor.phone || '',
      'Email id': visitor.email || '',
      'Organization': visitor.organization || '',
      'Region': visitor.region || '',
      'Sales Executive': visitor.salesExecutiveName || '',
      'Comments': visitor.comments || '',
      'Amount': visitor.amount || 0
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          return typeof value === 'string' && value.includes(',')
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `visitors_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoginClick = () => {
    router.push('/login');
  };

  const handleRegisterClick = () => {
    router.push('/register');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-soft border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Image 
                src="/envirocare-logo.png" 
                alt="Envirocare Labs" 
                width={200} 
                height={50} 
                className="h-12 w-auto"
              />
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRegisterClick}
                className="border border-primary text-primary hover:bg-primary/5 px-6 py-2.5 rounded-lg font-medium transition-all duration-200 hover:scale-105"
              >
                Register
              </button>
              <button
                onClick={handleLoginClick}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-soft hover:shadow-medium hover:scale-105"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-xl p-4 animate-slide-up">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-destructive mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-destructive font-medium">{error}</div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Visitors Management</h1>
              <p className="text-muted-foreground">View and manage all visitors through the pipeline</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Delete Selected Button */}
              {selectedVisitors.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all duration-200 shadow-soft hover:shadow-medium disabled:bg-muted disabled:cursor-not-allowed hover:scale-105"
                  title={`Delete ${selectedVisitors.size} selected visitor(s)`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {isDeleting ? 'Deleting...' : `Delete Selected (${selectedVisitors.size})`}
                </button>
              )}
              
              {/* Delete All Button */}
              {visitors.length > 0 && (
                <button
                  onClick={handleDeleteAll}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2.5 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-all duration-200 shadow-soft hover:shadow-medium disabled:bg-muted disabled:cursor-not-allowed hover:scale-105"
                  title="Delete all visitors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {isDeleting ? 'Deleting...' : 'Delete All'}
                </button>
              )}

              {/* Export Dropdown */}
              <div className="relative export-dropdown">
                <button
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-soft hover:shadow-medium hover:scale-105"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showExportDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-large z-50 animate-scale-in">
                    <div className="py-2">
                      <button
                        onClick={() => {
                          exportToCSV();
                          setShowExportDropdown(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors duration-200"
                      >
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export to Excel
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Refresh Button */}
              <button
                onClick={() => {
                  console.log('🔄 Manual refresh triggered');
                  loadVisitors();
                }}
                className="flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-soft hover:shadow-medium hover:scale-105"
                title="Refresh data"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl shadow-soft p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search visitors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-input text-foreground transition-all duration-200"
                />
                <svg className="absolute right-3 top-3.5 h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Status Filter */}
            <div className="relative status-filter">
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <button
                onClick={() => setShowStatusFilter(!showStatusFilter)}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-left text-foreground flex items-center justify-between bg-input hover:bg-accent transition-all duration-200"
              >
                <span>{PIPELINE_STAGES.find(s => s.id === filters.status)?.name || 'All Statuses'}</span>
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showStatusFilter && (
                <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-lg shadow-large max-h-60 overflow-y-auto animate-scale-in">
                  <button
                    onClick={() => {
                      setFilters(prev => ({ ...prev, status: 'all' }));
                      setShowStatusFilter(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-foreground hover:bg-accent transition-colors duration-200"
                  >
                    All Statuses
                  </button>
                  {PIPELINE_STAGES.map(stage => (
                    <button
                      key={stage.id}
                      onClick={() => {
                        setFilters(prev => ({ ...prev, status: stage.id }));
                        setShowStatusFilter(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-foreground hover:bg-accent transition-colors duration-200"
                    >
                      {stage.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Time Period Filter */}
            <div className="relative time-filter">
              <label className="block text-sm font-medium text-foreground mb-2">Time Period</label>
              <button
                onClick={() => setShowTimeFilter(!showTimeFilter)}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-left text-foreground flex items-center justify-between bg-input hover:bg-accent transition-all duration-200"
              >
                <span>{TIME_PERIODS.find(t => t.id === filters.timePeriod)?.name || 'All Time'}</span>
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showTimeFilter && (
                <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-lg shadow-large animate-scale-in">
                  {TIME_PERIODS.map(period => (
                    <button
                      key={period.id}
                      onClick={() => {
                        setFilters(prev => ({ ...prev, timePeriod: period.id }));
                        setShowTimeFilter(false);
                        // If monthly is selected, show month picker
                        if (period.id === 'monthly') {
                          setShowMonthPicker(true);
                        }
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-foreground hover:bg-accent transition-colors duration-200"
                    >
                      {period.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Month Filter - Only show when Monthly is selected */}
            {filters.timePeriod === 'monthly' && (
              <div className="relative month-picker">
                <label className="block text-sm font-medium text-foreground mb-2">Month</label>
                <button
                  onClick={() => setShowMonthPicker(!showMonthPicker)}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-left text-foreground flex items-center justify-between bg-input hover:bg-accent transition-all duration-200"
                >
                  <span>{filters.month === 'all' ? 'All Months' : MONTHS.find(m => m.id === filters.month)?.name || 'All Months'}</span>
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showMonthPicker && (
                  <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-lg shadow-large max-h-60 overflow-y-auto animate-scale-in">
                    <button
                      onClick={() => {
                        setFilters(prev => ({ ...prev, month: 'all' }));
                        setShowMonthPicker(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-foreground hover:bg-accent transition-colors duration-200"
                    >
                      All Months
                    </button>
                    {MONTHS.map(month => (
                      <button
                        key={month.id}
                        onClick={() => {
                          setFilters(prev => ({ ...prev, month: month.id }));
                          setShowMonthPicker(false);
                        }}
                        className="w-full px-4 py-3 text-left text-sm text-foreground hover:bg-accent transition-colors duration-200"
                      >
                        {month.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Columns Filter - Show when not monthly or as 4th column */}
            {filters.timePeriod !== 'monthly' && (
              <div className="relative column-filter">
                <label className="block text-sm font-medium text-foreground mb-2">Show Columns</label>
                <button
                  onClick={() => setShowColumnFilter(!showColumnFilter)}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-left text-foreground flex items-center justify-between bg-input hover:bg-accent transition-all duration-200"
                >
                  <span>Select Columns</span>
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showColumnFilter && (
                  <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-large z-50 max-h-80 overflow-y-auto animate-scale-in">
                    <div className="p-4">
                      <div className="text-sm font-medium text-foreground mb-4">Select columns to display:</div>
                      <div className="space-y-3">
                        {Object.entries(visibleColumns).map(([columnName, isVisible]) => (
                          <label key={columnName} className="flex items-center space-x-3 cursor-pointer hover:bg-accent p-3 rounded-lg transition-colors duration-200">
                            <input
                              type="checkbox"
                              checked={isVisible}
                              onChange={(e) => handleColumnVisibilityChange(columnName, e.target.checked)}
                              className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                            />
                            <span className="text-sm text-foreground">{columnName}</span>
                          </label>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-border">
                        <button
                          onClick={() => {
                            const allVisible = Object.keys(visibleColumns).reduce((acc, key) => ({ ...acc, [key]: true }), {} as typeof visibleColumns);
                            setVisibleColumns(allVisible);
                          }}
                          className="text-xs text-primary hover:text-primary/80 mr-4 transition-colors duration-200"
                        >
                          Show All
                        </button>
                        <button
                          onClick={() => {
                            const allHidden = Object.keys(visibleColumns).reduce((acc, key) => ({ ...acc, [key]: false }), {} as typeof visibleColumns);
                            setVisibleColumns(allHidden);
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
                        >
                          Hide All
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Visitors Table */}
        <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <div className="text-muted-foreground">Loading visitors...</div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    {/* Checkbox column */}
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedVisitors.size === filteredVisitors.length && filteredVisitors.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-primary border-border rounded focus:ring-primary cursor-pointer"
                        title="Select all visitors"
                      />
                    </th>
                    {visibleColumns['Sr.no.'] && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Sr.no.
                      </th>
                    )}
                    {visibleColumns['Name of Client'] && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Name of Client
                      </th>
                    )}
                    {visibleColumns['Agent'] && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Agent
                      </th>
                    )}
                    {visibleColumns['Status'] && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                    )}
                    {visibleColumns['Date & Time'] && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Date & Time
                      </th>
                    )}
                    {visibleColumns['Service'] && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Service
                      </th>
                    )}
                    {visibleColumns['Sub-service'] && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Sub-service
                      </th>
                    )}
                    {visibleColumns['Enquiry Details'] && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Enquiry Details
                      </th>
                    )}
                    {visibleColumns['Source'] && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Source
                      </th>
                    )}
                    {visibleColumns['Contact no.'] && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Contact no.
                      </th>
                    )}
                    {visibleColumns['Email id'] && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Email id
                      </th>
                    )}
                    {visibleColumns['Organization'] && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Organization
                      </th>
                    )}
                    {visibleColumns['Region'] && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Region
                      </th>
                    )}
                    {visibleColumns['Sales Executive'] && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Sales Executive
                      </th>
                    )}
                    {visibleColumns['Comments'] && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Comments
                      </th>
                    )}
                    {visibleColumns['Amount'] && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Amount
                      </th>
                    )}
                    {/* Actions column */}
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {filteredVisitors.map((visitor, index) => (
                    <tr key={visitor._id} className={`hover:bg-accent/50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-card' : 'bg-muted/20'}`}>
                      {/* Checkbox cell */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedVisitors.has(visitor._id)}
                          onChange={() => toggleVisitorSelection(visitor._id)}
                          className="w-4 h-4 text-primary border-border rounded focus:ring-primary cursor-pointer"
                          title="Select this visitor"
                        />
                      </td>
                      {visibleColumns['Sr.no.'] && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {index + 1}
                        </td>
                      )}
                      {visibleColumns['Name of Client'] && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-foreground">
                            {visitor.name || 'N/A'}
                          </div>
                        </td>
                      )}
                      {visibleColumns['Agent'] && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-foreground">
                            {visitor.agentName || visitor.assignedAgent || 'Unassigned'}
                          </div>
                        </td>
                      )}
                      {visibleColumns['Status'] && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedVisitor(visitor);
                              setShowPipeline(true);
                            }}
                            className={`inline-flex px-3 py-1.5 text-xs font-semibold rounded-full hover:opacity-80 transition-all duration-200 cursor-pointer hover:scale-105 ${
                              visitor.status === 'converted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              visitor.status === 'qualified' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                              visitor.status === 'quotation_sent' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              visitor.status === 'negotiation_stage' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                              'bg-muted text-muted-foreground'
                            }`}
                            title="Click to view pipeline and status history"
                          >
                            {visitor.status?.replace(/_/g, ' ') || 'New'}
                          </button>
                        </td>
                      )}
                      {visibleColumns['Date & Time'] && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {new Date(visitor.createdAt).toLocaleString()}
                        </td>
                      )}
                      {visibleColumns['Service'] && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-foreground">
                            {getServiceDisplayName(visitor.service) || visitor.service || 'N/A'}
                          </div>
                        </td>
                      )}
                      {visibleColumns['Sub-service'] && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-foreground">
                            {visitor.subservice || 'N/A'}
                          </div>
                        </td>
                      )}
                      {visibleColumns['Enquiry Details'] && (
                        <td className="px-6 py-4">
                          <div className="text-sm text-foreground max-w-xs truncate">
                            {visitor.enquiryDetails || 'N/A'}
                          </div>
                        </td>
                      )}
                      {visibleColumns['Source'] && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-3 py-1.5 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                            {visitor.source || 'N/A'}
                          </span>
                        </td>
                      )}
                      {visibleColumns['Contact no.'] && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {visitor.phone || 'N/A'}
                        </td>
                      )}
                      {visibleColumns['Email id'] && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {visitor.email || 'N/A'}
                        </td>
                      )}
                      {visibleColumns['Organization'] && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {visitor.organization || 'N/A'}
                        </td>
                      )}
                      {visibleColumns['Region'] && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {visitor.region || 'N/A'}
                        </td>
                      )}
                      {visibleColumns['Sales Executive'] && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {(() => {
                            // Don't show Customer Executive as Sales Executive
                            if (visitor.salesExecutiveName === 'Customer Executive') {
                              return 'N/A';
                            }
                            return visitor.salesExecutiveName || 'N/A';
                          })()}
                        </td>
                      )}
                      {visibleColumns['Comments'] && (
                        <td className="px-6 py-4">
                          <div className="text-sm text-foreground max-w-xs truncate">
                            {visitor.comments || 'N/A'}
                          </div>
                        </td>
                      )}
                      {visibleColumns['Amount'] && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {visitor.amount ? `₹${visitor.amount.toLocaleString()}` : 'N/A'}
                        </td>
                      )}
                      {/* Actions cell */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDeleteVisitor(visitor._id)}
                          disabled={isDeleting}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-all duration-200 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed hover:scale-105"
                          title="Delete this visitor"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* No results */}
          {!loading && filteredVisitors.length === 0 && (
            <div className="px-6 py-12 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-muted-foreground">
                  {searchTerm || filters.status !== 'all' || filters.timePeriod !== 'all' || filters.month !== 'all'
                    ? 'No visitors found matching your filters.'
                    : 'No visitors found.'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredVisitors.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {filteredVisitors.length} visitors
            </div>
          </div>
        )}
      </div>

      {/* Pipeline Modal */}
      {showPipeline && selectedVisitor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-card border border-border rounded-xl shadow-large w-full max-w-5xl max-h-[80vh] overflow-y-auto animate-scale-in">
            <div className="sticky top-0 bg-card border-b border-border px-6 py-5 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-foreground">
                  Pipeline Tracking: {selectedVisitor.name || 'Anonymous'}
                </h3>
                <button
                  onClick={() => setShowPipeline(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-accent"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Pipeline Flowchart - Read Only Mode */}
              <div className="mb-6">
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-primary mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-primary font-medium">Read-Only View</p>
                  </div>
                  <p className="text-primary/80 text-sm mt-1">
                    This is a read-only view of the pipeline. You can see the current status and executive notes, but cannot make changes.
                  </p>
                </div>
                
                <PipelineFlowchart
                  key={`pipeline-${selectedVisitor._id}-${selectedVisitor.status}`}
                  currentStatus={selectedVisitor.status}
                  onStatusChange={() => {}} // Empty function for read-only mode
                  className="w-full"
                  pipelineHistory={selectedVisitor.pipelineHistory || []}
                  readOnly={true}
                />
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex justify-end space-x-4">
                <button
                  onClick={() => setShowPipeline(false)}
                  className="px-6 py-3 text-foreground bg-secondary rounded-lg hover:bg-accent transition-all duration-200 font-medium hover:scale-105"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chatbot Widget */}
      <ChatbotWidget isOpen={isChatbotOpen} onToggle={() => setIsChatbotOpen(!isChatbotOpen)} />
      
      {/* Chatbot Toggle Button */}
      {!isChatbotOpen && (
        <button
          onClick={() => setIsChatbotOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 rounded-full shadow-large hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-40"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}
    </div>
  );
}
