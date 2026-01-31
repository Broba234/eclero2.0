"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import LiveKitRoom from "@/components/LiveKitRoom";

export default function SessionRoomPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const sessionId = params?.id;

  const [identity, setIdentity] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("User");
  const [role, setRole] = useState<"tutor" | "student" | "admin" | "">("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }
        setIdentity(user.id);
        const res = await fetch(`/api/profiles/get-full?email=${encodeURIComponent(user.email!)}`);
        if (res.ok) {
          const profile = await res.json();
          setDisplayName(profile.name || user.email?.split("@")[0] || "User");
          setRole((profile.role || "student") as any);
        } else {
          setDisplayName(user.email?.split("@")[0] || "User");
          setRole("student");
        }
        setReady(true);
      } catch (e) {
        router.push("/auth/login");
      }
    };
    init();
  }, [router]);

  if (!sessionId) return null;
  if (!ready) return <div className="fixed inset-0 z-50 bg-black flex items-center justify-center text-white">Loading…</div>;

  const roomName = `session-${sessionId}`;

  return (
    <LiveKitRoom
      roomName={roomName}
      userIdentity={identity}
      userName={displayName}
      userRole={(role === "tutor" ? "tutor" : "student") as any}
      onDisconnect={async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }
        console.log('sessionId', sessionId);
        const res = await fetch(`/api/sessions/update-status`, {
          method: 'PATCH',
          body: JSON.stringify({
            sessionId: sessionId,
            status: 'completed',
            userId: user.id
          })
        })
        if (res.ok) {
          router.push(`/home/${role || "student"}`);
        } else {
          console.error('Failed to update session status');
        }
      }}
      isOpen={true}
    />
  );
}

