import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, education } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
    }


    const result = await prisma.profiles.update({
      where: { email },
      data: {
        education: education || null,
      },
    });
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error: any) {
    console.error('[PROFILE_UPDATE] Error:', error);

    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      details: error?.message || error
    }), { status: 500 });
    console.error('[PROFILE_UPDATE] Error:', error);
  }
}