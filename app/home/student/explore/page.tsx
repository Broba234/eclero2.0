"use client";
import { useEffect, useState, useContext } from "react";
import { supabase } from "@/lib/supabaseClient";
import { TutorProfileModalContext } from "@/components/ui/components/common/TutorProfileModalContext";
import TutorProfileBubble from "@/components/ui/components/UserProfile/TutorProfileBubble";
import DOMPurify from "dompurify";
export type Subjects = {
  id: string;
  name: string;
  code: string;
  grade: number;
  category?: string;
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

// Ghost tile component for empty sections
const GhostTile = () => (
  <div
    className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-6 flex flex-col items-center border border-white/20"
    style={{ boxShadow: "0 8px 32px 0 rgba(31,38,135,0.37)" }}
  >
    <div className="w-20 h-20 rounded-full mb-4 bg-white/20 animate-pulse"></div>
    <div className="h-4 bg-white/20 rounded mb-2 w-24 animate-pulse"></div>
    <div className="h-3 bg-white/20 rounded w-32 animate-pulse"></div>
  </div>
);

// Section component
const TutorSection = ({
  title,
  description,
  tutors,
  loading,
  onBook,
}: {
  title: string;
  description: string;
  tutors: Tutor[];
  loading: boolean;
  onBook: (tutor: Tutor) => void;
}) => {
  const ghostTiles = Array.from({ length: 3 }, (_, i) => (
    <GhostTile key={`ghost-${i}`} />
  ));

  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-600 mt-1">
            {description}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {tutors.length} {tutors.length === 1 ? "tutor" : "tutors"} available
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          ghostTiles
        ) : (
          <>
            {tutors.map((tutor) => {
              const slotsToday = Array.isArray(tutor.availableSlots)
                ? tutor.availableSlots.length
                : 0;
              const educationHtml = tutor.education
                ? DOMPurify.sanitize(tutor.education.replace(/^"|"$/g, ""))
                : "";

              return (
                <div
                  key={tutor.id || "unknown"}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Left Section - Profile & Quick Info */}
                    <div className="flex items-start gap-4 md:w-1/3">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#1089d3] to-[#12B1D1] flex items-center justify-center text-white font-bold text-xl">
                          {tutor.name?.charAt(0) || "T"}
                        </div>
                        {tutor.derivedActiveNow === true && (
                          <div className="absolute -top-1 -right-1">
                            <div className="w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900">
                            {tutor.name}
                          </h3>
                        </div>
                        {educationHtml && (
                          <div
                            className="text-gray-600 text-sm mt-1"
                            dangerouslySetInnerHTML={{ __html: educationHtml }}
                          />
                        )}
                        {typeof tutor.rating === "number" && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                            <span className="text-amber-500">★</span>
                            <span>{tutor.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle Section - Details */}
                    <div className="md:w-1/3 space-y-3">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                          />
                        </svg>
                        <span className="text-sm text-gray-600">
                          {slotsToday > 0
                            ? `${slotsToday} time slot${
                                slotsToday === 1 ? "" : "s"
                              } today`
                            : "No slots today"}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {tutor.subjects?.slice(0, 3).map((subject, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gradient-to-r from-[#1089d3] to-[#12B1D1] text-white text-xs font-medium rounded"
                          >
                            {subject.name}
                          </span>
                        ))}
                        {tutor.subjects && tutor.subjects.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                            +{tutor.subjects.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Section - Action & Stats */}
                    <div className="md:w-1/3 flex flex-col justify-between">
                      {tutor.bio && (
                        <div className="space-y-3">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {tutor.bio}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => onBook(tutor)}
                          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#1089d3] to-[#12B1D1] text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm"
                        >
                          Book Session
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

const GRADES = [9, 10, 11, 12];

export default function ExploreTutors() {
  const [studentSubjectIds, setStudentSubjectIds] = useState<string[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subjects[]>([]);
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [gradeFilter, setGradeFilter] = useState<string>("");
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);
  const [onlyActiveNow, setOnlyActiveNow] = useState(false);

  const { openTutorProfileModal } = useContext(TutorProfileModalContext)!;

  useEffect(() => {
    // Fetch available tutors from your API
    const fetchTutors = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/profiles/available-tutors${
            onlyActiveNow ? "?availableNow=true" : ""
          }`
        );

        if (!res.ok) {
          console.error("Failed to fetch tutors:", res.status, res.statusText);
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
      } catch (error) {
        console.error("Error fetching tutors:", error);
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
          // Group by category
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
          setSubjects([]);
          setCategories([]);
          setSubjectsError("Invalid data format from server");
        }
        setSubjectsLoading(false);
      })
      .catch((err) => {
        setSubjectsError("Failed to load subjects");
        setSubjects([]);
        setCategories([]);
        setSubjectsLoading(false);
      });
  }, []);

  useEffect(() => {
    // Fetch student subjects from backend
    const fetchStudentSubjects = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (!user || error || !user.email) return;

        const email = user.email;
        const res = await fetch(
          `/api/profiles/get-full?email=${encodeURIComponent(email)}`
        );
        if (res.ok) {
          const profile = await res.json();
          // Normalize subjects: handle [{subject: {...}}] or [{id: ...}]
          const normalizedSubjects = Array.isArray(profile?.subjects)
            ? profile.subjects
                .map((s: any) => {
                  if (s && typeof s.id === "string") return s;
                  if (s && s.subject && typeof s.subject.id === "string")
                    return s.subject;
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
      } catch (error) {
        setStudentSubjectIds([]);
      }
    };
    fetchStudentSubjects();
  }, []);

  const toggleSubject = (id: string) => {
    const ids = validStudentSubjectIds;
    if (typeof id === "string" && id.length > 0 && ids.includes(id)) {
      setStudentSubjectIds(ids.filter((sid) => sid !== id));
    } else {
      if (ids.length < 5 && typeof id === "string" && id.length > 0) {
        setStudentSubjectIds([...ids, id]);
      }
    }
  };

  const removeSubject = (id: string) => {
    if (typeof id === "string" && id.length > 0) {
      setStudentSubjectIds(validStudentSubjectIds.filter((sid) => sid !== id));
    }
  };

  // Find subject details for selected chips
  // For .includes, filter studentSubjectIds to only valid strings
  const validStudentSubjectIds = (studentSubjectIds ?? []).filter(
    (id): id is string => typeof id === "string" && id.length > 0
  );
  const selectedSubjects: Subjects[] = [];
  subjects.forEach((subj) => {
    if (
      typeof subj.id === "string" &&
      subj.id.length > 0 &&
      validStudentSubjectIds.includes(String(subj.id))
    ) {
      selectedSubjects.push(subj);
    }
  });

  // Filter tutors by subject, but only if they have an available slot today for that subject
  const getSubjectTutors = (subjectId: string) => {
    return tutors.filter((tutor) => {
      if (!Array.isArray(tutor.availableSlots)) return false;
      return tutor.availableSlots.some(
        (slot) => slot.subject_id && slot.subject_id === subjectId
      );
    });
  };

  // "All tutors" should show every tutor who teaches
  // at least one of the student's selected subjects (no date restriction).
  const allTutorsForSelectedSubjects =
    validStudentSubjectIds.length > 0
      ? tutors.filter((tutor) => {
          if (!Array.isArray(tutor.subjects)) return false;
          const selectedIdSet = new Set(validStudentSubjectIds);
          return tutor.subjects.some(
            (s: Subjects) => s.id && selectedIdSet.has(s.id)
          );
        })
      : [];

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold mb-6 text-gray-900">Find a Tutor</h1>

      {/* Filter & Active Now */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Grade Filter - Modern Select Dropdown */}
        <div className="">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-gray-800 min-w-32">
              Filter by Grade:
            </span>
            <div className="relative inline-block">
              <select
                value={gradeFilter || ""}
                onChange={(e) => {
                  setGradeFilter((e.target.value as any) || "");
                }}
                className="appearance-none bg-white border border-gray-300 rounded-xl pl-4 pr-10 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm cursor-pointer w-48"
              >
                <option value="">All Grades</option>
                {GRADES.map((grade) => (
                  <option key={grade} value={grade}>
                    Grade {grade}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => setOnlyActiveNow((v) => !v)}
          className={`px-6 py-3 rounded-full border text-sm font-medium transition-all duration-200 ${
            onlyActiveNow
              ? "bg-gradient-to-r from-[#1089d3] to-[#12B1D1] text-white border-transparent"
              : "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"
          }`}
        >
          {onlyActiveNow ? "Showing Active Now" : "Show Only Active Now"}
        </button>
      </div>
      <div>
        <div className="space-y-3 mb-5">
          <div className="flex items-center justify-between">
            <h5 className="font-semibold text-gray-800">Filter by Subject:</h5>

            <div className="text-sm text-gray-500 flex items-center gap-2">
              {subjectsLoading
                ? "Loading..."
                : `${validStudentSubjectIds.length} available subjects`}
              {validStudentSubjectIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setStudentSubjectIds([])}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {subjectsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Category Tabs */}
              <div className="relative">
                <div className="flex flex-wrap gap-2 mb-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.name || "unknown"}
                      type="button"
                      onClick={() =>
                        setExpanded(expanded === cat.name ? null : cat.name)
                      }
                      className={`relative px-3 py-1 rounded-xl border font-medium transition-all duration-300 transform hover:scale-[1.02] ${
                        expanded === cat.name
                          ? "bg-gradient-to-r from-[#1089d3] to-[#12B1D1] text-white border-transparent shadow-lg shadow-blue-500/20"
                          : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50 shadow-sm"
                      }`}
                    >
                      {cat.name}
                      {expanded === cat.name && (
                        <div className="absolute left-1/2 -bottom-2 transform -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-blue-600"></div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Category Content with Dropdown Effect */}
                {expanded && (
                  <div className="relative">
                    {/* Dropdown Arrow */}
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[12px] border-b-white"></div>
                    </div>

                    {/* Content Container */}
                    <div className="relative bg-white rounded-2xl border border-gray-200 shadow-xl p-6 animate-fadeIn">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-indigo-50/20 rounded-2xl"></div>

                      {categories.map(
                        (cat) =>
                          expanded === cat.name && (
                            <div
                              key={cat.name + "-subjects"}
                              className="relative"
                            >
                              <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                                <h3 className="text-lg font-bold text-gray-900">
                                  {cat.name} Subjects
                                </h3>
                                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                  {
                                    cat.subjects.filter((s) =>
                                      gradeFilter === ""
                                        ? true
                                        : s.grade === parseInt(gradeFilter)
                                    ).length
                                  }{" "}
                                  subjects
                                </span>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {cat.subjects
                                  .filter((subject) =>
                                    gradeFilter === ""
                                      ? true
                                      : subject.grade ===
                                        parseInt(gradeFilter as any)
                                  )
                                  .map((subject) => {
                                    const isSelected =
                                      typeof subject.id === "string" &&
                                      subject.id.length > 0 &&
                                      validStudentSubjectIds.includes(
                                        subject.id
                                      );

                                    return (
                                      <button
                                        key={subject.id || "unknown"}
                                        type="button"
                                        onClick={() =>
                                          toggleSubject(subject.id)
                                        }
                                        className={`group relative p-2 rounded-xl border transition-all duration-300 hover:shadow-lg text-left ${
                                          isSelected
                                            ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-md"
                                            : "bg-white border-gray-200 hover:border-blue-200"
                                        }`}
                                      >
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span
                                                className={`font-semibold text-gray-900 group-hover:text-blue-600 ${
                                                  isSelected
                                                    ? "text-blue-700"
                                                    : ""
                                                }`}
                                              >
                                                {subject.name}
                                              </span>
                                              {isSelected && (
                                                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                                                  <svg
                                                    className="w-3 h-3 text-white"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                  >
                                                    <path
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      strokeWidth="3"
                                                      d="M5 13l4 4L19 7"
                                                    />
                                                  </svg>
                                                </div>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-3 text-sm">
                                              <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                                {subject.code}
                                              </span>
                                              <span
                                                className={`px-2 py-0.5 rounded font-medium ${
                                                  subject.grade <= 9
                                                    ? "bg-green-100 text-green-800"
                                                    : subject.grade <= 11
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : "bg-purple-100 text-purple-800"
                                                }`}
                                              >
                                                G{subject.grade}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Hover effect overlay */}
                                        <div
                                          className={`absolute inset-0 rounded-xl transition-opacity duration-300 ${
                                            isSelected
                                              ? "opacity-10 bg-gradient-to-r from-blue-500 to-indigo-500"
                                              : "opacity-0 group-hover:opacity-5 bg-blue-500"
                                          }`}
                                        ></div>
                                      </button>
                                    );
                                  })}
                              </div>

                              {cat.subjects.filter((s) =>
                                gradeFilter === ""
                                  ? true
                                  : s.grade === parseInt(gradeFilter)
                              ).length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                  <svg
                                    className="w-12 h-12 mx-auto text-gray-300 mb-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="1.5"
                                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  <p>
                                    No subjects found for the selected grade
                                    filter
                                  </p>
                                  <button
                                    onClick={() => setGradeFilter("")}
                                    className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
                                  >
                                    Clear grade filter to see all subjects
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      {subjectsError && (
        <div className="mb-6 text-sm text-red-600">{subjectsError}</div>
      )}

      {/* Collapsible Filter Section */}
      {selectedSubjects.length > 0 && (
        <div className="my-4 p-3 bg-white rounded-2xl shadow-lg border border-gray-200 backdrop-blur-sm bg-white/95">
          <div className="w-full max-w-4xl mx-auto">
            {/* Selected Subjects Tags */}
            {selectedSubjects.length > 0 && (
              <div className="">
                <div className="flex flex-wrap gap-2">
                  {selectedSubjects.map((subject) => (
                    <div
                      key={subject.id || "unknown"}
                      className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 px-4 py-2 rounded-xl shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="font-medium text-gray-800">
                          {subject.name}
                        </span>
                        <span className="text-xs text-gray-600 bg-white px-1.5 py-0.5 rounded">
                          {subject.code}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSubject(subject.id)}
                        className="ml-2 text-gray-400 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded-lg"
                        aria-label={`Remove ${subject.name}`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dynamic sections based on student's subjects */}
      {studentSubjectIds.length > 0 && subjects.length > 0 && (
        <>
          {studentSubjectIds
            .filter(
              (subjectId): subjectId is string =>
                typeof subjectId === "string" && subjectId.length > 0
            )
            .map((subjectId) => {
              const subject = subjects.find(
                (s) =>
                  typeof s.id === "string" &&
                  s.id === subjectId &&
                  s.id.length > 0
              );
              if (!subject) return null;
              const tutorsForSubject = getSubjectTutors(subjectId);
              return (
                <div key={`subject-row-${subjectId || "unknown"}`}>
                  <TutorSection
                    title={`Tutors who teach ${subject.name} [ ${subject.code} ]`}
                    description={`Tutors who teach ${subject.name} [ ${subject.code} ]`}
                    tutors={tutorsForSubject}
                    loading={loading}
                    onBook={openTutorProfileModal}
                  />
                  {!loading && tutorsForSubject.length === 0 && (
                    <div className="text-center text-gray-500 mb-8">
                      No tutors available for this subject yet.
                    </div>
                  )}
                </div>
              );
            })}
        </>
      )}

      {/* Show message if no student subjects */}
      {studentSubjectIds.length === 0 && !loading && (
        <div className="mb-8 p-6 bg-yellow-100 border border-yellow-300 rounded-lg">
          <h3 className="text-yellow-800 font-bold mb-2">
            No Subjects Selected
          </h3>
          <p className="text-yellow-700 text-sm">
            You haven't selected any subjects yet. Use the "Filter by:" button
            above to select subjects you're interested in, and we'll show you
            tutors who teach those subjects.
          </p>
        </div>
      )}

      {validStudentSubjectIds.length > 0 && (
        <>
          <TutorSection
            title="All Tutors"
            description="All tutors who teach at least one of your selected subjects"
            tutors={allTutorsForSelectedSubjects}
            loading={loading}
            onBook={openTutorProfileModal}
          />
          {!loading && allTutorsForSelectedSubjects.length === 0 && (
            <div className="mt-4 text-center text-gray-500">
              No tutors have availability today for your selected subjects.
            </div>
          )}
        </>
      )}
    </div>
  );
}
