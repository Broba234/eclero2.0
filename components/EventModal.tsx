import React, { useState, useEffect, useRef } from "react";
import moment from "moment";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { DateRange } from "react-date-range";
import { format } from "date-fns";
import { BookOpen, CalendarIcon, Clock, DollarSign, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export interface EventFormData {
  id: string;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  subject?: string; // subject name
  subject_id?: string;
  timezone?: string;
  duration_1?: number;
  duration_2?: number;
  duration_3?: number;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EventFormData) => void;
  defaultStart: Date;
  defaultEnd: Date;
  subjects?: any[];
}

interface Subject {
  id: string;
  name: string;
  code: string | null;
  grade: string | null;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultStart,
  defaultEnd,
  subjects,
}) => {
  const [formData, setFormData] = useState<EventFormData>({
    id: "",
    subject_id: "",
    startTime: moment(defaultStart).format("HH:mm"),
    endTime: moment(defaultEnd).format("HH:mm"),
    startDate: moment(defaultStart).format("YYYY-MM-DD"),
    endDate: moment(defaultEnd).format("YYYY-MM-DD"),
    duration_1: 0,
    duration_2: 0,
    duration_3: 0,
  });

  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [activeDurationSubjectId, setActiveDurationSubjectId] = useState<
    string | null
  >(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const durationDropdownRef = useRef<HTMLDivElement>(null);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        durationDropdownRef.current &&
        !durationDropdownRef.current.contains(event.target as Node)
      ) {
        const hasAnyDuration =
          !!formData.duration_1 || !!formData.duration_2 || !!formData.duration_3;
        if (hasAnyDuration) {
          setActiveDurationSubjectId(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [formData.duration_1, formData.duration_2, formData.duration_3]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      startTime: moment(defaultStart).format("HH:mm"),
      endTime: moment(defaultEnd).format("HH:mm"),
      date: moment(defaultStart).format("YYYY-MM-DD"),
    }));
  }, [defaultStart, defaultEnd]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const startDateTime = moment(
      `${formData.startDate} ${formData.startTime}`
    ).toDate();
    const endDateTime = moment(
      `${formData.endDate} ${formData.endTime}`
    ).toDate();

    if (endDateTime <= startDateTime) {
      alert("End time must be after start time");
      return;
    }

    if (!formData.subject) {
      alert("Please select a subject");
      return;
    }
    onSubmit({
      ...formData,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    });
    onClose();
  };
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleDurationChange = (
    durationKey: "duration_1" | "duration_2" | "duration_3"
  ) => {
    setFormData((prev) => ({
      ...prev,
      [durationKey]: prev[durationKey] ? 0 : 1,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-100 rounded-lg shadow-xl max-w-2xl w-full scrollbar-hide overflow-y-auto">
        <div className="flex relative m-2.5 text-white h-24 rounded-md bg-slate-800 justify-between items-center border-b px-6 py-4">
          <h3 className="text-xl font-semibold text-white">
            Create New Lecture
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-200 hover:text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Subject *
            </label>
            {loadingSubjects ? (
              <p className="text-sm text-gray-500">Loading subjects...</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {subjects.map((obj: any) => {
                  const isSelected = formData.subject_id === obj?.subject_id;
                  return (
                    <button
                      type="button"
                      key={obj?.subject_id}
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          subject_id: obj?.subject_id,
                          subject: obj.Subjects.name,
                        }));
                        setActiveDurationSubjectId(obj?.subject_id || null);
                      }}
                      className={`inline-flex items-center gap-1 border rounded-lg text-xs px-3 py-1.5 shadow-sm transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-blue-700 ring-2 ring-blue-200"
                          : "bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      <span className="font-semibold">
                        {obj?.Subjects.name}
                      </span>
                      {obj.Subjects.code && (
                        <span className="text-[10px] opacity-80">
                          {obj?.Subjects.code}
                        </span>
                      )}
                      {obj?.Subjects.grade && (
                        <span className="text-[10px] opacity-70">
                          · Grade {obj?.Subjects.grade}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {activeDurationSubjectId === formData.subject_id &&
              formData.subject_id && (
                <div className="relative mt-3" ref={durationDropdownRef}>
                  <div className="absolute z-10 mt-2 w-44 rounded-md border border-gray-200 bg-white p-3 shadow-lg">
                    <label className="flex items-center gap-2 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={!!formData.duration_1}
                        onChange={() => handleDurationChange("duration_1")}
                        className="h-3.5 w-3.5"
                      />
                      30 Min
                    </label>
                    <label className="mt-2 flex items-center gap-2 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={!!formData.duration_2}
                        onChange={() => handleDurationChange("duration_2")}
                        className="h-3.5 w-3.5"
                      />
                      1 Hour
                    </label>
                    <label className="mt-2 flex items-center gap-2 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={!!formData.duration_3}
                        onChange={() => handleDurationChange("duration_3")}
                        className="h-3.5 w-3.5"
                      />
                      1.5 Hour
                    </label>
                  </div>
                </div>
              )}
            {subjects.length === 0 && !loadingSubjects && (
              <p className="text-sm text-gray-500 mt-1">
                No subjects available. Please add subjects to your profile.
              </p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                End Date *
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Start Time *
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                End Time *
              </label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-10 mt-auto border-t">
            <button
              type="button"
              onClick={onClose}
              data-dialog-close="true"
              className="rounded-full border border-transparent px-5 py-2.5 text-center text-sm transition-all text-slate-600 hover:bg-slate-200 focus:bg-slate-100 active:bg-slate-100 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#cf3fad] text-white rounded-full hover:bg-[#cf3fad]/80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
