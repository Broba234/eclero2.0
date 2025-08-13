"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Stats = {
    totalSessions: number;
    completedSessions: number;
    upcomingSessions: number;
    totalEarnings: number;
    rating: number;
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
    const [isLoading, setIsLoading] = useState(true);
    const [isToggling, setIsToggling] = useState(false);

    const router = useRouter();

    // Fetch current availability status
    useEffect(() => {
        const fetchAvailability = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const profileRes = await fetch(`/api/profiles/get-full?email=${encodeURIComponent(user.email!)}`);
                if (profileRes.ok) {
                    const profile = await profileRes.json();
                    console.log('Fetched profile availability:', profile.isAvailableNow);
                    setIsAvailableNow(profile.isAvailableNow || false);
                } else {
                    console.error('Failed to fetch profile:', await profileRes.text());
                }
            } catch (error) {
                console.error('Error fetching availability:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAvailability();
    }, []);

    const handleAvailabilityToggle = async () => {
        setIsToggling(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                console.error("No user session");
                return;
            }

            console.log('Sending availability update:', { isAvailableNow: !isAvailableNow, userEmail: session.user.email });
            
            const response = await fetch('/api/profiles/update-availability', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    isAvailableNow: !isAvailableNow,
                    userEmail: session.user.email 
                })
            });
            
            console.log('Response status:', response.status);

            if (response.ok) {
                const updatedProfile = await response.json();
                setIsAvailableNow(updatedProfile.isAvailableNow);
                console.log('Availability updated to:', updatedProfile.isAvailableNow);
            } else {
                const errorText = await response.text();
                let message = 'Failed to update availability';
                try {
                    const parsed = JSON.parse(errorText);
                    message = parsed.error || message;
                } catch {}
                console.error('Failed to update availability:', response.status, errorText);
                alert(message);
            }
        } catch (error) {
            console.error('Error updating availability:', error);
        } finally {
            setIsToggling(false);
        }
    };

    // TODO: Fetch actual stats from backend
    // useEffect(() => {
    //     // Fetch stats
    // }, []);

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="md:flex md:items-center md:justify-between">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-3xl font-bold leading-7 text-white sm:text-4xl sm:truncate">
                            Welcome back
                        </h2>
                        <p className="mt-2 text-gray-300">Manage your tutoring sessions and earnings</p>
                    </div>
                    <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                        <button
                            onClick={handleAvailabilityToggle}
                            disabled={isLoading || isToggling}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                                isAvailableNow 
                                    ? 'bg-gradient-to-r from-green-400 to-green-600 text-white border-transparent hover:from-green-500 hover:to-green-700' 
                                    : 'bg-white/10 text-yellow-400 border-white/30 hover:bg-white/20'
                            } ${isLoading || isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            {isToggling ? (
                                <>
                                    <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <div className={`w-2 h-2 rounded-full ${
                                        isAvailableNow ? 'bg-green-400' : 'bg-yellow-400'
                                    }`}></div>
                                    {isAvailableNow ? 'Available now' : 'offline'}
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

                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Stats cards */}
                    <div className="bg-white/10 backdrop-blur-md overflow-hidden shadow-2xl rounded-2xl border border-white/20" style={{ boxShadow: '0 8px 32px 0 rgba(31,38,135,0.37)' }}>
                        <div className="p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-300 truncate">
                                            Total Sessions
                                        </dt>
                                        <dd className="text-2xl font-bold text-white">
                                            {stats.totalSessions}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md overflow-hidden shadow-2xl rounded-2xl border border-white/20" style={{ boxShadow: '0 8px 32px 0 rgba(31,38,135,0.37)' }}>
                        <div className="p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-300 truncate">
                                            Total Earnings
                                        </dt>
                                        <dd className="text-2xl font-bold text-white">
                                            ${stats.totalEarnings}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md overflow-hidden shadow-2xl rounded-2xl border border-white/20" style={{ boxShadow: '0 8px 32px 0 rgba(31,38,135,0.37)' }}>
                        <div className="p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-300 truncate">
                                            Rating
                                        </dt>
                                        <dd className="text-2xl font-bold text-white">
                                            {stats.rating.toFixed(1)} / 5.0
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upcoming Sessions */}
                <div className="mt-8">
                    <div className="bg-white/10 backdrop-blur-md shadow-2xl overflow-hidden sm:rounded-2xl border border-white/20" style={{ boxShadow: '0 8px 32px 0 rgba(31,38,135,0.37)' }}>
                        <div className="px-6 py-5 sm:px-6">
                            <h3 className="text-xl leading-6 font-bold text-white">
                                Upcoming Sessions
                            </h3>
                        </div>
                        <div className="border-t border-white/20">
                            <div className="px-6 py-5 sm:p-6">
                                {stats.upcomingSessions === 0 ? (
                                    <p className="text-gray-300 text-center">No upcoming sessions</p>
                                ) : (
                                    <div className="space-y-4">
                                        {/* TODO: Add actual session list */}
                                        <p className="text-gray-300 text-center">Loading sessions...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8">
                    <div className="bg-white/10 backdrop-blur-md shadow-2xl overflow-hidden sm:rounded-2xl border border-white/20" style={{ boxShadow: '0 8px 32px 0 rgba(31,38,135,0.37)' }}>
                        <div className="px-6 py-5 sm:px-6">
                            <h3 className="text-xl leading-6 font-bold text-white">
                                Quick Actions
                            </h3>
                        </div>
                        <div className="border-t border-white/20">
                            <div className="px-6 py-5 sm:p-6">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Link
                                        href="/home/tutor/profile"
                                        className="inline-flex items-center px-6 py-3 border border-white/30 text-sm font-medium rounded-full text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                                    >
                                        Edit Profile
                                    </Link>
                                    <Link
                                        href="/home/tutor/sessions"
                                        className="inline-flex items-center px-6 py-3 border border-white/30 text-sm font-medium rounded-full text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
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
