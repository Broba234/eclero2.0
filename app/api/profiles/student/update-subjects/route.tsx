import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email,subjects } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
    }
      const profile = await prisma.profiles.findUnique({
        where: { email },
        select: { id: true }
      });

      if (profile && subjects && Array.isArray(subjects)) {
        // Clear existing subject relationships
        await prisma.profilesOnSubjects.deleteMany({
          where: { profile_id: profile.id }
        });

        // Create new subject relationships
        for (const s of subjects) {
          if (s) {
            await prisma.profilesOnSubjects.create({
              data: {
                profile_id: profile.id,
                subject_id: s
              }
            });
          }
        }
      }

    return new Response(JSON.stringify(profile), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      details: error?.message || error
    }), { status: 500 });
  }
}