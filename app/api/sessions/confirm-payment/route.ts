import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from("Sessions")
      .update({ status: "accepted" })
      .eq("id", sessionId)
      .eq("status", "pending")
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to confirm session", details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Session not found or already confirmed" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, session: data });
  } catch (err) {
    console.error("[confirm-payment] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
