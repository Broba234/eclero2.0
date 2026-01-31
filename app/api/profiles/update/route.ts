import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email,name, phone, bio,avatar } = body;


    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
    }
    const fullName = name.trim();
      const updatedProfile = await prisma.profiles.update({
        where: { email },
        data: {
          name: fullName,
          phone: phone || null,
          bio: bio || null,
          ...(avatar !== undefined ? { avatar } : {}),
        },
      });


    return new Response(JSON.stringify(updatedProfile), { status: 200 });
  } catch (error: any) {
    console.error('[PROFILE_UPDATE] Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      details: error?.message || error
    }), { status: 500 });
  }
}