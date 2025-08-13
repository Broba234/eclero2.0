import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const { isAvailableNow, userEmail } = await req.json();

    if (typeof isAvailableNow !== 'boolean') {
      return NextResponse.json({ error: 'isAvailableNow must be a boolean' }, { status: 400 });
    }

    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail is required' }, { status: 400 });
    }

    console.log('[AVAILABILITY_UPDATE] Updating availability for user:', userEmail, 'to:', isAvailableNow);

    // If turning OFF, but schedule says they're active now, block and instruct to use calendar
    if (isAvailableNow === false) {
      // Resolve tutor id
      const profile = await prisma.profiles.findUnique({ where: { email: userEmail }, select: { id: true } });
      if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      const activeSlots = await prisma.tutorAvailability.findMany({
        where: { tutorId: profile.id, isActive: true },
        select: { dayOfWeek: true, startTime: true, endTime: true, timezone: true },
      });
      if (activeSlots.length) {
        const tz = activeSlots[0].timezone || 'UTC';
        const dtf = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, weekday: 'short', hour: '2-digit', minute: '2-digit' });
        const parts = Object.fromEntries(dtf.formatToParts(new Date()).map(p => [p.type, p.value]));
        const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
        const day = weekdayMap[(parts.weekday || 'Sun').slice(0,3)] ?? 0;
        const hm = `${parts.hour || '00'}:${parts.minute || '00'}`;
        const hhmm = (d: Date) => `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`;
        const inSlot = activeSlots.some(s => s.dayOfWeek === day && hhmm(s.startTime) <= hm && hm < hhmm(s.endTime));
        if (inSlot) {
          return NextResponse.json({
            error: 'You are currently scheduled to be active. To go offline now, adjust your calendar availability.',
            code: 'SCHEDULE_OVERRIDE'
          }, { status: 409 });
        }
      }
    }

    const updatedProfile = await prisma.profiles.update({
      where: { email: userEmail },
      data: { isAvailableNow },
      select: { id: true, email: true, isAvailableNow: true }
    });

    console.log('[AVAILABILITY_UPDATE] Successfully updated profile:', updatedProfile);

    return NextResponse.json(updatedProfile);
  } catch (error: any) {
    console.error('[AVAILABILITY_UPDATE] Error:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      details: error?.message || error
    }, { status: 500 });
  }
}
