"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Button from "@/components/ui/components/ui/button/Button";
import SubjectSelector from "@/components/SubjectSelector";
import { Modal } from "@/components/ui/components/ui/modal";

export default function TutorProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editHourlyRate, setEditHourlyRate] = useState("");
  const [saving, setSaving] = useState(false);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectsModalOpen, setSubjectsModalOpen] = useState(false);
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
          setEditName(profileData.name || "");
          setEditPhone(profileData.phone || "");
          setEditBio(profileData.bio || "");
          setEditHourlyRate(profileData.hourlyRate?.toString() || "");

          // Normalize selected subject ids from profile
          let normalizedSubjects: string[] = [];
          if (profileData.subjects && Array.isArray(profileData.subjects)) {
            normalizedSubjects = profileData.subjects
              .map((s: any) => {
                if (s && typeof s.id === "string") return s.id;
                if (s && s.subject && typeof s.subject.id === "string") return s.subject.id;
                return undefined;
              })
              .filter((id: any): id is string => typeof id === "string" && id.length > 0);
          }
          setSubjects(normalizedSubjects);
        }
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditName(profile.name || "");
    setEditPhone(profile.phone || "");
    setEditBio(profile.bio || "");
    setEditHourlyRate(profile.hourlyRate?.toString() || "");
    setEditMode(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const hourlyRate = editHourlyRate ? parseFloat(editHourlyRate) : null;
    await fetch("/api/profiles/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email: profile.email, 
        name: editName, 
        phone: editPhone,
        bio: editBio,
        hourlyRate: hourlyRate
      }),
    });
    setProfile({ ...profile, name: editName, phone: editPhone, bio: editBio, hourlyRate: hourlyRate });
    setEditMode(false);
    setSaving(false);
  };

  const handleSubjectsChange = async (subjectIds: string[]) => {
    if (!profile?.email) return;
    setSubjects(subjectIds);
    try {
      await fetch("/api/profiles/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile.email, subjects: subjectIds }),
      });
    } catch (e) {
      // noop; UI remains updated locally
    }
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
    <div className="flex justify-center items-center min-h-screen">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8 flex flex-col md:flex-row gap-8" style={{ boxShadow: '0 8px 32px 0 rgba(31,38,135,0.37)' }}>
        {/* Profile Picture */}
        <div className="flex flex-col items-center md:items-start md:w-1/3">
          <img
            src={profile.avatar || "/default-avatar.png"}
            alt={profile.name}
            className="w-32 h-32 rounded-full object-cover border-4 border-white/30 mb-4"
          />
          <div className="text-center md:text-left">
            {!editMode ? (
              <>
                <h2 className="text-2xl font-bold text-white mb-1">{profile.name}</h2>
                {profile.rating && (
                  <div className="flex items-center justify-center md:justify-start mt-1">
                    <span className="text-yellow-400">★</span>
                    <span className="ml-1 text-white font-medium">{profile.rating}</span>
                  </div>
                )}
                {subjects && subjects.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {/* Display selected subject chips based on local state for consistency */}
                    {Array.isArray(profile.subjects) && profile.subjects.length > 0
                      ? profile.subjects.map((subj: any) => (
                          <span key={subj.subject?.id || subj.id || subj.subject?.code || subj.code}
                                className="bg-gradient-to-r from-blue-400 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                            {(subj.subject?.name || subj.name) ?? "Subject"} ({(subj.subject?.code || subj.code) ?? ""})
                          </span>
                        ))
                      : null}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <Button onClick={() => setSubjectsModalOpen(true)} variant="outline">Edit Courses</Button>
                  <Button onClick={handleEdit} variant="outline">Edit Profile</Button>
                </div>
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
                {profile.rating && (
                  <div className="flex items-center justify-center md:justify-start mt-1 mb-2">
                    <span className="text-yellow-400">★</span>
                    <span className="ml-1 text-white font-medium">{profile.rating}</span>
                  </div>
                )}
                {subjects && subjects.length > 0 && (
                  <div className="mt-2 mb-2 flex flex-wrap gap-2">
                    {Array.isArray(profile.subjects) && profile.subjects.length > 0
                      ? profile.subjects.map((subj: any) => (
                          <span key={subj.subject?.id || subj.id || subj.subject?.code || subj.code}
                                className="bg-gradient-to-r from-blue-400 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                            {(subj.subject?.name || subj.name) ?? "Subject"} ({(subj.subject?.code || subj.code) ?? ""})
                          </span>
                        ))
                      : null}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleSave} disabled={saving} variant="primary">Save</Button>
                  <Button onClick={handleCancel} disabled={saving} variant="outline">Cancel</Button>
                </div>
              </>
            )}
          </div>
        </div>
        {/* Profile Info */}
        <div className="flex-1 flex flex-col gap-4 text-white">
          {!editMode ? (
            <>
              {profile.bio && (
                <div>
                  <h3 className="text-lg font-semibold mb-1">Bio</h3>
                  <p className="text-gray-200 whitespace-pre-line">{profile.bio}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-6">
                {profile.email && (
                  <div>
                    <div className="text-xs text-gray-400">Email</div>
                    <div className="text-sm font-medium">{profile.email}</div>
                  </div>
                )}
                {profile.phone && (
                  <div>
                    <div className="text-xs text-gray-400">Phone</div>
                    <div className="text-sm font-medium">{profile.phone}</div>
                  </div>
                )}
                {typeof profile.hourlyRate === 'number' && (
                  <div>
                    <div className="text-xs text-gray-400">Hourly Rate</div>
                    <div className="text-sm font-medium">${profile.hourlyRate}</div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-1">Bio</h3>
                <textarea
                  className="w-full px-3 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  rows={4}
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  disabled={saving}
                />
              </div>
              <div className="flex flex-wrap gap-6">
                <div>
                  <div className="text-xs text-gray-400">Email</div>
                  <div className="text-sm font-medium">{profile.email}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Phone</div>
                  <input
                    className="w-full px-3 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    placeholder="Phone"
                    disabled={saving}
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-400">Hourly Rate</div>
                  <input
                    className="w-full px-3 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={editHourlyRate}
                    onChange={e => setEditHourlyRate(e.target.value)}
                    placeholder="0"
                    type="number"
                    disabled={saving}
                  />
                </div>
              </div>
            </>
          )}
          {profile.education && profile.education.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-1 mt-2">Education</h3>
              <ul className="list-disc list-inside text-gray-200">
                {profile.education.map((edu: any, idx: number) => (
                  <li key={idx}>
                    {edu.degree} @ {edu.institution} ({edu.year})
                  </li>
                ))}
              </ul>
            </div>
          )}
          {profile.experience && profile.experience.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-1 mt-2">Experience</h3>
              <ul className="list-disc list-inside text-gray-200">
                {profile.experience.map((exp: any, idx: number) => (
                  <li key={idx}>
                    <span className="font-medium">{exp.title}</span>: {exp.description} ({exp.years} yrs)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Courses Modal */}
      <Modal isOpen={subjectsModalOpen} onClose={() => setSubjectsModalOpen(false)} className="max-w-3xl p-6">
        <div className="text-white">
          <h3 className="text-2xl font-bold mb-4">Choose Courses You Teach</h3>
          <SubjectSelector
            selectedSubjectIds={subjects}
            onSelectionChange={handleSubjectsChange}
            maxSelections={10}
            disabled={false}
          />
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setSubjectsModalOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
