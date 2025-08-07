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
          let normalizedSubjects: any[] = [];
          if (profileData.subjects && Array.isArray(profileData.subjects)) {
            normalizedSubjects = profileData.subjects.map((s: any) => {
              if (s && typeof s.id === 'string') return s.id;
              if (s && s.subject && typeof s.subject.id === 'string') return s.subject.id;
              return undefined;
            }).filter((id: any): id is string => typeof id === 'string' && id.length > 0);
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
    await fetch("/api/profiles/update", {
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-white text-xl font-bold">Loading profile...</div>
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-white text-xl font-bold">Profile not found.</div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center min-h-screen gap-8 p-6">
      {/* Profile Card */}
      <div className="relative w-full max-w-4xl bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8" style={{ boxShadow: '0 8px 32px 0 rgba(31,38,135,0.37)' }}>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Picture */}
          <div className="flex flex-col items-center md:items-start md:w-1/3 relative">
            <img
              src={profile.avatar || "/default-avatar.png"}
              alt={profile.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-white/30 mb-4"
            />
            <div className="text-center md:text-left flex-1">
              {!editMode ? (
                <>
                  <h2 className="text-2xl font-bold text-white mb-1">{profile.name}</h2>
                </>
              ) : (
                <>
                  <input
                    className="w-full mb-2 px-3 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder="Name"
                    disabled={saving}
                  />
                </>
              )}
            </div>
            {/* Edit Profile Button - Bottom Left */}
            <div className="w-full mt-auto">
              {!editMode ? (
                <Button className="w-full flex items-center justify-center gap-2" onClick={handleEdit} variant="outline">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving} variant="primary" className="flex-1">Save</Button>
                  <Button onClick={handleCancel} disabled={saving} variant="outline" className="flex-1">Cancel</Button>
                </div>
              )}
            </div>
          </div>

          {/* Profile Information */}
          <div className="flex-1 text-white">
            <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div>
                <div className="text-xs text-gray-400 mb-1">Email</div>
                <div className="text-sm font-medium bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                  {profile.email}
                </div>
              </div>

              {/* Phone */}
              <div>
                <div className="text-xs text-gray-400 mb-1">Phone</div>
                {!editMode ? (
                  <div className="text-sm font-medium bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                    {profile.phone || "Not provided"}
                  </div>
                ) : (
                  <input
                    className="w-full px-3 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    placeholder="Phone number"
                    disabled={saving}
                  />
                )}
              </div>

              {/* Join Date */}
              {profile.created_at && (
                <div>
                  <div className="text-xs text-gray-400 mb-1">Member Since</div>
                  <div className="text-sm font-medium bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Course Selection Section */}
      <div className="w-full max-w-4xl bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8" style={{ boxShadow: '0 8px 32px 0 rgba(31,38,135,0.37)' }}>
        <h3 className="text-2xl font-bold text-white mb-6">My Courses</h3>
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