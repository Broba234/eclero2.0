'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LiveKitRoom from '@/components/LiveKitRoom';
import { supabase } from '@/lib/supabaseClient';

interface SessionRequest {
  id: string;
  studentName: string;
  studentAvatar?: string;
  subject: string;
  start_time: string;
  duration: number;
  date: string;
  requestedAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'in_progress' | 'completed' | 'cancelled';
  message?: string;
}

export default function InboxPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<SessionRequest[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  
  // LiveKit session state
  const [isSessionOpen, setIsSessionOpen] = useState(false);
  const [currentSessionData, setCurrentSessionData] = useState<{
    roomName: string;
    studentName: string;
    subject: string;
  } | null>(null);
  const [userInfo, setUserInfo] = useState<{
    identity: string;
    name: string;
  } | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  // Get current user info for LiveKit
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const profileRes = await fetch(`/api/profiles/get-full?email=${encodeURIComponent(user.email!)}`);
          if (profileRes.ok) {
            const profile = await profileRes.json();
                      setUserInfo({
            identity: user.id,
            name: profile.name || 'Tutor'
          });
          setUserId(user.id);
          }
        }
      } catch (error) {
        console.error('Error getting user info:', error);
      }
    };
    getCurrentUser();
  }, []);

  // Fetch sessions function
  const fetchSessions = async () => {
    if (!userId) return; // Wait for userId to be available
    setLoading(true);
    
    try {
      const res = await fetch(`/api/sessions/tutor?tutorId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        console.log("data", data);
        if (data.success && data.sessions) {
          const formattedRequests: SessionRequest[] = data.sessions.map((session: any) => ({
            id: session.id,
            studentName: session.student?.name || 'Student',
            studentAvatar: session.student?.avatar || undefined,
            subject: session.topic || 'General Session',
            start_time: session.start_time,
            duration: session.duration,
            date: session.date,
            requestedAt: session.created_at,
            status: session.status,
            message: session.notes || undefined
          }));
          setRequests(formattedRequests);
        }
      }
    } catch (error) {
      setLoading(false);
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and auto-refresh
  useEffect(() => {
    if (!userId) return;
    
    fetchSessions(); // Initial fetch
    
    // Auto-refresh every 10 seconds to check for new session requests
    const interval = setInterval(fetchSessions, 10000);
    
    return () => clearInterval(interval);
  }, [userId]);

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const res = await fetch('/api/sessions/update-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: requestId,
          status: 'accepted',
          userId: userId
        })
      });

      if (res.ok) {
        setRequests(prev => 
          prev.map(req => 
            req.id === requestId ? { ...req, status: 'accepted' } : req
          )
        );
      } else {
        console.error('Failed to accept request');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const res = await fetch('/api/sessions/update-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: requestId,
          status: 'declined',
          userId: userId
        })
      });

      if (res.ok) {
        setRequests(prev => 
          prev.map(req => 
            req.id === requestId ? { ...req, status: 'declined' } : req
          )
        );
      } else {
        console.error('Failed to decline request');
      }
    } catch (error) {
      console.error('Error declining request:', error);
    }
  };

  const handleStartSession = async (request: SessionRequest) => {
    if (!userInfo) {
      console.error('User info not available');
      return;
    }
    
    try {
      // Generate room name for the session (consistent with student side)
      const roomName = `session-${request.id}`;
      
      // Update session status to in_progress
      const statusResponse = await fetch('/api/sessions/update-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: request.id,
          status: 'in_progress',
          userId: userId
        })
      });

      if (!statusResponse.ok) {
        console.error('Failed to update session status');
        return;
      }

      // Navigate to dedicated session page
      router.push(`/home/session/${request.id}`);
      
      // Update local state
      setRequests(prev => 
        prev.map(req => 
          req.id === request.id ? { ...req, status: 'in_progress' } : req
        )
      );
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const handleEndSession = async (forceComplete = false) => {
    
    if (currentSessionData && forceComplete) {
      try {
        // Find the session ID from current data
        const currentRequest = requests.find(req => 
          req.studentName === currentSessionData.studentName && 
          req.subject === currentSessionData.subject
        );
        
        if (currentRequest) {
          // Update session status to completed only if explicitly requested
          const res = await fetch('/api/sessions/update-status', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: currentRequest.id,
              status: 'completed',
              userId: userId
            })
          });

          if (!res.ok) {
            throw new Error(`API request failed with status ${res.status}`);
          }
          
          // Update local state
          setRequests(prev => 
            prev.map(req => 
              req.id === currentRequest.id ? { ...req, status: 'completed' } : req
            )
          );
        }
      } catch (error) {
        alert('Failed to end the session. Please check your internet connection and try again.');
      }
    } else if (currentSessionData && !forceComplete) {
      // If it's just a disconnect (not intentional end), keep session as in_progress
    }
    
    setIsSessionOpen(false);
    setCurrentSessionData(null);
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const pendingCount = requests.filter(req => req.status === 'pending').length;
  const inProgressCount = requests.filter(req => req.status === 'in_progress').length;
  const completedCount = requests.filter(req => req.status === 'completed').length;
console.log("requests",requests);
  return (
<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
    {/* Header with improved typography */}
    <div className="mb-10 lg:mb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">Session Requests</h1>
          </div>
          <p className="text-gray-600 text-lg">Review and manage incoming tutoring session requests</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
            <span className="text-sm text-gray-500">Total Requests:</span>
            <span className="font-semibold text-gray-900">{pendingCount + inProgressCount + completedCount}</span>
          </div>
          <button
            onClick={fetchSessions}
            className="px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full transition-all duration-200 flex items-center gap-2 font-medium shadow-md hover:shadow-lg active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Pending</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{pendingCount}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-full">
              <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">In Progress</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{inProgressCount}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <svg className="w-6 h-6 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Completed</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{completedCount}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
            <svg className="w-6 h-6 text-green-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Filter Tabs - Redesigned */}
    <div className="mb-10">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter by Status</h2>
      <div className="bg-white rounded-2xl p-2 border border-gray-200 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {(['all', 'pending', 'in_progress', 'completed'] as const).map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                filter === filterOption
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span>{filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}</span>
              {filterOption !== 'all' && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  filter === filterOption 
                    ? 'bg-white/30 text-white' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {filterOption === 'pending' ? pendingCount : 
                   filterOption === 'in_progress' ? inProgressCount : completedCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>

    {/* Requests List - Professional Card Layout */}
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {filteredRequests.length === 0 ? (
        <div className="p-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {loading ? 'Loading...' : 'No ' + (filter === 'all' ? '' : filter + ' ') + 'session requests'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              {filter === 'pending' ? 'All pending requests have been responded to.' : 
               filter === 'in_progress' ? 'No in progress requests at this time.' :
               filter === 'completed' ? 'No completed requests at this time.' :
               'You have no session requests at the moment.'}
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
              >
                View All Requests
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {filteredRequests.map((request) => (
            <div key={request.id} className="p-6 hover:bg-gray-50/80 transition-colors group">
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                {/* Student Avatar & Info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="relative">
                    <img
                      src={request.studentAvatar || "/default-avatar.png"}
                      alt={request.studentName}
                      className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-sm"
                    />
                    
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
                      request.status === 'pending' ? 'bg-yellow-400' :
                      request.status === 'in_progress' ? 'bg-green-400' : 'bg-red-400'
                    }`}></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{request.studentName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            {request.subject}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatTimeAgo(request.requestedAt)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                      <p className="text-gray-600 text-sm font-medium p-2 border border-gray-200 rounded-lg">{request.date} at {request.start_time} • {request.duration == 0.5 ? "30" : request.duration == 1 ? "60" : "90"} min</p>
                        <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                          request.status === 'pending' 
                            ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' 
                            : request.status === 'in_progress'
                            ? 'bg-green-50 text-green-700 border border-green-100'
                            : request.status === 'completed'
                            ? 'bg-red-50 text-red-700 border border-red-100'
                            : 'bg-gray-50 text-gray-700 border border-gray-100'
                        }`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Message Preview */}
                    {request.message && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-1">Student's message:</p>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <p className="text-gray-800 italic">"{request.message}"</p>
                        </div>
                      </div>
                    )}
                     
                    
                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 mt-5">
                      {/* {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAcceptRequest(request.id)}
                            className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl transition-all duration-200 font-medium shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Accept Request
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(request.id)}
                            className="px-5 py-2.5 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl transition-all duration-200 font-medium shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Decline
                          </button>
                          <button className="px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all duration-200 font-medium border border-gray-300 shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            Message
                          </button>
                        </>
                      )} */}
                      
                        <div className="flex flex-wrap gap-3">
                          <button 
                            onClick={() => handleStartSession(request)}
                            className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl transition-all duration-200 font-medium shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2"
                            disabled={!userInfo}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Start Session
                          </button>
                        </div>
{/*                       
                      {request.status === 'declined' && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleAcceptRequest(request.id)}
                            className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 font-medium shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Reconsider
                          </button>
                          <button className="px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all duration-200 font-medium border border-gray-300 shadow-sm hover:shadow-md active:scale-95">
                            View Details
                          </button>
                        </div>
                      )} */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    
    {/* Footer Note */}
    {filteredRequests.length > 0 && (
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Showing {filteredRequests.length} {filter === 'all' ? 'total' : filter} request{filteredRequests.length !== 1 ? 's' : ''}
        </p>
      </div>
    )}
  </div>
</div>
  );
} 
