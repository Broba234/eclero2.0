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
  requestedAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'in_progress' | 'completed' | 'cancelled';
  message?: string;
}

export default function InboxPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<SessionRequest[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'declined' | 'in_progress' | 'completed'>('all');
  
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
    
    try {
      const res = await fetch(`/api/sessions/tutor?tutorId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.sessions) {
          const formattedRequests: SessionRequest[] = data.sessions.map((session: any) => ({
            id: session.id,
            studentName: session.student?.name || 'Student',
            studentAvatar: session.student?.avatar || undefined,
            subject: session.topic || 'General Session',
            requestedAt: session.created_at,
            status: session.status,
            message: session.notes || undefined
          }));
          setRequests(formattedRequests);
        }
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
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
      
      console.log('Session started successfully:', roomName);
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const handleEndSession = async (forceComplete = false) => {
    console.log('handleEndSession called, forceComplete:', forceComplete);
    
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
          console.log('Session marked as completed');
        }
      } catch (error) {
        console.error('Error ending session:', error);
        alert('Failed to end the session. Please check your internet connection and try again.');
      }
    } else if (currentSessionData && !forceComplete) {
      // If it's just a disconnect (not intentional end), keep session as in_progress
      console.log('Session disconnected but keeping as in_progress');
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
  const acceptedCount = requests.filter(req => req.status === 'accepted').length;
  const declinedCount = requests.filter(req => req.status === 'declined').length;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Session Requests</h1>
            <p className="text-gray-300">Manage your incoming tutoring session requests</p>
          </div>
          <button
            onClick={fetchSessions}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>



        {/* Filter Tabs */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-8" style={{ boxShadow: '0 8px 32px 0 rgba(31,38,135,0.37)' }}>
          <div className="flex space-x-1 bg-white/5 p-1 rounded-lg">
            {(['all', 'pending', 'accepted', 'declined'] as const).map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                  filter === filterOption
                    ? 'bg-gradient-to-r from-blue-400 to-purple-500 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                {filterOption !== 'all' && (
                  <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                    {filterOption === 'pending' ? pendingCount : 
                     filterOption === 'accepted' ? acceptedCount : declinedCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20" style={{ boxShadow: '0 8px 32px 0 rgba(31,38,135,0.37)' }}>
          {filteredRequests.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-xl">No {filter === 'all' ? '' : filter + ' '}session requests</p>
              <p className="text-sm mt-2 text-gray-500">
                {filter === 'pending' ? 'All requests have been responded to' : 
                 filter === 'accepted' ? 'No accepted requests yet' :
                 filter === 'declined' ? 'No declined requests yet' :
                 'You have no session requests at the moment'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredRequests.map((request) => (
                <div key={request.id} className="p-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-start gap-4">
                    <img
                      src={request.studentAvatar || "/default-avatar.png"}
                      alt={request.studentName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-white">{request.studentName}</h3>
                          <p className="text-sm text-blue-400">{request.subject}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-400">
                            {formatTimeAgo(request.requestedAt)}
                          </span>
                          <div className="mt-1">
                            {request.status === 'pending' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-400/20 text-yellow-400 border border-yellow-400/30">
                                Pending
                              </span>
                            )}
                            {request.status === 'accepted' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-400/20 text-green-400 border border-green-400/30">
                                Accepted
                              </span>
                            )}
                            {request.status === 'declined' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-400/20 text-red-400 border border-red-400/30">
                                Declined
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {request.message && (
                        <p className="text-sm text-gray-300 mb-4 bg-white/5 p-3 rounded-lg">
                          "{request.message}"
                        </p>
                      )}
                      
                      <div className="flex gap-3">
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleAcceptRequest(request.id)}
                              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors font-medium"
                            >
                              Accept Request
                            </button>
                            <button
                              onClick={() => handleDeclineRequest(request.id)}
                              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors font-medium"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        
                        {request.status === 'accepted' && (
                          <div className="flex gap-3">
                            <button 
                              onClick={() => handleStartSession(request)}
                              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors font-medium"
                              disabled={!userInfo}
                            >
                              Start Session
                            </button>
                            <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-lg transition-colors font-medium">
                              Message Student
                            </button>
                          </div>
                        )}
                        
                        {request.status === 'declined' && (
                          <button
                            onClick={() => handleAcceptRequest(request.id)}
                            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors font-medium"
                          >
                            Reconsider
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Session view moved to /home/session/[id] */}
    </div>
  );
} 
