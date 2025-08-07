import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const subjects = [
  { code: "ADA3M", name: "Theatre, Grade 11", category: "Arts", grade: 11 },
  { code: "AMU4M", name: "Music, Grade 12", category: "Arts", grade: 12 },
  { code: "AVI1O", name: "Visual Arts, Grade 9", category: "Arts", grade: 9 },
  { code: "AVI2O", name: "Visual Arts, Grade 10", category: "Arts", grade: 10 },
  { code: "AVI3M", name: "Visual Arts, Grade 11", category: "Arts", grade: 11 },
  { code: "AVI4M", name: "Visual Arts, Grade 12", category: "Arts", grade: 12 },
  { code: "AWS3M", name: "Visual Arts – Sculpture, Grade 11", category: "Arts", grade: 11 },
  { code: "AWS4M", name: "Visual Arts – Sculpture, Grade 12", category: "Arts", grade: 12 },
  { code: "ASM2O", name: "Media Arts, Grade 10", category: "Arts", grade: 10 },
  { code: "ASM3M", name: "Media Arts, Grade 11", category: "Arts", grade: 11 },
  { code: "ASM4M", name: "Media Arts, Grade 12", category: "Arts", grade: 12 },
  { code: "ATC3M", name: "Dance, Grade 11", category: "Arts", grade: 11 },
  { code: "ATC4M", name: "Dance, Grade 12", category: "Arts", grade: 12 },
  { code: "AMV2O", name: "Music – Vocal, Grade 10", category: "Arts", grade: 10 },
  { code: "AMV3M", name: "Music – Vocal, Grade 11", category: "Arts", grade: 11 },
  { code: "AMV4M", name: "Music – Vocal, Grade 12", category: "Arts", grade: 12 },
  { code: "AMG2O", name: "Guitar, Grade 10", category: "Arts", grade: 10 },
  { code: "AMG3M", name: "Guitar, Grade 11", category: "Arts", grade: 11 },
  { code: "AMG4M", name: "Guitar, Grade 12", category: "Arts", grade: 12 }
];

async function main() {
  console.log('Seeding Subjects table...');

  // Create subjects individually, checking for existing ones first
  for (const subjectData of subjects) {
    try {
      // Check if subject already exists
      const existing = await prisma.subjects.findFirst({
        where: { name: subjectData.name }
      });

      if (existing) {
        console.log(`Subject already exists: ${subjectData.name}`);
        continue;
      }

      // Create new subject
      const subject = await prisma.subjects.create({
        data: {
          name: subjectData.name,
          code: subjectData.code,
          grade: subjectData.grade,
          category: subjectData.category
        }
      });

      console.log(`Subject created: ${subject.name} (Code: ${subject.code}, Grade: ${subject.grade}, Category: ${subject.category})`);
    } catch (error) {
      console.error(`Error creating subject ${subjectData.name}:`, error);
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
