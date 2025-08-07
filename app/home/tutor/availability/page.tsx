"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

type TimeSlot = {
    day: string;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME_SLOTS = [
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
];

export default function TutorAvailability() {
    const [availability, setAvailability] = useState<TimeSlot[]>([]);
    const [message, setMessage] = useState("");
    const router = useRouter();

    const handleTimeSlotToggle = (day: string, startTime: string, endTime: string) => {
        setAvailability(prev => {
            const existingSlot = prev.find(slot => 
                slot.day === day && slot.startTime === startTime && slot.endTime === endTime
            );

            if (existingSlot) {
                return prev.filter(slot => 
                    !(slot.day === day && slot.startTime === startTime && slot.endTime === endTime)
                );
            }

            return [...prev, { day, startTime, endTime, isAvailable: true }];
        });
    };

    const handleSave = async () => {
        try {
            // TODO: Implement saving availability to backend
            setMessage("Availability saved successfully!");
            setTimeout(() => setMessage(""), 3000);
        } catch (error) {
            setMessage("Error saving availability. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Manage Your Availability</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Select the time slots when you're available for tutoring sessions
                    </p>
                </div>

                <div className="mt-8">
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="grid grid-cols-8 gap-4">
                                <div className="col-span-1"></div>
                                {DAYS.map(day => (
                                    <div key={day} className="text-center font-medium text-gray-900">
                                        {day}
                                    </div>
                                ))}

                                {TIME_SLOTS.map((time, index) => (
                                    <React.Fragment key={time}>
                                        <div key={`time-${time}`} className="text-right pr-4 text-sm text-gray-500">
                                            {time}
                                        </div>
                                        {DAYS.map(day => {
                                            const isSelected = availability.some(
                                                slot => slot.day === day && slot.startTime === time
                                            );
                                            return (
                                                <button
                                                    key={`${day}-${time}`}
                                                    onClick={() => handleTimeSlotToggle(day, time, TIME_SLOTS[index + 1] || "19:00")}
                                                    className={`h-8 rounded ${
                                                        isSelected 
                                                            ? "bg-indigo-600 hover:bg-indigo-700" 
                                                            : "bg-gray-100 hover:bg-gray-200"
                                                    }`}
                                                />
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleSave}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Save Availability
                        </button>
                    </div>

                    {message && (
                        <div className="mt-4 text-center">
                            <p className={`text-sm ${
                                message.includes("Error") ? "text-red-600" : "text-green-600"
                            }`}>
                                {message}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
