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
  // Can be an array of subject IDs or full subject objects
  selectedSubjectIds: Array<string | Subjects>;
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

  // Normalize selectedSubjectIds prop to always work with string IDs internally
  const selectedIds: string[] = (selectedSubjectIds ?? [])
    .map((item) => (typeof item === "string" ? item : item?.id))
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  const toggleSubject = (id: string) => {
    const ids = selectedIds;
    if (ids.includes(id)) {
      onSelectionChange(ids.filter((sid) => sid !== id));
    } else {
      if (!maxSelections || ids.length < maxSelections) {
        onSelectionChange([...ids, id]);
      }
    }
  };

  const removeSubject = (id: string) => {
    onSelectionChange(selectedIds.filter((sid) => sid !== id));
  };

  // For .includes, we already have a normalized list of valid IDs
  const validSelectedSubjectIds = selectedIds;

  // Find subject details for selected chips
  const selectedSubjects: Subjects[] = [];
  subjects.forEach((subj) => {
    if (typeof subj.id === "string" && subj.id.length > 0 && validSelectedSubjectIds.includes(subj.id)) {
      selectedSubjects.push(subj);
    }
  });

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur-sm p-6 md:p-8 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h4 className="text-xl font-semibold tracking-tight text-slate-900">
              What course you willing to learn?
            </h4>
            <p className="mt-1 text-sm text-slate-500">
              Select up to {maxSelections ?? "several"} subjects that you want to learn.
            </p>
          </div>
          {maxSelections && (
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-1.5 text-xs font-medium text-slate-600 border border-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {selectedSubjects.length} of {maxSelections} selected
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Selected chips */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-3 min-h-[52px]">
          {selectedSubjects.length === 0 ? (
            <div className="text-xs text-slate-400">
              No subjects selected yet. Start by choosing a category below.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedSubjects.map((subject) => (
                <span
                  key={subject.id || "unknown"}
                  className="group inline-flex items-center gap-1.5 rounded-full bg-slate-900 text-slate-50 px-3 py-1.5 text-xs font-medium shadow-sm"
                >
                  <span className="truncate max-w-[180px]">
                    {subject.name}{" "}
                    <span className="text-slate-300">
                      ({subject.code}) · G{subject.grade}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-700/80 text-[10px] text-slate-100 hover:bg-red-500 transition-colors disabled:opacity-50"
                    onClick={() => removeSubject(subject.id)}
                    disabled={disabled}
                    aria-label={`Remove ${subject.name}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Grade filter */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Filter subjects by grade level
          </div>
          <div className="inline-flex flex-wrap gap-1.5">
            <button
              type="button"
              className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                gradeFilter === null
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
              onClick={() => setGradeFilter(null)}
              disabled={disabled}
            >
              All grades
            </button>
            {GRADES.map((grade) => (
              <button
                key={grade}
                type="button"
                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                  gradeFilter === grade
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-blue-50"
                }`}
                onClick={() => setGradeFilter(grade)}
                disabled={disabled}
              >
                Grade {grade}
              </button>
            ))}
          </div>
        </div>

        {/* Categories & subjects */}
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            Loading subjects...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.name || "unknown"}
                  type="button"
                  onClick={() =>
                    setExpanded(expanded === cat.name ? null : cat.name)
                  }
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${
                    expanded === cat.name
                      ? "bg-slate-900 text-slate-50 border-slate-900 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                  disabled={disabled}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  {cat.name}
                </button>
              ))}
            </div>

            {categories.map(
              (cat) =>
                expanded === cat.name && (
                  <div
                    key={(cat.name ? cat.name : "unknown") + "-subjects"}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {cat.name} subjects
                        </div>
                        <p className="text-xs text-slate-500">
                          Click to add or remove subjects from this category.
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-slate-500 border border-slate-200">
                        {cat.subjects.length} available
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto pr-1">
                      {cat.subjects
                        .filter((subject) =>
                          gradeFilter === null
                            ? true
                            : subject.grade === gradeFilter
                        )
                        .map((subject) => {
                          const isSelected = validSelectedSubjectIds.includes(
                            subject.id
                          );
                          return (
                            <button
                              key={subject.id || "unknown"}
                              type="button"
                              onClick={() => toggleSubject(subject.id)}
                              className={`group px-3 py-1.5 rounded-full border text-xs transition-all flex items-center gap-1.5 ${
                                isSelected
                                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                  : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
                              }`}
                              disabled={disabled}
                            >
                              <span className="truncate max-w-[160px]">
                                {subject.name}{" "}
                                <span
                                  className={
                                    isSelected
                                      ? "text-blue-100"
                                      : "text-slate-400"
                                  }
                                >
                                  ({subject.code}) · G{subject.grade}
                                </span>
                              </span>
                              {isSelected && (
                                <svg
                                  className="w-3.5 h-3.5 text-white"
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
                          );
                        })}
                    </div>
                  </div>
                )
            )}
          </div>
        )}
      </div>
    </div>
  );
} 