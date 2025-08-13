import { prisma } from "@/lib/prisma";

function getLocalParts(timeZone: string) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const parts = dtf.formatToParts(new Date());
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  const weekdayStr = (map.weekday || 'Sun').slice(0,3);
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const day = weekdayMap[weekdayStr] ?? 0;
  const hour = map.hour || '00';
  const minute = map.minute || '00';
  return { day, hm: `${hour}:${minute}` };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filterAvailable = searchParams.get('availableNow') === 'true';

    const tutors = await prisma.profiles.findMany({
      where: { role: "tutor" },
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
        isAvailableNow: true,
        rating: true,
        education: true,
        subjects: { select: { subject: { select: { id: true, name: true, code: true, grade: true } } } },
      },
      orderBy: { name: "asc" },
    });

    const tutorIds = tutors.map(t => t.id);
    const slots = await prisma.tutorAvailability.findMany({
      where: { tutorId: { in: tutorIds }, isActive: true },
      select: { tutorId: true, dayOfWeek: true, startTime: true, endTime: true, timezone: true },
    });

    const byTutor = new Map<string, { timezone: string; items: { dayOfWeek: number; start: string; end: string }[] }>();
    for (const s of slots) {
      const hhmm = (d: Date) => `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`;
      const row = byTutor.get(s.tutorId) || { timezone: s.timezone || 'UTC', items: [] };
      row.timezone = row.timezone || s.timezone || 'UTC';
      row.items.push({ dayOfWeek: s.dayOfWeek, start: hhmm(s.startTime), end: hhmm(s.endTime) });
      byTutor.set(s.tutorId, row);
    }

    const tutorsWithDerived = tutors.map(t => {
      const subj = t.subjects.map((ps: any) => ps.subject);
      const slotInfo = byTutor.get(t.id);
      let nowInSlot = false;
      if (slotInfo && slotInfo.items.length) {
        const { day, hm } = getLocalParts(slotInfo.timezone);
        nowInSlot = slotInfo.items.some(s => s.dayOfWeek === day && s.start <= hm && hm < s.end);
      }
      const derivedActiveNow = !!(t.isAvailableNow || nowInSlot);
      return { ...t, subjects: subj, derivedActiveNow };
    });

    const finalList = filterAvailable ? tutorsWithDerived.filter(t => t.derivedActiveNow) : tutorsWithDerived;
    return Response.json({ tutors: finalList });
  } catch (error) {
    console.error('Error fetching tutors:', error);
    return Response.json({ error: 'Failed to fetch tutors', tutors: [] }, { status: 500 });
  }
}
