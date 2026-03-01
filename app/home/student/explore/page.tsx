"use client";
import { useEffect, useState, useContext, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { TutorProfileModalContext } from "@/components/ui/components/common/TutorProfileModalContext";
import { FilterModal } from "@/components/FilterModal";
import DOMPurify from "dompurify";
import {
  SlidersHorizontal,
  X,
  Star,
  Clock,
  BookOpen,
  GraduationCap,
  Search,
  Users,
} from "lucide-react";

export type Subjects = {
  id: string;
  name: string;
  code: string;
  grade: number;
  category?: string;
  duration_1?: number | string | null;
  duration_2?: number | string | null;
  duration_3?: number | string | null;
  price_1?: number | string | null;
  price_2?: number | string | null;
  price_3?: number | string | null;
};

type CategoryGroup = {
  name: string;
  subjects: Subjects[];
};

type AvailableSlot = {
  subject_id?: string | null;
  start_time?: string | Date | null;
  end_time?: string | Date | null;
  start_date?: string | Date | null;
  end_date?: string | Date | null;
};

type Tutor = {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  rating?: number | null;
  isAvailableNow?: boolean | null;
  derivedActiveNow?: boolean;
  education?: string | null;
  subjects: Subjects[];
  availableSlots?: AvailableSlot[];
};

// ─── Tutor Card ───────────────────────────────────────────────────────────────
const toSlotMinutes = (value?: string | Date | null): number | null => {
  if (!value) return null;
  if (typeof value === "string") {
    const m = value.match(/T(\d{2}):(\d{2})/);
    if (m) return parseInt(m[1]) * 60 + parseInt(m[2]);
  }
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.getUTCHours() * 60 + d.getUTCMinutes();
};

function countTimeSlots(availableSlots: AvailableSlot[]): number {
  const SLOT_DURATION = 30; // smallest bookable duration in minutes
  const unique = new Set<number>();
  for (const slot of availableSlots) {
    const start = toSlotMinutes(slot.start_time);
    const end = toSlotMinutes(slot.end_time);
    if (start === null || end === null || end <= start) continue;
    for (let t = start; t + SLOT_DURATION <= end; t += SLOT_DURATION) {
      unique.add(t);
    }
  }
  return unique.size;
}

const TutorCard = ({
  tutor,
  onBook,
}: {
  tutor: Tutor;
  onBook: (tutor: Tutor) => void;
}) => {
  const slotsToday = useMemo(
    () => countTimeSlots(Array.isArray(tutor.availableSlots) ? tutor.availableSlots : []),
    [tutor.availableSlots]
  );
  const educationHtml = tutor.education
    ? DOMPurify.sanitize(tutor.education.replace(/^"|"$/g, ""))
    : "";

  return (
    <div className="group bg-white rounded-2xl border border-gray-200 hover:border-blue-200 transition-all duration-300 hover:shadow-lg overflow-hidden">
      <div className="p-5">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5">
                <img
                  src={tutor.avatar || "/default-avatar.png"}
                  alt={tutor.name || "Tutor"}
                  className="w-full h-full rounded-full object-cover bg-gray-100"
                />
              </div>
              {tutor.derivedActiveNow && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-gray-900 truncate">
                  {tutor.name}
                </h3>
                {educationHtml && (
                  <div
                    className="text-gray-500 text-sm mt-0.5 line-clamp-1"
                    dangerouslySetInnerHTML={{ __html: educationHtml }}
                  />
                )}
              </div>

              {/* Rating */}
              {typeof tutor.rating === "number" && (
                <div className="flex items-center gap-1 flex-shrink-0 px-2 py-1 bg-amber-50 rounded-lg">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-semibold text-amber-700">
                    {tutor.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {/* Subjects */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tutor.subjects?.slice(0, 4).map((subject, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-md"
                >
                  {subject.name}
                </span>
              ))}
              {tutor.subjects && tutor.subjects.length > 4 && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-md">
                  +{tutor.subjects.length - 4}
                </span>
              )}
            </div>

            {/* Bottom row */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-4">
                {slotsToday > 0 ? (
                  <div className="flex items-center gap-1.5 text-green-700">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">
                      {slotsToday} slot{slotsToday !== 1 ? "s" : ""} today
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">No slots today</span>
                  </div>
                )}
                {tutor.bio && (
                  <p className="text-xs text-gray-400 line-clamp-1 max-w-[200px] hidden md:block">
                    {tutor.bio}
                  </p>
                )}
              </div>

              <button
                onClick={() => onBook(tutor)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md"
              >
                Book Session
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Skeleton Card ────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
    <div className="flex gap-4">
      <div className="w-14 h-14 rounded-full bg-gray-200 flex-shrink-0" />
      <div className="flex-1 space-y-3">
        <div className="flex justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-3 bg-gray-200 rounded w-48" />
          </div>
          <div className="h-7 w-12 bg-gray-200 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="h-5 bg-gray-200 rounded w-16" />
          <div className="h-5 bg-gray-200 rounded w-20" />
          <div className="h-5 bg-gray-200 rounded w-14" />
        </div>
        <div className="flex justify-between items-center pt-1">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-9 bg-gray-200 rounded-xl w-28" />
        </div>
      </div>
    </div>
  </div>
);

// ─── Tutor Section ────────────────────────────────────────────────────────────
const TutorSection = ({
  title,
  icon,
  tutors,
  loading,
  onBook,
}: {
  title: string;
  icon?: React.ReactNode;
  tutors: Tutor[];
  loading: boolean;
  onBook: (tutor: Tutor) => void;
}) => {
  if (!loading && tutors.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          {icon}
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          {!loading && (
            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
              {tutors.length}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {loading
          ? Array.from({ length: 3 }, (_, i) => <SkeletonCard key={i} />)
          : tutors.map((tutor) => (
              <TutorCard key={tutor.id} tutor={tutor} onBook={onBook} />
            ))}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ExploreTutors() {
  const [studentSubjectIds, setStudentSubjectIds] = useState<string[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subjects[]>([]);
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [gradeFilter, setGradeFilter] = useState<string>("");
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);
  const [onlyActiveNow, setOnlyActiveNow] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const { openTutorProfileModal } = useContext(TutorProfileModalContext)!;

  // Handle return from Stripe 3DS redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentIntent = params.get("payment_intent");
    const redirectStatus = params.get("redirect_status");
    const sessionId = params.get("sessionId");
    if (!paymentIntent || !redirectStatus) return;

    // Clean query params from URL
    window.history.replaceState({}, "", window.location.pathname);

    if (redirectStatus === "succeeded" && sessionId) {
      fetch("/api/sessions/confirm-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
        .then((res) => {
          if (res.ok) {
            alert("Payment successful! Your session has been booked.");
          } else {
            // Session may have already been confirmed
            console.warn("Could not confirm session after 3DS redirect");
          }
        })
        .catch(() => {
          console.error("Failed to confirm payment after redirect");
        });
    } else if (redirectStatus === "failed") {
      alert("Payment was not completed. Please try booking again.");
    }
  }, []);

  useEffect(() => {
    const fetchTutors = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/profiles/available-tutors${onlyActiveNow ? "?availableNow=true" : ""}`
        );
        if (!res.ok) {
          setTutors([]);
          setLoading(false);
          return;
        }
        const data = await res.json();
        const tutorList = Array.isArray(data)
          ? data
          : Array.isArray(data?.tutors)
          ? data.tutors
          : [];
        setTutors(tutorList);
      } catch {
        setTutors([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTutors();
  }, [onlyActiveNow]);

  useEffect(() => {
    setSubjectsLoading(true);
    setSubjectsError(null);
    fetch("/api/subjects")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSubjects(data);
          const catMap = new Map<string, Subjects[]>();
          data.forEach((subject: Subjects) => {
            const cat = subject.category || "Uncategorized";
            if (!catMap.has(cat)) catMap.set(cat, []);
            catMap.get(cat)!.push(subject);
          });
          setCategories(
            Array.from(catMap.entries()).map(([name, subjects]) => ({ name, subjects }))
          );
        } else {
          setSubjects([]);
          setCategories([]);
          setSubjectsError("Invalid data format from server");
        }
        setSubjectsLoading(false);
      })
      .catch(() => {
        setSubjectsError("Failed to load subjects");
        setSubjects([]);
        setCategories([]);
        setSubjectsLoading(false);
      });
  }, []);

  useEffect(() => {
    const fetchStudentSubjects = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (!user || error || !user.email) return;
        const res = await fetch(
          `/api/profiles/get-full?email=${encodeURIComponent(user.email)}`
        );
        if (res.ok) {
          const profile = await res.json();
          const normalizedSubjects = Array.isArray(profile?.subjects)
            ? profile.subjects
                .map((s: any) => {
                  if (s && typeof s.id === "string") return s;
                  if (s && s.subject && typeof s.subject.id === "string") return s.subject;
                  return undefined;
                })
                .filter(
                  (s: any): s is { id: string } =>
                    !!s && typeof s.id === "string" && s.id.length > 0
                )
            : [];
          setStudentSubjectIds(normalizedSubjects.map((s) => s.id));
        } else {
          setStudentSubjectIds([]);
        }
      } catch {
        setStudentSubjectIds([]);
      }
    };
    fetchStudentSubjects();
  }, []);

  const toggleSubject = (id: string) => {
    if (typeof id !== "string" || id.length === 0) return;
    if (validStudentSubjectIds.includes(id)) {
      setStudentSubjectIds(validStudentSubjectIds.filter((sid) => sid !== id));
    } else if (validStudentSubjectIds.length < 5) {
      setStudentSubjectIds([...validStudentSubjectIds, id]);
    }
  };

  const removeSubject = (id: string) => {
    if (typeof id === "string" && id.length > 0) {
      setStudentSubjectIds(validStudentSubjectIds.filter((sid) => sid !== id));
    }
  };

  const validStudentSubjectIds = (studentSubjectIds ?? []).filter(
    (id): id is string => typeof id === "string" && id.length > 0
  );

  const selectedSubjects: Subjects[] = subjects.filter(
    (subj) =>
      typeof subj.id === "string" &&
      subj.id.length > 0 &&
      validStudentSubjectIds.includes(subj.id)
  );

  const getSubjectTutors = (subjectId: string) =>
    tutors.filter(
      (tutor) =>
        Array.isArray(tutor.availableSlots) &&
        tutor.availableSlots.some((slot) => slot.subject_id === subjectId)
    );

  const allTutorsForSelectedSubjects =
    validStudentSubjectIds.length > 0
      ? tutors.filter((tutor) => {
          if (!Array.isArray(tutor.subjects)) return false;
          const selectedIdSet = new Set(validStudentSubjectIds);
          return tutor.subjects.some((s) => s.id && selectedIdSet.has(s.id));
        })
      : [];

  const activeFilterCount =
    validStudentSubjectIds.length +
    (gradeFilter ? 1 : 0) +
    (onlyActiveNow ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Find a Tutor</h1>
              <p className="mt-1.5 text-gray-500">
                Explore tutors and book sessions that fit your schedule
              </p>
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setFilterModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Active Filter Chips */}
          {(selectedSubjects.length > 0 || gradeFilter || onlyActiveNow) && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {onlyActiveNow && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-200">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Active Now
                  <button
                    onClick={() => setOnlyActiveNow(false)}
                    className="ml-0.5 hover:text-green-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {gradeFilter && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full border border-purple-200">
                  Grade {gradeFilter}
                  <button
                    onClick={() => setGradeFilter("")}
                    className="ml-0.5 hover:text-purple-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedSubjects.map((subject) => (
                <span
                  key={subject.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200"
                >
                  {subject.name}
                  <button
                    onClick={() => removeSubject(subject.id)}
                    className="ml-0.5 hover:text-blue-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {activeFilterCount > 1 && (
                <button
                  onClick={() => {
                    setStudentSubjectIds([]);
                    setGradeFilter("");
                    setOnlyActiveNow(false);
                  }}
                  className="text-xs text-gray-500 hover:text-red-600 font-medium px-2 py-1 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>

        {subjectsError && (
          <div className="mb-6 px-4 py-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
            {subjectsError}
          </div>
        )}

        {/* No Subjects Selected */}
        {validStudentSubjectIds.length === 0 && !loading && (
          <div className="mb-8 p-8 bg-white border border-gray-200 rounded-2xl text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
              <Search className="w-7 h-7 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              No Subjects Selected
            </h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-5">
              Select subjects you're interested in to discover tutors who teach
              them. Use the filters to find the perfect match.
            </p>
            <button
              onClick={() => setFilterModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Open Filters
            </button>
          </div>
        )}

        {/* Per-Subject Tutor Sections */}
        {validStudentSubjectIds.length > 0 &&
          subjects.length > 0 &&
          validStudentSubjectIds
            .filter(
              (id): id is string => typeof id === "string" && id.length > 0
            )
            .map((subjectId) => {
              const subject = subjects.find(
                (s) => typeof s.id === "string" && s.id === subjectId
              );
              if (!subject) return null;
              const tutorsForSubject = getSubjectTutors(subjectId);
              if (!loading && tutorsForSubject.length === 0) return null;
              return (
                <TutorSection
                  key={`subject-${subjectId}`}
                  title={`${subject.name} (${subject.code})`}
                  icon={<BookOpen className="w-5 h-5 text-blue-500" />}
                  tutors={tutorsForSubject}
                  loading={loading}
                  onBook={openTutorProfileModal}
                />
              );
            })}

        {/* All Tutors Section */}
        {validStudentSubjectIds.length > 0 && (
          <TutorSection
            title="All Matching Tutors"
            icon={<Users className="w-5 h-5 text-indigo-500" />}
            tutors={allTutorsForSelectedSubjects}
            loading={loading}
            onBook={openTutorProfileModal}
          />
        )}

        {/* No results */}
        {validStudentSubjectIds.length > 0 &&
          !loading &&
          allTutorsForSelectedSubjects.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                No tutors found
              </h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                No tutors have availability for your selected subjects right
                now. Try adjusting your filters or check back later.
              </p>
            </div>
          )}
      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        categories={categories}
        selectedSubjectIds={validStudentSubjectIds}
        onToggleSubject={toggleSubject}
        onClearAll={() => setStudentSubjectIds([])}
        gradeFilter={gradeFilter}
        onGradeChange={setGradeFilter}
        onlyActiveNow={onlyActiveNow}
        onActiveNowChange={setOnlyActiveNow}
        subjectsLoading={subjectsLoading}
      />
    </div>
  );
}
