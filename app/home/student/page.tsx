"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import SignUpWizard from "@/components/student/SignUpWizard";
import Modal from "@/components/Modal/Modal";
import { AnimatePresence } from "framer-motion";

type Stats = {
    totalSessions: number;
    completedSessions: number;
    upcomingSessions: number;
    totalSpent: number;
    averageRating: number;
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
    tutorName: string;
    tutorAvatar?: string;
    subject: string;
    date: string;
    startTime: string;
    status: SessionStatus;
    duration: number;
};

export default function StudentHome() {
    const [stats, setStats] = useState<Stats>({
        totalSessions: 0,
        completedSessions: 0,
        upcomingSessions: 0,
        totalSpent: 0,
        averageRating: 0,
    });
    const [profile, setProfile] = useState<any>(null);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchProfile = async () => {
          try {
            const {
              data: { user },
              error: sessionError,
            } = await supabase.auth.getUser();
            if (sessionError || !user) {
              router.push("/auth/login");
              return;
            }
            const profileRes = await fetch(`/api/profiles/get-full?email=${encodeURIComponent(user.email!)}`);
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              setProfile(profileData);
              try {
                setSessionsLoading(true);
                const res = await fetch(`/api/sessions/student?studentId=${encodeURIComponent(profileData.id)}`);
                if (res.ok) {
                  const data = await res.json();
                  console.log("datadfghj", data);
                  if (data.success && Array.isArray(data.sessions)) {
                    const nonCompleted = data.sessions.filter(
                      (session: any) => session.status !== "completed"
                    );
                    const formattedSessions: Session[] = nonCompleted.map((session: any) => {
                      const sessionDate = new Date(session.created_at);
                      return {
                        id: session.id,
                        tutorName: session.tutor?.name || "Tutor",
                        tutorAvatar: session.tutor?.avatar || undefined,
                        subject: session.topic || "Session",
                        date: sessionDate.toISOString().split("T")[0],
                        startTime: sessionDate.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }),
                        status: session.status as SessionStatus,
                        duration: session.duration || 60,
                      };
                    });
    
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
            }
            setLoading(false);
          } catch (error) {
            setLoading(false);
          }
        };
        fetchProfile();
      }, [router]);

      console.log("profile", profile);
      if(loading) {
        return <div className="flex h-screen items-center justify-center bg-gradient-to-b from-[#F8F9FD] to-gray-400">
        <div className="text-lg text-white">Loading...</div>
      </div>;
      }
      if(!profile) {
        return <div className="flex h-screen items-center justify-center bg-gradient-to-b from-[#F8F9FD] to-gray-400">
        <div className="text-lg text-white">No profile found</div>
      </div>;
      }
      if(profile.role !== "student") {
        router.push("/auth/login");
      }
      if(!profile.profile_setup) {
        return (
            <>
         <AnimatePresence>
              <Modal
                isOpen={true}
                onClose={() => {}}
                transition="fade"
                overclass="justify-center overflow-y-auto w-full items-center p-2 lg:p-4"
                innerclass="max-h-screen min-h-[600px] w-full max-w-6xl mx-auto"
              >
                <SignUpWizard />
              </Modal>
          </AnimatePresence>
            </>
          );
      }

    return (
        <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <p className="mt-2 text-gray-600">Track your learning progress and find tutors</p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <Link
                        href="/home/student/explore"
                        className="inline-flex items-center px-6 py-3 border border-transparent rounded-full shadow-lg text-sm font-medium text-white bg-[#1559C6] hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:scale-105"
                    >
                        Find Tutor
                    </Link>
                </div>
            </div>
    
    
            {/* Upcoming Sessions */}
            <div className="mt-8">
                <div className="bg-white shadow-xl overflow-hidden sm:rounded-2xl border border-gray-200">
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
            <p className="text-gray-500">Loading your upcoming sessions...</p>
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
              Book a new session to see it appear here.
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
                    src={session.tutorAvatar || "/default-avatar.png"}
                    alt={session.tutorName}
                    className="w-12 h-12 rounded-full object-cover border border-white shadow-sm"
                  />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">
                      {session.subject}
                    </h4>
                    <p className="text-xs text-gray-500">
                      with{" "}
                      <span className="font-medium text-gray-800">
                        {session.tutorName}
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
                    href="/home/student/sessions"
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
                <div className="bg-white shadow-xl overflow-hidden sm:rounded-2xl border border-gray-200">
                    <div className="px-6 py-5 sm:px-6">
                        <h3 className="text-xl leading-6 font-bold text-gray-900">
                            Quick Actions
                        </h3>
                    </div>
                    <div className="border-t border-gray-200">
                        <div className="px-6 py-5 sm:p-6">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Link
                                    href="/home/student/profile"
                                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                                >
                                    Edit Profile
                                </Link>
                                <Link
                                    href="/home/student/sessions"
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
