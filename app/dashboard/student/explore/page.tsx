"use client";
import { useEffect, useState } from "react";

type Tutor = {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  // Add more fields as needed
};

export default function ExploreTutors() {
  const [search, setSearch] = useState("");
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch available tutors from your API
    const fetchTutors = async () => {
      setLoading(true);
      const res = await fetch("/api/profiles/available-tutors");
      const data = await res.json();
      setTutors(data.tutors || []);
      setLoading(false);
    };
    fetchTutors();
  }, []);

  // Filter by search term (client-side for now)
  const filteredTutors = tutors.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Find a Tutor</h1>
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search tutors by name..."
          className="w-full px-4 py-2 border rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {loading ? (
        <div className="text-center text-gray-500">Loading tutors...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredTutors.length === 0 ? (
            <div className="col-span-full text-center text-gray-400">No tutors found.</div>
          ) : (
            filteredTutors.map(tutor => (
              <div
                key={tutor.id}
                className="bg-white rounded-lg shadow p-6 flex flex-col items-center hover:shadow-lg transition"
              >
                <img
                  src={tutor.avatar || "/default-avatar.png"}
                  alt={tutor.name}
                  className="w-20 h-20 rounded-full mb-4 object-cover"
                />
                <h2 className="text-lg font-semibold mb-1">{tutor.name}</h2>
                <p className="text-gray-500 text-sm">{tutor.bio || "Available for sessions"}</p>
                {/* Add more info/actions as needed */}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
