import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toHHMM(date: Date) {
  return `${String(date.getUTCHours()).padStart(2,'0')}:${String(date.getUTCMinutes()).padStart(2,'0')}`;
}

function parseISODate(d: Date, tz: string) {
  // returns local dayOfWeek for tz
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' });
  const wd = fmt.format(d).slice(0,3);
  const map: Record<string, number> = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
  return map[wd] ?? 0;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tutorId = searchParams.get('tutorId');
    const email = searchParams.get('email');
    const days = Math.min(Math.max(parseInt(searchParams.get('days') || '30', 10) || 30, 1), 60);

    let resolvedTutorId = tutorId ?? '';
    if (!resolvedTutorId && email) {
      const prof = await prisma.profiles.findUnique({ where: { email }, select: { id: true } });
      if (!prof) return NextResponse.json({ error: 'Tutor not found' }, { status: 404 });
      resolvedTutorId = prof.id;
    }
    if (!resolvedTutorId) return NextResponse.json({ error: 'tutorId or email required' }, { status: 400 });

    const weekly = await prisma.tutorAvailability.findMany({
      where: { tutorId: resolvedTutorId, isActive: true },
      select: { dayOfWeek: true, startTime: true, endTime: true, timezone: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
    });
    const exceptions = await (prisma as any).tutorAvailabilityException.findMany({
      where: { tutorId: resolvedTutorId },
      select: { date: true, startTime: true, endTime: true, isActive: true, timezone: true },
    });

    const tz = weekly[0]?.timezone || (exceptions[0]?.timezone) || 'UTC';
    const today = new Date();
    const result: { date: string; slots: string[] }[] = [];

    for (let i=0; i<days; i++) {
      const dayDate = new Date(today.getTime() + i*86400000);
      // Format date as YYYY-MM-DD in tz
      const y = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric' }).format(dayDate);
      const m = new Intl.DateTimeFormat('en-CA', { timeZone: tz, month: '2-digit' }).format(dayDate);
      const d = new Intl.DateTimeFormat('en-CA', { timeZone: tz, day: '2-digit' }).format(dayDate);
      const dateStr = `${y}-${m}-${d}`;

      const dow = parseISODate(dayDate, tz);
      // Start with weekly slots
      let slots = weekly.filter(w => w.dayOfWeek === dow)
        .flatMap(w => {
          const start = toHHMM(w.startTime);
          const end = toHHMM(w.endTime);
          const out: string[] = [];
          // 30-min increments
          let [sh, sm] = start.split(':').map(Number);
          let [eh, em] = end.split(':').map(Number);
          for (let h=sh, m=sm; (h<eh) || (h===eh && m<em); ) {
            out.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
            m += 30; if (m>=60) { m-=60; h+=1; }
          }
          return out;
        });

      // Apply exceptions for this date
      const todaysEx = exceptions.filter((e: any) => new Intl.DateTimeFormat('en-CA', { timeZone: e.timezone || tz, year:'numeric', month:'2-digit', day:'2-digit' }).format(e.date) === dateStr);
      if (todaysEx.length) {
        // Remove and add
        let set = new Set(slots);
        for (const ex of todaysEx) {
          const exStart = toHHMM(ex.startTime);
          const exEnd = toHHMM(ex.endTime);
          const buffer: string[] = [];
          let [sh, sm] = exStart.split(':').map(Number);
          let [eh, em] = exEnd.split(':').map(Number);
          for (let h=sh, m=sm; (h<eh) || (h===eh && m<em); ) {
            buffer.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
            m += 30; if (m>=60) { m-=60; h+=1; }
          }
          if (ex.isActive) {
            buffer.forEach(t => set.add(t));
          } else {
            buffer.forEach(t => set.delete(t));
          }
        }
        slots = Array.from(set).sort();
      }

      result.push({ date: dateStr, slots });
    }

    return NextResponse.json({ timezone: tz, days: result });
  } catch (e: any) {
    console.error('[TA_CAL] Error', e);
    return NextResponse.json({ error: 'Internal Server Error', details: e?.message || e }, { status: 500 });
  }
}
