import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toTimeDate(time: string): Date {
  return new Date(`1970-01-01T${time}:00.000Z`);
}

export async function POST(req: Request) {
  try {
    const { userEmail, tutorId, date, start, end, isActive, timezone } = await req.json();
    if (!date || !start || !end || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'date, start, end, isActive required' }, { status: 400 });
    }
    let resolvedTutorId: string | null = tutorId ?? null;
    if (!resolvedTutorId && userEmail) {
      const prof = await prisma.profiles.findUnique({ where: { email: userEmail }, select: { id: true } });
      if (!prof) return NextResponse.json({ error: 'Tutor not found' }, { status: 404 });
      resolvedTutorId = prof.id;
    }
    if (!resolvedTutorId) return NextResponse.json({ error: 'tutorId or userEmail required' }, { status: 400 });

    const ex = await (prisma as any).tutorAvailabilityException.create({
      data: {
        tutorId: resolvedTutorId,
        date: new Date(`${date}T00:00:00.000Z`),
        startTime: toTimeDate(start),
        endTime: toTimeDate(end),
        isActive,
        timezone: timezone || 'UTC',
      }
    });
    return NextResponse.json({ success: true, exception: ex });
  } catch (e: any) {
    console.error('[TA_EXC] Error', e);
    return NextResponse.json({ error: 'Internal Server Error', details: e?.message || e }, { status: 500 });
  }
}
