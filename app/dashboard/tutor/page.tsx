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

export default function TutorDashboard() {
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
                const errorData = await response.text();
                console.error('Failed to update availability:', response.status, errorData);
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
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="md:flex md:items-center md:justify-between">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                            Tutor Dashboard
                        </h2>
                    </div>
                    <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                        <button
                            onClick={handleAvailabilityToggle}
                            disabled={isLoading || isToggling}
                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                                isAvailableNow 
                                    ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' 
                                    : 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200'
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
                                        isAvailableNow ? 'bg-green-500' : 'bg-yellow-500'
                                    }`}></div>
                                    {isAvailableNow ? 'Open to Sessions' : 'Not Available'}
                                </>
                            )}
                        </button>
                        <Link
                            href="/dashboard/tutor/availability"
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Manage Availability
                        </Link>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Stats cards */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Total Sessions
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {stats.totalSessions}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Total Earnings
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            ${stats.totalEarnings}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Rating
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
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
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Upcoming Sessions
                            </h3>
                        </div>
                        <div className="border-t border-gray-200">
                            <div className="px-4 py-5 sm:p-6">
                                {stats.upcomingSessions === 0 ? (
                                    <p className="text-gray-500 text-center">No upcoming sessions</p>
                                ) : (
                                    <div className="space-y-4">
                                        {/* TODO: Add actual session list */}
                                        <p className="text-gray-500 text-center">Loading sessions...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8">
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Quick Actions
                            </h3>
                        </div>
                        <div className="border-t border-gray-200">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Link
                                        href="/dashboard/tutor/profile"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Edit Profile
                                    </Link>
                                    <Link
                                        href="/dashboard/tutor/sessions"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
