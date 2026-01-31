import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email,subjects } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
    }

      // Handle subjects - first get the profile ID
      const profile = await prisma.profiles.findUnique({
        where: { email },
        select: { id: true }
      });

      if (profile && subjects && Array.isArray(subjects)) {
        // Clear existing subject relationships
        await prisma.profilesOnSubjects.deleteMany({
          where: { profile_id: profile.id }
        });
        await prisma.tutorAvailability.deleteMany({
          where: { tutor_id: profile.id }
        });

        // Create new subject relationships
        for (const s of subjects) {
          if (s.id.trim()) {
            await prisma.profilesOnSubjects.create({
              data: {
                profile_id: profile.id,
                subject_id: s.id.trim(),
                price: s.price * 1,
                duration: s.duration * 1
              }
            });
          }
        }
      }

    return new Response(JSON.stringify(profile), { status: 200 });
  } catch (error: any) {
    console.error('[PROFILE_UPDATE] Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      details: error?.message || error
    }), { status: 500 });
  }
}