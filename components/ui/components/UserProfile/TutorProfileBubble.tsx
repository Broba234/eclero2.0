"use client";

import { supabase } from "@/lib/supabaseClient";
import React, { useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

interface TutorProfile {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  email?: string;
  phone?: string;
  education?: { degree: string; institution: string; year: number }[];
  experience?: { title: string; description: string; years: number }[];
  rating?: number;
  subjects?: {
    id?: string;
    name: string;
    code: string;
    duration_1?: number | string | null;
    duration_2?: number | string | null;
    duration_3?: number | string | null;
    price_1?: number | string | null;
    price_2?: number | string | null;
    price_3?: number | string | null;
  }[];
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

function PaymentForm({
  sessionId,
  amount,
  tutorName,
  onSuccess,
  onBack,
}: {
  sessionId: string;
  amount: number;
  tutorName: string;
  onSuccess: () => void;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const returnUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}`
        : "";

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
        receipt_email: undefined,
        payment_method_data: {
          billing_details: {
            address: { country: "US" },
          },
        },
      },
    });

    if (submitError) {
      setError(submitError.message || "Payment failed");
      setLoading(false);
      return;
    }

    // Payment may redirect for 3DS; if we get here, it succeeded without redirect
    const res = await fetch("/api/sessions/confirm-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    if (res.ok) {
      onSuccess();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to confirm session");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 mb-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-700 font-semibold">Amount to pay</span>
          <span className="font-bold text-indigo-700">${amount.toFixed(2)}</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          90% goes to {tutorName}, 10% platform fee
        </p>
      </div>

      <div className="min-h-[200px]">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 bg-gray-50 border-2 border-gray-200 hover:bg-gray-100 disabled:opacity-50 transition-all"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Processing…" : "Pay now"}
        </button>
      </div>
    </form>
  );
}

const TutorProfileBubble: React.FC<TutorProfileBubbleProps> = ({
  tutor,
  userId,
  isOpen,
  onClose,
  onBookSession,
}) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<1 | 2>(1);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<"0.5" | "1" | "1.5"| any>("0.5");
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [bookingTopic, setBookingTopic] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [studentSubjects, setStudentSubjects] = useState<
    { id: string; name: string; code: string }[]
  >([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    null
  );
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

  const selectedTutorSubject = useMemo(() => {
    if (!Array.isArray(tutor.subjects) || tutor.subjects.length === 0) {
      return undefined;
    }
    if (selectedSubjectId) {
      const match = tutor.subjects.find(
        (s) => s.id && s.id === selectedSubjectId
      );
      if (match) return match;
    }
    return tutor.subjects[0];
  }, [tutor.subjects, selectedSubjectId]);

  const studentSubjectsForTutor = useMemo(() => {
    if (!Array.isArray(studentSubjects) || studentSubjects.length === 0) {
      return [];
    }
    if (!Array.isArray(tutor.subjects) || tutor.subjects.length === 0) {
      return studentSubjects;
    }
    const tutorIds = new Set(
      tutor.subjects
        .map((s) => s.id)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    );
    const filtered = studentSubjects.filter((s) => tutorIds.has(s.id));
    return filtered.length > 0 ? filtered : studentSubjects;
  }, [studentSubjects, tutor.subjects]);

  useEffect(() => {
    const fetchStudentSubjects = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (!user || error || !user.email) return;

        const res = await fetch(
          `/api/profiles/get-full?email=${encodeURIComponent(user.email)}`
        );
        if (!res.ok) return;
        const profile = await res.json();

        const rawSubjects = Array.isArray(profile?.subjects)
          ? profile.subjects
          : [];
        const normalized = rawSubjects
          .map((s: any) => {
            if (s && typeof s.id === "string") return s;
            if (s?.Subjects && typeof s.Subjects.id === "string")
              return s.Subjects;
            if (s?.subject && typeof s.subject.id === "string")
              return s.subject;
            return undefined;
          })
          .filter(
            (s: any): s is { id: string; name: string; code: string } =>
              !!s &&
              typeof s.id === "string" &&
              s.id.length > 0 &&
              typeof s.name === "string" &&
              typeof s.code === "string"
          );

        setStudentSubjects(normalized);
        if (!selectedSubjectId && normalized.length > 0) {
          setSelectedSubjectId(normalized[0].id);
        }
      } catch {
        setStudentSubjects([]);
      }
    };

    fetchStudentSubjects();
  }, [selectedSubjectId]);

  const getSessionPrice = (durationValue: string) => {
    if (!selectedTutorSubject) return null;
    const getNumber = (v: any) => {
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? n : null;
    };

    if (durationValue === "0.5") return getNumber(selectedTutorSubject.price_1);
    if (durationValue === "1") return getNumber(selectedTutorSubject.price_2);
    if (durationValue === "1.5") return getNumber(selectedTutorSubject.price_3);
    return null;
  };

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
      const start = toMinutes(slot.start_time);
      const end = toMinutes(slot.end_time);
      if (start === null || end === null || end <= start) continue;
      for (let t = start; t + durationMinutes <= end; t += durationMinutes) {
        slots.add(t);
      }
    }

    return Array.from(slots).sort((a, b) => a - b);
  }, [selectedDuration, tutor.availableSlots]);

  const minutesToTimeString = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:00`;
  };

  const handleConfirm = async () => {
    if (!tutor || !userId || !selectedTime) {
      alert("Please select a time slot");
      return;
    }

    const amount =
      getSessionPrice(String(selectedDuration)) ?? Number(selectedDuration);
    if (typeof amount !== "number" || amount <= 0) {
      alert("Invalid session price");
      return;
    }

    setPaymentLoading(true);
    try {
      const bookingTime = minutesToTimeString(selectedTime);
      const subjectIdForBooking =
        selectedSubjectId && selectedSubjectId.length > 0
          ? selectedSubjectId
          : selectedTutorSubject && typeof selectedTutorSubject.id === "string"
            ? selectedTutorSubject.id
            : undefined;

      const res = await fetch("/api/stripe/create-session-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutorId: tutor.id,
          studentId: userId,
          amount,
          start_time: bookingTime,
          duration: Number(selectedDuration),
          topic: bookingTopic.trim() || undefined,
          notes: bookingNotes.trim() || undefined,
          date: new Date().toISOString(),
          subjectId: subjectIdForBooking,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to create payment");
        setPaymentLoading(false);
        return;
      }

      setClientSecret(data.clientSecret);
      setSessionId(data.sessionId);
      setStep(2);
    } catch (err) {
      console.error("Payment intent error:", err);
      alert("An error occurred. Please try again.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    alert(`Session successfully booked with ${tutor.name}! Payment complete.`);
    setStep(1);
    setClientSecret(null);
    setSessionId(null);
    setSelectedTime(null);
    setBookingTopic("");
    setBookingNotes("");
    onBookSession?.(tutor);
    onClose();
  };

  const handleBackToBooking = () => {
    setStep(1);
    setClientSecret(null);
    setSessionId(null);
  };
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
          <div className="w-36 h-36 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-1 shadow-lg">
            <img
              src={tutor.avatar || "/default-avatar.png"}
              alt={tutor.name || "Tutor avatar"}
              className="w-full h-full rounded-full object-cover bg-gray-100"
            />
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
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
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
            {step === 1 ? "Schedule a Session" : "Complete Payment"}
          </h3>
          <p className="text-gray-600">
            {step === 1
              ? `Book a personalized learning session with ${tutor.name}`
              : `Pay securely with Stripe. 90% goes to ${tutor.name}, 10% platform fee.`}
          </p>
        </div>

        {step === 2 && clientSecret && stripePromise && sessionId ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: { borderRadius: "12px" },
              },
            }}
          >
            <PaymentForm
              sessionId={sessionId}
              amount={
                getSessionPrice(String(selectedDuration)) ??
                Number(selectedDuration)
              }
              tutorName={tutor.name || "Tutor"}
              onSuccess={handlePaymentSuccess}
              onBack={handleBackToBooking}
            />
          </Elements>
        ) : (
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
                  {getSessionPrice(String(option.value)) !== null && (
                    <div
                      className={`mt-1 text-xs ${
                        selectedDuration === option.value
                          ? "text-indigo-50"
                          : "text-gray-500"
                      }`}
                    >
                      ${getSessionPrice(String(option.value))!.toFixed(2)} / session
                    </div>
                  )}
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
                  {studentSubjectsForTutor.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-gray-600 mb-2">
                        Subject
                      </div>
                      <select
                        value={selectedSubjectId ?? ""}
                        onChange={(e) =>
                          setSelectedSubjectId(
                            e.target.value || selectedSubjectId
                          )
                        }
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                      >
                        {studentSubjectsForTutor.map((subject) => (
                          <option key={subject.id} value={subject.id}>
                            {subject.name} ({subject.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
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
                    onClick={handleConfirm}
                    disabled={selectedTime === null || paymentLoading}
                    className="flex-1 px-3 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {paymentLoading ? "Preparing…" : "Confirm"}
                  </button>
                </div>
                
                {selectedTime && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-gray-700">
                        <span className="font-semibold">Selected:</span> {formatTimeLabel(selectedTime)}
                      </div>
                      <div className="font-bold text-blue-700">
                        {selectedDuration === "0.5"
                          ? "30 min"
                          : selectedDuration === "1"
                          ? "60 min"
                          : selectedDuration === "1.5"
                          ? "90 min"
                          : `${Number(selectedDuration) * 60} min`}
                        {getSessionPrice(String(selectedDuration)) !== null && (
                          <span className="ml-2">
                            • $
                            {getSessionPrice(String(selectedDuration))!.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  </div>
  );
};

export default TutorProfileBubble;
