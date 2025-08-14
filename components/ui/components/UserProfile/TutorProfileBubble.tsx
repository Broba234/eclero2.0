import React from "react";
import { useRouter } from "next/navigation";

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
}

interface TutorProfileBubbleProps {
  tutor: TutorProfile;
  isOpen: boolean;
  onClose: () => void;
  onBookSession?: (tutor: TutorProfile) => void;
}

const TutorProfileBubble: React.FC<TutorProfileBubbleProps> = ({ tutor, isOpen, onClose, onBookSession }) => {
  if (!isOpen) return null;

  const handleBookSession = () => {
    if (onBookSession) {
      onBookSession(tutor);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-[90vw] max-w-3xl max-h-[90vh] overflow-y-auto bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8 flex flex-col md:flex-row gap-8" style={{ boxShadow: '0 8px 32px 0 rgba(31,38,135,0.37)' }}>
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-300 hover:text-white text-2xl font-bold focus:outline-none">
          &times;
        </button>
        {/* Profile Picture */}
        <div className="flex flex-col items-center md:items-start md:w-1/3">
          <img
            src={tutor.avatar || "/default-avatar.png"}
            alt={tutor.name}
            className="w-32 h-32 rounded-full object-cover border-4 border-white/30 mb-4"
          />
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold text-white mb-1">{tutor.name}</h2>
            {tutor.rating && (
              <div className="flex items-center justify-center md:justify-start mt-1">
                <span className="text-yellow-400">★</span>
                <span className="ml-1 text-white font-medium">{tutor.rating}</span>
              </div>
            )}
            {tutor.subjects && tutor.subjects.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {tutor.subjects.map((subj) => (
                  <span key={subj.code} className="bg-gradient-to-r from-blue-400 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    {subj.name} ({subj.code})
                  </span>
                ))}
              </div>
                         )}
           </div>
         </div>
         {/* Profile Info */}
         <div className="flex-1 flex flex-col gap-4 text-white">
           {/* Availability Status */}
           <div className="flex items-center justify-between">
             <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
               tutor.isAvailableNow 
                 ? 'bg-green-500/20 text-green-400' 
                 : 'bg-gray-500/20 text-gray-400'
             }`}>
               <span className={`w-2 h-2 rounded-full ${
                 tutor.isAvailableNow ? 'bg-green-400' : 'bg-gray-400'
               }`}></span>
               {tutor.isAvailableNow ? 'Available now' : 'Offline'}
             </span>
           </div>
          {tutor.bio && (
            <div>
              <h3 className="text-lg font-semibold mb-1">Bio</h3>
              <p className="text-gray-200 whitespace-pre-line">{tutor.bio}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-6">
            {tutor.email && (
              <div>
                <div className="text-xs text-gray-400">Email</div>
                <div className="text-sm font-medium">{tutor.email}</div>
              </div>
            )}
            {tutor.phone && (
              <div>
                <div className="text-xs text-gray-400">Phone</div>
                <div className="text-sm font-medium">{tutor.phone}</div>
              </div>
            )}
            {typeof tutor.hourlyRate === 'number' && (
              <div>
                <div className="text-xs text-gray-400">Hourly Rate</div>
                <div className="text-sm font-medium">${tutor.hourlyRate}</div>
              </div>
            )}
          </div>
          {tutor.education && tutor.education.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-1 mt-2">Education</h3>
              <ul className="list-disc list-inside text-gray-200">
                {tutor.education.map((edu, idx) => (
                  <li key={idx}>
                    {edu.degree} @ {edu.institution} ({edu.year})
                  </li>
                ))}
              </ul>
            </div>
          )}
          {tutor.experience && tutor.experience.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-1 mt-2">Experience</h3>
              <ul className="list-disc list-inside text-gray-200">
                {tutor.experience.map((exp, idx) => (
                  <li key={idx}>
                    <span className="font-medium">{exp.title}</span>: {exp.description} ({exp.years} yrs)
                  </li>
                                 ))}
               </ul>
             </div>
           )}
           
           {/* Booking Section */}
           <div className="mt-4 pt-4 border-t border-white/10">
             <button 
               onClick={handleBookSession}
               className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                 tutor.isAvailableNow
                   ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl'
                   : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
               }`}
             >
               {tutor.isAvailableNow ? (
                 <>
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                   Book Session Now
                 </>
               ) : (
                 <>
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.449L3 21l1.449-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                   </svg>
                   Request Session
                 </>
               )}
             </button>
             {tutor.isAvailableNow && (
               <p className="text-center text-sm text-gray-400 mt-2">
                 Instant booking available • Response within minutes
               </p>
             )}
             {!tutor.isAvailableNow && (
               <p className="text-center text-sm text-gray-400 mt-2">
                 Send a request • Tutor will respond within 24 hours
               </p>
             )}
             {/* Simple: request/instant only, no 30-day UI */}
           </div>
        </div>
      </div>
    </div>
  );
};

export default TutorProfileBubble; 
