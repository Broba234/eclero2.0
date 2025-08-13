import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toTimeString(date: Date): string {
  // Convert Date (TIME) to HH:mm based on UTC to avoid timezone drift
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const tutorId = searchParams.get('tutorId');

    if (!email && !tutorId) {
      return NextResponse.json({ error: 'email or tutorId is required' }, { status: 400 });
    }

    let resolvedTutorId = tutorId ?? '';
    if (!resolvedTutorId && email) {
      const profile = await prisma.profiles.findUnique({ where: { email }, select: { id: true } });
      if (!profile) return NextResponse.json({ error: 'Tutor not found' }, { status: 404 });
      resolvedTutorId = profile.id;
    }

    const slots = await prisma.tutorAvailability.findMany({
      where: { tutorId: resolvedTutorId, isActive: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    const response = {
      timezone: slots[0]?.timezone || 'UTC',
      slots: slots.map(s => ({
        id: s.id,
        dayOfWeek: s.dayOfWeek,
        start: toTimeString(s.startTime),
        end: toTimeString(s.endTime),
      })),
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[TA_GET] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error?.message || error }, { status: 500 });
  }
}

