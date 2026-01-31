import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    
const users = await prisma.profiles.findMany({
  where: {
    role: {
      in: ['student', 'tutor']
    }
  },
  orderBy: [
    { created_at: 'desc' },
  ]
});

    return new Response(JSON.stringify(users), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      details: error?.message || error
    }), { status: 500 });
  }
}