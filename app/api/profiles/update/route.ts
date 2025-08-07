import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, name, phone, bio, subjects, hourlyRate, education, experience } = body;

    console.log('[PROFILE_UPDATE] Received data:', body);

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
    }

    console.log('[PROFILE_UPDATE] Updating profile for email:', email);

    // Use name if provided, otherwise combine first and last name
    const fullName = name || `${firstName || ''} ${lastName || ''}`.trim();

    // Start a transaction to handle the profile update and subject relationships
    const result = await prisma.$transaction(async (tx) => {
      // Update the main profile
      const updatedProfile = await tx.profiles.update({
        where: { email },
        data: {
          name: fullName,
          phone: phone || null,
          bio: bio || null,
          hourlyRate: hourlyRate !== null && hourlyRate !== undefined ? parseFloat(hourlyRate) : null,
          education: education || null,
          experience: experience || null,
        },
      });

      // Handle subjects - first get the profile ID
      const profile = await tx.profiles.findUnique({
        where: { email },
        select: { id: true }
      });

      if (profile && subjects && Array.isArray(subjects)) {
        // Clear existing subject relationships
        await tx.profilesOnSubjects.deleteMany({
          where: { profileId: profile.id }
        });

        // Create new subject relationships
        for (const s of subjects) {
          let subjectId = typeof s === 'string' ? s : s?.subjectId;
          if (subjectId && typeof subjectId === 'string' && subjectId.trim()) {
            await tx.profilesOnSubjects.create({
              data: {
                profileId: profile.id,
                subjectId: subjectId.trim()
              }
            });
          }
        }
      }

      return updatedProfile;
    });

    console.log('[PROFILE_UPDATE] Profile updated successfully:', result);

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error: any) {
    console.error('[PROFILE_UPDATE] Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      details: error?.message || error
    }), { status: 500 });
  }
}