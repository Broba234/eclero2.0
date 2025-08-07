"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function HomeRedirect() {
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

          if (userData.role === "student") router.push("/home/student");
    else if (userData.role === "tutor") router.push("/home/tutor");
      else router.push("/auth/login");
    };

    redirect();
  }, [router]);

      return (
        <div className="flex h-screen items-center justify-center" style={{
          background: 'linear-gradient(to bottom, #2b3340, #23272f, #181a1b)'
        }}>
          <div className="text-white text-lg">Redirecting to home...</div>
        </div>
      );
}