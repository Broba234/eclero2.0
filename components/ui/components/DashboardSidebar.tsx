"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  hasNotification?: boolean;
}

interface HomeSidebarProps {
  userRole: string;
  userName: string;
}

export default function HomeSidebar({ userRole, userName }: HomeSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/auth/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getNavItems = (): NavItem[] => {
    const commonItems = [
      {
        label: "Overview",
        href: `/home/${userRole.toLowerCase()}`,
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
      },
    ];

    const roleSpecificItems: { [key: string]: NavItem[] } = {
      student: [
        {
          label: "Profile",
          href: "/home/student/profile",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          ),
        },
        {
          label: "Sessions",
          href: "/home/student/sessions",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          ),
        },
        {
          label: "Explore",
          href: "/home/student/explore",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          ),
        },
      ],
      tutor: [
        {
          label: "Profile",
          href: "/home/tutor/profile",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ),
        },
        {
          label: "Sessions",
          href: "/home/tutor/sessions",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
        {
          label: "Availability",
          href: "/home/tutor/availability",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
        },
      ],
      teacher: [
        {
          label: "My Courses",
          href: "/home/teacher/courses",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          ),
        },
        {
          label: "Students",
          href: "/home/teacher/students",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ),
        },
      ],
      admin: [
        {
          label: "Users",
          href: "/home/admin/users",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ),
        },
        {
          label: "Courses",
          href: "/home/admin/courses",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          ),
        },
        {
          label: "Settings",
          href: "/home/admin/settings",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        },
      ],
    };

    return [...commonItems, ...(roleSpecificItems[userRole.toLowerCase()] || [])];
  };

  return (
   <div
  className={`flex flex-col h-screen transition-all duration-500 ease-out bg-[#E6E6E6] rounded-r-[50px] ${
    isCollapsed ? "w-20" : "w-64"
  }`}
>
  {/* Header with user info and toggle button */}
  <div className="p-6 pb-4 border-b border-white/10 relative">
    {/* Glowing accent line */}
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent"></div>
    
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 overflow-hidden">
        {/* Animated avatar with gradient ring */}
        <div className="relative flex-shrink-0">
          <div className="relative w-10 h-10 bg-[#1559C6] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
        
        {!isCollapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-[#0F2854] truncate">{userName}</p>
            <p className="text-sm text-white py-1 text-center bg-[#1559C6] rounded-full font-medium">{userRole}</p>
          </div>
        )}
      </div>
      
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="relative w-8 h-8 rounded-full bg-white/50 hover:bg-[#0F2854] border border-white/10 flex items-center justify-center text-[#0F2854] hover:text-white transition-all duration-300 group flex-shrink-0"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {/* <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-400/10 group-hover:via-purple-500/10 group-hover:bg-[#0F2854] transition-all duration-500"></div> */}
        <svg
         className={`w-4 h-4 transition-transform duration-500 ${isCollapsed ? "-rotate-180" : "rotate-0"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={"M11 19l-7-7 7-7m8 14l-7-7 7-7"}
          />
        </svg>
      </button>
    </div>
  </div>

  {/* Navigation */}
  <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
    {getNavItems().map((item) => {
      const isActive =
        item.href === `/home/${userRole.toLowerCase()}`
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + "/");
      
      return (
        <div key={item.href} className="relative group">  
          <Link
            href={item.href}
            className={`relative flex items-center px-4 py-3 text-sm font-medium rounded-full transition-all duration-300 overflow-hidden ${
              isActive
                ? "bg-[#1559C6] text-white shadow-lg shadow-blue-500/10"
                : "text-[#0F2854] hover:text-white/70"
            } ${isCollapsed ? "justify-center px-3" : ""}`}
            title={isCollapsed ? item.label : undefined}
          >
            {/* Hover gradient overlay */}
            <div className="absolute inset-0 to-pink-500/0 group-hover:bg-[#0F2854]/20 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-500"></div>
            
            <span
              className={`relative z-10 flex items-center ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <span
                className={`relative flex items-center justify-center ${
                  isCollapsed ? "w-7 h-7" : "w-5 h-5"
                } ${isActive ? "text-blue-300" : "text-current"}`}
              >
                {item.icon}
                {item.hasNotification && userRole === "tutor" && (
                  <>
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-slate-900"></span>
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
                  </>
                )}
              </span>
              {!isCollapsed && (
                <span className="ml-3 font-medium tracking-wide truncate">
                  {item.label}
                </span>
              )}
            </span>
            
            {!isCollapsed && item.hasNotification && userRole === "tutor" && (
              <span className="ml-auto relative">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span className="absolute inset-0 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
              </span>
            )}
          </Link>
        </div>
      );
    })}
  </nav>

  {/* Footer with brand and sign out */}
  <div className="p-6 pt-4 border-t border-white/10 relative">
    {/* Glowing accent line */}
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/20 to-transparent"></div>
    
    <div className="mb-4">
      {!isCollapsed ? (
        <div className="relative">
          <h2 className="text-2xl font-black bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 text-transparent bg-clip-text tracking-tighter">
            eclero
          </h2>
          <div className="text-xs text-gray-500 font-medium mt-0.5 tracking-wider">
            EDUCATION PLATFORM
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-lg opacity-70 blur-sm"></div>
            <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-lg">e</span>
            </div>
          </div>
        </div>
      )}
    </div>
    
    <button
      onClick={handleSignOut}
      className={`relative flex items-center w-full px-4 py-3 text-sm font-medium rounded-full transition-all duration-300 overflow-hidden group ${
        isCollapsed ? "justify-center px-3" : ""
      }`}
      title={isCollapsed ? "Sign out" : undefined}
    >
      {/* Gradient hover effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-orange-500/0 to-pink-500/0 group-hover:from-red-500/10 group-hover:via-orange-500/10 group-hover:to-pink-500/10 transition-all duration-500"></div>
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-all duration-300"></div>
      
      <span className={`relative z-10 flex items-center ${isCollapsed ? "justify-center" : ""}`}>
        <svg
          className={`w-5 h-5 text-gray-400 group-hover:text-red-300 transition-colors ${
            isCollapsed ? "" : "mr-3"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
        {!isCollapsed && (
          <span className="font-medium text-black group-hover:text-white tracking-wide">
            Sign out
          </span>
        )}
      </span>
    </button>
  </div>
</div>
  );
}
