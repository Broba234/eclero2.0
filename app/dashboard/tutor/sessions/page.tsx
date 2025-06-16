"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Session = {
    id: string;
    studentName: string;
    subject: string;
    date: string;
    time: string;
    status: "upcoming" | "completed" | "cancelled";
    duration: number;
    price: number;
};

export default function TutorSessions() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [filter, setFilter] = useState<"all" | "upcoming" | "completed" | "cancelled">("all");
    const router = useRouter();

    // TODO: Fetch actual sessions from backend
    // useEffect(() => {
    //     // Fetch sessions
    // }, []);

    const filteredSessions = sessions.filter(session => 
        filter === "all" ? true : session.status === filter
    );

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="md:flex md:items-center md:justify-between">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                            My Sessions
                        </h2>
                    </div>
                </div>

                {/* Filters */}
                <div className="mt-4 flex space-x-4">
                    <button
                        onClick={() => setFilter("all")}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${
                            filter === "all"
                                ? "bg-indigo-100 text-indigo-700"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter("upcoming")}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${
                            filter === "upcoming"
                                ? "bg-indigo-100 text-indigo-700"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        Upcoming
                    </button>
                    <button
                        onClick={() => setFilter("completed")}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${
                            filter === "completed"
                                ? "bg-indigo-100 text-indigo-700"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        Completed
                    </button>
                    <button
                        onClick={() => setFilter("cancelled")}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${
                            filter === "cancelled"
                                ? "bg-indigo-100 text-indigo-700"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        Cancelled
                    </button>
                </div>

                {/* Sessions List */}
                <div className="mt-8 flex flex-col">
                    <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Student
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Subject
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date & Time
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Duration
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Price
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th scope="col" className="relative px-6 py-3">
                                                <span className="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredSessions.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                                                    No sessions found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredSessions.map((session) => (
                                                <tr key={session.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {session.studentName}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{session.subject}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {session.date} at {session.time}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{session.duration} min</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">${session.price}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                            session.status === "upcoming"
                                                                ? "bg-green-100 text-green-800"
                                                                : session.status === "completed"
                                                                ? "bg-blue-100 text-blue-800"
                                                                : "bg-red-100 text-red-800"
                                                        }`}>
                                                            {session.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() => router.push(`/dashboard/tutor/sessions/${session.id}`)}
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                        >
                                                            View Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

