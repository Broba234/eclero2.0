"use client";

import { useEffect, useState } from "react";

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

interface SubjectSelectorProps {
  selectedSubjectIds: string[];
  onSelectionChange: (ids: string[]) => void;
  maxSelections?: number;
  disabled?: boolean;
}

const GRADES = [9, 10, 11, 12];

export default function SubjectSelector({
  selectedSubjectIds,
  onSelectionChange,
  maxSelections,
  disabled,
}: SubjectSelectorProps) {
  const [subjects, setSubjects] = useState<Subjects[]>([]);
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [gradeFilter, setGradeFilter] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
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
          setError(null);
        } else {
          setSubjects([]);
          setCategories([]);
          setError("Invalid data format from server");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Subjects fetch error:", err);
        setError("Failed to load subjects");
        setSubjects([]);
        setCategories([]);
        setLoading(false);
      });
  }, []);

  const toggleSubject = (id: string) => {
    const ids = selectedSubjectIds ?? [];
    if (ids.includes(id)) {
      onSelectionChange(ids.filter((sid) => sid !== id));
    } else {
      if (!maxSelections || ids.length < maxSelections) {
        onSelectionChange([...ids, id]);
      }
    }
  };

  const removeSubject = (id: string) => {
    onSelectionChange(selectedSubjectIds.filter((sid) => sid !== id));
  };

  // For .includes, filter selectedSubjectIds to only valid strings
  const validSelectedSubjectIds = (selectedSubjectIds ?? []).filter((id): id is string => typeof id === 'string' && id.length > 0);

  // Find subject details for selected chips
  const selectedSubjects: Subjects[] = [];
  subjects.forEach((subj) => {
    if (typeof subj.id === 'string' && subj.id.length > 0 && validSelectedSubjectIds.includes(subj.id)) {
      selectedSubjects.push(subj);
    }
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h4 className="text-lg font-semibold mb-2">What courses are you proficient in?</h4>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="mb-4 flex flex-wrap gap-2">
        {selectedSubjects.map((subject) => (
          <span
            key={subject.id || 'unknown'}
            className="flex items-center bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium mr-2 mb-2"
          >
            {subject.name} ({subject.code})
            <button
              type="button"
              className="ml-2 text-indigo-500 hover:text-red-500 focus:outline-none"
              onClick={() => removeSubject(subject.id)}
              disabled={disabled}
              aria-label={`Remove ${subject.name}`}
            >
              &times;
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-4 mb-4">
        <span className="font-medium">Filter by grade:</span>
        <div className="flex gap-2">
          <button
            type="button"
            className={`px-3 py-1 rounded-full border text-sm transition ${
              gradeFilter === null
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-800 border-gray-300 hover:bg-blue-50"
            }`}
            onClick={() => setGradeFilter(null)}
            disabled={disabled}
          >
            All
          </button>
          {GRADES.map((grade) => (
            <button
              key={grade}
              type="button"
              className={`px-3 py-1 rounded-full border text-sm transition ${
                gradeFilter === grade
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-800 border-gray-300 hover:bg-blue-50"
              }`}
              onClick={() => setGradeFilter(grade)}
              disabled={disabled}
            >
              {grade}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="text-gray-500">Loading subjects...</div>
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
                disabled={disabled}
              >
                {cat.name}
              </button>
            ))}
          </div>
          {categories.map(
            (cat) =>
              expanded === cat.name && (
                <div key={(cat.name ? cat.name : 'unknown') + "-subjects"} className="mb-6 ml-2">
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
                            validSelectedSubjectIds.includes(subject.id)
                              ? "bg-gradient-to-r from-blue-400 to-purple-500 text-white border-transparent"
                              : "bg-white/10 text-white border-white/30 hover:bg-white/20"
                          }`}
                          disabled={disabled}
                        >
                          {subject.name} ({subject.code})
                          <span className="ml-1 text-xs text-gray-300">G{subject.grade}</span>
                          {validSelectedSubjectIds.includes(subject.id) && (
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
  );
} 