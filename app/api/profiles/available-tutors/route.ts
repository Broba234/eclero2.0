import { prisma } from "@/lib/prisma";

function isSlotActiveToday(
  slot: { start_date: Date | null; end_date: Date | null },
  today: Date
) {
  if (!slot.start_date || !slot.end_date) return false;
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const todayEnd = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23,
    59,
    59,
    999
  );

  return slot.start_date <= todayEnd && slot.end_date >= todayStart;
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
        subjects: { select: { Subjects: { select: { id: true, name: true, code: true, grade: true } } } },
      },
      orderBy: { name: "asc" },
    });
    
    const tutorIds = tutors.map(t => t.id);
    
    // Fetch active slots
    const slots = await prisma.tutorAvailability.findMany({
      where: { 
        tutor_id: { in: tutorIds }, 
        is_active: true 
      },
      select: { 
        tutor_id: true, 
        subject_id: true, 
        start_time: true, 
        end_time: true, 
        start_date: true, 
        end_date: true 
      },
    });
    
    // Group slots by tutor id for quick lookup later
    const slotsByTutorId = new Map<
      string,
      Array<{
        subject_id: string | null;
        start_time: Date | null;
        end_time: Date | null;
        start_date: Date | null;
        end_date: Date | null;
      }>
    >();
    
    for (const slot of slots) {
      if (!slotsByTutorId.has(slot.tutor_id)) {
        slotsByTutorId.set(slot.tutor_id, []);
      }
      slotsByTutorId.get(slot.tutor_id)!.push({
        subject_id: slot.subject_id,
        start_time: slot.start_time,
        end_time: slot.end_time,
        start_date: slot.start_date,
        end_date: slot.end_date,
      });
    }
    
    // Process tutors with availability check
    const tutorsWithDerived = tutors.map((t) => {
      const subjects = t.subjects.map((ps: any) => ps.Subjects);
      const tutorSlots = slotsByTutorId.get(t.id) || [];

      const today = new Date();

      // Filter slots to only include those active today
      const todaysSlots = tutorSlots.filter((slot) =>
        isSlotActiveToday(slot, today)
      );
      const hasSlotToday = todaysSlots.length > 0;

      // Only use slot-based availability
      const derivedActiveNow = hasSlotToday;

      return {
        ...t,
        subjects,
        derivedActiveNow,
        availableSlots: todaysSlots // Return only today's slots instead of all slots
      };
    });
    
    const finalList = filterAvailable 
      ? tutorsWithDerived.filter(t => t.derivedActiveNow) 
      : tutorsWithDerived;
    
    return Response.json({ tutors: finalList });
  } catch (error) {
    console.error('Error fetching tutors:', error);
    return Response.json({ error: 'Failed to fetch tutors', tutors: [] }, { status: 500 });
  }
}