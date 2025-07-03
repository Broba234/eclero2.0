import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('[SUBJECTS_GET] Fetching all subjects');

    const subjects = await prisma.subjects.findMany({
      orderBy: [
        { category: 'asc' },
        { grade: 'asc' },
        { name: 'asc' }
      ]
    });

    return new Response(JSON.stringify(subjects), { status: 200 });
  } catch (error: any) {
    console.error('[SUBJECTS_GET] Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      details: error?.message || error
    }), { status: 500 });
  }
} 