import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email parameter is required' }), { status: 400 });
    }

    console.log('[PROFILE_GET] Looking up profile for email:', email);

    const profile = await prisma.profiles.findUnique({
      where: { email },
      select: { role: true }
    });

    console.log('[PROFILE_GET] Found profile:', profile);

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404 });
    }

    return new Response(JSON.stringify(profile), { status: 200 });
  } catch (error: any) {
    console.error('[PROFILE_GET] Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      details: error?.message || error
    }), { status: 500 });
  }
} 