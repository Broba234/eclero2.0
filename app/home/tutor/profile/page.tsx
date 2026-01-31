"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import TiptapEditor from "@/components/RichTextEditor";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import SubjectSelectProfile from "@/components/ui/components/SubjectSelectProfile";
import WizardTimeSlot from "@/components/ui/components/WizardTimeSlot";
import UpdateProfileTimeSlot from "@/components/ui/components/UpdateProfileTimeSlot";
export type Subjects = {
  id: string;
  name: string;
  code: string;
  grade: number;
  category?: string;
  created_at?: Date;
  updated_at?: Date;
};
type CategoryGroup = {
  name: string;
  subjects: Subjects[];
};
export default function TutorProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editMode1, setEditMode1] = useState(false);
  const [editMode2, setEditMode2] = useState(false);
  const [editMode3, setEditMode3] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editHourlyRate, setEditHourlyRate] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const [educationText, setEducationText] = useState<string>("");
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<any[]>([]);
  const [selectedSubjectsWithPrice, setSelectedSubjectsWithPrice] = useState<
    any[]
  >([]);
  const [error, setError] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
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
      const profileRes = await fetch(
        `/api/profiles/get-full?email=${encodeURIComponent(user.email!)}`
      );
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
        setEditName(profileData.name || "");
        setEditPhone(profileData.phone || "");
        setEditBio(profileData.bio || "");
        setEditHourlyRate(profileData.hourlyRate?.toString() || "");
        if (profileData.education) {
          setEducationText(String(profileData.education) || "");
        } else {
          setEducationText(""); 
        }
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
                (subject: any): subject is Subjects =>
                typeof subject.id === "string" && subject.id.length > 0
            );
        }
        setSelectedSubjects(normalizedSubjects);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };
  useEffect(() => {

    fetchProfile();

    fetch("/api/subjects")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // setSelectedSubjects(data);
          const catMap = new Map<string, Subjects[]>();
          data.forEach((subject: Subjects) => {
            const cat = subject.category || "Uncategorized";
            if (!catMap.has(cat)) catMap.set(cat, []);
            catMap.get(cat)!.push(subject);
          });
          const grouped: CategoryGroup[] = Array.from(catMap.entries()).map(
            ([name, subjects]) => ({ name, subjects })
          );
          setCategories(grouped);
        } else {
          setSelectedSubjects([]);
          setCategories([]);
        }
      })
      .catch((err) => {
        setSelectedSubjects([]);
        setCategories([]);
      });
  }, [router]);

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
        hourlyRate: hourlyRate,
      }),
    });
    setProfile({
      ...profile,
      name: editName,
      phone: editPhone,
      bio: editBio,
      hourlyRate: hourlyRate,
    });
    setSaving(false);
  };
  const handleSaveEducation = async () => {
    setSaving(true);
    await fetch("/api/profiles/update-education", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: profile.email,
        education: educationText,
      }),
    });
    setProfile({ ...profile, education: educationText });
    setSaving(false);
  };
  const onSubjectsChange = (subjects: any) => {
    setError(false);
    setErrorMsg("");
    setSelectedSubjects(subjects);
  };
  const handleSubjectsChange = async () => {
    if (!profile?.email) return;
    if (selectedSubjectsWithPrice.length === 0) {
      setError(true);
      setErrorMsg("Please select all subjects and time slots with prices");
      return;
    }
    const hasInvalidPriceOrDuration = selectedSubjectsWithPrice.some(
      (subject) =>
        !subject?.duration_1 ||
        Number(subject?.price_1) <= 0 ||
        !subject?.duration_2 ||
        Number(subject?.price_2) <= 0 ||
        !subject?.duration_3 ||
        Number(subject?.price_3) <= 0
    );
    if (hasInvalidPriceOrDuration) {
      setError(true);
      setErrorMsg(
        "Please add prices and select durations for all session lengths"
      );
      return;
    }
    Swal.fire({
      title: "Are you sure?",
      text: "All availablity records will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Proceed!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await fetch("/api/subjects/update-subjects-and-prices", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: profile.email,
              subjects: selectedSubjectsWithPrice,
            }),
          });
        } catch (e) {
        }
        setEditMode3(false);
        setStep(1);
        fetchProfile();
        Swal.fire({
          title: "Updated!",
          text: "Your subjects have been updated.",
          icon: "success",
        });
      }
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-900 items-center justify-center">
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
   <div className="h-screen flex items-center justify-center bg-[#F3F4F4]">
  <div className="w-full max-w-7xl lg:min-h-[750px] bg-white rounded-2xl border border-gray-200 p-8 grid grid-cols-1 md:grid-cols-[1.1fr_1.6fr] gap-8" style={{ boxShadow: '0 8px 32px 0 rgba(31,38,135,0.37)' }}>
    {/* LEFT COLUMN – Subjects */}
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-12 h-12 rounded-2xl object-cover border border-gray-600 shadow-lg bg-gray-600 p-2"
          viewBox="0 0 48 48"
          fill="none"
        >
          <circle cx="24" cy="24" r="24" fill="#4b5563" />
          <circle cx="24" cy="19" r="8" fill="#6b7280" />
          <ellipse cx="24" cy="34" rx="12" ry="6" fill="#6b7280" />
        </svg>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            {profile.name}
          </h2>
          <div className="mt-1 inline-flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {profile.role === "tutor"
                ? "Tutor"
                : profile.role || "Student"}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-300 bg-gray-50 p-5">
        {editMode3 ? (
          <>
            {error && <div className="text-red-500 text-sm mb-2">{errorMsg}</div>}
            {step === 1 && (
              <motion.div
                key="subjects-step"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <SubjectSelectProfile
                  categories={categories}
                  selectedSubjects={selectedSubjects}
                  onSubjectsChange={onSubjectsChange}
                />
              </motion.div>
            )}
            {step === 2 && (
              <motion.div
                key="timeslot-step"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <UpdateProfileTimeSlot
                  selectedSubjectsfromProfile={selectedSubjects}
                  setSelectedSubjectsWithPrice={setSelectedSubjectsWithPrice}
                />
              </motion.div>
            )}
            <div className="pt-5 flex justify-end">
              <button
                onClick={() => {
                  setEditMode3(false);
                  setStep(1);
                }}
                className="inline-flex items-center px-4 py-2.5 rounded-full text-sm font-medium border border-gray-300 text-gray-700 mr-3 disabled:opacity-60 disabled:cursor-not-allowed transition-colors hover:bg-gray-100"
              >
                cancel
              </button>
              {step === 1 && (
              <button
                onClick={() => setStep(2)}
                disabled={saving}
                className="inline-flex items-center px-4 py-2.5 rounded-full text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
              )}
              {step === 2 && (
                <button
                  onClick={handleSubjectsChange}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2.5 rounded-full text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  Save Changes
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Subjects you teach
                </h3>
              </div>
              <button
                onClick={() => {
                  setEditMode3(true);
                  setEditMode2(false);
                  setEditMode1(false);
                }}
                className="inline-flex items-center min-w-[100px] px-3 py-1.5 rounded-full text-xs font-medium bg-gray-800 text-white hover:bg-gray-900 transition-colors"
              >
                Edit Subjects
              </button>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Manage the courses that appear on your profile.
            </p>

            <div className=" flex flex-wrap gap-2">
              {Array.isArray(profile.subjects) &&
              profile.subjects.length > 0 ? (
                profile.subjects.map((subject: any, index: number) => (
                  <button
                    key={index}
                    className={`rounded-xl border border-gray-300 px-5 py-4 w-full text-sm transition gap-2 hover:border-gray-400 hover:bg-gray-50`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="block text-gray-900">
                        {subject.Subjects?.name || subject.name}
                      </span>
                      <span className="text-gray-700 rounded-lg px-[15px] bg-gray-200">
                        {subject.Subjects?.code || subject.code}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-xs text-gray-500">
                  No subjects selected yet. Click "Edit Subjects" to add some.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>

    {/* RIGHT COLUMN – Personal Info + Education */}
    <div className="flex flex-col gap-6">
      {/* Personal Info */}
      <section className="rounded-2xl border border-gray-300 bg-gray-50 p-5">
        <form action="">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Personal Info
              </h3>
              <p className="text-xs text-gray-600">
                Basic details that students will see on your profile.
              </p>
            </div>
            {!editMode1 && (
              <span
                onClick={() => {
                  setEditMode1(true);
                  setEditMode2(false);
                  setEditMode3(false);
                }}
                className="inline-flex cursor-pointer items-center min-w-[100px] px-3 py-1.5 rounded-full text-xs font-medium bg-gray-800 text-white hover:bg-gray-900 transition-colors"
              >
                Edit profile
              </span>
            )}
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Full Name
              </label>
              <input
                className="w-full rounded-xl bg-white border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your full name"
                disabled={saving}
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Bio
              </label>
              <textarea
                className="w-full rounded-xl bg-white border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none min-h-[96px]"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Tell students about your experience, teaching style, and what to expect."
                disabled={saving}
              />
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  className="w-full rounded-xl bg-gray-100 border border-gray-300 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={profile.email}
                  disabled
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Phone
                </label>
                <input
                  className="w-full rounded-xl bg-white border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+1 234 567 890"
                  disabled={saving}
                />
              </div>
            </div>

            {editMode1 && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setEditMode1(false)}
                  className="inline-flex items-center px-4 py-2.5 rounded-full text-sm font-medium border border-gray-300 text-gray-700 mr-3 disabled:opacity-60 disabled:cursor-not-allowed transition-colors hover:bg-gray-100"
                >
                  cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2.5 rounded-full text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </form>
      </section>

      {/* Education (Rich Text-ish) */}
      <section className="rounded-2xl border border-gray-300 bg-gray-50 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Education
            </h3>
            <p className="text-xs text-gray-600">
              Share your degrees, institutions and any relevant qualifications.
            </p>
          </div>
          {!editMode2 && (
            <span
              onClick={() => {
                setEditMode2(true);
                setEditMode1(false);
                setEditMode3(false);
              }}
              className="inline-flex cursor-pointer items-center min-w-[100px] px-3 py-1.5 rounded-full text-xs font-medium bg-gray-800 text-white hover:bg-gray-900 transition-colors"
            >
              Edit education
            </span>
          )}
        </div>
        <div className="relative">
          <div className="relative">
            {editMode2 ? (
              <TiptapEditor
                onChange={setEducationText}
                value={educationText}
              />
            ) : (
              <div className="education-content">
                <div
                  className="rendered-html-content text-gray-900"
                  dangerouslySetInnerHTML={{ __html: educationText }}
                />
              </div>
            )}
          </div>
        </div>
        {editMode2 && (
          <div className="w-full flex mt-3 justify-end">
            <button
              onClick={() => setEditMode2(false)}
              className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium border border-gray-300 text-gray-700 mr-3 disabled:opacity-60 disabled:cursor-not-allowed transition-colors hover:bg-gray-100"
            >
              cancel
            </button>
            <button
              disabled={saving}
              onClick={handleSaveEducation}
              className="inline-flex items-center justify-end px-4 py-2.5 rounded-full text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </section>
    </div>
  </div>
</div>
  );
}
