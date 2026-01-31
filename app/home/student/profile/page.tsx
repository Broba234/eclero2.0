"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import SubjectSelector from "@/components/SubjectSelector";
import Button from "@/components/ui/components/ui/button/Button";

export default function StudentProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
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
          let normalizedSubjects: string[] = [];
          if (profileData.subjects && Array.isArray(profileData.subjects)) {
            normalizedSubjects = profileData.subjects
              .map((s: any) => {
                if (s && typeof s.id === "string") return s.id;
                if (s && s.Subjects && typeof s.Subjects.id === "string")
                  return s.Subjects;
                return undefined;
              })
              .filter(
                  (subject: any): subject is any =>
                  typeof subject.id === "string" && subject.id.length > 0
              );
          }
          setSubjects(normalizedSubjects);
          setEditName(profileData.name || "");
          setEditPhone(profileData.phone || "");
        }
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  const handleSubjectsChange = async (subjectIds: string[]) => {
    if (!profile?.email) return;
    setSubjects(subjectIds);
    await fetch("/api/profiles/student/update-subjects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: profile.email, subjects: subjectIds }),
    });
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditName(profile.name || "");
    setEditPhone(profile.phone || "");
    setEditMode(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/profiles/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: profile.email, name: editName, phone: editPhone }),
    });
    setProfile({ ...profile, name: editName, phone: editPhone });
    setEditMode(false);
    setSaving(false);
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.email) return;

    try {
      setAvatarUploading(true);

      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9-_.]/g, "-");
      const filePath = `avatars/${profile.email}-${Date.now()}-${sanitizedFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("eclero-storage")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("eclero-storage").getPublicUrl(filePath);

      await fetch("/api/profiles/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile.email, name: profile.name, phone: profile.phone, bio:profile.bio, avatar: publicUrl }),
      });

      setProfile({ ...profile, avatar: publicUrl });
    } catch (error: any) {
      console.error("Error uploading avatar:", error?.message || error);
      alert("Failed to upload profile picture. Please try again.");
    } finally {
      setAvatarUploading(false);
      // Allow re-selecting the same file
      event.target.value = "";
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-b from-[#F8F9FD] to-gray-400 items-center justify-center">
        <div className="text-white text-xl font-bold">Loading profile...</div>
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="flex h-screen bg-gradient-to-b from-[#F8F9FD] to-gray-400 items-center justify-center">
        <div className="text-white text-xl font-bold">Profile not found.</div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center min-h-screen gap-8 p-6 bg-gray-50">
    {/* Profile Card */}
    <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Profile Picture */}
        <div className="flex flex-col items-center md:items-start md:w-1/3 relative space-y-4">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 p-1 shadow-lg">
              <img
                src={profile.avatar || "/default-avatar.png"}
                alt={profile.name}
                className="w-full h-full rounded-full object-cover bg-gray-100"
              />
            </div>
            {editMode && (
              <label className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/90 border border-gray-200 text-xs font-medium text-gray-700 shadow-sm cursor-pointer hover:bg-gray-50 transition">
                {avatarUploading ? "Uploading..." : "Change photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  disabled={avatarUploading}
                />
              </label>
            )}
          </div>
          <p className="text-xs text-gray-400 text-center md:text-left">
            For best results, use a clear square image of your face.
          </p>
          <div className="text-center md:text-left flex-1">
            {!editMode &&(
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{profile.name}</h2>
              </>
            )}
          </div>
          {/* Edit Profile Button - Bottom Left */}
          <div className="w-full mt-auto">
            {!editMode ? (
              <span className="w-full py-2 cursor-pointer flex items-center justify-center gap-2 rounded-full bg-slate-100" onClick={handleEdit} >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Edit profile
              </span>
            ) : (
              <div className="flex gap-2">
                <span onClick={handleSave} className="flex-1 text-center bg-gradient-to-r from-[#1089d3] to-[#12B1D1] rounded-full hover:bg-blue-600 cursor-pointer py-2 text-white">Save</span>
                <span onClick={handleCancel} className="flex-1 text-center rounded-full bg-slate-200 cursor-pointer py-2">Cancel</span>
              </div>
            )}
          </div>
        </div>

        {/* Profile Information */}
        <div className="flex-1 text-gray-900">
          <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
          <div className="grid grid-cols-1 gap-6">
          {editMode && (
   <div>
    <div className="text-xs text-gray-500 mb-1">Name</div>
   <input
         className="w-full mb-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
         value={editName}
         onChange={e => setEditName(e.target.value)}
         placeholder="Name"
         disabled={saving}
       />
   </div>
          )}
         
            {/* Email */}
            <div>
              <div className="text-xs text-gray-500 mb-1">Email</div>
              <div className="text-sm font-medium bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                {profile.email}
              </div>
            </div>

            {/* Phone */}
            <div>
              <div className="text-xs text-gray-500 mb-1">Phone</div>
              {!editMode ? (
                <div className="text-sm font-medium bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  {profile.phone || "Not provided"}
                </div>
              ) : (
                <input
                  className="w-full px-3 py-2 rounded-lg bg-gray-100 text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  placeholder="Phone number"
                  disabled={saving}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Course Selection Section */}
    <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">My Courses</h3>
      <SubjectSelector
        selectedSubjectIds={subjects}
        onSelectionChange={handleSubjectsChange}
        maxSelections={5}
        disabled={false}
      />
    </div>
  </div>
  );
} 