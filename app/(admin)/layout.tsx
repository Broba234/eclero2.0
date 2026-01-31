"use client";

import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  // Dynamic class for main content margin based on sidebar state
  // const mainContentMargin = isMobileOpen
  //   ? "ml-0"
  //   : isExpanded || isHovered
  //   ? "lg:ml-[290px]"
  //   : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      <AppSidebar />
      <div
        className={`flex-1 transition-all  duration-300 ease-in-out`}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <div className="p-4 ml-[20%] max-w-[1440px] md:p-6">{children}</div>
      </div>
    </div>
  );
}
