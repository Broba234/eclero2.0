import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


// Build a Date from date (YYYY-MM-DD) and time (HH:mm) in local time to preserve wall clock

// For @db.Time fields we can still store as UTC time-only
function toTimeDate(time: string): Date {
  const [hh, mm] = time.split(":").map(Number);
  return new Date(Date.UTC(1970, 0, 1, hh, mm, 0, 0));
}

export async function POST(req: Request) {
  try {
    const { email, newEvent } = await req.json();

    if (!email && !newEvent) {
      return NextResponse.json({ error: "userEmail or tutorId is required" }, { status: 400 });
    }

    // Resolve tutor id
    let resolvedTutorId: any;
    if (email) {
      const profile = await prisma.profiles.findUnique({
        where: { email },
        select: { id: true },
      });
      if (!profile) return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
      resolvedTutorId = profile.id;
    }
    if (!resolvedTutorId) {
      return NextResponse.json({ error: "Could not resolve tutorId" }, { status: 400 });
    }
const startDate = new Date(`${newEvent.startDate}T${newEvent.start_time}:00`);
const endDate = new Date(`${newEvent.endDate}T${newEvent.end_time}:00`);

        if (newEvent.subject_id.trim()) {
      const existing = await prisma.profilesOnSubjects.findFirst({
        where: {
          profile_id: resolvedTutorId,
          subject_id: newEvent.subject_id.trim()
        }
      });
        await prisma.tutorAvailability.create({
          data: {
            tutor_id: resolvedTutorId,
            subject_id: newEvent.subject_id.trim(),
            subject: newEvent.title,
            duration_1: newEvent.duration_1,
            duration_2: newEvent.duration_2,
            duration_3: newEvent.duration_3,
            start_time: toTimeDate(newEvent.start_time),
            end_time: toTimeDate(newEvent.end_time),
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
          }
        });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[TA_SAVE] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error?.message || error },
      { status: 500 }
    );
  }
}