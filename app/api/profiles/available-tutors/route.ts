import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tutors = await prisma.profiles.findMany({
      where: {
        role: "tutor",
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
        isAvailableNow: true,
        rating: true,
        education: true,
        subjects: {
          select: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                grade: true,
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });
    
    // Flatten subjects to array of subject objects
    const tutorsWithSubjects = tutors.map(tutor => ({
      ...tutor,
      subjects: tutor.subjects.map((ps: any) => ps.subject),
    }));
    
    return Response.json({ tutors: tutorsWithSubjects });
  } catch (error) {
    console.error('Error fetching tutors:', error);
    return Response.json({ 
      error: 'Failed to fetch tutors',
      tutors: [] 
    }, { status: 500 });
  }
}
