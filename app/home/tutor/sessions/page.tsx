'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LiveKitRoom from '@/components/LiveKitRoom';
import { supabase } from '@/lib/supabaseClient';

interface Session {
  id: string;
  studentName: string;
  studentAvatar?: string;
  subject: string;
  date: string;
  time: string;
  status: 'active' | 'upcoming' | 'completed' | 'requested';
  duration: number;
  price: number;
  meetingLink?: string;
  homework?: string;
  progress?: string;
  rating?: number;
}

export default function TutorSessions() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'completed' | 'requested'>('all');
  
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
        console.log('Getting current tutor user...');
        const { data: { user } } = await supabase.auth.getUser();
        console.log('Supabase tutor user:', user);
        
        if (user) {
          console.log('Tutor User ID:', user.id);
          const profileRes = await fetch(`/api/profiles/get-full?email=${encodeURIComponent(user.email!)}`);
          if (profileRes.ok) {
            const profile = await profileRes.json();
            console.log('Tutor user profile:', profile);
            
            setUserInfo({
              identity: user.id,
              name: profile.name || 'Tutor'
            });
            setUserId(user.id);
            console.log('Tutor User ID set to:', user.id);
          } else {
            console.error('Failed to fetch tutor user profile');
          }
        } else {
          console.log('No tutor user found');
        }
      } catch (error) {
        console.error('Error getting tutor user info:', error);
      }
    };
    getCurrentUser();
  }, []);

  // Fetch sessions function  
  const fetchSessions = async () => {
    if (!userId || userId.length === 0) {
      console.log('No tutor userId available, skipping fetch');
      return; // Wait for userId to be available
    }
    
    try {
      console.log('Fetching sessions for tutor:', userId);
      const res = await fetch(`/api/sessions/tutor?tutorId=${encodeURIComponent(userId)}`);
      
      if (res.ok) {
        const data = await res.json();
        console.log('Tutor Sessions API response:', data);
        
        if (data.success && data.sessions) {
          const formattedSessions: Session[] = data.sessions.map((session: any) => {
            const sessionDate = new Date(session.created_at);
            return {
              id: session.id,
              studentName: session.student?.name || 'Student',
              studentAvatar: session.student?.avatar || undefined,
              subject: session.topic || 'Session',
              date: sessionDate.toISOString().split('T')[0], // YYYY-MM-DD format
              time: sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              status: session.status === 'pending' ? 'requested' : 
                      session.status === 'accepted' ? 'upcoming' : 
                      session.status === 'in_progress' ? 'active' :
                      session.status === 'completed' ? 'completed' : 'upcoming',
              duration: session.duration || 60, // Use actual duration or default
              price: session.hourlyRate || 0, // Use actual tutor rate or 0
              meetingLink: session.room_name ? `session-${session.id}` : undefined,
              homework: session.homework || undefined,
              progress: session.notes || undefined,
              rating: session.rating || undefined
            };
          });
          setSessions(formattedSessions);
          console.log('Formatted tutor sessions:', formattedSessions);
        } else {
          console.log('No tutor sessions found in response');
          setSessions([]);
        }
      } else {
        const errorData = await res.json();
        console.error('Tutor API error response:', errorData);
        setSessions([]);
      }
    } catch (error) {
      console.error('Error fetching tutor sessions:', error);
      setSessions([]); // Set empty array on error
    }
  };

  // Initial fetch and auto-refresh
  useEffect(() => {
    if (!userId || userId.length === 0) {
      console.log('No tutor userId, skipping auto-refresh setup');
      return;
    }
    
    console.log('Setting up auto-refresh for tutor:', userId);
    fetchSessions(); // Initial fetch
    
    // Auto-refresh every 5 seconds to check for session status updates
    const interval = setInterval(() => {
      console.log('Auto-refreshing tutor sessions...');
      fetchSessions();
    }, 5000);
    
    return () => {
      console.log('Cleaning up tutor auto-refresh interval');
      clearInterval(interval);
    };
  }, [userId]);

  const filteredSessions = sessions.filter(session => 
    filter === 'all' ? true : session.status === filter
  );

  const handleRejoinSession = async (session: Session) => {
    if (!userInfo) return;
    router.push(`/home/session/${session.id}`);
  };

  const handleEndSession = async (forceComplete = false) => {
    console.log('Tutor handleEndSession called, forceComplete:', forceComplete);
    
    if (currentSessionData && forceComplete) {
      try {
        // Find the session ID from current data
        const currentSession = sessions.find(session => 
          session.studentName === currentSessionData.studentName && 
          session.subject === currentSessionData.subject
        );
        
        if (currentSession) {
          // Update session status to completed only if explicitly requested
          await fetch('/api/sessions/update-status', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: currentSession.id,
              status: 'completed',
              userId: userId
            })
          });
          
          // Refresh sessions list
          fetchSessions();
          console.log('Tutor session marked as completed');
        }
      } catch (error) {
        console.error('Error ending tutor session:', error);
      }
    } else if (currentSessionData && !forceComplete) {
      // If it's just a disconnect (not intentional end), keep session as in_progress
      console.log('Tutor session disconnected but keeping as in_progress');
    }
    
    setIsSessionOpen(false);
    setCurrentSessionData(null);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Sessions</h1>
            <p className="text-gray-300">Manage your tutoring sessions and track student progress</p>
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

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {(['all', 'active', 'upcoming', 'completed', 'requested'] as const).map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === filterOption
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              {filterOption !== 'all' && (
                <span className="ml-2 bg-white/20 px-2 py-1 rounded-full text-xs">
                  {sessions.filter(s => s.status === filterOption).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg">No sessions found</div>
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all"
                style={{ boxShadow: '0 8px 32px 0 rgba(31,38,135,0.37)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={session.studentAvatar || "/default-avatar.png"}
                      alt={session.studentName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-white">{session.studentName}</h3>
                      <p className="text-blue-400">{session.subject}</p>
                      {session.status === 'active' ? (
                        <p className="text-green-400 text-sm font-medium">
                          🔴 Live Session • {session.duration} min
                        </p>
                      ) : (
                        <p className="text-gray-400 text-sm">{session.date} at {session.time} • {session.duration} min</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      {session.price > 0 && (
                        <div className="text-white font-semibold">${session.price}/hr</div>
                      )}
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        session.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        session.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' :
                        session.status === 'completed' ? 'bg-gray-500/20 text-gray-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                    {session.status === 'active' && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2 text-green-400 text-sm">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          Session in progress
                        </div>
                        <button
                          onClick={() => handleRejoinSession(session)}
                          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors font-medium animate-pulse"
                          disabled={!userInfo}
                        >
                          Rejoin Session
                        </button>
                      </div>
                    )}
                    {session.status === 'upcoming' && (
                      <div className="text-center">
                        <div className="text-blue-400 text-sm mb-2">Session scheduled</div>
                        <div className="text-gray-400 text-xs">Waiting to start</div>
                      </div>
                    )}
                    {session.status === 'requested' && (
                      <div className="text-center">
                        <div className="text-yellow-400 text-sm mb-2">Pending response</div>
                        <div className="text-gray-400 text-xs">Check your inbox</div>
                      </div>
                    )}
                    {session.status === 'completed' && (
                      <div className="text-center">
                        <div className="text-gray-400 text-sm mb-2">Session completed</div>
                        <div className="text-gray-500 text-xs">
                          {session.progress ? 'Notes available' : 'No notes'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Additional Info */}
                {session.homework && (
                  <div className="mt-4 p-3 bg-white/5 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-300 mb-1">Homework Assigned:</h4>
                    <p className="text-sm text-white">{session.homework}</p>
                  </div>
                )}
                
                {session.progress && (
                  <div className="mt-4 p-3 bg-white/5 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-300 mb-1">Session Notes:</h4>
                    <p className="text-sm text-white">{session.progress}</p>
                    {session.rating && (
                      <div className="flex items-center mt-2">
                        <span className="text-sm text-gray-400 mr-2">Student Rating:</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-lg ${i < session.rating! ? 'text-yellow-400' : 'text-gray-600'}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Session view moved to /home/session/[id] */}
    </div>
  );
}
