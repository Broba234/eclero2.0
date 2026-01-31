import { bookSession } from "@/lib/bookingUtils";
import React, { useMemo, useState } from "react";

interface TutorProfile {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  email?: string;
  phone?: string;
  hourlyRate?: number;
  education?: { degree: string; institution: string; year: number }[];
  experience?: { title: string; description: string; years: number }[];
  rating?: number;
  subjects?: { name: string; code: string }[];
  isAvailableNow?: boolean;
  availableSlots?: {
    subject_id?: string;
    start_time?: string | Date | null;
    end_time?: string | Date | null;
    start_date?: string | Date | null;
    end_date?: string | Date | null;
  }[];
}

interface TutorProfileBubbleProps {
  tutor: TutorProfile;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onBookSession?: (tutor: TutorProfile) => void;
}

const TutorProfileBubble: React.FC<TutorProfileBubbleProps> = ({
  tutor,
  userId,
  isOpen,
  onClose,
  onBookSession,
}) => {
  if (!isOpen) return null;

  const [selectedDuration, setSelectedDuration] = useState<"0.5" | "1" | "1.5"| any>("0.5");
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [bookingTopic, setBookingTopic] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const timeZoneLabel =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const durationOptions = [
    { value: "0.5" as const, label: "30 Minutes" },
    { value: "1" as const, label: "1 Hour" },
    { value: "1.5" as const, label: "1.5 Hours" },
  ];

  const formatTimeLabel = (minutes: number) => {
    const hour24 = Math.floor(minutes / 60) % 24;
    const minute = minutes % 60;
    const hour12 = hour24 % 12 || 12;
    const suffix = hour24 >= 12 ? "PM" : "AM";
    return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
  };

  const timeSlots = useMemo(() => {
    const durationMinutes = Number(selectedDuration) * 60;
    const slots = new Set<number>();
    const availableSlots = Array.isArray(tutor.availableSlots)
      ? tutor.availableSlots
      : [];
console.log(availableSlots);
const toMinutes = (value?: string | Date | null) => {
  if (!value) return null;
  
  if (typeof value === 'string') {
    // Extract time portion from ISO string
    const timeMatch = value.match(/T(\d{2}):(\d{2})/);
    if (timeMatch) {
      return parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]);
    }
  }
  
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getUTCHours() * 60 + date.getUTCMinutes();
};

    for (const slot of availableSlots) {
      console.log("slotsssssssss", slot);  
      const start = toMinutes(slot.start_time);
      const end = toMinutes(slot.end_time);
      if (start === null || end === null || end <= start) continue;
      for (let t = start; t + durationMinutes <= end; t += durationMinutes) {
        slots.add(t);
      }
    }

    return Array.from(slots).sort((a, b) => a - b);
  }, [selectedDuration, tutor.availableSlots]);
console.log("timeSlots", timeSlots);
  const handleBookSession = async () => {
    if (!tutor || !userId || !selectedTime) {
      alert("Please select a time slot");
      return;
    }
    
    try {
      // Convert minutes to ISO string
      const minutesToTimeString = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
      };
      
      const bookingTime = minutesToTimeString(selectedTime);
      
      const result = await bookSession({
        tutorId: tutor.id,
        studentId: userId,
        start_time: bookingTime,  // Add this field
        duration: selectedDuration * 1,      // Add this field
        topic: bookingTopic.trim() || undefined,
        notes: bookingNotes.trim() || undefined,
        date: new Date().toISOString(),
        amount: selectedDuration,
      });
  
      if (result.success) {
        alert(`Session successfully booked with ${tutor.name}! They will receive your request.`);
        // Reset form
        setSelectedTime(null);
        setBookingTopic("");
        setBookingNotes("");
      } else {
        alert(`Failed to book session: ${result.error}`);
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('An error occurred while booking the session.');
    }
  };
console.log("tutor", tutor);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="relative w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl border border-gray-100 p-8 flex flex-col md:flex-row gap-8">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-gray-500 hover:text-gray-700 text-2xl font-light hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
      >
        &times;
      </button>
      
      {/* Profile Section */}
      <div className="flex flex-col items-center md:items-start md:w-1/3">
        <div className="relative mb-6">
          <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-white"
            >
              <circle cx="32" cy="32" r="28" fill="white" fillOpacity="0.2" />
              <circle cx="32" cy="24" r="8" fill="white" />
              <path
                d="M24 40C24 36 32 32 32 32C32 32 40 36 40 40V44H24V40Z"
                fill="white"
              />
            </svg>
          </div>
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
            <div className="bg-white px-4 py-1.5 rounded-full shadow-md border border-gray-100">
              <span className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Pro Tutor
              </span>
            </div>
          </div>
        </div>
        
        <div className="text-center md:text-left w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{tutor.name}</h2>
          <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
            {tutor.rating && (
              <>
                <div className="flex items-center">
                  <span className="text-amber-500">★</span>
                  <span className="ml-1 text-gray-900 font-semibold">
                    {tutor.rating}
                  </span>
                  <span className="ml-1 text-gray-500 text-sm">/ 5.0</span>
                </div>
                <span className="text-gray-300">•</span>
              </>
            )}
            <span className="text-gray-600 text-sm font-medium">500+ sessions</span>
          </div>
          
          {tutor.subjects && tutor.subjects.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Expertise</h3>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {tutor.subjects.map((subj) => (
                  <span
                    key={subj.code}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 text-gray-800 px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-100 shadow-sm"
                  >
                    {subj.name} ({subj.code})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Booking Section */}
      <div className="flex-1">
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Schedule a Session
          </h3>
          <p className="text-gray-600">
            Book a personalized learning session with {tutor.name}
          </p>
        </div>
        
        <div className="space-y-8">
          {/* Duration Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Select Duration
            </label>
            <div className="flex flex-wrap gap-3">
              {durationOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setSelectedDuration(option.value);
                    setSelectedTime(null);
                  }}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all duration-200 ${
                    selectedDuration === option.value
                      ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white border-indigo-500 shadow-lg shadow-indigo-100"
                      : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:shadow-md"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Time Selection */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-semibold text-gray-900">
                  Available Time Slots
                </label>
                <div className="px-3 py-1 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-emerald-100">
                  <span className="text-sm font-semibold text-emerald-700">
                    {todayLabel}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto p-1">
                {timeSlots.length > 0 ? (
                  timeSlots.map((slotMinutes) => (
                    <button
                      key={slotMinutes}
                      type="button"
                      onClick={() => setSelectedTime(slotMinutes)}
                      className={`px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all duration-200 ${
                        selectedTime === slotMinutes
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-100"
                          : "bg-white text-gray-700 border-gray-200 hover:border-green-300 hover:shadow-md"
                      }`}
                    >
                      {formatTimeLabel(slotMinutes)}
                    </button>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8">
                    <div className="text-gray-400 mb-2">No slots available</div>
                    <div className="text-sm text-gray-500">
                      Try selecting a different duration
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Session Details */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Session Details
                </label>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">
                      Topic (optional)
                    </div>
                    <input
                      type="text"
                      value={bookingTopic}
                      onChange={(e) => setBookingTopic(e.target.value)}
                      placeholder="What would you like to study?"
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                  
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">
                      Notes (optional)
                    </div>
                    <textarea
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      placeholder="Any specific requirements or questions?"
                      rows={4}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
                    />
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-3 py-2 rounded-xl text-sm font-semibold text-gray-700 bg-gray-50 border-2 border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleBookSession}
                    disabled={selectedTime === null}
                    className="flex-1 px-3 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Confirm
                  </button>
                </div>
                
                {selectedTime && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-gray-700">
                        <span className="font-semibold">Selected:</span> {formatTimeLabel(selectedTime)}
                      </div>
                      <div className="font-bold text-blue-700">
                        {selectedDuration} min
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default TutorProfileBubble;
