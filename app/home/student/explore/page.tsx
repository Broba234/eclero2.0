"use client";
import { useEffect, useState, useContext } from "react";
import { supabase } from "@/lib/supabaseClient";
import { TutorProfileModalContext } from "@/components/ui/components/common/TutorProfileModalContext";
import TutorProfileBubble from "@/components/ui/components/UserProfile/TutorProfileBubble";

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

type Tutor = {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  rating?: number;
  isAvailableNow?: boolean;
  education?: any;
  subjects: Subjects[]; // Add this line
};

// Ghost tile component for empty sections
const GhostTile = () => (
  <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-6 flex flex-col items-center border border-white/20" style={{ boxShadow: '0 8px 32px 0 rgba(31,38,135,0.37)' }}>
    <div className="w-20 h-20 rounded-full mb-4 bg-white/20 animate-pulse"></div>
    <div className="h-4 bg-white/20 rounded mb-2 w-24 animate-pulse"></div>
    <div className="h-3 bg-white/20 rounded w-32 animate-pulse"></div>
  </div>
);

// Section component
const TutorSection = ({ title, tutors, loading, onBook }: { title: string; tutors: Tutor[]; loading: boolean; onBook: (tutor: Tutor) => void }) => {
  const ghostTiles = Array.from({ length: 3 }, (_, i) => <GhostTile key={`ghost-${i}`} />);
  
  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-6 text-white">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {loading ? (
          ghostTiles
        ) : (
          <>
            {tutors.map(tutor => (
              <div
                key={tutor.id || 'unknown'}
                className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-6 flex flex-col items-center border border-white/20 hover:shadow-2xl transition-all duration-200 hover:scale-105" style={{ boxShadow: '0 8px 32px 0 rgba(31,38,135,0.37)' }}
              >
                <img
                  src={tutor.avatar || "/default-avatar.png"}
                  alt={tutor.name}
                  className="w-20 h-20 rounded-full mb-4 object-cover border-2 border-white/30"
                />
                <h3 className="text-lg font-bold mb-1 text-white">{tutor.name}</h3>
                <p className="text-gray-300 text-sm text-center">{tutor.bio || "Available for sessions"}</p>
                {tutor.rating && (
                  <div className="flex items-center mt-2">
                    <span className="text-yellow-400">★</span>
                    <span className="text-sm text-gray-300 ml-1">{tutor.rating}</span>
                  </div>
                )}
                {(tutor as any).derivedActiveNow === true && (
                  <div className="flex items-center mt-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2 inline-block"></span>
                    <span className="text-sm text-green-400">Available Now</span>
                  </div>
                )}
                <button
                  className="mt-3 px-6 py-2 rounded-full font-medium transition-all duration-200 bg-gradient-to-r from-blue-400 to-purple-500 text-white hover:from-blue-500 hover:to-purple-600 hover:scale-105"
                  onClick={() => onBook(tutor)}
                >
                  Book
                </button>
              </div>
            ))}
            {/* Fill remaining slots with ghost tiles */}
            {Array.from({ length: Math.max(0, 3 - tutors.length) }, (_, i) => (
              <GhostTile key={`ghost-${i}`} />
            ))}
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
  const [gradeFilter, setGradeFilter] = useState<number | null>(null);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [onlyActiveNow, setOnlyActiveNow] = useState(false);

  const { openTutorProfileModal } = useContext(TutorProfileModalContext)!;

  useEffect(() => {
    // Fetch available tutors from your API
    const fetchTutors = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/profiles/available-tutors${onlyActiveNow ? '?availableNow=true' : ''}`);
        
        if (!res.ok) {
          console.error('Failed to fetch tutors:', res.status, res.statusText);
          setTutors([]);
          setLoading(false);
          return;
        }

        const text = await res.text();
        if (!text) {
          console.error('Empty response from tutors API');
          setTutors([]);
          setLoading(false);
          return;
        }

        const data = JSON.parse(text);
        setTutors(data.tutors || []);
      } catch (error) {
        console.error('Error fetching tutors:', error);
        setTutors([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTutors();
  }, [onlyActiveNow]);

  useEffect(() => {
    setSubjectsLoading(true);
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
        const { data: { user }, error } = await supabase.auth.getUser();
        if (!user || error || !user.email) return;
        
        const email = user.email;
        const res = await fetch(`/api/profiles/get-full?email=${encodeURIComponent(email)}`);
        if (res.ok) {
          const profile = await res.json();
          
          // Normalize subjects: handle [{subject: {...}}] or [{id: ...}]
          let normalizedSubjects: any[] = [];
          if (profile.subjects && Array.isArray(profile.subjects)) {
            normalizedSubjects = profile.subjects.map((s: any) => {
              if (s && typeof s.id === 'string') return s;
              if (s && s.subject && typeof s.subject.id === 'string') return s.subject;
              return undefined;
            }).filter((s: any): s is { id: string } => !!s && typeof s.id === 'string' && s.id.length > 0);
          }
          
          setStudentSubjectIds(normalizedSubjects.map(s => s.id));
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
    if (typeof id === 'string' && id.length > 0 && ids.includes(id)) {
      setStudentSubjectIds(ids.filter((sid) => sid !== id));
    } else {
      if (ids.length < 5 && typeof id === 'string' && id.length > 0) {
        setStudentSubjectIds([...ids, id]);
      }
    }
  };

  const removeSubject = (id: string) => {
    if (typeof id === 'string' && id.length > 0) {
      setStudentSubjectIds(validStudentSubjectIds.filter((sid) => sid !== id));
    }
  };

  // Find subject details for selected chips
  // For .includes, filter studentSubjectIds to only valid strings
  const validStudentSubjectIds = (studentSubjectIds ?? []).filter((id): id is string => typeof id === 'string' && id.length > 0);
  const selectedSubjects: Subjects[] = [];
  subjects.forEach((subj) => {
    if (typeof subj.id === 'string' && subj.id.length > 0 && validStudentSubjectIds.includes(String(subj.id))) {
      selectedSubjects.push(subj);
    }
  });

  // Filter by selected subjects (if any subjects are selected)
  const filteredTutors = studentSubjectIds.length > 0 
    ? tutors.filter(t => {
        // This is a placeholder - you'll need to implement actual subject filtering
        // based on how tutors' subjects are stored in your data
        return true; // For now, show all tutors
      })
    : tutors;

  // Organize tutors into sections
  const readyNowTutors = filteredTutors.filter(t => t.isAvailableNow === true);
  const highlyRatedTutors = filteredTutors.filter(t => (t.rating || 0) >= 4.5);
  const atYourSchoolTutors = filteredTutors.filter(t => t.education); // You'll need to add user's school logic



  // Filter tutors by subject
  const getSubjectTutors = (subjectId: string) => {
    return tutors.filter(tutor => {
      if (!tutor.subjects || !Array.isArray(tutor.subjects)) return false;
      return tutor.subjects.some((s: Subjects) => s.id === subjectId);
    });
  };



  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold mb-6 text-white">Find a Tutor</h1>
      
      {/* Filter & Active Now */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/30 rounded-full shadow-2xl hover:bg-white/20 transition-all duration-200 text-white" style={{ boxShadow: '0 8px 32px 0 rgba(31,38,135,0.37)' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span>Filter by:</span>
          {studentSubjectIds.length > 0 && (
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium">
              {studentSubjectIds.length} selected
            </span>
          )}
        </button>
        <button
          onClick={() => setOnlyActiveNow(v => !v)}
          className={`px-6 py-3 rounded-full border text-sm font-medium transition-all duration-200 ${onlyActiveNow ? 'bg-gradient-to-r from-blue-400 to-purple-500 text-white border-transparent' : 'bg-white/10 text-white border-white/30 hover:bg-white/20'}`}
        >
          {onlyActiveNow ? 'Showing Active Now' : 'Show Only Active Now'}
        </button>
      </div>

      {/* Collapsible Filter Section */}
      {showFilter && (
        <div className="mb-8 p-6 bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20" style={{ boxShadow: '0 8px 32px 0 rgba(31,38,135,0.37)' }}>
          <div className="w-full max-w-2xl mx-auto">
            <h4 className="text-lg font-bold mb-4 text-white">Filter by subjects:</h4>
            {subjectsError && <div className="text-red-400 mb-2">{subjectsError}</div>}
            <div className="mb-4 flex flex-wrap gap-2">
              {selectedSubjects.map((subject) => (
                <span
                  key={subject.id || 'unknown'}
                  className="flex items-center bg-gradient-to-r from-blue-400/20 to-purple-500/20 text-white px-3 py-1 rounded-full text-sm font-medium mr-2 mb-2 border border-white/30"
                >
                  {subject.name} ({subject.code})
                  <button
                    type="button"
                    className="ml-2 text-white hover:text-red-400 focus:outline-none transition-colors"
                    onClick={() => removeSubject(subject.id)}
                    aria-label={`Remove ${subject.name}`}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4 mb-4">
              <span className="font-medium text-white">Filter by grade:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`px-3 py-1 rounded-full border text-sm transition-all duration-200 ${
                    gradeFilter === null
                      ? "bg-gradient-to-r from-blue-400 to-purple-500 text-white border-transparent"
                      : "bg-white/10 text-white border-white/30 hover:bg-white/20"
                  }`}
                  onClick={() => setGradeFilter(null)}
                >
                  All
                </button>
                {GRADES.map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    className={`px-3 py-1 rounded-full border text-sm transition-all duration-200 ${
                      gradeFilter === grade
                        ? "bg-gradient-to-r from-blue-400 to-purple-500 text-white border-transparent"
                        : "bg-white/10 text-white border-white/30 hover:bg-white/20"
                    }`}
                    onClick={() => setGradeFilter(grade)}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            </div>
            {subjectsLoading ? (
              <div className="text-gray-300">Loading subjects...</div>
            ) : (
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map((cat) => (
                    <button
                      key={cat.name || 'unknown'}
                      type="button"
                      onClick={() => setExpanded(expanded === cat.name ? null : cat.name)}
                      className={`px-4 py-2 rounded-full border font-medium transition-all duration-200 ${
                        expanded === cat.name
                          ? "bg-gradient-to-r from-blue-400 to-purple-500 text-white border-transparent"
                          : "bg-white/10 text-white border-white/30 hover:bg-white/20"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
                {categories.map(
                  (cat) =>
                    expanded === cat.name && (
                      <div key={cat.name + "-subjects"} className="mb-6 ml-2">
                        <div className="mb-2 font-bold text-white">
                          {cat.name} Subjects:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {cat.subjects
                            .filter((subject) =>
                              gradeFilter === null ? true : subject.grade === gradeFilter
                            )
                            .map((subject) => (
                              <button
                                key={subject.id || 'unknown'}
                                type="button"
                                onClick={() => toggleSubject(subject.id)}
                                className={`px-3 py-1 rounded-full border text-sm transition-all duration-200 flex items-center gap-1 ${
                                  typeof subject.id === 'string' && subject.id.length > 0 && validStudentSubjectIds.includes(subject.id)
                                    ? "bg-gradient-to-r from-blue-400 to-purple-500 text-white border-transparent"
                                    : "bg-white/10 text-white border-white/30 hover:bg-white/20"
                                }`}
                              >
                                {subject.name} ({subject.code})
                                <span className="ml-1 text-xs text-gray-300">G{subject.grade}</span>
                                {typeof subject.id === 'string' && subject.id.length > 0 && validStudentSubjectIds.includes(subject.id) && (
                                  <svg
                                    className="w-4 h-4 ml-1 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                              </button>
                            ))}
                        </div>
                      </div>
                    )
                )}
              </div>
            )}
          </div>
        </div>
      )}
      


      {/* Dynamic sections based on student's subjects */}
      {studentSubjectIds.length > 0 && subjects.length > 0 && (
        <>
          {studentSubjectIds
            .filter((subjectId): subjectId is string => typeof subjectId === 'string' && subjectId.length > 0)
            .map(subjectId => {
              const subject = subjects.find(s => typeof s.id === 'string' && s.id === subjectId && s.id.length > 0);
              if (!subject) return null;
              const tutorsForSubject = getSubjectTutors(subjectId);
              return (
                <div key={`subject-row-${subjectId || 'unknown'}`}>
                  <TutorSection
                    title={`Tutors who teach ${subject.name} [ ${subject.code} ]`}
                    tutors={tutorsForSubject}
                    loading={loading}
                    onBook={openTutorProfileModal}
                  />
                  {(!loading && tutorsForSubject.length === 0) && (
                    <div className="text-center text-gray-400 mb-8">No tutors available for this subject yet.</div>
                  )}
                </div>
              );
            })}
        </>
      )}

      {/* Show message if no student subjects */}
      {studentSubjectIds.length === 0 && !loading && (
        <div className="mb-8 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <h3 className="text-yellow-400 font-bold mb-2">No Subjects Selected</h3>
          <p className="text-yellow-300 text-sm">
            You haven't selected any subjects yet. Use the "Filter by:" button above to select subjects you're interested in,
            and we'll show you tutors who teach those subjects.
          </p>
        </div>
      )}
      
      <TutorSection 
        title="At Your Institution" 
        tutors={atYourSchoolTutors} 
        loading={loading} 
        onBook={openTutorProfileModal}
      />


    </div>
  );
}
