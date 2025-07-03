"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import SubjectSelector from "@/components/SubjectSelector";

type TutorProfile = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    bio: string;
    subjects: string[];
    hourlyRate: number;
    education: {
        degree: string;
        institution: string;
        year: number;
    }[];
    experience: {
        title: string;
        description: string;
        years: number;
    }[];
};

export default function TutorProfile() {
    console.log("TutorProfile page loaded");

    const [profile, setProfile] = useState<TutorProfile>({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        bio: "",
        subjects: [],
        hourlyRate: 0,
        education: [],
        experience: [],
    });

    const [message, setMessage] = useState("");
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
                    console.error("Supabase session or user fetch error:", sessionError);
                    router.push("/auth/login");
                    return;
                }

                // Fetch profile data
                const profileRes = await fetch(`/api/profiles/get-full?email=${encodeURIComponent(user.email!)}`);
                
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    console.log('Fetched profile data:', profileData);
                    
                    // Split the name into first and last name
                    const nameParts = profileData.name ? profileData.name.split(' ') : ['', ''];
                    const firstName = nameParts[0] || '';
                    const lastName = nameParts.slice(1).join(' ') || '';
                    
                    // Parse JSON fields if they exist
                    const education = profileData.education ? 
                        (typeof profileData.education === 'string' ? JSON.parse(profileData.education) : profileData.education) : [];
                    const experience = profileData.experience ? 
                        (typeof profileData.experience === 'string' ? JSON.parse(profileData.experience) : profileData.experience) : [];
                    
                    // Extract subject names from the new structure
                    const subjects = profileData.subjects ? 
                        profileData.subjects.map((item: any) => item.subject.id) : [];
                    
                    setProfile(prev => ({
                        ...prev,
                        firstName,
                        lastName,
                        email: profileData.email || user.email || '',
                        phone: profileData.phone || '',
                        bio: profileData.bio || '',
                        subjects: subjects,
                        hourlyRate: profileData.hourlyRate !== null && profileData.hourlyRate !== undefined ? profileData.hourlyRate : 0,
                        education: education,
                        experience: experience,
                    }));
                }
                
                setLoading(false);
            } catch (error) {
                console.error("Error fetching profile:", error);
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const {
                data: { user },
                error: sessionError,
            } = await supabase.auth.getUser();

            if (sessionError || !user) {
                setMessage("Authentication error. Please log in again.");
                return;
            }

            const requestBody = {
                email: user.email,
                firstName: profile.firstName,
                lastName: profile.lastName,
                phone: profile.phone,
                bio: profile.bio,
                subjects: profile.subjects,
                hourlyRate: profile.hourlyRate,
                education: profile.education,
                experience: profile.experience,
            };
            
            console.log('Sending profile update:', requestBody);

            const response = await fetch('/api/profiles/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (response.ok) {
                setMessage("Profile updated successfully!");
                setTimeout(() => setMessage(""), 3000);
            } else {
                const errorData = await response.json();
                setMessage(`Error updating profile: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            setMessage("Error updating profile. Please try again.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="text-lg">Loading profile...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="md:flex md:items-center md:justify-between">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                            Profile Settings
                        </h2>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 space-y-8 divide-y divide-gray-200">
                    <div className="space-y-8 divide-y divide-gray-200">
                        <div>
                            <div>
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Personal Information
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    This information will be displayed publicly.
                                </p>
                            </div>

                            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                <div className="sm:col-span-3">
                                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                                        First name
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="firstName"
                                            id="firstName"
                                            value={profile.firstName}
                                            onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-3">
                                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                                        Last name
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="lastName"
                                            id="lastName"
                                            value={profile.lastName}
                                            onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-4">
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                        Email address
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="email"
                                            name="email"
                                            id="email"
                                            value={profile.email}
                                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-4">
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                        Phone number
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="tel"
                                            name="phone"
                                            id="phone"
                                            value={profile.phone}
                                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-6">
                                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                                        Bio
                                    </label>
                                    <div className="mt-1">
                                        <textarea
                                            id="bio"
                                            name="bio"
                                            rows={4}
                                            value={profile.bio}
                                            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        />
                                    </div>
                                    <p className="mt-2 text-sm text-gray-500">
                                        Brief description for your profile. URLs are hyperlinked.
                                    </p>
                                </div>

                                <div className="sm:col-span-4">
                                    <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">
                                        Hourly Rate ($)
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="number"
                                            name="hourlyRate"
                                            id="hourlyRate"
                                            value={profile.hourlyRate}
                                            onChange={(e) => setProfile({ ...profile, hourlyRate: Number(e.target.value) })}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-6">
                                    <label htmlFor="subjects" className="block text-sm font-medium text-gray-700">
                                        Subjects
                                    </label>
                                    <div className="mt-1">
                                        <SubjectSelector
                                            selectedSubjectIds={profile.subjects}
                                            onSelectionChange={(ids: string[]) => setProfile({ ...profile, subjects: ids })}
                                        />
                                    </div>
                                    <p className="mt-2 text-sm text-gray-500">
                                        Select one or more subjects from the available categories.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-5">
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Save
                            </button>
                        </div>
                    </div>

                    {message && (
                        <div className="mt-4 text-center">
                            <p className={`text-sm ${
                                message.includes("Error") ? "text-red-600" : "text-green-600"
                            }`}>
                                {message}
                            </p>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

