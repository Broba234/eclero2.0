"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Modal from "@/components/Modal/Modal";
import SetupWizard from "@/components/ui/SetupWizard";
import { AnimatePresence } from "framer-motion";

type Stats = {
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  totalEarnings: number;
  rating: number;
};

type SessionStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "in_progress"
  | "completed"
  | "cancelled";

type Session = {
  id: string;
  studentName: string;
  studentAvatar?: string;
  subject: string;
  date: string;
  startTime: string;
  status: SessionStatus;
  duration: number;
};

export default function TutorHome() {
  const [stats, setStats] = useState<Stats>({
    totalSessions: 0,
    completedSessions: 0,
    upcomingSessions: 0,
    totalEarnings: 0,
    rating: 0,
  });
  const [isAvailableNow, setIsAvailableNow] = useState(false);
  const [freshAvailability, setFreshAvailability] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const router = useRouter();
// 
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setIsLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const profileRes = await fetch(
          `/api/profiles/get-full?email=${encodeURIComponent(user.email!)}`
        );
        if (profileRes.ok) {
          const profile = await profileRes.json();
          setIsAvailableNow(profile.isAvailableNow || false);
          setFreshAvailability(profile.profile_setup || false);
          setIsLoading(false);
        } else {
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, []);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setSessionsLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setSessions([]);
          setSessionsLoading(false);
          return;
        }

        const res = await fetch(
          `/api/sessions/tutor?tutorId=${encodeURIComponent(user.id)}`
        );

        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.sessions)) {
            const nonCompleted = data.sessions.filter(
              (session: any) => session.status !== "completed"
            );

            const formattedSessions: Session[] = nonCompleted.map(
              (session: any) => {
                const sessionDate = new Date(session.created_at);
                return {
                  id: session.id,
                  studentName: session.student?.name || "Student",
                  studentAvatar: session.student?.avatar || undefined,
                  subject: session.topic || "General Session",
                  date: sessionDate.toISOString().split("T")[0],
                  startTime: sessionDate.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  status: session.status as SessionStatus,
                  duration: session.duration || 60,
                };
              }
            );

            setSessions(formattedSessions);
            setStats((prev) => ({
              ...prev,
              totalSessions: data.sessions.length,
              completedSessions: data.sessions.filter(
                (s: any) => s.status === "completed"
              ).length,
              upcomingSessions: formattedSessions.length,
            }));
          } else {
            setSessions([]);
          }
        } else {
          setSessions([]);
        }
      } catch (error) {
        setSessions([]);
      } finally {
        setSessionsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const handleAvailabilityToggle = async () => {
    setIsToggling(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        console.error("No user session");
        return;
      }

      const response = await fetch("/api/profiles/update-availability", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isAvailableNow: !isAvailableNow,
          userEmail: session.user.email,
        }),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setIsAvailableNow(updatedProfile.isAvailableNow);
      } else {
        const errorText = await response.text();
        let message = "Failed to update availability";
        try {
          const parsed = JSON.parse(errorText);
          message = parsed.error || message;
        } catch {}
        alert(message);
      }
    } catch (error) {
    } finally {
      setIsToggling(false);
    }
  };

    if (isLoading || freshAvailability == null) {
    return (
      <div className="flex h-screen bg-slate-900 items-center justify-center">
        <div className="text-lg text-white">Loading...</div>
      </div>
    );
  }
  if (!freshAvailability) {
    return (
      <>
   <AnimatePresence>
        <Modal
          isOpen={true}
          onClose={() => {}}
          transition="fade"
          overclass="justify-center overflow-y-auto w-full items-center p-2 lg:p-4"
          innerclass="max-h-screen min-h-[600px]"
        >
          <SetupWizard />
        </Modal>
    </AnimatePresence>
      </>
    );
  }

  return (
 <div className="min-h-screen flex items-center bg-[#F3F4F4]">
  <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
    <div className="md:flex md:items-center md:justify-between">
      <div className="flex-1 min-w-0">
        <p className="mt-2 text-gray-600">
          Manage your tutoring sessions and earnings
        </p>
      </div>
      <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
        <button
          onClick={handleAvailabilityToggle}
          disabled={isLoading || isToggling}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
            isAvailableNow
              ? "bg-gradient-to-r from-green-400 to-green-600 text-white border-transparent hover:from-green-500 hover:to-green-700"
              : "bg-gray-800 text-yellow-400 border-gray-700 hover:bg-gray-700"
          } ${
            isLoading || isToggling
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer"
          }`}
        >
          {isToggling ? (
            <>
              <svg
                className="animate-spin h-3 w-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Updating...
            </>
          ) : (
            <>
              <div
                className={`w-2 h-2 rounded-full ${
                  isAvailableNow ? "bg-green-400" : "bg-yellow-400"
                }`}
              ></div>
              {isAvailableNow ? "Available now" : "offline"}
            </>
          )}
        </button>
        <Link
          href="/home/tutor/availability"
          className="inline-flex items-center px-6 py-3 border border-transparent rounded-full shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:scale-105"
        >
          Manage Availability
        </Link>
      </div>
    </div>

    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
      {/* Stats cards */}
      <div
        className="bg-white overflow-hidden shadow-2xl rounded-2xl border border-gray-200"
        style={{ boxShadow: "0 8px 32px 0 rgba(31,38,135,0.37)" }}
      >
        <div className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Sessions
                </dt>
                <dd className="text-2xl font-bold text-gray-900">
                  {stats.totalSessions}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div
        className="bg-white overflow-hidden shadow-2xl rounded-2xl border border-gray-200"
        style={{ boxShadow: "0 8px 32px 0 rgba(31,38,135,0.37)" }}
      >
        <div className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Completed Sessions
                </dt>
                <dd className="text-2xl font-bold text-gray-900">
                  {stats.completedSessions}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Upcoming Sessions */}
    <div className="mt-8">
      <div
        className="bg-white shadow-2xl overflow-hidden sm:rounded-2xl border border-gray-200"
        style={{ boxShadow: "0 8px 32px 0 rgba(31,38,135,0.37)" }}
      >
        <div className="px-6 py-5 sm:px-6">
          <h3 className="text-xl leading-6 font-bold text-gray-900">
            Upcoming Sessions
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <div className="px-6 py-5 sm:p-6">
            {sessionsLoading ? (
              <div className="flex flex-col items-center justify-center text-center space-y-3">
                <svg
                  className="w-10 h-10 text-blue-500 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h3z"
                  ></path>
                </svg>
                <p className="text-gray-500">
                  Loading your upcoming sessions...
                </p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center space-y-3">
                <svg
                  className="w-16 h-16 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-gray-500">No upcoming sessions</p>
                <p className="text-sm text-gray-400">
                  When students book with you, they will show up here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={session.studentAvatar || "/default-avatar.png"}
                        alt={session.studentName}
                        className="w-12 h-12 rounded-full object-cover border border-white shadow-sm"
                      />
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">
                          {session.subject}
                        </h4>
                        <p className="text-xs text-gray-500">
                          with{" "}
                          <span className="font-medium text-gray-800">
                            {session.studentName}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {session.date} at {session.startTime} •{" "}
                          {session.duration === 0.5
                            ? "30"
                            : session.duration === 1
                            ? "60"
                            : session.duration === 1.5
                            ? "90"
                            : `${session.duration} min`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          session.status === "in_progress"
                            ? "bg-green-100 text-green-800"
                            : session.status === "pending"
                            ? "bg-blue-100 text-blue-800"
                            : session.status === "accepted"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {session.status.replace("_", " ")}
                      </span>
                      <Link
                        href="/home/tutor/sessions"
                        className="text-xs text-[#1559C6] hover:underline font-medium"
                      >
                        View details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Quick Actions */}
    <div className="mt-8">
      <div
        className="bg-white shadow-2xl overflow-hidden sm:rounded-2xl border border-gray-200"
        style={{ boxShadow: "0 8px 32px 0 rgba(31,38,135,0.37)" }}
      >
        <div className="px-6 py-5 sm:px-6">
          <h3 className="text-xl leading-6 font-bold text-gray-900">
            Quick Actions
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <div className="px-6 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Link
                href="/home/tutor/profile"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                Edit Profile
              </Link>
              <Link
                href="/home/tutor/sessions"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                View All Sessions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  );
}
