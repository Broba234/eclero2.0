import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email parameter is required' }), { status: 400 });
    }

    const profile = await prisma.profiles.findUnique({
      where: { email },
      select: { 
        id: true,
        role: true,
        name: true,
        email: true,
        bio: true,
        avatar: true,
        phone: true,
        hourlyRate: true,
        isAvailableNow: true,
        availability: true,
        education: true,
        experience: true,
        created_at: true,
        updated_at: true,
        profile_setup: true,
        is_tutor: true,
        subjects: {
          select: {
            Subjects: {
              select: {
                id: true,
                name: true,
                code: true,
                grade: true,
                category: true,
                created_at: true,
                updated_at: true,
              }
            }
          }
        }
      }
    });
    const subjects = profile.subjects.map(pivot => pivot.Subjects);

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ ...profile, subjects }), { status: 200 });
  } catch (error: any) {
    console.error('[PROFILE_GET_FULL] Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      details: error?.message || error
    }), { status: 500 });
  }
} 