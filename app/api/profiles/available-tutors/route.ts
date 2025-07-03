import { prisma } from "@/lib/prisma";

export async function GET() {
  const tutors = await prisma.profiles.findMany({
    where: {
      role: "tutor",
      isAvailableNow: true,
    },
    select: {
      id: true,
      name: true,
      avatar: true,
      bio: true,
    },
    orderBy: { name: "asc" },
  });
  return Response.json({ tutors });
}
