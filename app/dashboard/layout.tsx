"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/ui/components/DashboardSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        console.log("[DASHBOARD] Starting profile fetch");
        
        const {
          data: { user },
          error: sessionError,
        } = await supabase.auth.getUser();

        console.log("[DASHBOARD] User fetch result:", { user: !!user, error: sessionError });

        if (sessionError || !user) {
          console.error("Supabase session or user fetch error:", sessionError);
          router.push("/auth/login");
          return;
        }

        console.log("[DASHBOARD] Fetching profile for email:", user.email);
        
        // Fetch profile using the API endpoint for consistency
        let profileRes = await fetch(`/api/profiles/get?email=${encodeURIComponent(user.email!)}`);
        
        console.log("[DASHBOARD] Profile fetch result:", { status: profileRes.status, ok: profileRes.ok });
        
        // If profile not found, wait a moment and try again (in case of timing issue)
        if (!profileRes.ok && profileRes.status === 404) {
          console.log("Profile not found, waiting and retrying...");
          await new Promise(resolve => setTimeout(resolve, 1000));
          profileRes = await fetch(`/api/profiles/get?email=${encodeURIComponent(user.email!)}`);
          console.log("[DASHBOARD] Profile retry result:", { status: profileRes.status, ok: profileRes.ok });
        }
        
        if (!profileRes.ok) {
          const errorText = await profileRes.text();
          console.error("Failed to fetch profile:", errorText);
          router.push("/auth/login");
          return;
        }

        const profile = await profileRes.json();
        
        // Get full profile data including name
        const fullProfileRes = await fetch(`/api/profiles/get-full?email=${encodeURIComponent(user.email!)}`);
        if (fullProfileRes.ok) {
          const fullProfile = await fullProfileRes.json();
          setUserName(fullProfile.name || "Anonymous");
        } else {
          setUserName("Anonymous");
        }

        setUserRole(profile.role);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching profile:", error);
        router.push("/auth/login");
      }
    };

    fetchProfile();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!userRole || !userName) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebar userRole={userRole} userName={userName} />
      <main className="flex-1 overflow-y-auto bg-gray-100">
        <div className="p-4">{children}</div>
      </main>
    </div>
  );
}