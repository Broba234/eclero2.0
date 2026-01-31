'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LiveKitRoom from '@/components/LiveKitRoom';
import { supabase } from '@/lib/supabaseClient';

interface Session {
  id: string;
  tutorName: string;
  tutorAvatar?: string;
  subject: string;
  date: string;
  start_time: string;
  status: 'active' | 'completed' | 'pending';
  duration: number;
  price: number;
  meetingLink?: string;
  homework?: string;
  progress?: string;
  rating?: number;
}

export default function StudentSessions() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // LiveKit session state
  const [isSessionOpen, setIsSessionOpen] = useState(false);
  const [currentSessionData, setCurrentSessionData] = useState<{
    roomName: string;
    tutorName: string;
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
              name: profile.name || 'Student'
            });
            setUserId(user.id);
          } else {
          }
        } else {
        }
      } catch (error) {
      }
    };
    getCurrentUser();
  }, []);

  const fetchSessions = async () => {
    if (!userId || userId.length === 0) {
      return;
    }

    try {
      const res = await fetch(`/api/sessions/student?studentId=${encodeURIComponent(userId)}`);

      if (res.ok) {
        const data = await res.json();

        if (data.success && data.sessions) {
          const formattedSessions: Session[] = data.sessions.map((session: any) => {
            const sessionDate = new Date(session.created_at);
            return {
              id: session.id,
              tutorName: session.tutor?.name || 'Tutor',
              tutorAvatar: session.tutor?.avatar || undefined,
              subject: session.topic || 'Session',
              date: sessionDate.toISOString().split('T')[0], // YYYY-MM-DD format
              start_time: sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              status: session.status === 'in_progress' ? 'active' :
                    session.status === 'completed' ? 'completed' : 'pending',
              duration: session.duration || 60, // Use actual duration or default
              price: session.tutor?.hourlyRate || 0, // Use actual tutor rate or 0
              meetingLink: session.room_name ? `session-${session.id}` : undefined,
              homework: session.homework || undefined,
              progress: session.notes || undefined,
              rating: session.rating || undefined
            };
          });
          setSessions(formattedSessions);
        } else {
          setSessions([]);
        }
      } else {
        const errorData = await res.json();
        setSessions([]);
      }
    } catch (error) {
      setSessions([]);
    }
  };

  useEffect(() => {
    if (!userId || userId.length === 0) {
      return;
    }

    fetchSessions();
    const interval = setInterval(() => {
      fetchSessions();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [userId]);

  const filteredSessions = sessions.filter((session: Session) =>
    filter === 'all' ? true : session.status === filter
  );



  const handleJoinSession = async (session: Session) => {
    if (!userInfo) return;
    router.push(`/home/session/${session.id}`);
  };

  const handleEndSession = () => {
    setIsSessionOpen(false);
    setCurrentSessionData(null);
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Sessions</h1>
            <p className="text-gray-600">Manage your tutoring sessions and track your progress</p>
          </div>
          <button
            onClick={fetchSessions}
            className="px-4 py-2 bg-[#1559C6] text-white rounded-full transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {(['all', 'active', 'completed', 'pending'] as const).map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption as any)}
              className={`px-4 py-2 rounded-full font-medium transition-all ${filter === filterOption
                  ? 'bg-[#1559C6] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-full'
                }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              {filterOption !== 'all' && (
                <span className="ml-2 bg-gray-300 px-2 py-1 rounded-full text-xs text-white">
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
              <div className="text-gray-500 text-lg">No sessions found</div>
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                className="bg-white rounded-2xl p-6 border border-gray-200 hover:bg-gray-50 transition-all shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={session.tutorAvatar || "/default-avatar.png"}
                      alt={session.tutorName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{session.tutorName}</h3>
                      <p className="text-[#1559C6]">{session.subject}</p>
                      {session.status === 'active' ? (
                        <p className="text-green-600 text-sm font-medium">
                          🔴 Live Session • {session.duration} min
                        </p>
                      ) : (
                        <p className="text-gray-600 text-sm">{session.date} at {session.start_time} • {session.duration == 0.5 ? "30" : session.duration == 1 ? "60" : "90"} min</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      {session.price > 0 && (
                        <div className="text-gray-900 font-semibold">${session.price}</div>
                      )}
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${session.status === 'active' ? 'bg-green-100 text-green-800' :
                          session.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                            session.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                        }`}>
                        {session.status}
                      </span>
                    </div>
                    {session.status === 'active' && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2 text-green-600 text-sm">
                          <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                          Tutor is waiting
                        </div>
                        <button
                          onClick={() => handleJoinSession(session)}
                          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors font-medium animate-pulse"
                          disabled={!userInfo}
                        >
                          Join Session Now
                        </button>
                      </div>
                    )}
                    {session.status === 'pending' && (
                      <div className="text-center">
                        <div className="text-[#1559C6] text-sm mb-2">Session accepted</div>
                        <div className="text-gray-500 text-xs">Waiting for tutor to start</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Info */}
                {session.homework && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Homework Assigned:</h4>
                    <p className="text-sm text-gray-900">{session.homework}</p>
                  </div>
                )}

                {session.progress && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Session Summary:</h4>
                    <p className="text-sm text-gray-900">{session.progress}</p>
                    {session.rating && (
                      <div className="flex items-center mt-2">
                        <span className="text-sm text-gray-600 mr-2">Your Rating:</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-lg ${i < session.rating! ? 'text-yellow-500' : 'text-gray-300'}`}
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
