import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, name, phone, bio, subjects, education, experience, is_tutor } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
    }

    // Use name if provided, otherwise combine first and last name
    const fullName = name || `${firstName || ''} ${lastName || ''}`.trim();

    // Start a transaction to handle the profile update and subject relationships
    const result = await prisma.$transaction(async (tx:any) => {
      // Update the main profile
      const updatedProfile = await tx.profiles.update({
        where: { email },
        data: {
          name: fullName,
          phone: phone || null,
          bio: bio || null,
          hourlyRate: null,
          is_tutor: is_tutor,
          education: education || null,
          experience: experience || null,
        },
      });

      return updatedProfile;
    });

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error: any) {
    console.error('[PROFILE_UPDATE] Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      details: error?.message || error
    }), { status: 500 });
  }
}