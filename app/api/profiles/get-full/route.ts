import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email parameter is required' }), { status: 400 });
    }

    console.log('[PROFILE_GET_FULL] Looking up full profile for email:', email);

    const profile = await prisma.profiles.findUnique({
      where: { email },
      select: { 
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
        subjects: {
          select: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                grade: true,
                category: true
              }
            }
          }
        }
      }
    });

    console.log('[PROFILE_GET_FULL] Found profile:', profile);

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404 });
    }

    return new Response(JSON.stringify(profile), { status: 200 });
  } catch (error: any) {
    console.error('[PROFILE_GET_FULL] Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      details: error?.message || error
    }), { status: 500 });
  }
} 