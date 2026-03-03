"use client";
import { useEffect, useState, useContext, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { TutorProfileModalContext } from "@/components/ui/components/common/TutorProfileModalContext";
import { FilterModal } from "@/components/FilterModal";
import DOMPurify from "dompurify";
import { toast } from "sonner";
import {
  SlidersHorizontal,
  X,
  Star,
  Clock,
  BookOpen,
  GraduationCap,
  Search,
  Users,
  Globe,
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
  timezone?: string | null;
  subjects: Subjects[];
  availableSlots?: AvailableSlot[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
  const SLOT_DURATION = 30;
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

/** Format IANA timezone to readable label, e.g. "America/New_York" → "New York" */
function formatTimezone(tz: string): string {
  const city = tz.split("/").pop()?.replace(/_/g, " ") ?? tz;
  return city;
}

/** Get current time in a given IANA timezone, e.g. "3:42 PM" */
function currentTimeInTz(tz: string): string {
  try {
    return new Date().toLocaleTimeString("en-US", {
      timeZone: tz,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

/** Get the lowest price across all subjects */
function getStartingPrice(subjects: Subjects[]): number | null {
  let min: number | null = null;
  for (const s of subjects) {
    for (const p of [s.price_1, s.price_2, s.price_3]) {
      const n = typeof p === "string" ? parseFloat(p) : p;
      if (typeof n === "number" && !isNaN(n) && (min === null || n < min))
        min = n;
    }
  }
  return min;
}

// ─── Tutor Card ───────────────────────────────────────────────────────────────
const TutorCard = ({
  tutor,
  onBook,
}: {
  tutor: Tutor;
  onBook: (tutor: Tutor) => void;
}) => {
  const slotsToday = useMemo(
    () =>
      countTimeSlots(
        Array.isArray(tutor.availableSlots) ? tutor.availableSlots : []
      ),
    [tutor.availableSlots]
  );

  const educationHtml = tutor.education
    ? DOMPurify.sanitize(tutor.education.replace(/^"|"$/g, ""))
    : "";

  const startingPrice = useMemo(
    () => getStartingPrice(tutor.subjects ?? []),
    [tutor.subjects]
  );

  const tzLabel = tutor.timezone ? formatTimezone(tutor.timezone) : null;
  const tzTime = tutor.timezone ? currentTimeInTz(tutor.timezone) : null;

  return (
    <div className="group bg-white rounded-2xl border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg hover:shadow-blue-100/50 overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex gap-4 sm:gap-5">
          {/* Avatar */}
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            <div className="relative">
              <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5">
                <img
                  src={tutor.avatar || "/default-avatar.png"}
                  alt={tutor.name || "Tutor"}
                  className="w-full h-full rounded-[14px] object-cover bg-gray-100"
                />
              </div>
              {tutor.derivedActiveNow && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-[2.5px] border-white flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              )}
            </div>
            {typeof tutor.rating === "number" && (
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-xs font-bold text-gray-700">
                  {tutor.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Name + status */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                {tutor.name}
              </h3>
              {tutor.derivedActiveNow && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-semibold rounded-full border border-green-200 flex-shrink-0">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Online
                </span>
              )}
            </div>

            {/* Education */}
            {educationHtml && (
              <div
                className="text-gray-500 text-sm line-clamp-1"
                dangerouslySetInnerHTML={{ __html: educationHtml }}
              />
            )}

            {/* Bio */}
            {tutor.bio && (
              <p className="text-gray-400 text-xs mt-1 line-clamp-2 sm:line-clamp-1">
                {tutor.bio}
              </p>
            )}

            {/* Timezone + Slots row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
              {tzLabel && (
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-medium">{tzLabel}</span>
                  {tzTime && (
                    <span className="text-[10px] text-gray-400 font-medium">
                      ({tzTime})
                    </span>
                  )}
                </div>
              )}
              {slotsToday > 0 ? (
                <div className="flex items-center gap-1.5 text-green-600">
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
            </div>

            {/* Subjects */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tutor.subjects?.slice(0, 4).map((subject, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded-lg"
                >
                  {subject.name}
                </span>
              ))}
              {tutor.subjects && tutor.subjects.length > 4 && (
                <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-[11px] font-semibold rounded-lg">
                  +{tutor.subjects.length - 4} more
                </span>
              )}
            </div>

            {/* Bottom row: price + book */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <div>
                {startingPrice !== null && (
                  <div className="text-sm">
                    <span className="text-gray-400 text-xs">from </span>
                    <span className="font-bold text-gray-900">
                      ${startingPrice.toFixed(0)}
                    </span>
                    <span className="text-gray-400 text-xs">/session</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => onBook(tutor)}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
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
  <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 animate-pulse">
    <div className="flex gap-4 sm:gap-5">
      <div className="flex flex-col items-center gap-2 flex-shrink-0">
        <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl bg-gray-200" />
        <div className="h-3 w-8 bg-gray-200 rounded" />
      </div>
      <div className="flex-1 space-y-3">
        <div className="space-y-1.5">
          <div className="h-5 bg-gray-200 rounded w-36" />
          <div className="h-3 bg-gray-200 rounded w-52" />
        </div>
        <div className="flex gap-3">
          <div className="h-3 bg-gray-200 rounded w-24" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-6 bg-gray-200 rounded-lg w-16" />
          <div className="h-6 bg-gray-200 rounded-lg w-20" />
          <div className="h-6 bg-gray-200 rounded-lg w-14" />
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="h-10 bg-gray-200 rounded-xl w-28" />
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
            toast.success("Payment successful! Your session has been booked.");
          } else {
            // Session may have already been confirmed
            console.warn("Could not confirm session after 3DS redirect");
          }
        })
        .catch(() => {
          console.error("Failed to confirm payment after redirect");
        });
    } else if (redirectStatus === "failed") {
      toast.error("Payment was not completed. Please try booking again.");
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
