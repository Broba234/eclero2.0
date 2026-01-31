import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

function convertTimeStringToDate(timeString: string) {
  // HH:mm or HH:mm:ss -> Date with only the time portion (UTC)
  const timeParts = timeString.split(':');
  const hours = parseInt(timeParts[0]);
  const minutes = parseInt(timeParts[1]);
  const seconds = timeParts[2] ? parseInt(timeParts[2]) : 0;
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, seconds));
}

// New: build Date in local time so wall-clock is preserved
function createDateTimeFromDateAndTime(dateStr: string, timeStr: string): Date {
  // dateStr: "YYYY-MM-DD", timeStr: "HH:mm"
  return new Date(`${dateStr}T${timeStr}:00`);
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, updatedData, email } = body;

    if (!eventId || !updatedData) {
      return new Response(JSON.stringify({ error: 'eventId and updatedData are required' }), { status: 400 });
    }

    // Resolve tutor_id from email if provided
    let tutorId: string | undefined;
    if (email) {
      const profile = await prisma.profiles.findUnique({
        where: { email },
        select: { id: true },
      });
      if (!profile) {
        return new Response(JSON.stringify({ error: 'Tutor profile not found' }), { status: 404 });
      }
      tutorId = profile.id;
    }

    const existingEvent = await prisma.tutorAvailability.findUnique({
      where: { id: eventId },
      select: { tutor_id: true },
    });
    if (!existingEvent) {
      return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404 });
    }

    // Build start/end with time preserved
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    let startTimeStr = '00:00';
    let endTimeStr = '00:00';

    startDate = new Date(`${updatedData.date}T${updatedData.startTime}:00`);
    endDate = new Date(`${updatedData.endDate}T${updatedData.endTime}:00`);

    startTimeStr = updatedData.startTime;
    endTimeStr = updatedData.endTime;
    const updateData: any = {
      duration_1: updatedData.duration_1,
      duration_2: updatedData.duration_2,
      duration_3: updatedData.duration_3,
      start_time: convertTimeStringToDate(startTimeStr),
      end_time: convertTimeStringToDate(endTimeStr),
      start_date: startDate,
      end_date: endDate, 
      updated_at: new Date(),
    };

    const result = await prisma.tutorAvailability.update({
      where: { id: eventId },
      data: updateData,
    });

    return new Response(JSON.stringify({ success: true, event: result }), { status: 200 });
  } catch (error: any) {
    console.error('[TUTOR_AVAILABILITY_UPDATE] Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      details: error?.message || error,
    }), { status: 500 });
  }
}