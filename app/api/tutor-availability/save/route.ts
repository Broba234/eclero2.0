import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type SlotInput = { dayOfWeek: number; start: string; end: string };

function isValidTimeString(t: string) {
  return /^\d{2}:\d{2}$/.test(t);
}

function toTimeDate(time: string): Date {
  // Expect HH:mm, store as 1970-01-01T..Z to preserve time component only
  return new Date(`1970-01-01T${time}:00.000Z`);
}

export async function POST(req: Request) {
  try {
    const { userEmail, tutorId, timezone, slots } = await req.json();

    if (!userEmail && !tutorId) {
      return NextResponse.json({ error: 'userEmail or tutorId is required' }, { status: 400 });
    }
    if (!timezone || typeof timezone !== 'string') {
      return NextResponse.json({ error: 'timezone is required' }, { status: 400 });
    }
    if (!Array.isArray(slots)) {
      return NextResponse.json({ error: 'slots must be an array' }, { status: 400 });
    }

    // Resolve tutor id
    let resolvedTutorId: string | null = tutorId ?? null;
    if (!resolvedTutorId && userEmail) {
      const profile = await prisma.profiles.findUnique({ where: { email: userEmail }, select: { id: true } });
      if (!profile) return NextResponse.json({ error: 'Tutor not found' }, { status: 404 });
      resolvedTutorId = profile.id;
    }
    if (!resolvedTutorId) {
      return NextResponse.json({ error: 'Could not resolve tutorId' }, { status: 400 });
    }

    // Validate slots
    const toCreate: SlotInput[] = [];
    for (const s of slots as SlotInput[]) {
      if (typeof s.dayOfWeek !== 'number' || s.dayOfWeek < 0 || s.dayOfWeek > 6) {
        return NextResponse.json({ error: 'Invalid dayOfWeek' }, { status: 400 });
      }
      if (!isValidTimeString(s.start) || !isValidTimeString(s.end)) {
        return NextResponse.json({ error: 'Invalid time format (HH:mm expected)' }, { status: 400 });
      }
      if (s.start === s.end) continue;
      toCreate.push(s);
    }

    // Replace existing active slots
    await prisma.$transaction([
      prisma.tutorAvailability.deleteMany({ where: { tutorId: resolvedTutorId } }),
      prisma.tutorAvailability.createMany({
        data: toCreate.map(s => ({
          tutorId: resolvedTutorId!,
          dayOfWeek: s.dayOfWeek,
          startTime: toTimeDate(s.start),
          endTime: toTimeDate(s.end),
          timezone,
          isActive: true,
        })),
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[TA_SAVE] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error?.message || error }, { status: 500 });
  }
}

