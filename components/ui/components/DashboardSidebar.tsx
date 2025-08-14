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
          label: "My Courses",
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
          label: "Inbox",
          href: "/home/tutor/inbox",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          ),
          hasNotification: true,
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
    <div className={`flex flex-col h-screen bg-white/10 backdrop-blur-lg border-r border-white/20 shadow-2xl transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-48'
    }`} style={{ boxShadow: '0 8px 32px 0 rgba(31,38,135,0.37)' }}>
      {/* Header with user info and toggle button */}
      <div className="p-4 border-b border-white/20 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <p className="text-xs text-gray-300 font-medium truncate ml-2">{userName}</p>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-300 hover:text-white transition-colors p-1 rounded no-tap-highlight focus:outline-none"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isCollapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
          </svg>
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {getNavItems().map((item) => (
          <div key={item.href} className="relative">
            <Link
              href={item.href}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors no-tap-highlight focus:outline-none ${
                ((item.href === `/home/${userRole.toLowerCase()}`) ? (pathname === item.href) : (pathname === item.href || pathname.startsWith(item.href + '/')))
                  ? "bg-gradient-to-r from-blue-400/20 to-purple-500/20 text-white"
                  : isCollapsed
                    ? 'justify-center bg-transparent hover:bg-transparent focus:bg-transparent shadow-none'
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <span className={`relative ${isCollapsed ? 'w-7 h-7 flex items-center justify-center text-gray-300' : 'w-5 h-5 flex items-center justify-center'}`}>
                {item.icon}
                {item.hasNotification && userRole === 'tutor' && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </span>
              {!isCollapsed && <span className="ml-2 truncate">{item.label}</span>}
              {!isCollapsed && item.hasNotification && userRole === 'tutor' && (
                <span className="ml-auto w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </Link>
          </div>
        ))}
      </nav>

      {/* Footer with brand and sign out */}
      <div className="p-4 border-t border-white/20">
        <div className="mb-3">
          {!isCollapsed ? (
            <h2 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">eclero</h2>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">e</span>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={handleSignOut}
          className={`flex items-center w-full px-3 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-white/10 hover:text-white transition-all duration-200 ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? "Sign out" : undefined}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!isCollapsed && <span className="ml-2 truncate">Sign out</span>}
        </button>
      </div>
    </div>
  );
}
