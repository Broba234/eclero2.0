import { prisma } from '@/lib/prisma';
import { validRoles } from '@/lib/types/roles';

export async function POST(request: Request) {
  try {
    const { id, email, role, name, bio, avatar, subjects, hourlyRate, availability, isAvailableNow, rating } = await request.json();

    if (!id || !email || !role || !name) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    if (!validRoles.includes(role)) {
      return new Response(JSON.stringify({ error: 'Invalid role' }), { status: 400 });
    }

    console.log('[PROFILE_CREATE] Attempting insert with:', {
      id, email, role, name, bio, avatar, subjects, hourlyRate, availability, isAvailableNow, rating
    });

    const profile = await prisma.profiles.create({
      data: {
        id,
        email,
        role,
        name,
        bio,
        avatar,
        subjects: subjects ?? [],
        hourlyRate,
        availability,
        isAvailableNow,
        rating,
      },
    });

    return new Response(JSON.stringify(profile), { status: 201 });
  } catch (error: any) {
    console.error('[PROFILE_CREATE FULL ERROR DUMP]');
    console.dir(error, { depth: null });

    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      details: error?.message || error
    }), { status: 500 });
  }
}