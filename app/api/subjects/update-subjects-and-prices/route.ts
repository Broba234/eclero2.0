import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, subjects } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Get the profile ID
    const profile = await prisma.profiles.findUnique({
      where: { email },
      select: { id: true }
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    if (!subjects || !Array.isArray(subjects)) {
      return NextResponse.json(
        { error: 'Subjects must be provided as an array' },
        { status: 400 }
      );
    }

    // Filter valid subjects with non-empty IDs
    const validSubjects = subjects.filter(s => s?.id?.trim());

    if (validSubjects.length === 0) {
      return NextResponse.json(
        { error: 'No valid subjects provided' },
        { status: 400 }
      );
    }
      // Get existing subject connections
      const existingConnections = await prisma.profilesOnSubjects.findMany({
        where: { profile_id: profile.id }
      });

      // Extract IDs of new subjects
      const newSubjectIds = validSubjects.map(s => s.id.trim());

      // Delete subjects that are no longer in the list
      const subjectsToDelete = existingConnections.filter(
        connection => !newSubjectIds.includes(connection.subject_id)
      );

      if (subjectsToDelete.length > 0) {
        await prisma.profilesOnSubjects.deleteMany({
          where: {
            profile_id: profile.id,
            subject_id: {
              in: subjectsToDelete.map(s => s.subject_id)
            }
          }
        });
      }

      // Create/update operations for each subject
      const upsertOperations = validSubjects.map(subject => {
        const subjectId = subject.id.trim();
        const price_1 = Number(subject.price_1) || 0;
        const price_2 = Number(subject.price_2) || 0;
        const price_3 = Number(subject.price_3) || 0;

        return prisma.profilesOnSubjects.upsert({
          where: {
            profile_id_subject_id: {
              profile_id: profile.id,
              subject_id: subjectId
            }
          },
          update: {
            price_1,
            price_2,
            price_3,
          },
          create: {
            profile_id: profile.id,
            subject_id: subjectId,
            price_1,
            price_2,
            price_3,
          }
        });
      });

      // Execute all upsert operations
      await Promise.all(upsertOperations);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('[SUBJECTS_UPDATE] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}