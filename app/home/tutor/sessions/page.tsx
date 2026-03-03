'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  amount: number | null;
  status: 'pending' | 'accepted' | 'declined' | 'in_progress' | 'completed' | 'cancelled';
  message?: string;
}

export default function InboxPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<SessionRequest[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [userInfo, setUserInfo] = useState<{ identity: string; name: string } | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(() => new Date());

  // Tick every 30s so the "Start Session" button appears in real-time
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const isSessionReady = (request: SessionRequest): boolean => {
    try {
      return now >= new Date(`${request.date}T${request.start_time}`);
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const profileRes = await fetch(`/api/profiles/get-full?email=${encodeURIComponent(user.email!)}`);
          if (profileRes.ok) {
            const profile = await profileRes.json();
            setUserInfo({ identity: user.id, name: profile.name || 'Tutor' });
            setUserId(user.id);
          }
        }
      } catch (error) {
        console.error('Error getting user info:', error);
      }
    };
    getCurrentUser();
  }, []);

  const fetchSessions = async () => {
    if (!userId) return;
    setLoading(true);
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
            start_time: session.start_time,
            duration: session.duration,
            date: session.date,
            requestedAt: session.created_at,
            amount: session.amount ?? null,
            status: session.status,
            message: session.notes || undefined,
          }));
          setRequests(formattedRequests);
        }
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchSessions();
    const interval = setInterval(fetchSessions, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleStartSession = async (request: SessionRequest) => {
    if (!userInfo) return;
    try {
      const statusResponse = await fetch('/api/sessions/update-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: request.id, status: 'in_progress', userId }),
      });
      if (!statusResponse.ok) return;
      router.push(`/home/session/${request.id}`);
      setRequests(prev => prev.map(req => req.id === request.id ? { ...req, status: 'in_progress' } : req));
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  // ── Helpers ──────────────────────────────────────────────

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatDuration = (dur: number) => {
    if (dur === 0.5) return '30 min';
    if (dur === 1) return '1 hr';
    if (dur === 1.5) return '1.5 hrs';
    return `${dur} hrs`;
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60_000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    pending:     { label: 'Pending',     bg: 'bg-amber-50  border-amber-200', text: 'text-amber-700',  dot: 'bg-amber-400' },
    accepted:    { label: 'Accepted',    bg: 'bg-blue-50   border-blue-200',  text: 'text-blue-700',   dot: 'bg-blue-400' },
    in_progress: { label: 'In Progress', bg: 'bg-green-50  border-green-200', text: 'text-green-700',  dot: 'bg-green-400' },
    completed:   { label: 'Completed',   bg: 'bg-gray-50   border-gray-200',  text: 'text-gray-600',   dot: 'bg-gray-400' },
    declined:    { label: 'Declined',    bg: 'bg-red-50    border-red-200',   text: 'text-red-700',    dot: 'bg-red-400' },
    cancelled:   { label: 'Cancelled',   bg: 'bg-gray-50   border-gray-200',  text: 'text-gray-500',   dot: 'bg-gray-400' },
  };

  const filteredRequests = requests.filter(req => filter === 'all' || req.status === filter);
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const inProgressCount = requests.filter(r => r.status === 'in_progress').length;
  const completedCount = requests.filter(r => r.status === 'completed').length;

  // ── Earnings sum from completed sessions ─────────────────
  const totalEarnings = requests
    .filter(r => r.status === 'completed' && r.amount)
    .reduce((sum, r) => sum + (r.amount ?? 0), 0);

  return (
    <div className="min-h-screen bg-gray-50/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

        {/* ── Header ────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">Sessions</h1>
            <p className="text-gray-500 mt-1">Manage your tutoring sessions</p>
          </div>
          <button
            onClick={fetchSessions}
            className="self-start sm:self-auto px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all border border-gray-200 shadow-sm flex items-center gap-2 text-sm font-medium active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* ── Stat Cards ────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Pending',     count: pendingCount,    color: 'text-amber-600',  iconBg: 'bg-amber-50',  icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
            { label: 'In Progress', count: inProgressCount, color: 'text-blue-600',   iconBg: 'bg-blue-50',   icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
            { label: 'Completed',   count: completedCount,  color: 'text-green-600',  iconBg: 'bg-green-50',  icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
            { label: 'Earnings',    count: null,            color: 'text-emerald-600', iconBg: 'bg-emerald-50', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                  <svg className={`w-5 h-5 ${stat.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                  <p className={`text-xl font-bold text-gray-900`}>
                    {stat.count !== null ? stat.count : `$${totalEarnings.toFixed(0)}`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters ───────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['all', 'pending', 'in_progress', 'completed'] as const).map(opt => {
            const count = opt === 'pending' ? pendingCount : opt === 'in_progress' ? inProgressCount : opt === 'completed' ? completedCount : null;
            const labels: Record<string, string> = { all: 'All', pending: 'Pending', in_progress: 'In Progress', completed: 'Completed' };
            return (
              <button
                key={opt}
                onClick={() => setFilter(opt)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === opt
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {labels[opt]}
                {count !== null && (
                  <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-md ${
                    filter === opt ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Session List ──────────────────────────── */}
        {loading && requests.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            <p className="text-gray-500 mt-4 text-sm">Loading sessions...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No {filter !== 'all' ? filter.replace('_', ' ') + ' ' : ''}sessions</h3>
            <p className="text-gray-500 text-sm mb-4">
              {filter === 'all' ? 'Session requests from students will appear here.' : 'No sessions match this filter.'}
            </p>
            {filter !== 'all' && (
              <button onClick={() => setFilter('all')} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                View all sessions
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((request) => {
              const sc = statusConfig[request.status] ?? statusConfig.pending;
              const ready = isSessionReady(request);
              return (
                <div
                  key={request.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="p-5 sm:p-6">
                    {/* Top row: avatar + name + status */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={request.studentAvatar || '/default-avatar.png'}
                            alt={request.studentName}
                            className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-100"
                          />
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${sc.dot}`} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{request.studentName}</h3>
                          <p className="text-sm text-gray-500 truncate">{request.subject}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {request.amount != null && (
                          <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-semibold border border-emerald-100">
                            ${request.amount.toFixed(2)}
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border ${sc.bg} ${sc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </div>
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{formatDate(request.date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{request.start_time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>{formatDuration(request.duration)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        <span>Requested {formatTimeAgo(request.requestedAt)}</span>
                      </div>
                    </div>

                    {/* Student message */}
                    {request.message && (
                      <div className="bg-blue-50/60 border border-blue-100 rounded-xl px-4 py-3 mb-4">
                        <p className="text-xs font-medium text-blue-600 mb-1">Student note</p>
                        <p className="text-sm text-gray-700 leading-relaxed">&ldquo;{request.message}&rdquo;</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1">
                       <button
                            onClick={() => handleStartSession(request)}
                            disabled={!userInfo}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Start Session
                          </button>
                      <div className="flex items-center gap-2">
                        {ready && request.status !== 'completed' && request.status !== 'cancelled' && request.status !== 'declined' ? (
                          <button
                            onClick={() => handleStartSession(request)}
                            disabled={!userInfo}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Start Session
                          </button>
                        ) : request.status !== 'completed' && request.status !== 'cancelled' && request.status !== 'declined' ? (
                          <span className="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg text-sm font-medium flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Starts at {request.start_time}
                          </span>
                        ) : null}
                      </div>

                      {request.amount != null && (
                        <p className="text-xs text-gray-400 hidden sm:block">
                          Session ID: {request.id.slice(0, 8)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Footer count ──────────────────────────── */}
        {filteredRequests.length > 0 && (
          <p className="text-center text-xs text-gray-400 mt-6">
            {filteredRequests.length} session{filteredRequests.length !== 1 ? 's' : ''} shown
          </p>
        )}
      </div>
    </div>
  );
}
