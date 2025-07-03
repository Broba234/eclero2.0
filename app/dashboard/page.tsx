"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push("/auth/login");

      const { data: userData } = await supabase
        .from("Profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (!userData || !userData.role) return router.push("/auth/login");

      if (userData.role === "student") router.push("/dashboard/student");
      else if (userData.role === "tutor") router.push("/dashboard/tutor");
      else router.push("/auth/login");
    };

    redirect();
  }, [router]);

  return <div className="text-gray-500 p-6">Redirecting to dashboard...</div>;
}