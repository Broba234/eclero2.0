"use client";

import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import HomeSidebar from "@/components/ui/components/DashboardSidebar";
import TutorProfileBubble from "@/components/ui/components/UserProfile/TutorProfileBubble";
import { bookSession } from "@/lib/bookingUtils";


import { TutorProfileModalContext } from "@/components/ui/components/common/TutorProfileModalContext";

export default function HomeLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal state
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<any>(null);
  const [fullTutorProfile, setFullTutorProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Booking modal state
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingTutor, setBookingTutor] = useState<any>(null);
  const [bookingTopic, setBookingTopic] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const openTutorProfileModal = async (tutor: any) => {
    setProfileModalOpen(true);
    setSelectedTutor(tutor);
    setProfileLoading(true);
    setFullTutorProfile(null);
    try {
      const url = `/api/profiles/get-full?id=${encodeURIComponent(tutor.id)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setFullTutorProfile(data);
      } else {
        setFullTutorProfile(null);
      }
    } catch (e) {
      setFullTutorProfile(null);
    }
    setProfileLoading(false);
  };

  const handleBookSession = (tutor: any) => {
    setProfileModalOpen(false); // Close profile modal
    setBookingTutor(tutor);
    setBookingModalOpen(true);
    
    // Pre-fill topic with tutor's subjects if available
    if (tutor.subjects && tutor.subjects.length > 0) {
      setBookingTopic(`Help with ${tutor.subjects[0].name}`);
    } else {
      setBookingTopic("");
    }
    setBookingNotes("");
  };

  const confirmBooking = async () => {
    if (!bookingTutor || !userId) return;

    setBookingLoading(true);
    try {
      const result = await bookSession({
        tutorId: bookingTutor.id,
        studentId: userId,
        topic: bookingTopic.trim() || undefined,
        notes: bookingNotes.trim() || undefined,
      });

      if (result.success) {
        alert(`Session successfully booked with ${bookingTutor.name}! They will receive your request.`);
        setBookingModalOpen(false);
        setBookingTutor(null);
        setBookingTopic("");
        setBookingNotes("");
      } else {
        alert(`Failed to book session: ${result.error}`);
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('An error occurred while booking the session.');
    } finally {
      setBookingLoading(false);
    }
  };

  const cancelBooking = () => {
    setBookingModalOpen(false);
    setBookingTutor(null);
    setBookingTopic("");
    setBookingNotes("");
  };

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
        let profileRes = await fetch(`/api/profiles/get?email=${encodeURIComponent(user.email!)}`);
        if (!profileRes.ok && profileRes.status === 404) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          profileRes = await fetch(`/api/profiles/get?email=${encodeURIComponent(user.email!)}`);
        }
        if (!profileRes.ok) {
          router.push("/auth/login");
          return;
        }
        const profile = await profileRes.json();
        const fullProfileRes = await fetch(`/api/profiles/get-full?email=${encodeURIComponent(user.email!)}`);
        if (fullProfileRes.ok) {
          const fullProfile = await fullProfileRes.json();
          setUserName(fullProfile.name || user.email?.split('@')[0] || "User");
        } else {
          setUserName(user.email?.split('@')[0] || "User");
        }
        setUserRole(profile.role);
        setUserId(user.id); // Store the user ID
        setLoading(false);
      } catch (error) {
        router.push("/auth/login");
      }
    };
    fetchProfile();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{
        background: 'linear-gradient(to bottom, #2b3340, #23272f, #181a1b)'
      }}>
        <div className="text-lg text-white">Loading...</div>
      </div>
    );
  }
  if (!userRole || !userName) {
    return (
      <div className="flex h-screen items-center justify-center" style={{
        background: 'linear-gradient(to bottom, #2b3340, #23272f, #181a1b)'
      }}>
        <div className="text-lg text-white">Redirecting to login...</div>
      </div>
    );
  }

  return (
    <TutorProfileModalContext.Provider value={{ openTutorProfileModal }}>
      <>
        {/* Mobile top bar */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/10 backdrop-blur-md border-b border-white/20 px-4 py-3 flex items-center justify-between" style={{
          boxShadow: '0 8px 32px 0 rgba(31,38,135,0.25)'
        }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="text-white font-semibold tracking-tight">eclero</div>
          </div>
          <button
            aria-label="Open sidebar menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(v => !v)}
            className="inline-flex flex-col items-center justify-center w-9 h-9 rounded-full bg-white/80 border border-white/40 shadow hover:bg-white"
          >
            <span className="block w-5 h-0.5 bg-gray-800" />
            <span className="block w-5 h-0.5 bg-gray-800 mt-1.5" />
            <span className="block w-5 h-0.5 bg-gray-800 mt-1.5" />
          </button>
        </div>

        <div className="flex h-screen pt-14 lg:pt-0" style={{
          background: 'linear-gradient(to bottom, #2b3340, #23272f, #181a1b)'
        }}>
          {/* Sidebar: desktop */}
          <div className="hidden lg:block">
            <HomeSidebar userRole={userRole} userName={userName} />
          </div>
          <main className="flex-1 overflow-y-auto relative">
            <div className="p-6">{children}</div>
          </main>
        </div>

        {/* Sidebar drawer: mobile */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
            <div className="absolute top-0 left-0 h-full w-64 max-w-[85vw] shadow-2xl">
              <HomeSidebar userRole={userRole} userName={userName} />
            </div>
          </div>
        )}
        {/* Modal overlay is now outside the flex container, so sidebar is never blurred */}
        {profileModalOpen && (
          profileLoading ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="text-white text-xl font-bold">Loading profile...</div>
            </div>
          ) : (
            <TutorProfileBubble
              tutor={fullTutorProfile || selectedTutor}
              isOpen={profileModalOpen}
              onClose={() => setProfileModalOpen(false)}
              onBookSession={handleBookSession}
            />
          )
        )}

        {/* Booking Modal */}
        {bookingModalOpen && bookingTutor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-6 w-full max-w-md border border-white/20" style={{ boxShadow: '0 8px 32px 0 rgba(31,38,135,0.37)' }}>
              <h3 className="text-xl font-bold mb-4 text-white">Book Session with {bookingTutor.name}</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Topic (optional)
                </label>
                <input
                  type="text"
                  value={bookingTopic}
                  onChange={(e) => setBookingTopic(e.target.value)}
                  placeholder="What would you like to study?"
                  className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Any specific requirements or questions?"
                  rows={3}
                  className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={cancelBooking}
                  disabled={bookingLoading}
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBooking}
                  disabled={bookingLoading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-400 to-purple-500 text-white rounded-lg hover:from-blue-500 hover:to-purple-600 transition-all disabled:opacity-50"
                >
                  {bookingLoading ? 'Booking...' : 'Book Session'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    </TutorProfileModalContext.Provider>
  );
}
