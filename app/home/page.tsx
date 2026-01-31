"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("session", session);
      if (!session) return router.push("/auth/login");
      const profileRes = await fetch(`/api/profiles/get?email=${encodeURIComponent(session.user.email!)}`);
      const userData = await profileRes.json();
      console.log("userData", userData);
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