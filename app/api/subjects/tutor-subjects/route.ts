import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    const profile = await prisma.profiles.findUnique({
        where: { email },
        select: { id: true }
      });
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    const subjects = await prisma.profilesOnSubjects.findMany({
      where: { profile_id: profile.id },
      select: {
        subject_id: true,
        profile_id: true,
        price_1: true,
        price_2: true,
        price_3: true,
        duration_1: true,
        duration_2: true,
        duration_3: true,
        created_at: true,
        updated_at: true,
        Subjects: {
          select: {
            name: true,
            code: true,
            grade: true,
            category: true,
            created_at: true,
            updated_at: true,
          }
        }
      }
    });
    return NextResponse.json(subjects, { status: 200 });
  } catch (error: any) {
    console.error('[TUTOR_SUBJECTS] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}