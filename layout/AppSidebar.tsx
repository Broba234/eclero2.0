"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const AppSidebar: React.FC = () => {
  const pathname = usePathname();

  // Simple SVG icons
  const DashboardIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );

  const SubjectsIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );

  const CategoriesIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );

  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <DashboardIcon />,
    },
    {
      name: "Subjects",
      path: "/dashboard/subjects",
      icon: <SubjectsIcon />,
    }
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard") return pathname === "/dashboard";
    return pathname === path || pathname.startsWith(path + "/");
  };

  return (
    <aside className="fixed mt-16 lg:mt-0 top-0 left-0 bg-white dark:bg-gray-900 h-screen w-64 border-r border-gray-200 dark:border-gray-800 z-50">
      <div className="flex flex-col h-full px-4 py-6">
        {/* Sidebar header */}
        <div className="px-3 mb-8">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Eclero</h2>
        </div>

        {/* Navigation items */}
        <nav className="space-y-1">
          {navItems.map((item, index) => (
            <Link
              key={index}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive(item.path)
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              <span className={`${isActive(item.path) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                {item.icon}
              </span>
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;