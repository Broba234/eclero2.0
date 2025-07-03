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
  console.log('Seeding SubjectCategory and Subject tables...');

  // Get unique categories from the subjects array
  const uniqueCategories = [...new Set(subjects.map(subject => subject.category))];
  
  // Create a map to store category IDs
  const categoryMap = new Map<string, string>();

  // Upsert each unique category
  for (const categoryName of uniqueCategories) {
    const category = await prisma.subjectCategory.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName }
    });
    
    categoryMap.set(categoryName, category.id);
    console.log(`Category upserted: ${categoryName} (ID: ${category.id})`);
  }

  // Upsert each subject, linking it to its category
  for (const subjectData of subjects) {
    const categoryId = categoryMap.get(subjectData.category);
    
    if (!categoryId) {
      console.error(`Category not found for subject: ${subjectData.name}`);
      continue;
    }

    const subject = await prisma.subject.upsert({
      where: { name: subjectData.name },
      update: {
        code: subjectData.code,
        grade: subjectData.grade,
        categoryId: categoryId
      },
      create: {
        name: subjectData.name,
        code: subjectData.code,
        grade: subjectData.grade,
        categoryId: categoryId
      }
    });

    console.log(`Subject upserted: ${subject.name} (Code: ${subject.code}, Grade: ${subject.grade}, Category: ${subjectData.category})`);
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
